import type { NextFunction, Request, Response } from 'express';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const error = new Error(`Route not found: ${req.originalUrl}`) as Error & { statusCode?: number };
  error.statusCode = 404;
  next(error);
}
