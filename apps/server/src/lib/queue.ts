import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ─── Configuration ──────────────────────────────────

const REDIS_URL = process.env.REDIS_URL;

function createRedisConnection(): IORedis | null {
  if (!REDIS_URL) return null;
  const conn = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {},
  });
  conn.on('error', (err) => {
    console.error('Redis connection error (queue):', err.message);
  });
  return conn;
}

export const redisConnection = createRedisConnection();

export const tryonQueue = redisConnection
  ? new Queue('tryon', { connection: redisConnection })
  : null;

// ─── Exports ────────────────────────────────────────

export function isQueueConfigured(): boolean {
  return tryonQueue !== null;
}
