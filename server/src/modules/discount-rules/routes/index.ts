import { Router } from 'express';
import { discountRulesController } from '../controllers/discountRules.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const discountRulesRouter = Router();

// All discount rules endpoints require authentication
discountRulesRouter.use(requireAuth);

// Discount Resolution
discountRulesRouter.get(
  '/resolve',
  requirePermission(Permissions.DISCOUNT_RULE_READ),
  (req, res, next) => discountRulesController.resolveEffectiveLimit(req, res, next)
);

// Customer Tier Discount Rules
discountRulesRouter.get(
  '/customer-tiers',
  requirePermission(Permissions.DISCOUNT_RULE_READ),
  (req, res, next) => discountRulesController.listTierRules(req, res, next)
);

discountRulesRouter.get(
  '/customer-tiers/:id',
  requirePermission(Permissions.DISCOUNT_RULE_READ),
  (req, res, next) => discountRulesController.getTierRuleById(req, res, next)
);

discountRulesRouter.post(
  '/customer-tiers',
  requirePermission(Permissions.DISCOUNT_RULE_MANAGE),
  (req, res, next) => discountRulesController.createTierRule(req, res, next)
);

discountRulesRouter.patch(
  '/customer-tiers/:id',
  requirePermission(Permissions.DISCOUNT_RULE_MANAGE),
  (req, res, next) => discountRulesController.updateTierRule(req, res, next)
);

discountRulesRouter.delete(
  '/customer-tiers/:id',
  requirePermission(Permissions.DISCOUNT_RULE_MANAGE),
  (req, res, next) => discountRulesController.deleteTierRule(req, res, next)
);

// Category Discount Rules
discountRulesRouter.get(
  '/categories',
  requirePermission(Permissions.DISCOUNT_RULE_READ),
  (req, res, next) => discountRulesController.listCategoryRules(req, res, next)
);

discountRulesRouter.get(
  '/categories/:id',
  requirePermission(Permissions.DISCOUNT_RULE_READ),
  (req, res, next) => discountRulesController.getCategoryRuleById(req, res, next)
);

discountRulesRouter.post(
  '/categories',
  requirePermission(Permissions.DISCOUNT_RULE_MANAGE),
  (req, res, next) => discountRulesController.createCategoryRule(req, res, next)
);

discountRulesRouter.patch(
  '/categories/:id',
  requirePermission(Permissions.DISCOUNT_RULE_MANAGE),
  (req, res, next) => discountRulesController.updateCategoryRule(req, res, next)
);

discountRulesRouter.delete(
  '/categories/:id',
  requirePermission(Permissions.DISCOUNT_RULE_MANAGE),
  (req, res, next) => discountRulesController.deleteCategoryRule(req, res, next)
);
