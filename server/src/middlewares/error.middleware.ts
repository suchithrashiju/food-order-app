import type { NextFunction, Request, Response } from 'express';

interface AppError extends Error {
  statusCode?: number;
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const error = err instanceof Error ? err : new Error('Internal Server Error');
  const statusCode = typeof (error as AppError).statusCode === 'number' ? (error as AppError).statusCode! : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
}
