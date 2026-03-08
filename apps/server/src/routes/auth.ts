import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as AuthService from '../services/AuthService.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Zod Schemas ────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters').trim(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ─── Routes ─────────────────────────────────────────

router.post(
  '/register',
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body as z.infer<typeof registerSchema>;
      const result = await AuthService.register(email, password, name);
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: 'Registration successful',
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;
      const result = await AuthService.login(email, password);
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: 'Login successful',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await AuthService.getMe(req.userId!);
      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as authRouter };
