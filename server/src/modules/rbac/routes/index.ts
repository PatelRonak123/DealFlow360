import { Router } from 'express';
import { rolesController } from '../controllers/roles.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../constants/permissions.js';

export const rolesRouter = Router();
rolesRouter.use(requireAuth);

rolesRouter.get(
  '/',
  requirePermission(Permissions.USER_READ),
  (req, res, next) => rolesController.listRoles(req, res, next)
);

rolesRouter.get(
  '/:id',
  requirePermission(Permissions.USER_READ),
  (req, res, next) => rolesController.getRoleById(req, res, next)
);

rolesRouter.post(
  '/',
  requirePermission(Permissions.USER_MANAGE),
  (req, res, next) => rolesController.createRole(req, res, next)
);

rolesRouter.patch(
  '/:id',
  requirePermission(Permissions.USER_MANAGE),
  (req, res, next) => rolesController.updateRole(req, res, next)
);

rolesRouter.delete(
  '/:id',
  requirePermission(Permissions.USER_MANAGE),
  (req, res, next) => rolesController.deleteRole(req, res, next)
);

export const permissionsRouter = Router();
permissionsRouter.use(requireAuth);

permissionsRouter.get(
  '/',
  requirePermission(Permissions.USER_READ),
  (req, res, next) => rolesController.listPermissions(req, res, next)
);
