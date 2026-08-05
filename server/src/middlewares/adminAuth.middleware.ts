import type { NextFunction, Request, Response } from 'express';

import { adminService } from '@src/modules/admin-modules/admin/admin.service';
import { unauthorized } from '@src/utils/httpError';

export interface AdminRequest extends Request {
  adminUser?: string;
}

export function adminAuthMiddleware(req: AdminRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw unauthorized('Admin authorization token is required');
    }

    const token = authHeader.slice('Bearer '.length).trim();

    if (!token) {
      throw unauthorized('Admin authorization token is required');
    }

    const payload = adminService.verifyToken(token);
    req.adminUser = payload.username;
    next();
  } catch (error) {
    next(error);
  }
}
