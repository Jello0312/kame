import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/lib/prisma.js';
import { uploadFile } from '../src/integrations/s3.js';

// ─── Config ──────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, 'fashn-recovery-data.txt');

// ─── Main ────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🔄 Recover Base Images from FASHN CDN${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // 1. Load recovery data (prediction_id|product_image_url per line)
  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  const recoveryEntries = raw.split('\n').map((line) => {
    const [predictionId, productImageUrl] = line.split('|');
    return {
      predictionId: predictionId!.trim(),
      productImageUrl: productImageUrl!.trim(),
      cdnUrl: `https://cdn.fashn.ai/${predictionId!.trim()}/product_to_model_0.png`,
    };
  });

  console.log(`Loaded ${recoveryEntries.length} FASHN predictions from recovery data\n`);

  // 2. Load all products and build lookup map: imageUrl → productId
  const products = await prisma.product.findMany({
    select: { id: true, name: true, imageUrls: true },
  });

  const imageToProduct = new Map<string, { id: string; name: string }>();
  for (const product of products) {
    for (const url of product.imageUrls) {
      imageToProduct.set(url, { id: product.id, name: product.name });
    }
  }

  console.log(`Loaded ${products.length} products (${imageToProduct.size} image URLs indexed)\n`);

  // 3. Load existing COMPLETED base images to skip
  const existingCompleted = await prisma.baseProductImage.findMany({
    where: { status: 'COMPLETED' },
    select: { productId: true },
  });
  const completedProductIds = new Set(existingCompleted.map((b) => b.productId));
  console.log(`${completedProductIds.size} products already have COMPLETED base images — will skip\n`);

  // 4. Match predictions to products and process
  let recovered = 0;
  let skippedCompleted = 0;
  let skippedNoMatch = 0;
  let failed = 0;
  const processedProducts = new Set<string>();

  for (const entry of recoveryEntries) {
    // Match product_image URL to a product
    const product = imageToProduct.get(entry.productImageUrl);
    if (!product) {
      skippedNoMatch++;
      console.warn(`⚠ No product match for: ${entry.productImageUrl.substring(0, 80)}...`);
      continue;
    }

    // Skip if already completed
    if (completedProductIds.has(product.id)) {
      skippedCompleted++;
      continue;
    }

    // Skip duplicate predictions for same product (take first)
    if (processedProducts.has(product.id)) {
      continue;
    }
    processedProducts.add(product.id);

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would recover: ${product.name} (${product.id})`);
      console.log(`  CDN: ${entry.cdnUrl}`);
      recovered++;
      continue;
    }

    try {
      // Download from FASHN CDN
      console.log(`⬇ Downloading: ${product.name}...`);
      const response = await fetch(entry.cdnUrl);
      if (!response.ok) {
        throw new Error(`CDN download failed: ${response.status} ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const s3Key = `base-images/${product.id}.jpg`;

      // Upload to R2
      console.log(`⬆ Uploading to R2: ${s3Key}`);
      const r2Url = await uploadFile(s3Key, buffer, 'image/png');

      // Upsert BaseProductImage as COMPLETED
      await prisma.baseProductImage.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          imageUrl: r2Url,
          prompt: 'full body shot, standing, in a daily life setting background (e.g., street, office, cafe)',
          status: 'COMPLETED',
        },
        update: {
          imageUrl: r2Url,
          status: 'COMPLETED',
        },
      });

      recovered++;
      console.log(`✓ Recovered ${recovered}: ${product.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ Failed: ${product.name} — ${message}`);
      failed++;
    }
  }

  // 5. Summary
  const totalCompleted = completedProductIds.size + recovered;
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Recovery complete:`);
  console.log(`   Recovered:        ${recovered}`);
  console.log(`   Already complete:  ${skippedCompleted}`);
  console.log(`   No product match:  ${skippedNoMatch}`);
  console.log(`   Failed:            ${failed}`);
  console.log(`   Total COMPLETED:   ${totalCompleted} / ${products.length}`);
  console.log(`${'═'.repeat(50)}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
