import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ─── Configuration ──────────────────────────────────

const REDIS_URL = process.env.REDIS_URL;

export const redisConnection = REDIS_URL
  ? new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
  : null;

export const tryonQueue = redisConnection
  ? new Queue('tryon', { connection: redisConnection })
  : null;

// ─── Exports ────────────────────────────────────────

export function isQueueConfigured(): boolean {
  return tryonQueue !== null;
}
