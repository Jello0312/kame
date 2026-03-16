import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { deleteFilesByPrefix, isS3Configured } from '../integrations/s3.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── DELETE / — Permanently delete user account and all data ──

router.delete(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      // 1. Clean up stored files (S3/R2) before cascade deletes URL references
      if (isS3Configured()) {
        await Promise.all([
          deleteFilesByPrefix(`avatars/${userId}/`),
          deleteFilesByPrefix(`tryon/${userId}/`),
        ]);
      }

      // 2. Delete User record — Prisma cascades ALL child records:
      //    UserProfile, UserAvatar, StylePreference, SwipeAction,
      //    TryOnResult, AnalyticsClick
      await prisma.user.delete({
        where: { id: userId },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Account and all data permanently deleted',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as accountRouter };
