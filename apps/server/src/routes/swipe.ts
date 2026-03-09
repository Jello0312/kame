import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Zod Schema ─────────────────────────────────────

const swipeSchema = z.object({
  productId: z.string().uuid(),
  action: z.enum(['LIKE', 'DISLIKE']),
  outfitGroupId: z.string().uuid().optional(),
});

// ─── Routes ─────────────────────────────────────────

router.post(
  '/',
  authenticate,
  validate({ body: swipeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as z.infer<typeof swipeSchema>;

      const swipe = await prisma.swipeAction.upsert({
        where: {
          userId_productId: {
            userId: req.userId!,
            productId: data.productId,
          },
        },
        create: {
          userId: req.userId!,
          productId: data.productId,
          action: data.action,
          outfitGroupId: data.outfitGroupId ?? null,
        },
        update: {
          action: data.action,
          outfitGroupId: data.outfitGroupId ?? null,
        },
      });

      const response: ApiResponse<typeof swipe> = {
        success: true,
        data: swipe,
        message: 'Swipe recorded',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as swipeRouter };
