import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { env } from '../../config/env.js';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorCode = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError ? err.message : 'An unexpected error occurred';
  const details = isAppError ? err.details : undefined;

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}
