import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { adminAuth } from '../middleware/adminAuth.js';
import * as WaitlistService from '../services/WaitlistService.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Zod Schemas ────────────────────────────────────

const signupSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  name: z.string().max(100).optional(),
  consent: z.literal(true, { error: 'Consent is required' }),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  referrerUrl: z.string().max(2000).optional(),
});

// ─── POST /signup (public) ──────────────────────────

router.post(
  '/signup',
  validate({ body: signupSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof signupSchema>;

      // Extract country from Cloudflare header if available
      const ipCountry =
        (req.headers['cf-ipcountry'] as string) || undefined;

      const result = await WaitlistService.signup({
        email: body.email,
        name: body.name,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        referrerUrl: body.referrerUrl,
        ipCountry,
      });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: "You're on the list!",
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /count (public, cached 60s) ────────────────

router.get(
  '/count',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await WaitlistService.getCount();
      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /admin/stats (password protected) ──────────

router.get(
  '/admin/stats',
  adminAuth,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await WaitlistService.getAdminStats();
      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as waitlistRouter };
