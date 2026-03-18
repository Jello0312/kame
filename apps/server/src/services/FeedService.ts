import type { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { resolveToPublicUrl } from '../utils/url.js';

// ─── Interfaces ─────────────────────────────────────────

export interface ProductSummary {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  currency: string;
  platform: string;
  imageUrl: string;
  productPageUrl: string;
}

export interface FeedCard {
  productId: string;
  tryOnImageUrl: string | null;
  product: ProductSummary;
}

export interface FeedResult {
  cards: FeedCard[];
  nextCursor: string | null;
}

// ─── Helpers ────────────────────────────────────────────

function toProductSummary(product: {
  id: string;
  name: string;
  brand: string | null;
  price: Decimal;
  currency: string;
  platform: string;
  imageUrls: string[];
  productPageUrl: string;
}): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: Number(product.price),
    currency: product.currency,
    platform: product.platform,
    imageUrl: product.imageUrls[0] ?? '',
    productPageUrl: product.productPageUrl,
  };
}

/** FNV-1a hash — turns a string into a 32-bit integer */
function seedFromString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 — seeded PRNG returning () => number in [0,1) */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(array: T[], random: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

// ─── Try-On Image Lookup ────────────────────────────────

export async function getTryOnImageForProduct(
  userId: string,
  productId: string,
): Promise<string | null> {
  const result = await prisma.tryOnResult.findFirst({
    where: {
      userId,
      productId,
      status: 'COMPLETED',
    },
  });

  return result?.resultImageUrl ? resolveToPublicUrl(result.resultImageUrl) : null;
}

// ═══════════════════════════════════════════════════════
// FUTURE v1.2 — Optimization
// Base images are already shared. Face-swap results could be cached
// across sessions for returning users (skip re-generation if unchanged).
// ═══════════════════════════════════════════════════════

// ─── Feed Generation ────────────────────────────────────

export async function getFeedForUser(
  userId: string,
  cursor?: string,
  limit: number = 10,
): Promise<FeedResult> {
  // 1. Get user profile (required)
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('UserProfile');
  }

  // 2. Get style preferences (optional)
  const stylePref = await prisma.stylePreference.findUnique({
    where: { userId },
  });

  // 3. Get IDs of products the user already swiped
  const swipedRows = await prisma.swipeAction.findMany({
    where: { userId },
    select: { productId: true },
  });
  const swipedIds = new Set(swipedRows.map((r) => r.productId));

  // 4. Map profile gender to Product gender enum and query products
  const genderFilter: Array<'MALE' | 'FEMALE' | 'UNISEX'> =
    profile.gender === 'M' ? ['MALE', 'UNISEX'] : ['FEMALE', 'UNISEX'];

  const products = await prisma.product.findMany({
    where: {
      gender: { in: genderFilter },
      id: { notIn: [...swipedIds] },
    },
  });

  // 5. Filter by fashion style preferences (if user has them)
  const userStyles = stylePref?.fashionStyles ?? [];
  const styledProducts =
    userStyles.length > 0
      ? products.filter((p) =>
          p.styleTags.some((tag) => userStyles.includes(tag)),
        )
      : products;

  // 6. Batch-fetch all try-on results in a single query (avoids N+1 / pool exhaustion)
  const productIds = styledProducts.map((p) => p.id);
  const tryOnResults = await prisma.tryOnResult.findMany({
    where: {
      userId,
      productId: { in: productIds },
      status: 'COMPLETED',
    },
    select: { productId: true, resultImageUrl: true },
  });
  const tryOnMap = new Map(
    tryOnResults.map((r) => [r.productId, r.resultImageUrl ? resolveToPublicUrl(r.resultImageUrl) : null]),
  );

  // 7. Build FeedCard array — split by try-on availability
  const withTryOn: FeedCard[] = [];
  const withoutTryOn: FeedCard[] = [];

  for (const product of styledProducts) {
    const tryOnUrl = tryOnMap.get(product.id) ?? null;
    const card: FeedCard = {
      productId: product.id,
      tryOnImageUrl: tryOnUrl,
      product: toProductSummary(product),
    };
    if (tryOnUrl) {
      withTryOn.push(card);
    } else {
      withoutTryOn.push(card);
    }
  }

  // 8. Deterministic shuffle each group, then concat (try-on first)
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const seed = seedFromString(userId + today);
  const random = mulberry32(seed);
  const shuffled = [
    ...shuffleArray(withTryOn, random),
    ...shuffleArray(withoutTryOn, random),
  ];

  // 9. Cursor pagination
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = shuffled.findIndex((card) => card.productId === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  }

  // 10. Take `limit` items
  const page = shuffled.slice(startIndex, startIndex + limit);

  // 11. Set nextCursor
  const lastCard = page[page.length - 1];
  const nextCursor = page.length < limit ? null : lastCard?.productId ?? null;

  // 12. Return result
  return { cards: page, nextCursor };
}
