import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { tryonProcessor } from '../lib/jobProcessor.js';
import { processModelSwap } from '../jobs/generateTryOn.js';
import { isFashnConfigured } from '../integrations/fashn.js';
import { isS3Configured } from '../integrations/s3.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Constants ───────────────────────────────────────

const MAX_CARDS = 10; // 10 cards × 5 credits (model-swap + face ref) = 50 credits/session
const BATCH_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

// ─── Interfaces ──────────────────────────────────────

interface BatchResult {
  totalQueued: number;
  remainingProducts: number;
}

interface StatusResult {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
}

// ─── POST /batch — Trigger face-swap pre-generation ──

router.post(
  '/batch',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isFashnConfigured()) {
        throw new AppError('FASHN API is not configured (missing FASHN_API_KEY)', 503);
      }

      const userId = req.userId!;

      // 0. Check cooldown — prevent batch spam (skip on first batch / onboarding)
      const lastTryOn = await prisma.tryOnResult.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      if (lastTryOn) {
        const elapsed = Date.now() - lastTryOn.createdAt.getTime();
        if (elapsed < BATCH_COOLDOWN_MS) {
          const minutesLeft = Math.ceil((BATCH_COOLDOWN_MS - elapsed) / 60000);
          throw new AppError(
            `Please wait ${minutesLeft} more minute${minutesLeft === 1 ? '' : 's'} before generating new styles`,
            429,
          );
        }
      }

      // 1. Get user avatar (need face photo for face-swap)
      const avatar = await prisma.userAvatar.findUnique({
        where: { userId },
      });

      if (!avatar?.facePhotoUrl) {
        throw new NotFoundError('UserAvatar with face photo');
      }

      // 2. Get user profile (need gender)
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new NotFoundError('UserProfile');
      }

      // 3. Map profile gender to Product gender enum
      const genderFilter: Array<'MALE' | 'FEMALE' | 'UNISEX'> =
        profile.gender === 'M' ? ['MALE', 'UNISEX'] : ['FEMALE', 'UNISEX'];

      // 4. Get style preferences (optional)
      const stylePref = await prisma.stylePreference.findUnique({
        where: { userId },
      });
      const userStyles = stylePref?.fashionStyles ?? [];

      // 5. Get existing TryOnResult product IDs for this user (exclude already-queued)
      const existingResults = await prisma.tryOnResult.findMany({
        where: { userId, productId: { not: null } },
        select: { productId: true },
      });
      const existingProductIds = existingResults
        .map((r) => r.productId)
        .filter((id): id is string => id !== null);

      // 6. Query products — filtered by gender, style, excluding already-processed
      let products = await prisma.product.findMany({
        where: {
          gender: { in: genderFilter },
          id: { notIn: existingProductIds },
          ...(userStyles.length > 0
            ? { styleTags: { hasSome: userStyles } }
            : {}),
        },
        select: { id: true },
        take: MAX_CARDS,
      });

      // Fallback: if style filter returned 0 results, retry without style filter
      if (products.length === 0 && userStyles.length > 0) {
        products = await prisma.product.findMany({
          where: {
            gender: { in: genderFilter },
            id: { notIn: existingProductIds },
          },
          select: { id: true },
          take: MAX_CARDS,
        });
      }

      // 7. For each product, look up base image and queue face-swap job
      let totalQueued = 0;

      for (const product of products) {
        const baseImage = await prisma.baseProductImage.findFirst({
          where: { productId: product.id, status: 'COMPLETED' },
        });

        if (!baseImage) {
          console.warn(`Skipping product ${product.id} — no completed base image`);
          continue;
        }

        // Create PENDING TryOnResult record
        const tryOnResult = await prisma.tryOnResult.create({
          data: {
            userId,
            productId: product.id,
            status: 'PENDING',
            layer: 'single',
          },
        });

        // Queue face-swap job via in-memory processor
        tryonProcessor.add(tryOnResult.id, () =>
          processModelSwap({
            tryOnResultId: tryOnResult.id,
            userId,
            facePhotoUrl: avatar.facePhotoUrl!,
            productId: product.id,
            baseImageUrl: baseImage.imageUrl,
          }),
        );
        totalQueued++;
      }

      // Count remaining products that could still get try-ons
      const allExistingIds = [
        ...existingProductIds,
        ...products.map((p) => p.id),
      ];
      const remainingCount = await prisma.product.count({
        where: {
          gender: { in: genderFilter },
          id: { notIn: allExistingIds },
          ...(userStyles.length > 0
            ? { styleTags: { hasSome: userStyles } }
            : {}),
        },
      });

      const result: BatchResult = { totalQueued, remainingProducts: remainingCount };

      const response: ApiResponse<BatchResult> = {
        success: true,
        data: result,
        message: `Queued ${totalQueued} try-on jobs`,
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

// ─── GET /diagnostics — Pipeline health check ──────

router.get(
  '/diagnostics',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      // 1. FASHN + R2 config
      const fashnConfigured = isFashnConfigured();
      const r2Configured = isS3Configured();
      const r2PublicUrl = process.env.R2_PUBLIC_URL ?? '(not set)';

      // 2. Avatar status
      const avatar = await prisma.userAvatar.findUnique({
        where: { userId },
      });

      // 3. Base image counts
      const baseImageCounts = await prisma.baseProductImage.groupBy({
        by: ['status'],
        _count: true,
      });
      const baseImages: Record<string, number> = {};
      for (const row of baseImageCounts) {
        baseImages[row.status.toLowerCase()] = row._count;
      }

      // 4. TryOnResult counts for this user
      const tryOnCounts = await prisma.tryOnResult.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      });
      const tryOnResults: Record<string, number> = {};
      for (const row of tryOnCounts) {
        tryOnResults[row.status.toLowerCase()] = row._count;
      }

      // 5. Recent failed jobs (last 10)
      const recentFailed = await prisma.tryOnResult.findMany({
        where: { userId, status: 'FAILED' },
        select: { id: true, productId: true, status: true, createdAt: true, resultImageUrl: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // 6. Recent completed jobs (last 5) — check URLs
      const recentCompleted = await prisma.tryOnResult.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { id: true, productId: true, resultImageUrl: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // 7. Job processor state
      const jobQueue = {
        pending: tryonProcessor.pendingCount,
        active: tryonProcessor.activeCount,
      };

      const response: ApiResponse = {
        success: true,
        data: {
          fashnConfigured,
          r2Configured,
          r2PublicUrl,
          avatar: avatar
            ? {
                exists: true,
                hasFacePhoto: !!avatar.facePhotoUrl,
                facePhotoUrl: avatar.facePhotoUrl ?? null,
                status: avatar.status,
              }
            : { exists: false },
          baseImages,
          tryOnResults,
          recentFailed,
          recentCompleted,
          jobQueue,
        },
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /retry-failed — Re-queue failed try-on jobs ─

router.post(
  '/retry-failed',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isFashnConfigured()) {
        throw new AppError('FASHN API is not configured (missing FASHN_API_KEY)', 503);
      }

      const userId = req.userId!;

      // Get user's avatar
      const avatar = await prisma.userAvatar.findUnique({
        where: { userId },
      });

      if (!avatar?.facePhotoUrl) {
        throw new NotFoundError('UserAvatar with face photo');
      }

      // Find all FAILED results for this user
      const failedResults = await prisma.tryOnResult.findMany({
        where: { userId, status: 'FAILED', productId: { not: null } },
        select: { id: true, productId: true },
      });

      let requeued = 0;

      for (const result of failedResults) {
        if (!result.productId) continue;

        const baseImage = await prisma.baseProductImage.findFirst({
          where: { productId: result.productId, status: 'COMPLETED' },
        });

        if (!baseImage) {
          console.warn(`[TryOn] Retry skip — no base image for product ${result.productId}`);
          continue;
        }

        // Reset status to PENDING
        await prisma.tryOnResult.update({
          where: { id: result.id },
          data: { status: 'PENDING' },
        });

        // Re-queue the job
        tryonProcessor.add(result.id, () =>
          processModelSwap({
            tryOnResultId: result.id,
            userId,
            facePhotoUrl: avatar.facePhotoUrl!,
            productId: result.productId!,
            baseImageUrl: baseImage.imageUrl,
          }),
        );
        requeued++;
      }

      console.log(`[TryOn] Retried ${requeued}/${failedResults.length} failed jobs for user ${userId}`);

      const response: ApiResponse<{ requeued: number; totalFailed: number }> = {
        success: true,
        data: { requeued, totalFailed: failedResults.length },
        message: `Re-queued ${requeued} failed try-on jobs`,
      };
      res.status(202).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as tryonRouter };
