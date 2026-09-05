import { Router } from 'express';
import { recommendationRulesController } from '../controllers/recommendationRules.controller.js';
import { quotationRecommendationsController } from '../controllers/quotationRecommendations.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const recommendationRulesRouter = Router();
recommendationRulesRouter.use(requireAuth);

recommendationRulesRouter.post(
  '/',
  requirePermission(Permissions.RECOMMENDATION_RULE_CREATE),
  (req, res, next) => recommendationRulesController.create(req, res, next)
);

recommendationRulesRouter.get(
  '/',
  requirePermission(Permissions.RECOMMENDATION_RULE_READ),
  (req, res, next) => recommendationRulesController.list(req, res, next)
);

recommendationRulesRouter.get(
  '/:id',
  requirePermission(Permissions.RECOMMENDATION_RULE_READ),
  (req, res, next) => recommendationRulesController.getById(req, res, next)
);

recommendationRulesRouter.patch(
  '/:id',
  requirePermission(Permissions.RECOMMENDATION_RULE_UPDATE),
  (req, res, next) => recommendationRulesController.update(req, res, next)
);

recommendationRulesRouter.delete(
  '/:id',
  requirePermission(Permissions.RECOMMENDATION_RULE_DELETE),
  (req, res, next) => recommendationRulesController.delete(req, res, next)
);

export const quotationRecommendationsRouter = Router({ mergeParams: true });
quotationRecommendationsRouter.use(requireAuth);

quotationRecommendationsRouter.get(
  '/',
  requirePermission(Permissions.RECOMMENDATION_READ),
  (req, res, next) => quotationRecommendationsController.getRecommendations(req, res, next)
);

quotationRecommendationsRouter.post(
  '/:recommendationId/accept',
  requirePermission(Permissions.RECOMMENDATION_ACCEPT),
  (req, res, next) => quotationRecommendationsController.acceptRecommendation(req, res, next)
);

quotationRecommendationsRouter.post(
  '/:recommendationId/dismiss',
  requirePermission(Permissions.RECOMMENDATION_DISMISS),
  (req, res, next) => quotationRecommendationsController.dismissRecommendation(req, res, next)
);
