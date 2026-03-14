import { prisma } from '../lib/prisma.js';

interface ClickData {
  productId: string;
  platform: string;
}

export async function logClick(userId: string, data: ClickData) {
  return prisma.analyticsClick.create({
    data: {
      userId,
      productId: data.productId,
      platform: data.platform,
    },
  });
}
