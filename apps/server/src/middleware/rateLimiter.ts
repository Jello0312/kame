import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import type { ApiResponse } from '@kame/shared-types';

// ─── Shared handler ────────────────────────────────

function rateLimitHandler(_req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: 'Too many requests. Please try again later.',
  };
  res.status(429).json(response);
}

// ─── 1. Auth limiter — strictest (brute-force protection) ───
//    5 requests per 15 minutes per IP
//    Only counts failed requests (skipSuccessfulRequests)

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler,
});

// ─── 2. Upload limiter — expensive operations ───────────────
//    10 requests per 15 minutes per IP

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─── 3. Write limiter — moderate protection ─────────────────
//    30 requests per 15 minutes per IP

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─── 4. General limiter — catch-all ─────────────────────────
//    100 requests per 15 minutes per IP

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});
