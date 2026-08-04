import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const error = err instanceof Error ? err : new Error('Internal Server Error');
  const statusCode = typeof (error as AppError).statusCode === 'number' ? (error as AppError).statusCode! : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
}
