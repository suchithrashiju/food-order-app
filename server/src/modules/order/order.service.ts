import { randomUUID } from 'node:crypto';

import type { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';

import { Order, ORDER_STATUSES, type IOrderBase, type OrderStatus } from '@src/models/order.model';
import type { CreateOrderInput } from '@src/modules/order/order.validation';
import { notFound } from '@src/utils/httpError';

const DELIVERY_FEE = 2.99;
const TAX_RATE = 0.08;
const STATUS_ADVANCE_MS = 12_000;

interface OrderResponse {
  id: string;
  items: IOrderBase['items'];
  delivery: IOrderBase['delivery'];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  estimatedDeliveryMinutes: number;
  createdAt: string;
  updatedAt: string;
}

interface InMemoryOrder extends IOrderBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderService {
  private readonly inMemoryOrders: InMemoryOrder[] = [];
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  async createOrder(input: CreateOrderInput, io?: SocketIOServer): Promise<{ success: boolean; data: OrderResponse }> {
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const deliveryFee = DELIVERY_FEE;
    const total = Number((subtotal + tax + deliveryFee).toFixed(2));
    const notes = input.delivery.notes?.trim() ? input.delivery.notes.trim() : undefined;

    const payload: IOrderBase = {
      items: input.items,
      delivery: {
        name: input.delivery.name,
        phone: input.delivery.phone,
        address: input.delivery.address,
        city: input.delivery.city,
        postalCode: input.delivery.postalCode,
        ...(notes ? { notes } : {}),
      },
      status: 'Order Received',
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee,
      tax,
      total,
      estimatedDeliveryMinutes: 35,
    };

    if (!this.isMongoConnected()) {
      const order: InMemoryOrder = {
        _id: randomUUID(),
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.inMemoryOrders.unshift(order);
      this.scheduleStatusProgression(order._id, io);
      return { success: true, data: this.toResponse(order) };
    }

    const order = await Order.create(payload);
    this.scheduleStatusProgression(order._id.toString(), io);
    return { success: true, data: this.toResponse(order) };
  }

  async getOrderById(id: string): Promise<{ success: boolean; data: OrderResponse }> {
    if (!this.isMongoConnected()) {
      const order = this.inMemoryOrders.find((entry) => entry._id === id);
      if (!order) {
        throw notFound('Order not found');
      }
      return { success: true, data: this.toResponse(order) };
    }

    const order = await Order.findById(id).exec();
    if (!order) {
      throw notFound('Order not found');
    }
    return { success: true, data: this.toResponse(order) };
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
      todaysRevenue: number;
      pendingOrders: number;
      completedOrders: number;
      recentOrders: OrderResponse[];
    };
  }> {
    const { data: orders } = await this.listOrders();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysRevenue = orders
      .filter((order) => new Date(order.createdAt) >= startOfDay)
      .reduce((sum, order) => sum + order.total, 0);

    return {
      success: true,
      data: {
        totalOrders: orders.length,
        todaysRevenue: Number(todaysRevenue.toFixed(2)),
        pendingOrders: orders.filter((order) => order.status !== 'Delivered').length,
        completedOrders: orders.filter((order) => order.status === 'Delivered').length,
        recentOrders: orders.slice(0, 10),
      },
    };
  }

  private scheduleStatusProgression(orderId: string, io?: SocketIOServer): void {
    const existing = this.timers.get(orderId);
    if (existing) {
      clearTimeout(existing);
    }

    const advance = async (): Promise<void> => {
      const current = await this.getCurrentStatus(orderId);
      if (!current) {
        return;
      }

      const index = ORDER_STATUSES.indexOf(current);
      if (index < 0 || index >= ORDER_STATUSES.length - 1) {
        this.timers.delete(orderId);
        return;
      }

      const nextStatus = ORDER_STATUSES[index + 1]!;
      await this.updateStatus(orderId, nextStatus);

      io?.to(`order:${orderId}`).emit('order:status', {
        orderId,
        status: nextStatus,
      });

      if (nextStatus !== 'Delivered') {
        const timer = setTimeout(() => {
          void advance();
        }, STATUS_ADVANCE_MS);
        this.timers.set(orderId, timer);
      } else {
        this.timers.delete(orderId);
      }
    };

    const timer = setTimeout(() => {
      void advance();
    }, STATUS_ADVANCE_MS);
    this.timers.set(orderId, timer);
  }

  private async getCurrentStatus(orderId: string): Promise<OrderStatus | null> {
    if (!this.isMongoConnected()) {
      return this.inMemoryOrders.find((order) => order._id === orderId)?.status ?? null;
    }

    const order = await Order.findById(orderId).select('status').lean().exec();
    return (order?.status as OrderStatus | undefined) ?? null;
  }

  private async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (!this.isMongoConnected()) {
      const order = this.inMemoryOrders.find((entry) => entry._id === orderId);
      if (order) {
        order.status = status;
        order.updatedAt = new Date();
      }
      return;
    }

    await Order.findByIdAndUpdate(orderId, { status }).exec();
  }

  private toResponse(order: {
    _id: string | { toString(): string };
    items: IOrderBase['items'];
    delivery: IOrderBase['delivery'];
    status: OrderStatus;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
    estimatedDeliveryMinutes: number;
    createdAt: Date;
    updatedAt: Date;
  }): OrderResponse {
    return {
      id: order._id.toString(),
      items: order.items,
      delivery: order.delivery,
      status: order.status,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      total: order.total,
      estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export const orderService = new OrderService();
