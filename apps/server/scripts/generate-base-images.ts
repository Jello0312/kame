import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { generateProductToModel } from '../src/integrations/fashn.js';

// ─── Config ──────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const CONCURRENCY = 3;
const PROMPT = 'full body shot, standing, in a daily life setting background (e.g., street, office, cafe)';
const ASPECT_RATIO = '3:4';

// ─── Main ────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🚀 Generate Base Images${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // Fetch products that don't have a COMPLETED base image
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { baseImage: { is: null } },
        { baseImage: { status: { not: 'COMPLETED' } } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  const total = products.length;
  console.log(`Found ${total} products needing base images\n`);

  if (total === 0) {
    console.log('Nothing to do — all products have base images.');
    await prisma.$disconnect();
    return;
  }

  let completed = 0;
  let failed = 0;
  let processed = 0;

  // Simple promise pool with fixed concurrency
  const active: Promise<void>[] = [];

  for (const product of products) {
    const imageUrl = product.imageUrls[0];
    if (!imageUrl) {
      console.warn(`⚠ Skipping ${product.name} (${product.id}) — no image URL`);
      failed++;
      processed++;
      continue;
    }

    if (DRY_RUN) {
      processed++;
      console.log(`[DRY RUN] Would generate base image for: ${product.name} (${product.id})`);
      continue;
    }

    const task = (async () => {
      try {
        // Upsert BaseProductImage as PENDING
        await prisma.baseProductImage.upsert({
          where: { productId: product.id },
          create: {
            productId: product.id,
            imageUrl: '',
            prompt: PROMPT,
            status: 'PENDING',
          },
          update: {
            status: 'PENDING',
            prompt: PROMPT,
          },
        });

        const s3Key = `base-images/${product.id}.jpg`;
        const resultUrl = await generateProductToModel(imageUrl, PROMPT, ASPECT_RATIO, s3Key);

        await prisma.baseProductImage.update({
          where: { productId: product.id },
          data: { status: 'COMPLETED', imageUrl: resultUrl },
        });

        completed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`✗ Failed: ${product.name} (${product.id}) — ${message}`);

        try {
          await prisma.baseProductImage.update({
            where: { productId: product.id },
            data: { status: 'FAILED' },
          });
        } catch {
          // Record may not exist if upsert itself failed
        }

        failed++;
      } finally {
        processed++;
        console.log(`  Generated ${processed}/${total} base images...`);
      }
    })();

    active.push(task);

    // When pool is full, wait for one to finish
    if (active.length >= CONCURRENCY) {
      await Promise.race(active);
      // Remove settled promises
      for (let i = active.length - 1; i >= 0; i--) {
        const settled = await Promise.race([
          active[i]!.then(() => true),
          Promise.resolve(false),
        ]);
        if (settled) active.splice(i, 1);
      }
    }
  }

  // Wait for remaining tasks
  await Promise.allSettled(active);

  console.log(`\n✅ Done: ${completed} completed, ${failed} failed (${total} total)\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
