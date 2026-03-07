import { products } from '../prisma/catalog';

// ─── Types ────────────────────────────────────────────

interface ValidationResult {
  externalId: string;
  platform: string;
  name: string;
  category: string;
  imageUrl: string;
  status: number | 'TIMEOUT' | 'ERROR';
  ok: boolean;
  error?: string;
  responseTimeMs: number;
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
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── Image checker ────────────────────────────────────

async function checkImageUrl(
  url: string,
  platform: string,
  timeoutMs = 10000,
): Promise<{ status: number | 'TIMEOUT' | 'ERROR'; ok: boolean; error?: string; responseTimeMs: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };

  // SHEIN CDN may need a Referer
  if (platform === 'SHEIN') {
    headers['Referer'] = 'https://us.shein.com/';
  }

  try {
    // Try HEAD first
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal, headers, redirect: 'follow' });

    // Some CDNs return 405 for HEAD — fall back to GET
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', signal: controller.signal, headers, redirect: 'follow' });
    }

    return { status: res.status, ok: res.ok, responseTimeMs: Date.now() - start };
  } catch (err) {
    const isTimeout = (err as Error).name === 'AbortError';
    return {
      status: isTimeout ? 'TIMEOUT' : 'ERROR',
      ok: false,
      error: (err as Error).message,
      responseTimeMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Main ─────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`Validating ${products.length} product image URLs...\n`);

  const tasks = products.map((product) => async (): Promise<ValidationResult> => {
    const imageUrl = product.imageUrls[0];
    if (!imageUrl) {
      return {
        externalId: product.externalId,
        platform: product.platform,
        name: product.name,
        category: product.category,
        imageUrl: '(none)',
        status: 'ERROR',
        ok: false,
        error: 'No image URL',
        responseTimeMs: 0,
      };
    }

    const result = await checkImageUrl(imageUrl, product.platform);
    const tag = result.ok ? '.' : 'X';
    process.stdout.write(tag);

    return {
      externalId: product.externalId,
      platform: product.platform,
      name: product.name,
      category: product.category,
      imageUrl,
      ...result,
    };
  });

  const results = await runWithConcurrency(tasks, 5);
  console.log('\n');

  // ─── Report ───────────────────────────────────────
  const working = results.filter((r) => r.ok);
  const broken = results.filter((r) => !r.ok);

  console.log('═══════════════════════════════════════════════');
  console.log('  IMAGE VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Total products:  ${results.length}`);
  console.log(`  Working images:  ${working.length}`);
  console.log(`  Broken images:   ${broken.length}`);
  console.log('═══════════════════════════════════════════════');

  if (broken.length > 0) {
    // Group by platform
    const byPlatform = new Map<string, ValidationResult[]>();
    for (const b of broken) {
      const arr = byPlatform.get(b.platform) ?? [];
      arr.push(b);
      byPlatform.set(b.platform, arr);
    }

    for (const [platform, items] of byPlatform) {
      console.log(`\n── ${platform} (${items.length} broken) ──`);
      for (const item of items) {
        console.log(`  ${item.externalId} | ${item.name}`);
        console.log(`    Category: ${item.category}`);
        console.log(`    URL:      ${item.imageUrl}`);
        console.log(`    Status:   ${item.status}${item.error ? ` (${item.error})` : ''}`);
        console.log(`    Time:     ${item.responseTimeMs}ms`);
      }
    }
  } else {
    console.log('\nAll image URLs are working!');
  }

  process.exit(broken.length > 0 ? 1 : 0);
}

main();
