import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma.js';
import { generateTryOn } from '../integrations/fashn.js';

// ─── Types ──────────────────────────────────────────

export interface TryOnJobData {
  tryOnResultId: string;
  userId: string;
  bodyPhotoUrl: string;
  type: 'outfit' | 'solo';
  // Outfit fields
  outfitPairingId?: string;
  topGarmentUrl?: string;
  bottomGarmentUrl?: string;
  topCategory?: 'tops' | 'bottoms' | 'one-pieces';
  bottomCategory?: 'tops' | 'bottoms' | 'one-pieces';
  // Solo fields
  productId?: string;
  garmentUrl?: string;
  garmentCategory?: 'tops' | 'bottoms' | 'one-pieces';
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
      const { tryOnResultId, type } = job.data;

      // Mark as PROCESSING
      await prisma.tryOnResult.update({
        where: { id: tryOnResultId },
        data: { status: 'PROCESSING' },
      });

      try {
        let resultUrl: string;

        if (type === 'outfit') {
          resultUrl = await processOutfitPairing(job.data);
        } else {
          resultUrl = await processSoloDress(job.data);
        }

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

// ─── Helpers ────────────────────────────────────────

async function processOutfitPairing(data: TryOnJobData): Promise<string> {
  const {
    userId,
    bodyPhotoUrl,
    outfitPairingId,
    topGarmentUrl,
    bottomGarmentUrl,
    topCategory,
    bottomCategory,
  } = data;

  if (
    !outfitPairingId ||
    !topGarmentUrl ||
    !bottomGarmentUrl ||
    !topCategory ||
    !bottomCategory
  ) {
    throw new Error('Missing outfit pairing data');
  }

  // Pass 1: Top garment on user's body
  const topS3Key = `tryon/${userId}/${outfitPairingId}/top.jpg`;
  const topResultUrl = await generateTryOn(
    bodyPhotoUrl,
    topGarmentUrl,
    topCategory,
    topS3Key,
  );

  // Pass 2: Bottom garment on the result of pass 1
  const combinedS3Key = `tryon/${userId}/${outfitPairingId}/combined.jpg`;
  const combinedResultUrl = await generateTryOn(
    topResultUrl,
    bottomGarmentUrl,
    bottomCategory,
    combinedS3Key,
  );

  return combinedResultUrl;
}

async function processSoloDress(data: TryOnJobData): Promise<string> {
  const { userId, bodyPhotoUrl, productId, garmentUrl, garmentCategory } = data;

  if (!productId || !garmentUrl || !garmentCategory) {
    throw new Error('Missing solo dress data');
  }

  const s3Key = `tryon/${userId}/${productId}/solo.jpg`;
  return generateTryOn(bodyPhotoUrl, garmentUrl, garmentCategory, s3Key);
}
