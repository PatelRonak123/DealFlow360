import { Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { HttpStatus, HttpStatusCode } from '../constants/httpStatus.js';

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message = 'Operation completed successfully',
  statusCode: HttpStatusCode = HttpStatus.OK,
  meta?: ApiResponse['meta']
): Response {
  const responseBody: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(responseBody);
}

export function sendError(
  res: Response,
  message = 'An unexpected error occurred',
  statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
  code = 'INTERNAL_ERROR',
  details?: unknown,
  stack?: string
): Response {
  const responseBody: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(stack ? { stack } : {}),
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(responseBody);
}
