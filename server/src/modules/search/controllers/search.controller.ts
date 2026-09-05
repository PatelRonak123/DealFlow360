import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service.js';
import { sendSuccess } from '../../../common/utils/index.js';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const user = req.user!;
      const results = await searchService.performGlobalSearch(query, user as any);
      sendSuccess(res, results);
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
