import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../../config/env.js';
import { HttpStatusCode } from '../constants/httpStatus.js';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = (isAppError ? err.statusCode : 500) as HttpStatusCode;
  const errorCode = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError ? err.message : 'An unexpected error occurred';
  const details = isAppError ? err.details : undefined;
  const stack = env.NODE_ENV === 'development' ? err.stack : undefined;

  sendError(res, message, statusCode, errorCode, details, stack);
}
