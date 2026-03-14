import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import * as FavoritesService from '../services/FavoritesService.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Routes ─────────────────────────────────────────

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = z.coerce.number().positive().default(50).parse(req.query.limit);
      const offset = z.coerce.number().nonnegative().default(0).parse(req.query.offset);
      const favorites = await FavoritesService.getFavorites(req.userId!, limit, offset);
      const response: ApiResponse<typeof favorites> = {
        success: true,
        data: favorites,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as favoritesRouter };
