import { prisma } from '../lib/prisma.js';

export async function getFavorites(userId: string, limit: number, offset: number) {
  const swipes = await prisma.swipeAction.findMany({
    where: { userId, action: 'LIKE' },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return swipes.map((s) => ({
    id: s.product.id,
    name: s.product.name,
    brand: s.product.brand,
    price: Number(s.product.price),
    currency: s.product.currency,
    platform: s.product.platform,
    imageUrl: s.product.imageUrls[0] ?? '',
    productPageUrl: s.product.productPageUrl,
    likedAt: s.createdAt,
  }));
}
