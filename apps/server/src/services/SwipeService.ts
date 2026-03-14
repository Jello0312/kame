import { prisma } from '../lib/prisma.js';

interface SwipeData {
  productId: string;
  action: 'LIKE' | 'DISLIKE';
  outfitGroupId?: string;
}

export async function recordSwipe(userId: string, data: SwipeData) {
  return prisma.swipeAction.upsert({
    where: {
      userId_productId: {
        userId,
        productId: data.productId,
      },
    },
    create: {
      userId,
      productId: data.productId,
      action: data.action,
      outfitGroupId: data.outfitGroupId ?? null,
    },
    update: {
      action: data.action,
      outfitGroupId: data.outfitGroupId ?? null,
    },
  });
}
