import type { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';

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
  outfitPairingId: string | null;
  tryOnImageUrl: string | null;
  topProduct: ProductSummary | null;
  bottomProduct: ProductSummary | null;
  soloProduct: ProductSummary | null;
  totalPrice: number;
  isSolo: boolean;
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

export async function getTryOnImageForFeed(
  userId: string,
  outfitPairingId: string,
): Promise<string | null> {
  const result = await prisma.tryOnResult.findFirst({
    where: {
      userId,
      outfitPairingId,
      status: 'COMPLETED',
      layer: 'combined',
    },
  });

  return result?.resultImageUrl ?? null;
}

export async function getSoloTryOnImageForFeed(
  userId: string,
  productId: string,
): Promise<string | null> {
  const result = await prisma.tryOnResult.findFirst({
    where: {
      userId,
      productId,
      status: 'COMPLETED',
      layer: 'solo',
    },
  });
  return result?.resultImageUrl ?? null;
}

// ═══════════════════════════════════════════════════════
// FUTURE v1.2 — Option C Migration (85% cost reduction)
// Replace the above with:
// const shared = await prisma.sharedTryOn.findFirst({
//   where: { outfitPairingId, modelId: user.selectedModelId }
// });
// return shared?.resultImageUrl ?? null;
// This is the ONLY method that changes. Zero frontend changes.
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

  // 4. Query outfit pairings matching user gender
  const pairings = await prisma.outfitPairing.findMany({
    where: {
      gender: { in: [profile.gender, 'U'] },
    },
    include: {
      topProduct: true,
      bottomProduct: true,
    },
  });

  // 5. Filter out pairings where BOTH products have been swiped
  const unseenPairings = pairings.filter(
    (p) => !(swipedIds.has(p.topProductId) && swipedIds.has(p.bottomProductId)),
  );

  // 6. Filter by fashion style preferences (if user has them)
  const userStyles = stylePref?.fashionStyles ?? [];
  const styledPairings =
    userStyles.length > 0
      ? unseenPairings.filter((p) =>
          p.styleTags.some((tag) => userStyles.includes(tag)),
        )
      : unseenPairings;

  // 7. Build solo dress cards for female users
  let soloProducts: Array<
    Awaited<ReturnType<typeof prisma.product.findMany>>[number]
  > = [];

  if (profile.gender === 'W') {
    const allSoloDresses = await prisma.product.findMany({
      where: {
        fashnCategory: 'one-pieces',
        gender: 'FEMALE',
      },
    });

    // Filter out already-swiped solo products
    const unseenSolo = allSoloDresses.filter((p) => !swipedIds.has(p.id));

    // Apply style tag filtering if preferences exist
    soloProducts =
      userStyles.length > 0
        ? unseenSolo.filter((p) =>
            p.styleTags.some((tag) => userStyles.includes(tag)),
          )
        : unseenSolo;
  }

  // 8. Build FeedCard array
  const pairingCards: FeedCard[] = await Promise.all(
    styledPairings.map(async (pairing) => {
      const tryOnImageUrl = await getTryOnImageForFeed(userId, pairing.id);
      return {
        outfitPairingId: pairing.id,
        tryOnImageUrl,
        topProduct: toProductSummary(pairing.topProduct),
        bottomProduct: toProductSummary(pairing.bottomProduct),
        soloProduct: null,
        totalPrice:
          Number(pairing.topProduct.price) +
          Number(pairing.bottomProduct.price),
        isSolo: false,
      };
    }),
  );

  const soloCards: FeedCard[] = await Promise.all(
    soloProducts.map(async (product) => {
      const tryOnImageUrl = await getSoloTryOnImageForFeed(userId, product.id);
      return {
        outfitPairingId: null,
        tryOnImageUrl,
        topProduct: null,
        bottomProduct: null,
        soloProduct: toProductSummary(product),
        totalPrice: Number(product.price),
        isSolo: true,
      };
    }),
  );

  // 9. Deterministic shuffle (seeded by userId + date for stable pagination)
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const seed = seedFromString(userId + today);
  const random = mulberry32(seed);
  const allCards = shuffleArray([...pairingCards, ...soloCards], random);

  // 10. Cursor pagination
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = allCards.findIndex(
      (card) =>
        card.outfitPairingId === cursor || card.soloProduct?.id === cursor,
    );
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  }

  // 11. Take `limit` items
  const page = allCards.slice(startIndex, startIndex + limit);

  // 12. Set nextCursor
  const lastCard = page[page.length - 1];
  const nextCursor =
    page.length < limit
      ? null
      : lastCard?.outfitPairingId ?? lastCard?.soloProduct?.id ?? null;

  // 13. Return result
  return { cards: page, nextCursor };
}
