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
  const tag = `[TryOn ${data.tryOnResultId}]`;
  const resolvedBaseUrl = resolveToPublicUrl(data.baseImageUrl);
  const resolvedFaceUrl = resolveToPublicUrl(data.facePhotoUrl);
  const s3Key = `tryon/${data.userId}/${data.productId}/result.jpg`;

  console.log(`${tag} Starting — baseImage: ${resolvedBaseUrl}, facePhoto: ${resolvedFaceUrl}`);

  await prisma.tryOnResult.update({
    where: { id: data.tryOnResultId },
    data: { status: 'PROCESSING' },
  });

  try {
    const resultUrl = await generateModelSwap(
      resolvedBaseUrl,
      resolvedFaceUrl,
      s3Key,
    );

    console.log(`${tag} R2 upload done — resultUrl: ${resultUrl}`);

    await prisma.tryOnResult.update({
      where: { id: data.tryOnResultId },
      data: { status: 'COMPLETED', resultImageUrl: resultUrl },
    });

    console.log(`${tag} COMPLETED`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${tag} FAILED: ${message}`);

    await prisma.tryOnResult.update({
      where: { id: data.tryOnResultId },
      data: { status: 'FAILED' },
    });
  }
}
