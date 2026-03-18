import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as FeedService from '../services/FeedService.js';
import type { FeedResult } from '../services/FeedService.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Zod Schema ─────────────────────────────────────

const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─── Routes ─────────────────────────────────────────

router.get(
  '/',
  authenticate,
  validate({ query: feedQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as z.infer<typeof feedQuerySchema>;
      const result = await FeedService.getFeedForUser(req.userId!, query.cursor, query.limit);
      const response: ApiResponse<FeedResult> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      // Temporary debug: log full error for diagnosis
      console.error('[FEED ERROR]', err instanceof Error ? err.stack : err);
      next(err);
    }
  },
);

// ─── Debug Route (TEMPORARY — remove before production) ────
router.get(
  '/debug',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const result = await FeedService.getFeedForUser(req.userId!, undefined, 3);
      res.json({ success: true, cards: result.cards.length });
    } catch (err) {
      const error = err instanceof Error ? { message: err.message, stack: err.stack, name: err.name } : err;
      res.status(500).json({ success: false, debug: error });
    }
  },
);

export { router as feedRouter };
