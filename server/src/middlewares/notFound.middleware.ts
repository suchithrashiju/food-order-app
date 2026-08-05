import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '@src/utils/httpError';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Route not found: ${req.originalUrl}`));
}
