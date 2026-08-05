import type { NextFunction, Request, Response } from 'express';
import type { Server as SocketIOServer } from 'socket.io';

import { orderService } from '@src/modules/order/order.service';
import { createOrderSchema, orderIdParamSchema } from '@src/modules/order/order.validation';

export class OrderController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createOrderSchema.parse(req.body);
      const io = req.app.locals.io as SocketIOServer | undefined;
      const response = await orderService.createOrder(input, io);
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
}

export const orderController = new OrderController();
