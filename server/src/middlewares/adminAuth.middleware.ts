import type { NextFunction, Request, Response } from 'express';

import { adminService } from '@src/modules/admin-modules/admin/admin.service';

export interface AdminRequest extends Request {
  adminUser?: string;
}

export function adminAuthMiddleware(req: AdminRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      const error = new Error('Admin authorization token is required') as Error & { statusCode?: number };
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const payload = adminService.verifyToken(token);
    req.adminUser = payload.username;
    next();
  } catch (error) {
    next(error);
  }
}
