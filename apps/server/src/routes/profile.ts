import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as ProfileService from '../services/ProfileService.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Zod Schema ─────────────────────────────────────

const profileSchema = z.object({
  gender: z.enum(['M', 'W']),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  bodyShape: z
    .enum(['HOURGLASS', 'PEAR', 'APPLE', 'RECTANGLE', 'INVERTED_TRIANGLE'])
    .optional(),
  measurementUnit: z.enum(['METRIC', 'IMPERIAL']).optional(),
});

// ─── Routes ─────────────────────────────────────────

router.post(
  '/',
  authenticate,
  validate({ body: profileSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as z.infer<typeof profileSchema>;
      const profile = await ProfileService.upsertProfile(req.userId!, data);
      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile,
        message: 'Profile saved',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await ProfileService.getProfile(req.userId!);
      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as profileRouter };
