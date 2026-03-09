import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Zod Schema ─────────────────────────────────────

const clickSchema = z.object({
  productId: z.string().uuid(),
  platform: z.string().min(1),
});

// ─── Routes ─────────────────────────────────────────

router.post(
  '/click',
  authenticate,
  validate({ body: clickSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as z.infer<typeof clickSchema>;
      await prisma.analyticsClick.create({
        data: {
          userId: req.userId!,
          productId: data.productId,
          platform: data.platform,
        },
      });
      const response: ApiResponse = {
        success: true,
        message: 'Click logged',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as analyticsRouter };
