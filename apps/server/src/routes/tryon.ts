import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { tryonQueue, isQueueConfigured } from '../lib/queue.js';
import { isFashnConfigured } from '../integrations/fashn.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import type { ApiResponse } from '@kame/shared-types';

// NOTE: TryOnJobData changed in Session 2 (face-swap migration).
// These routes still use the old outfit-pairing shape and will be
// fully rewritten in Session 3. Using untyped job data for now.

const router: Router = Router();

// ─── Constants ───────────────────────────────────────

const MAX_FEMALE_OUTFITS = 20;
const MAX_MALE_OUTFITS = 15;
const MAX_SOLO_DRESSES = 6;

// ─── Interfaces ──────────────────────────────────────

interface BatchResult {
  totalQueued: number;
  outfitPairings: number;
  soloDresses: number;
}

interface StatusResult {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
}

// ─── POST /batch — Trigger pre-generation ────────────

router.post(
  '/batch',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isQueueConfigured()) {
        throw new AppError('Try-on queue is not configured (missing REDIS_URL)', 503);
      }

      if (!isFashnConfigured()) {
        throw new AppError('FASHN API is not configured (missing FASHN_API_KEY)', 503);
      }

      const userId = req.userId!;

      // 1. Get user avatar (need body photo URL)
      const avatar = await prisma.userAvatar.findUnique({
        where: { userId },
      });

      if (!avatar?.bodyPhotoUrl) {
        throw new NotFoundError('UserAvatar with body photo');
      }

      // 2. Get user profile (need gender)
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new NotFoundError('UserProfile');
      }

      const isFemale = profile.gender === 'W';
      const maxOutfits = isFemale ? MAX_FEMALE_OUTFITS : MAX_MALE_OUTFITS;

      // 3. Get outfit pairings — exclude already-generated
      const existingOutfitResults = await prisma.tryOnResult.findMany({
        where: { userId, outfitPairingId: { not: null } },
        select: { outfitPairingId: true },
      });
      const existingOutfitIds = new Set(
        existingOutfitResults.map((r) => r.outfitPairingId),
      );

      const pairings = await prisma.outfitPairing.findMany({
        where: {
          gender: { in: [profile.gender, 'U'] },
          id: { notIn: [...existingOutfitIds].filter((id): id is string => id !== null) },
        },
        include: {
          topProduct: { select: { imageUrls: true, fashnCategory: true } },
          bottomProduct: { select: { imageUrls: true, fashnCategory: true } },
        },
        take: maxOutfits,
      });

      // 4. Queue outfit pairing jobs
      let outfitCount = 0;
      for (const pairing of pairings) {
        const topImageUrl = pairing.topProduct.imageUrls[0];
        const bottomImageUrl = pairing.bottomProduct.imageUrls[0];

        if (!topImageUrl || !bottomImageUrl) continue;

        // Create PENDING TryOnResult record
        const tryOnResult = await prisma.tryOnResult.create({
          data: {
            userId,
            outfitPairingId: pairing.id,
            status: 'PENDING',
            layer: 'combined',
          },
        });

        // Add to queue
        // Legacy job data — will be replaced in Session 3
        const jobData = {
          tryOnResultId: tryOnResult.id,
          userId,
          bodyPhotoUrl: avatar.bodyPhotoUrl,
          type: 'outfit' as const,
          outfitPairingId: pairing.id,
          topGarmentUrl: topImageUrl,
          bottomGarmentUrl: bottomImageUrl,
          topCategory: (pairing.topProduct.fashnCategory ?? 'tops') as 'tops' | 'bottoms' | 'one-pieces',
          bottomCategory: (pairing.bottomProduct.fashnCategory ?? 'bottoms') as 'tops' | 'bottoms' | 'one-pieces',
        };

        await tryonQueue!.add('outfit', jobData);
        outfitCount++;
      }

      // 5. Queue solo dress jobs (female only)
      let soloCount = 0;
      if (isFemale) {
        const existingSoloResults = await prisma.tryOnResult.findMany({
          where: { userId, layer: 'solo', productId: { not: null } },
          select: { productId: true },
        });
        const existingSoloIds = new Set(
          existingSoloResults.map((r) => r.productId),
        );

        const soloDresses = await prisma.product.findMany({
          where: {
            fashnCategory: 'one-pieces',
            gender: 'FEMALE',
            id: { notIn: [...existingSoloIds].filter((id): id is string => id !== null) },
          },
          select: { id: true, imageUrls: true, fashnCategory: true },
          take: MAX_SOLO_DRESSES,
        });

        for (const dress of soloDresses) {
          const garmentUrl = dress.imageUrls[0];
          if (!garmentUrl) continue;

          const tryOnResult = await prisma.tryOnResult.create({
            data: {
              userId,
              productId: dress.id,
              status: 'PENDING',
              layer: 'solo',
            },
          });

          // Legacy job data — will be replaced in Session 3
          const jobData = {
            tryOnResultId: tryOnResult.id,
            userId,
            bodyPhotoUrl: avatar.bodyPhotoUrl,
            type: 'solo' as const,
            productId: dress.id,
            garmentUrl,
            garmentCategory: (dress.fashnCategory ?? 'one-pieces') as 'tops' | 'bottoms' | 'one-pieces',
          };

          await tryonQueue!.add('solo', jobData);
          soloCount++;
        }
      }

      const result: BatchResult = {
        totalQueued: outfitCount + soloCount,
        outfitPairings: outfitCount,
        soloDresses: soloCount,
      };

      const response: ApiResponse<BatchResult> = {
        success: true,
        data: result,
        message: `Queued ${result.totalQueued} try-on jobs`,
      };
      res.status(202).json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /status — Check generation progress ─────────

router.get(
  '/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      const results = await prisma.tryOnResult.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      });

      const counts: StatusResult = {
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0,
        processing: 0,
      };

      for (const row of results) {
        const count = row._count;
        counts.total += count;
        switch (row.status) {
          case 'COMPLETED':
            counts.completed += count;
            break;
          case 'FAILED':
            counts.failed += count;
            break;
          case 'PENDING':
            counts.pending += count;
            break;
          case 'PROCESSING':
            counts.processing += count;
            break;
        }
      }

      const response: ApiResponse<StatusResult> = {
        success: true,
        data: counts,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as tryonRouter };
