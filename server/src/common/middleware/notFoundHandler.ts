import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/AppError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
}
