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

// ─── Process a single face-swap job ─────────────────

export async function processModelSwap(data: TryOnJobData): Promise<void> {
  await prisma.tryOnResult.update({
    where: { id: data.tryOnResultId },
    data: { status: 'PROCESSING' },
  });

  try {
    const resultUrl = await generateModelSwap(
      resolveToPublicUrl(data.baseImageUrl),
      resolveToPublicUrl(data.facePhotoUrl),
      `tryon/${data.userId}/${data.productId}/result.jpg`,
    );

    await prisma.tryOnResult.update({
      where: { id: data.tryOnResultId },
      data: { status: 'COMPLETED', resultImageUrl: resultUrl },
    });
  } catch (err) {
    console.error(
      `Try-on generation failed for ${data.tryOnResultId}:`,
      err,
    );

    await prisma.tryOnResult.update({
      where: { id: data.tryOnResultId },
      data: { status: 'FAILED' },
    });
  }
}
