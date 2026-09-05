import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../validators/auth.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/index.js';
import { ValidationError } from '../../../common/errors/index.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.format());
      }

      const result = await authService.register(parsed.data);
      sendSuccess(res, result, 'User registered successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.format());
      }

      const result = await authService.login(parsed.data);
      sendSuccess(res, result, 'Login successful', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.format());
      }

      const result = await authService.refreshTokens(parsed.data.refreshToken);
      sendSuccess(res, result, 'Tokens refreshed successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = logoutSchema.safeParse(req.body);
      const refreshToken = parsed.success ? parsed.data.refreshToken : undefined;

      await authService.logout(refreshToken);
      sendSuccess(res, null, 'Logged out successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await authService.getCurrentUser(userId);
      sendSuccess(res, user, 'Current user profile retrieved', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
