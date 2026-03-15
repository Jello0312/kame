import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma.js';
import { generateModelSwap } from '../integrations/fashn.js';
import { resolveToPublicUrl } from '../utils/url.js';

// ─── Types ──────────────────────────────────────────

export interface TryOnJobData {
  tryOnResultId: string;
  userId: string;
  facePhotoUrl: string;
  productId: string;
  baseImageUrl: string;
}

// ─── Worker ─────────────────────────────────────────

export function startTryOnWorker(): Worker<TryOnJobData> | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL not configured — try-on worker disabled');
    return null;
  }

  // BullMQ requires separate Redis connections for Queue and Worker
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {},
  });
  connection.on('error', (err) => {
    console.error('Redis connection error (worker):', err.message);
  });

  const worker = new Worker<TryOnJobData>(
    'tryon',
    async (job: Job<TryOnJobData>) => {
      const { tryOnResultId, userId, facePhotoUrl, productId, baseImageUrl } = job.data;

      // Mark as PROCESSING
      await prisma.tryOnResult.update({
        where: { id: tryOnResultId },
        data: { status: 'PROCESSING' },
      });

      try {
        const s3Key = `tryon/${userId}/${productId}/result.jpg`;
        const resultUrl = await generateModelSwap(
          resolveToPublicUrl(baseImageUrl),
          resolveToPublicUrl(facePhotoUrl),
          s3Key,
        );

        // Mark as COMPLETED with result URL
        await prisma.tryOnResult.update({
          where: { id: tryOnResultId },
          data: { status: 'COMPLETED', resultImageUrl: resultUrl },
        });
      } catch (err) {
        console.error(`Try-on job ${job.id} failed:`, err);

        // Mark as FAILED
        await prisma.tryOnResult.update({
          where: { id: tryOnResultId },
          data: { status: 'FAILED' },
        });

        throw err; // Let BullMQ track the failure
      }
    },
    {
      connection,
      concurrency: 2,
      drainDelay: 60,            // 1min idle poll (Upstash free tier: 500k req/day)
      stalledInterval: 300_000,   // Check stalled jobs every 5min (default 30s)
      lockDuration: 600_000,      // 10min lock (default 30s) — try-on jobs take ~20s
    },
  );

  // Event handlers
  worker.on('failed', (job, err) => {
    console.error(`Try-on job ${job?.id} failed:`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`Try-on job ${job.id} completed`);
  });

  console.log('Try-on worker started (concurrency: 2)');
  return worker;
}
