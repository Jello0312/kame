import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../utils/errors.js';

/**
 * Simple admin authentication middleware.
 * Checks Authorization: Bearer <ADMIN_PASSWORD> header
 * or ?key=<ADMIN_PASSWORD> query param.
 */
export function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    next(new AuthError('Admin access not configured'));
    return;
  }

  // Check Bearer token header
  const header = req.headers.authorization;
  if (header === `Bearer ${password}`) {
    next();
    return;
  }

  // Check query param (for easy browser access)
  if (req.query.key === password) {
    next();
    return;
  }

  next(new AuthError('Invalid admin credentials'));
}
