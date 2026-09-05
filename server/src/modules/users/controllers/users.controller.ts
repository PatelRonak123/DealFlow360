import { Request, Response, NextFunction } from 'express';
import { usersService } from '../services/users.service.js';
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userQuerySchema,
} from '../validators/users.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class UsersController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = userQuerySchema.parse(req.query);
      const result = await usersService.listUsers(query);

      sendSuccess(res, result.items, 'Users retrieved successfully', HttpStatus.OK, {
        page: result.page,
        limit: result.limit,
        pageSize: result.limit,
        total: result.total,
        totalItems: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getUserById(req.params.id);
      sendSuccess(res, user, 'User details retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createUserSchema.parse(req.body);
      const created = await usersService.createUser(input);
      sendSuccess(res, created, 'User account created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateUserSchema.parse(req.body);
      const requestingUserId = (req as any).user?.userId;
      const updated = await usersService.updateUser(req.params.id, input, requestingUserId);
      sendSuccess(res, updated, 'User account updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateUserStatusSchema.parse(req.body);
      const requestingUserId = (req as any).user?.userId;
      const updated = await usersService.updateUserStatus(
        req.params.id,
        input,
        requestingUserId
      );
      sendSuccess(res, updated, 'User status updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestingUserId = (req as any).user?.userId;
      await usersService.deleteUser(req.params.id, requestingUserId);
      sendSuccess(res, null, 'User deactivated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
