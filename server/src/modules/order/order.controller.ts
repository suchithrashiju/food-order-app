import type { NextFunction, Request, Response } from 'express';
import type { Server as SocketIOServer } from 'socket.io';

import type { AdminRequest } from '@src/middlewares/adminAuth.middleware';
import {
  cancelOrderStatusSimulation,
  scheduleOrderStatusSimulation,
} from '@src/modules/order/order-status.simulator';
import { orderService } from '@src/modules/order/order.service';
import {
  createOrderSchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from '@src/modules/order/order.validation';

export class OrderController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createOrderSchema.parse(req.body);
      const response = await orderService.createOrder(input);
      const io = req.app.locals.io as SocketIOServer | undefined;
      scheduleOrderStatusSimulation(response.data.id, io);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = orderIdParamSchema.parse(req.params);
      const response = await orderService.getOrderById(id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await orderService.listOrders();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await orderService.getDashboardStats();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = orderIdParamSchema.parse(req.params);
      const { status, remarks } = updateOrderStatusSchema.parse(req.body);
      const io = req.app.locals.io as SocketIOServer | undefined;
      // Manual admin updates stop the auto-simulator so paths do not race.
      cancelOrderStatusSimulation(id);
      const response = await orderService.updateOrderStatus(
        id,
        status,
        remarks || undefined,
        req.adminUser ?? 'admin',
        io,
      );
      cancelOrderStatusSimulation(response.data.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
