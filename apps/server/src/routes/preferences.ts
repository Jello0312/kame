import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as PreferenceService from '../services/PreferenceService.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Zod Schema ─────────────────────────────────────

const preferencesSchema = z.object({
  budgetRange: z.enum(['BUDGET', 'MID', 'PREMIUM', 'LUXURY']).nullish(),
  fashionStyles: z.array(z.string()).optional(),
  preferredPlatforms: z
    .array(z.enum(['AMAZON', 'SHEIN', 'ZARA', 'ZALORA', 'ZALANDO', 'TAOBAO', 'ASOS']))
    .optional(),
});

// ─── Routes ─────────────────────────────────────────

router.post(
  '/',
  authenticate,
  validate({ body: preferencesSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as z.infer<typeof preferencesSchema>;
      const prefs = await PreferenceService.upsertPreferences(req.userId!, data);
      const response: ApiResponse<typeof prefs> = {
        success: true,
        data: prefs,
        message: 'Preferences saved',
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
      const prefs = await PreferenceService.getPreferences(req.userId!);
      const response: ApiResponse<typeof prefs> = {
        success: true,
        data: prefs,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as preferencesRouter };
