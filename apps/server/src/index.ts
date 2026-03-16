import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { avatarRouter } from './routes/avatar.js';
import { preferencesRouter } from './routes/preferences.js';
import { feedRouter } from './routes/feed.js';
import { swipeRouter } from './routes/swipe.js';
import { favoritesRouter } from './routes/favorites.js';
import { analyticsRouter } from './routes/analytics.js';
import { tryonRouter } from './routes/tryon.js';
import { accountRouter } from './routes/account.js';
import { isS3Configured } from './integrations/s3.js';
import { prisma } from './lib/prisma.js';
import { AppError, ValidationError } from './utils/errors.js';
import {
  authLimiter,
  uploadLimiter,
  writeLimiter,
  generalLimiter,
} from './middleware/rateLimiter.js';
import type { ApiResponse } from '@kame/shared-types';

// ─── Env validation ─────────────────────────────────
const requiredEnv = ['JWT_SECRET', 'DATABASE_URL'] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ───────────────────────────
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGIN || '*'
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);
app.use(express.json());

// ─── Rate Limiters (specific before general) ──────
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/api/avatar', uploadLimiter);
app.use('/api/tryon', uploadLimiter);
app.use('/api/swipe', writeLimiter);
app.use('/api/profile', writeLimiter);
app.use('/api/preferences', writeLimiter);
app.use(generalLimiter);

// ─── Health Check ───────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kame-server', timestamp: new Date().toISOString() });
});

// ─── Static uploads (local fallback when S3 not configured) ──
if (!isS3Configured()) {
  app.use('/uploads', express.static(path.resolve('uploads')));
}

// ─── Startup Diagnostics ────────────────────────────
console.log(`  Storage       : ${isS3Configured() ? 'Cloudflare R2' : 'LOCAL (ephemeral)'}`);
console.log(`  FASHN AI      : ${process.env.FASHN_API_KEY ? 'configured' : 'DISABLED (no FASHN_API_KEY)'}`);
console.log(`  Job processor : in-memory (concurrency: 2)`);

// ─── Routes ─────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/avatar', avatarRouter);
app.use('/api/preferences', preferencesRouter);
app.use('/api/feed', feedRouter);
app.use('/api/swipe', swipeRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/tryon', tryonRouter);
app.use('/api/account', accountRouter);

// ─── Stale Job Recovery ─────────────────────────────
// Marks PENDING/PROCESSING jobs older than 10 min as FAILED.
// Catches jobs stuck from a server restart mid-generation.
setInterval(async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const staleJobs = await prisma.tryOnResult.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { lt: tenMinutesAgo },
      },
      select: { id: true },
    });

    if (staleJobs.length > 0) {
      console.log(`Found ${staleJobs.length} stale try-on jobs, marking as FAILED`);
      await prisma.tryOnResult.updateMany({
        where: {
          id: { in: staleJobs.map((j) => j.id) },
        },
        data: { status: 'FAILED' },
      });
    }
  } catch (err) {
    console.error('Stale job recovery error:', err);
  }
}, 5 * 60 * 1000);

// ─── Global Error Handler ───────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    const response: ApiResponse & { fieldErrors?: Record<string, string[]> } = {
      success: false,
      error: err.message,
    };

    if (err instanceof ValidationError) {
      response.fieldErrors = err.fieldErrors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma unique constraint violation (P2002)
  if ('code' in err && (err as Record<string, unknown>).code === 'P2002') {
    const response: ApiResponse = {
      success: false,
      error: 'A record with this value already exists',
    };
    res.status(409).json(response);
    return;
  }

  // Unexpected errors
  console.error('Unhandled error:', err);
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  };
  res.status(500).json(response);
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Kame server running on 0.0.0.0:${PORT}`);
});
