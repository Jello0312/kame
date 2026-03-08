#!/usr/bin/env tsx
// ═══════════════════════════════════════════════════════════════
// Fix broken product images by scraping real data from Amazon
// Extracts: real image URL, product title, price from each ASIN
// ═══════════════════════════════════════════════════════════════

import { products } from '../prisma/catalog';

interface ScrapedProduct {
  asin: string;
  title: string | null;
  imageUrl: string | null;
  price: string | null;
  status: 'ok' | 'no-image' | 'error' | 'captcha';
  error?: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

async function scrapeAmazonProduct(asin: string): Promise<ScrapedProduct> {
  const url = `https://www.amazon.com/dp/${asin}`;
  try {
    const resp = await fetch(url, {
      headers: HEADERS,
      redirect: 'follow',
    });
    const html = await resp.text();

    // Check for CAPTCHA / bot detection
    if (html.includes('captcha') || html.includes('robot') || html.includes('automated access')) {
      return { asin, title: null, imageUrl: null, price: null, status: 'captcha' };
    }

    // Extract hi-res image from the colorImages JSON data
    let imageUrl: string | null = null;

    // Method 1: hiRes from colorImages JSON
    const hiResMatch = html.match(/"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (hiResMatch) {
      imageUrl = hiResMatch[1];
    }

    // Method 2: landingImage src
    if (!imageUrl) {
      const landingMatch = html.match(/id="landingImage"[^>]*src="([^"]+)"/);
      if (landingMatch) imageUrl = landingMatch[1];
    }

    // Method 3: data-old-hires
    if (!imageUrl) {
      const oldHiresMatch = html.match(/data-old-hires="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
      if (oldHiresMatch) imageUrl = oldHiresMatch[1];
    }

    // Method 4: Any product image from the images/I/ path
    if (!imageUrl) {
      const anyImgMatch = html.match(/(https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+_.-]+\._AC_SL1500_\.jpg)/);
      if (anyImgMatch) imageUrl = anyImgMatch[1];
    }

    // Extract product title
    let title: string | null = null;
    const titleMatch = html.match(/<span id="productTitle"[^>]*>\s*([^<]+?)\s*<\/span>/);
    if (titleMatch) title = titleMatch[1].trim();

    // Extract price
    let price: string | null = null;
    const priceMatch = html.match(/<span class="a-offscreen">\$([0-9]+\.[0-9]+)<\/span>/);
    if (priceMatch) price = priceMatch[1];

    // Normalize image URL to _AC_SX679_ size
    if (imageUrl) {
      imageUrl = imageUrl.replace(/\._[A-Z]+_[A-Z]+[0-9]+_\./, '._AC_SX679_.');
    }

    return {
      asin,
      title,
      imageUrl,
      price,
      status: imageUrl ? 'ok' : 'no-image',
    };
  } catch (err) {
    return {
      asin,
      title: null,
      imageUrl: null,
      price: null,
      status: 'error',
      error: (err as Error).message,
    };
  }
}

// ─── Concurrency limiter ──────────────────────────────
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
      // Random delay between 1-3 seconds to avoid rate limiting
      const delay = 1000 + Math.random() * 2000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  // Get unique Amazon ASINs from catalog
  const amazonProducts = products.filter((p) => p.platform === 'AMAZON');
  const sheinProducts = products.filter((p) => p.platform === 'SHEIN');

  console.log(`\n🔍 Found ${amazonProducts.length} Amazon products, ${sheinProducts.length} SHEIN products`);
  console.log(`\n📦 Scraping ${amazonProducts.length} Amazon product pages...\n`);

  const tasks = amazonProducts.map(
    (product) => () => scrapeAmazonProduct(product.externalId),
  );

  const results = await runWithConcurrency(tasks, 2); // Only 2 concurrent to avoid blocks

  // Report results
  const ok = results.filter((r) => r.status === 'ok');
  const noImage = results.filter((r) => r.status === 'no-image');
  const errors = results.filter((r) => r.status === 'error');
  const captchas = results.filter((r) => r.status === 'captcha');

  console.log('\n\n═══════════════════════════════════════════════');
  console.log('  AMAZON SCRAPE RESULTS');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Total:     ${results.length}`);
  console.log(`  ✅ OK:     ${ok.length}`);
  console.log(`  ⚠️ No img:  ${noImage.length}`);
  console.log(`  ❌ Error:   ${errors.length}`);
  console.log(`  🤖 Captcha: ${captchas.length}`);
  console.log('═══════════════════════════════════════════════\n');

  // Output mapping for catalog update
  console.log('// ═══════════════════════════════════════════');
  console.log('// ASIN → Real Image URL mapping');
  console.log('// ═══════════════════════════════════════════');
  for (const r of results) {
    const tag = r.status === 'ok' ? '✅' : '❌';
    console.log(`${tag} ${r.asin}:`);
    if (r.title) console.log(`   Title: ${r.title}`);
    if (r.imageUrl) console.log(`   Image: ${r.imageUrl}`);
    if (r.price) console.log(`   Price: $${r.price}`);
    if (r.error) console.log(`   Error: ${r.error}`);
    console.log('');
  }

  // Output as JSON for easy consumption
  const jsonPath = new URL('./amazon-image-map.json', import.meta.url).pathname;
  const mapping: Record<string, string> = {};
  for (const r of ok) {
    if (r.imageUrl) mapping[r.asin] = r.imageUrl;
  }

  console.log('\n// JSON mapping (copy to update catalog):');
  console.log(JSON.stringify(mapping, null, 2));
}

main();
