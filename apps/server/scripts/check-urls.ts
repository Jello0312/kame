import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, 'fashn-recovery-data.txt');

async function main() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  const entries = raw.split('\n').map((line) => {
    const [id, img] = line.split('|');
    return { id: id!.trim(), img: img!.trim() };
  });

  const products = await prisma.product.findMany({
    select: { id: true, imageUrls: true },
  });

  const dbUrls = new Set<string>();
  for (const p of products) {
    for (const url of p.imageUrls) {
      dbUrls.add(url);
    }
  }

  // Find unmatched entries and compare with DB URLs
  const unmatched = entries.filter((e) => !dbUrls.has(e.img));
  console.log(`Total entries: ${entries.length}`);
  console.log(`Matched: ${entries.length - unmatched.length}`);
  console.log(`Unmatched: ${unmatched.length}`);
  console.log('\nSample unmatched URLs:');
  unmatched.slice(0, 5).forEach((e) => {
    console.log(`  FASHN: ${e.img}`);
    // Try to find similar DB URL
    const similar = [...dbUrls].find((u) =>
      u.includes(e.img.split('/').pop()?.split('_')[0] || 'NOMATCH')
    );
    console.log(`  DB:    ${similar || 'NO SIMILAR FOUND'}`);
    console.log();
  });

  console.log('\nSample DB URLs:');
  [...dbUrls].slice(0, 3).forEach((u) => console.log(`  ${u}`));

  await prisma.$disconnect();
}

main().catch(console.error);
