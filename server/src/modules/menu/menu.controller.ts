import type { NextFunction, Request, Response } from 'express';

import { menuService } from '@src/modules/menu/menu.service';
import { getMenuItemsQuerySchema } from '@src/modules/menu/menu.validation';

export class MenuController {
  async getMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getMenuItemsQuerySchema.parse(req.query);
      const response = await menuService.getMenuItems(query);

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const menuController = new MenuController();
