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
import { waitlistRouter } from './routes/waitlist.js';
import { isS3Configured } from './integrations/s3.js';
import { isFashnConfigured } from './integrations/fashn.js';
import { prisma } from './lib/prisma.js';
import { tryonProcessor } from './lib/jobProcessor.js';
import { processModelSwap } from './jobs/generateTryOn.js';
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

// ─── Trust Proxy (Railway runs behind a reverse proxy) ──
app.set('trust proxy', 1);

// ─── Security Middleware ───────────────────────────
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (origin, callback) => {
            const allowed = [
              process.env.ALLOWED_ORIGIN,
              'https://kame-ai.com',
              'https://www.kame-ai.com',
            ].filter(Boolean) as string[];
            if (!origin || allowed.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
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
app.use('/api/waitlist/signup', writeLimiter);
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

// ─── Health Check (no dependencies) ──────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

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
app.use('/api/waitlist', waitlistRouter);

// ─── Debug: log registered routes ────────────────────
console.log('Registered routes:');
app._router?.stack?.forEach((layer: Record<string, unknown>) => {
  if (layer.route) {
    const r = layer.route as Record<string, unknown>;
    console.log(`  ${Object.keys(r.methods as object).join(',').toUpperCase()} ${r.path}`);
  } else if (layer.name === 'router' && layer.regexp) {
    console.log(`  ROUTER ${layer.regexp}`);
  }
});

// ─── Debug: catch-all to diagnose 404s ───────────────
app.use('/api/waitlist/*', (req: Request, res: Response) => {
  console.log(`WAITLIST CATCH-ALL HIT: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}`, debug: true });
});

// ─── Orphaned Job Recovery (on startup) ──────────────
// Re-queues PENDING/PROCESSING jobs left over from a server restart.
// In-memory queue is lost on restart; FASHN may have finished but we never polled.
async function recoverOrphanedJobs(): Promise<void> {
  try {
    if (!isFashnConfigured()) {
      console.log('[TryOn] Recovery skipped — FASHN not configured');
      return;
    }

    const orphanedJobs = await prisma.tryOnResult.findMany({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
      select: { id: true, userId: true, productId: true },
    });

    if (orphanedJobs.length === 0) {
      console.log('[TryOn] No orphaned jobs to recover');
      return;
    }

    console.log(`[TryOn] Found ${orphanedJobs.length} orphaned jobs — re-queuing...`);

    let requeued = 0;
    for (const job of orphanedJobs) {
      if (!job.productId) {
        await prisma.tryOnResult.update({ where: { id: job.id }, data: { status: 'FAILED' } });
        continue;
      }

      // Look up prerequisites
      const [avatar, baseImage] = await Promise.all([
        prisma.userAvatar.findUnique({ where: { userId: job.userId } }),
        prisma.baseProductImage.findFirst({ where: { productId: job.productId, status: 'COMPLETED' } }),
      ]);

      if (!avatar?.facePhotoUrl || !baseImage) {
        console.warn(`[TryOn] Recovery skip job ${job.id} — missing avatar or base image`);
        await prisma.tryOnResult.update({ where: { id: job.id }, data: { status: 'FAILED' } });
        continue;
      }

      // Reset to PENDING and re-queue
      await prisma.tryOnResult.update({ where: { id: job.id }, data: { status: 'PENDING' } });
      tryonProcessor.add(job.id, () =>
        processModelSwap({
          tryOnResultId: job.id,
          userId: job.userId,
          facePhotoUrl: avatar.facePhotoUrl!,
          productId: job.productId!,
          baseImageUrl: baseImage.imageUrl,
        }),
      );
      requeued++;
    }

    console.log(`[TryOn] Re-queued ${requeued}/${orphanedJobs.length} orphaned jobs`);
  } catch (err) {
    console.error('[TryOn] Orphaned job recovery error:', err);
  }
}

// ─── Stale Job Cleanup (periodic) ────────────────────
// Marks jobs older than 15 min as FAILED (catches truly stuck jobs).
setInterval(async () => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const staleJobs = await prisma.tryOnResult.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { lt: fifteenMinutesAgo },
      },
      select: { id: true },
    });

    if (staleJobs.length > 0) {
      console.log(`[TryOn] Found ${staleJobs.length} stale jobs (>15min), marking as FAILED`);
      await prisma.tryOnResult.updateMany({
        where: {
          id: { in: staleJobs.map((j) => j.id) },
        },
        data: { status: 'FAILED' },
      });
    }
  } catch (err) {
    console.error('[TryOn] Stale job cleanup error:', err);
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
  // Recover orphaned try-on jobs from previous server instance
  recoverOrphanedJobs();
});
