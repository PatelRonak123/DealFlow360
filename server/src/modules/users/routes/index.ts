import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const usersRouter = Router();

// All users management endpoints require authentication and user permissions
usersRouter.use(requireAuth);

usersRouter.get(
  '/',
  requirePermission(Permissions.USER_READ),
  (req, res, next) => usersController.list(req, res, next)
);

usersRouter.get(
  '/:id',
  requirePermission(Permissions.USER_READ),
  (req, res, next) => usersController.getById(req, res, next)
);

usersRouter.post(
  '/',
  requirePermission(Permissions.USER_MANAGE),
  (req, res, next) => usersController.create(req, res, next)
);

usersRouter.patch(
  '/:id',
  requirePermission(Permissions.USER_MANAGE),
  (req, res, next) => usersController.update(req, res, next)
);

usersRouter.patch(
  '/:id/status',
  requirePermission(Permissions.USER_MANAGE),
  (req, res, next) => usersController.updateStatus(req, res, next)
);

usersRouter.delete(
  '/:id',
  requirePermission(Permissions.USER_MANAGE),
  (req, res, next) => usersController.delete(req, res, next)
);
