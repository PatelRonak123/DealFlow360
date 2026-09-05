import { Router } from 'express';
import { requireAuth } from '../../auth/middleware/auth.middleware.js';
import { searchController } from '../controllers/search.controller.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

searchRouter.get('/', (req, res, next) => searchController.search(req, res, next));
