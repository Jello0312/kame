import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

// Load disposable domains list — use fs.readFileSync to avoid Node 20 ESM JSON import assertion issues
const require_ = createRequire(import.meta.url);
const domainListPath = require_.resolve('disposable-email-domains');
const disposableDomains: string[] = JSON.parse(readFileSync(domainListPath, 'utf-8'));

// ─── Types ──────────────────────────────────────────

interface SignupInput {
  email: string;
  name?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerUrl?: string;
  ipCountry?: string;
}

interface AdminStats {
  totalSignups: number;
  today: number;
  thisWeek: number;
  bySource: Array<{ source: string | null; count: number }>;
  byCountry: Array<{ country: string | null; count: number }>;
  byCampaign: Array<{ campaign: string | null; count: number }>;
  byDay: Array<{ date: string; count: number }>;
  recentSignups: Array<{
    name: string | null;
    email: string;
    source: string | null;
    country: string | null;
    createdAt: Date;
  }>;
}

// ─── In-memory count cache (60s TTL) ────────────────

let cachedCount: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000;

// ─── Helpers ────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

// ─── Public API ─────────────────────────────────────

export async function signup(input: SignupInput) {
  const email = input.email.trim().toLowerCase();

  // Check disposable email domain
  const domain = email.split('@')[1];
  if (domain && disposableDomains.includes(domain)) {
    throw new AppError('Please use a permanent email address', 400);
  }

  // Create signup — unique constraint on email handles duplicates
  // (Prisma P2002 → global error handler returns 409)
  const signup = await prisma.waitlistSignup.create({
    data: {
      email,
      name: input.name?.trim() || null,
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      referrerUrl: input.referrerUrl || null,
      ipCountry: input.ipCountry || null,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  // Bust count cache
  cachedCount = null;

  return signup;
}

export async function getCount(): Promise<number> {
  if (cachedCount !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedCount;
  }
  cachedCount = await prisma.waitlistSignup.count();
  cacheTimestamp = Date.now();
  return cachedCount;
}

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalSignups, today, thisWeek] = await Promise.all([
    prisma.waitlistSignup.count(),
    prisma.waitlistSignup.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.waitlistSignup.count({ where: { createdAt: { gte: oneWeekAgo } } }),
  ]);

  // Aggregations via raw SQL (Prisma groupBy doesn't support date truncation)
  const [bySource, byCountry, byCampaign, byDay] = await Promise.all([
    prisma.$queryRaw<Array<{ source: string | null; count: number }>>`
      SELECT utm_source as source, COUNT(*)::int as count
      FROM waitlist_signups
      GROUP BY utm_source
      ORDER BY count DESC
    `,
    prisma.$queryRaw<Array<{ country: string | null; count: number }>>`
      SELECT ip_country as country, COUNT(*)::int as count
      FROM waitlist_signups
      WHERE ip_country IS NOT NULL
      GROUP BY ip_country
      ORDER BY count DESC
    `,
    prisma.$queryRaw<Array<{ campaign: string | null; count: number }>>`
      SELECT utm_campaign as campaign, COUNT(*)::int as count
      FROM waitlist_signups
      WHERE utm_campaign IS NOT NULL
      GROUP BY utm_campaign
      ORDER BY count DESC
    `,
    prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
      FROM waitlist_signups
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY created_at::date
      ORDER BY date ASC
    `,
  ]);

  // Recent signups with masked emails
  const rawRecent = await prisma.waitlistSignup.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      name: true,
      email: true,
      utmSource: true,
      ipCountry: true,
      createdAt: true,
    },
  });

  const recentSignups = rawRecent.map((s) => ({
    name: s.name,
    email: maskEmail(s.email),
    source: s.utmSource,
    country: s.ipCountry,
    createdAt: s.createdAt,
  }));

  return {
    totalSignups,
    today,
    thisWeek,
    bySource,
    byCountry,
    byCampaign,
    byDay,
    recentSignups,
  };
}
