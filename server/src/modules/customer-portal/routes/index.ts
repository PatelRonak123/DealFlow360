import { Router } from 'express';
import { customerPortalController } from '../controllers/customerPortal.controller.js';
import { requireAuth, requireRole } from '../../auth/middleware/auth.middleware.js';
import { Roles } from '../../rbac/constants/roles.js';

export const customerPortalRouter = Router();

// Protect all customer portal routes: Authenticated users with CUSTOMER (or ADMIN) role
customerPortalRouter.use(requireAuth, requireRole(Roles.CUSTOMER, Roles.ADMIN));

// Dashboard
customerPortalRouter.get('/dashboard', (req, res, next) => customerPortalController.getDashboard(req, res, next));

// Quotations
customerPortalRouter.get('/quotations', (req, res, next) => customerPortalController.listQuotations(req, res, next));
customerPortalRouter.get('/quotations/:id', (req, res, next) => customerPortalController.getQuotationById(req, res, next));
customerPortalRouter.post('/quotations/:id/negotiate', (req, res, next) => customerPortalController.submitNegotiation(req, res, next));
customerPortalRouter.post('/quotations/:id/confirm', (req, res, next) => customerPortalController.confirmQuotation(req, res, next));

// Orders
customerPortalRouter.get('/orders', (req, res, next) => customerPortalController.listOrders(req, res, next));
customerPortalRouter.get('/orders/:id', (req, res, next) => customerPortalController.getOrderById(req, res, next));

// Invoices
customerPortalRouter.get('/invoices', (req, res, next) => customerPortalController.listInvoices(req, res, next));
customerPortalRouter.get('/invoices/:id', (req, res, next) => customerPortalController.getInvoiceById(req, res, next));
customerPortalRouter.post('/invoices/:id/pay', (req, res, next) => customerPortalController.payInvoice(req, res, next));

// Payments
customerPortalRouter.get('/payments', (req, res, next) => customerPortalController.listPayments(req, res, next));

// Subscriptions
customerPortalRouter.get('/subscriptions', (req, res, next) => customerPortalController.listSubscriptions(req, res, next));
customerPortalRouter.get('/subscriptions/:id', (req, res, next) => customerPortalController.getSubscriptionById(req, res, next));

// Notifications
customerPortalRouter.get('/notifications', (req, res, next) => customerPortalController.listNotifications(req, res, next));
customerPortalRouter.patch('/notifications/:id/read', (req, res, next) => customerPortalController.markNotificationRead(req, res, next));
customerPortalRouter.post('/notifications/mark-all-read', (req, res, next) => customerPortalController.markAllNotificationsRead(req, res, next));

// Profile
customerPortalRouter.get('/profile', (req, res, next) => customerPortalController.getProfile(req, res, next));
customerPortalRouter.patch('/profile', (req, res, next) => customerPortalController.updateProfile(req, res, next));
