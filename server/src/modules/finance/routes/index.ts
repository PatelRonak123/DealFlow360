import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../auth/middleware/auth.middleware.js";
import { Roles } from "../../rbac/constants/roles.js";
import { financeController } from "../controllers/finance.controller.js";

export const financeRouter = Router();

// All finance routes require authentication and FINANCE or ADMIN role
financeRouter.use(requireAuth);
financeRouter.use(requireRole(Roles.FINANCE, Roles.ADMIN));

financeRouter.get("/dashboard", (req, res, next) =>
  financeController.getDashboard(req, res, next),
);

financeRouter.get("/approvals", (req, res, next) =>
  financeController.listApprovals(req, res, next),
);

financeRouter.get("/approvals/:id", (req, res, next) =>
  financeController.getDealReview(req, res, next),
);

financeRouter.post("/approvals/:id/approve", (req, res, next) =>
  financeController.approveDeal(req, res, next),
);

financeRouter.post("/approvals/:id/reject", (req, res, next) =>
  financeController.rejectDeal(req, res, next),
);

financeRouter.post("/approvals/:id/return", (req, res, next) =>
  financeController.returnDeal(req, res, next),
);
