import type { NextFunction, Request, Response } from 'express';

import type { AdminRequest } from '@src/middlewares/adminAuth.middleware';
import { menuItemsService } from '@src/modules/admin-modules/menu-items/menuItems.service';
import {
  createMenuItemAdminSchema,
  menuItemIdParamSchema,
  statusChangeSchema,
  updateMenuItemAdminSchema,
} from '@src/modules/admin-modules/menu-items/menuItems.validation';

export class MenuItemsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await menuItemsService.listMenuItems(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createMenuItemAdminSchema.parse(req.body);
      const response = await menuItemsService.createMenuItem(input, req.adminUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = menuItemIdParamSchema.parse(req.params);
      const input = updateMenuItemAdminSchema.parse(req.body);
      const response = await menuItemsService.updateMenuItem(id, input, req.adminUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async softDelete(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = menuItemIdParamSchema.parse(req.params);
      const response = await menuItemsService.softDeleteMenuItem(id, req.adminUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = menuItemIdParamSchema.parse(req.params);
      const input = statusChangeSchema.parse(req.body);
      const response = await menuItemsService.changeStatus(id, input.isAvailable, req.adminUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const menuItemsController = new MenuItemsController();
