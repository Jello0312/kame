import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
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

      const swipes = await prisma.swipeAction.findMany({
        where: { userId: req.userId!, action: 'LIKE' },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const favorites = swipes.map((s) => ({
        id: s.product.id,
        name: s.product.name,
        brand: s.product.brand,
        price: Number(s.product.price),
        currency: s.product.currency,
        platform: s.product.platform,
        imageUrl: s.product.imageUrls[0] ?? '',
        productPageUrl: s.product.productPageUrl,
        likedAt: s.createdAt,
      }));

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
