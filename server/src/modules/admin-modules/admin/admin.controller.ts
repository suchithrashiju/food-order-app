import type { NextFunction, Request, Response } from 'express';

import { adminService } from '@src/modules/admin-modules/admin/admin.service';
import { adminLoginSchema, seedAdminSchema } from '@src/modules/admin-modules/admin/admin.validation';

export class AdminController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = adminLoginSchema.parse(req.body);
      const response = await adminService.login(input);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async seed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const headerSecret = req.headers['x-seed-secret'];
      const bodyInput = seedAdminSchema.parse(req.body ?? {});
      const seedSecret = typeof headerSecret === 'string' && headerSecret.trim() !== ''
        ? headerSecret.trim()
        : bodyInput.seedSecret;

      adminService.assertSeedAccess({
        ...(seedSecret ? { seedSecret } : {}),
      });

      const response = await adminService.seedAdminSetup();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await adminService.getDashboardSummary();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
