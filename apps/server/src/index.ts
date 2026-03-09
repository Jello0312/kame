import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
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
import { isS3Configured } from './integrations/s3.js';
import { AppError, ValidationError } from './utils/errors.js';
import type { ApiResponse } from '@kame/shared-types';

// ─── Env validation ─────────────────────────────────
const requiredEnv = ['JWT_SECRET'] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Health Check ───────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kame-server', timestamp: new Date().toISOString() });
});

// ─── Static uploads (local fallback when S3 not configured) ──
if (!isS3Configured()) {
  app.use('/uploads', express.static(path.resolve('uploads')));
}

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

// ─── Try-On Worker (when Redis is configured) ───────
if (process.env.REDIS_URL) {
  import('./jobs/generateTryOn.js').then(({ startTryOnWorker }) => {
    startTryOnWorker();
  }).catch((err) => {
    console.error('Failed to start try-on worker:', err);
  });
}

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

app.listen(PORT, () => {
  console.log(`Kame server running on port ${PORT}`);
});
