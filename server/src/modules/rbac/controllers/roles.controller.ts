import { Request, Response, NextFunction } from 'express';
import { rolesService } from '../services/roles.service.js';
import { createRoleSchema, updateRoleSchema } from '../validators/roles.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class RolesController {
  async listRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await rolesService.listRoles();
      sendSuccess(res, items, 'Roles retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await rolesService.getRoleById(req.params.id);
      sendSuccess(res, role, 'Role retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createRoleSchema.parse(req.body);
      const created = await rolesService.createRole(input);
      sendSuccess(res, created, 'Role created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateRoleSchema.parse(req.body);
      const updated = await rolesService.updateRole(req.params.id, input);
      sendSuccess(res, updated, 'Role updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await rolesService.deleteRole(req.params.id);
      sendSuccess(res, null, 'Role deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async listPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolesService.listPermissionsGrouped();
      sendSuccess(res, data, 'Permissions retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const rolesController = new RolesController();
