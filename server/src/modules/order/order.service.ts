import { randomUUID } from 'node:crypto';

import type { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';

import { Order, type IOrderBase, type IStatusHistoryEntry, type OrderStatus } from '@src/models/order.model';
import type { CreateOrderInput } from '@src/modules/order/order.validation';
import {
  sendOrderCancelledEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  type EmailSendResult,
} from '@src/services/email.service';
import { badRequest, notFound } from '@src/utils/httpError';
import { generateOrderReference } from '@src/utils/orderReference';

const DELIVERY_FEE = 2.99;
const TAX_RATE = 0.08;

interface StatusHistoryResponse {
  status: OrderStatus;
  remarks?: string;
  updatedBy: string;
  updatedAt: string;
}

interface OrderResponse {
  id: string;
  orderReference: string;
  items: IOrderBase['items'];
  delivery: IOrderBase['delivery'];
  status: OrderStatus;
  statusHistory: StatusHistoryResponse[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  estimatedDeliveryMinutes: number;
  createdAt: string;
  updatedAt: string;
  emailNotification?: EmailSendResult;
}

interface InMemoryOrder extends IOrderBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

function createHistoryEntry(
  status: OrderStatus,
  updatedBy: string,
  remarks?: string,
): IStatusHistoryEntry {
  const entry: IStatusHistoryEntry = {
    status,
    updatedBy,
    updatedAt: new Date(),
  };
  if (remarks) {
    entry.remarks = remarks;
  }
  return entry;
}

export class OrderService {
  private readonly inMemoryOrders: InMemoryOrder[] = [];

  async createOrder(
    input: CreateOrderInput,
  ): Promise<{ success: boolean; data: OrderResponse }> {
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const deliveryFee = DELIVERY_FEE;
    const total = Number((subtotal + tax + deliveryFee).toFixed(2));
    const notes = input.delivery.notes?.trim() ? input.delivery.notes.trim() : undefined;
    const email = input.delivery.email?.trim() ? input.delivery.email.trim().toLowerCase() : undefined;
    const orderReference = generateOrderReference();
    const now = new Date();

    const payload: IOrderBase = {
      orderReference,
      items: input.items,
      delivery: {
        name: input.delivery.name,
        phone: input.delivery.phone,
        address: input.delivery.address,
        city: input.delivery.city,
        postalCode: input.delivery.postalCode,
        ...(email ? { email } : {}),
        ...(notes ? { notes } : {}),
      },
      status: 'Order Received',
      statusHistory: [
        createHistoryEntry('Order Received', 'system', 'Order placed by customer'),
      ],
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee,
      tax,
      total,
      estimatedDeliveryMinutes: 35,
    };

    let savedOrder: {
      _id: string | { toString(): string };
      orderReference: string;
      items: IOrderBase['items'];
      delivery: IOrderBase['delivery'];
      status: OrderStatus;
      statusHistory?: IStatusHistoryEntry[];
      subtotal: number;
      deliveryFee: number;
      tax: number;
      total: number;
      estimatedDeliveryMinutes: number;
      createdAt: Date;
      updatedAt: Date;
    };

    if (!this.isMongoConnected()) {
      const order: InMemoryOrder = {
        _id: randomUUID(),
        ...payload,
        createdAt: now,
        updatedAt: now,
      };
      this.inMemoryOrders.unshift(order);
      savedOrder = order;
    } else {
      const order = await Order.create(payload);
      savedOrder = order;
    }

    let emailNotification: EmailSendResult | undefined;

    if (email) {
      emailNotification = await sendOrderConfirmationEmail({
        to: email,
        customerName: input.delivery.name,
        orderReference,
        total,
        estimatedDeliveryMinutes: payload.estimatedDeliveryMinutes,
        items: input.items,
      });
    }

    return {
      success: true,
      data: this.toResponse(savedOrder, emailNotification),
    };
  }

  async getOrderById(id: string): Promise<{ success: boolean; data: OrderResponse }> {
    const normalized = id.trim();
    const reference = normalized.toUpperCase();

    if (!this.isMongoConnected()) {
      const order = this.inMemoryOrders.find(
        (entry) => entry._id === normalized || entry.orderReference === reference,
      );
      if (!order) {
        throw notFound('Order not found');
      }
      return { success: true, data: this.toResponse(order) };
    }

    let order = null;

    if (mongoose.isValidObjectId(normalized)) {
      order = await Order.findById(normalized).exec();
    }

    if (!order) {
      order = await Order.findOne({ orderReference: reference }).exec();
    }

    if (!order) {
      throw notFound('Order not found');
    }

    return { success: true, data: this.toResponse(order) };
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    remarks?: string,
    updatedBy = 'admin',
    io?: SocketIOServer,
  ): Promise<{ success: boolean; data: OrderResponse }> {
    const normalized = id.trim();
    const reference = normalized.toUpperCase();
    const trimmedRemarks = remarks?.trim() ? remarks.trim() : undefined;

    if (!trimmedRemarks) {
      throw badRequest(status === 'Cancelled' ? 'Cancellation reason is required' : 'Remarks are required');
    }

    const historyEntry = createHistoryEntry(status, updatedBy, trimmedRemarks);

    if (!this.isMongoConnected()) {
      const order = this.inMemoryOrders.find(
        (entry) => entry._id === normalized || entry.orderReference === reference,
      );
      if (!order) {
        throw notFound('Order not found');
      }
      if (order.status === 'Cancelled') {
        throw badRequest('Cancelled orders cannot be updated');
      }
      if (order.status === 'Delivered' && status !== 'Delivered') {
        throw badRequest('Delivered orders cannot be changed');
      }
      if (status === 'Cancelled' && order.status === 'Delivered') {
        throw badRequest('Delivered orders cannot be cancelled');
      }
      order.status = status;
      order.statusHistory = [...(order.statusHistory ?? []), historyEntry];
      order.updatedAt = new Date();
      io?.to(`order:${order._id}`).emit('order:status', {
        orderId: order._id,
        status,
      });

      const emailNotification = await this.sendStatusUpdateEmail(order, status, trimmedRemarks);
      return { success: true, data: this.toResponse(order, emailNotification) };
    }

    let order = null;

    if (mongoose.isValidObjectId(normalized)) {
      order = await Order.findById(normalized).exec();
    }

    if (!order) {
      order = await Order.findOne({ orderReference: reference }).exec();
    }

    if (!order) {
      throw notFound('Order not found');
    }

    if (order.status === 'Cancelled') {
      throw badRequest('Cancelled orders cannot be updated');
    }
    if (order.status === 'Delivered' && status !== 'Delivered') {
      throw badRequest('Delivered orders cannot be changed');
    }
    if (status === 'Cancelled' && order.status === 'Delivered') {
      throw badRequest('Delivered orders cannot be cancelled');
    }

    order.status = status;
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push(historyEntry);
    await order.save();

    io?.to(`order:${order._id.toString()}`).emit('order:status', {
      orderId: order._id.toString(),
      status,
    });

    const emailNotification = await this.sendStatusUpdateEmail(order, status, trimmedRemarks);
    return { success: true, data: this.toResponse(order, emailNotification) };
  }

  async listOrders(): Promise<{ success: boolean; data: OrderResponse[]; count: number }> {
    if (!this.isMongoConnected()) {
      const data = this.inMemoryOrders.map((order) => this.toResponse(order));
      return { success: true, data, count: data.length };
    }

    const orders = await Order.find().sort({ createdAt: -1 }).limit(50).exec();
    const data = orders.map((order) => this.toResponse(order));
    return { success: true, data, count: data.length };
  }

  async getDashboardStats(): Promise<{
    success: boolean;
    data: {
      totalOrders: number;
      todaysOrders: number;
      todaysRevenue: number;
      pendingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      recentOrders: OrderResponse[];
    };
  }> {
    const { data: orders } = await this.listOrders();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysOrdersList = orders.filter((order) => new Date(order.createdAt) >= startOfDay);
    const todaysBillableOrders = todaysOrdersList.filter((order) => order.status !== 'Cancelled');
    const todaysRevenue = todaysBillableOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      success: true,
      data: {
        totalOrders: orders.length,
        todaysOrders: todaysBillableOrders.length,
        todaysRevenue: Number(todaysRevenue.toFixed(2)),
        pendingOrders: orders.filter(
          (order) => order.status !== 'Delivered' && order.status !== 'Cancelled',
        ).length,
        completedOrders: orders.filter((order) => order.status === 'Delivered').length,
        cancelledOrders: orders.filter((order) => order.status === 'Cancelled').length,
        recentOrders: orders.slice(0, 10),
      },
    };
  }

  private async sendStatusUpdateEmail(
    order: {
      orderReference: string;
      items: IOrderBase['items'];
      delivery: IOrderBase['delivery'];
      total: number;
    },
    status: OrderStatus,
    remarks?: string,
  ): Promise<EmailSendResult | undefined> {
    const email = order.delivery.email?.trim();
    if (!email) {
      return undefined;
    }

    if (status !== 'Delivered' && status !== 'Cancelled') {
      return undefined;
    }

    const payload = {
      to: email,
      customerName: order.delivery.name,
      orderReference: order.orderReference,
      total: order.total,
      items: order.items,
      ...(remarks ? { remarks } : {}),
    };

    if (status === 'Delivered') {
      return sendOrderDeliveredEmail(payload);
    }

    return sendOrderCancelledEmail(payload);
  }

  private toResponse(
    order: {
      _id: string | { toString(): string };
      orderReference: string;
      items: IOrderBase['items'];
      delivery: IOrderBase['delivery'];
      status: OrderStatus;
      statusHistory?: IStatusHistoryEntry[];
      subtotal: number;
      deliveryFee: number;
      tax: number;
      total: number;
      estimatedDeliveryMinutes: number;
      createdAt: Date;
      updatedAt: Date;
    },
    emailNotification?: EmailSendResult,
  ): OrderResponse {
    const history = (order.statusHistory ?? []).map((entry) => ({
      status: entry.status,
      ...(entry.remarks ? { remarks: entry.remarks } : {}),
      updatedBy: entry.updatedBy,
      updatedAt:
        entry.updatedAt instanceof Date
          ? entry.updatedAt.toISOString()
          : new Date(entry.updatedAt).toISOString(),
    }));

    return {
      id: order._id.toString(),
      orderReference: order.orderReference,
      items: order.items,
      delivery: order.delivery,
      status: order.status,
      statusHistory: history,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      total: order.total,
      estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      ...(emailNotification ? { emailNotification } : {}),
    };
  }

  private isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export const orderService = new OrderService();
