import { PrismaClient, Platform, Gender } from '@prisma/client';
import { products as catalogProducts, outfitPairings } from './catalog';

const prisma = new PrismaClient();

// Map string literals from catalog to Prisma enums
const platformMap: Record<string, Platform> = { AMAZON: Platform.AMAZON, SHEIN: Platform.SHEIN };
const genderMap: Record<string, Gender> = { FEMALE: Gender.FEMALE, MALE: Gender.MALE, UNISEX: Gender.UNISEX };

const products = catalogProducts.map((p) => ({
  ...p,
  platform: platformMap[p.platform],
  gender: genderMap[p.gender],
}));

async function main() {
  console.log(`Seeding database with ${catalogProducts.length} products and ${outfitPairings.length} outfit pairings...`);

  // Step 1: Delete existing data (FK order matters)
  await prisma.swipeAction.deleteMany();
  await prisma.tryOnResult.deleteMany();
  await prisma.outfitPairing.deleteMany();
  await prisma.product.deleteMany();

  // Step 2: Create all products
  const result = await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  // Step 3: Build externalId → DB id lookup map
  const dbProducts = await prisma.product.findMany({
    select: { id: true, externalId: true },
  });
  const productMap = new Map(dbProducts.map((p) => [p.externalId, p.id]));

  // Step 4: Create outfit pairings, resolving externalId → DB id
  let pairingCount = 0;
  for (const pairing of outfitPairings) {
    const topId = productMap.get(pairing.top);
    const bottomId = productMap.get(pairing.bottom);
    if (!topId || !bottomId) {
      console.warn(`Skipping pairing: ${pairing.top} + ${pairing.bottom} (product not found)`);
      continue;
    }
    await prisma.outfitPairing.create({
      data: {
        topProductId: topId,
        bottomProductId: bottomId,
        gender: pairing.gender,
        styleTags: pairing.styleTags,
      },
    });
    pairingCount++;
  }

  // Step 5: Log summary with category breakdown
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: { id: true },
  });

  console.log(`\nSeeded ${result.count} products and ${pairingCount} outfit pairings`);
  console.log('\nProducts per category:');
  for (const c of categories) {
    console.log(`  ${c.category}: ${c._count.id}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
