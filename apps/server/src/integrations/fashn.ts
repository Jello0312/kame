import { Fashn } from 'fashn';
import { uploadFile } from './s3.js';

// ─── Configuration ──────────────────────────────────

const FASHN_API_KEY = process.env.FASHN_API_KEY || '';

const client = FASHN_API_KEY ? new Fashn({ apiKey: FASHN_API_KEY }) : null;

const DEFAULT_MODE = 'balanced' as const; // ~8s processing
const DEFAULT_GARMENT_PHOTO_TYPE = 'auto' as const;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ─── Exports ────────────────────────────────────────

export function isFashnConfigured(): boolean {
  return client !== null;
}

export async function generateTryOn(
  personImageUrl: string,
  garmentImageUrl: string,
  category: 'tops' | 'bottoms' | 'one-pieces',
  s3Key: string,
): Promise<string> {
  if (!client) {
    throw new Error('FASHN API is not configured — set FASHN_API_KEY env var');
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Submit prediction and auto-poll until terminal state
      const prediction = await client.predictions.subscribe({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: personImageUrl,
          garment_image: garmentImageUrl,
          category,
          mode: DEFAULT_MODE,
          garment_photo_type: DEFAULT_GARMENT_PHOTO_TYPE,
        },
      });

      if (prediction.status !== 'completed' || !prediction.output?.[0]) {
        const detail = {
          status: prediction.status,
          id: prediction.id,
          error: (prediction as unknown as Record<string, unknown>).error,
          logs: (prediction as unknown as Record<string, unknown>).logs,
          inputs: { personImageUrl, garmentImageUrl, category },
        };
        console.error('[FASHN] Prediction failed:', JSON.stringify(detail, null, 2));
        throw new Error(
          `FASHN prediction failed: status="${prediction.status}"`,
        );
      }

      const cdnUrl: string = prediction.output[0];

      // Download result from FASHN CDN
      const response = await fetch(cdnUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download FASHN result: ${response.status} ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Re-upload to our S3 for persistence
      const s3Url = await uploadFile(s3Key, buffer, 'image/jpeg');
      return s3Url;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[FASHN] Attempt ${attempt}/${MAX_RETRIES} failed:`, {
        message: lastError.message,
        inputs: { personImageUrl, garmentImageUrl, category, s3Key },
      });

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error('FASHN try-on generation failed after retries');
}

// ─── Raw FASHN REST API methods ─────────────────────
// These use raw fetch instead of the SDK because the SDK types
// are outdated and don't include face_reference or all product-to-model params.

const FASHN_API_BASE = 'https://api.fashn.ai/v1';

export async function generateProductToModel(
  productImageUrl: string,
  prompt: string,
  aspectRatio: string,
  s3Key: string,
): Promise<string> {
  if (!FASHN_API_KEY) {
    throw new Error('FASHN API is not configured — set FASHN_API_KEY env var');
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const runResponse = await fetch(`${FASHN_API_BASE}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FASHN_API_KEY}`,
        },
        body: JSON.stringify({
          model_name: 'product-to-model',
          inputs: {
            product_image: productImageUrl,
            prompt,
            aspect_ratio: aspectRatio,
          },
        }),
      });

      if (!runResponse.ok) {
        throw new Error(
          `FASHN product-to-model submit failed: ${runResponse.status} ${runResponse.statusText}`,
        );
      }

      const { id } = await runResponse.json() as { id: string };
      const result = await pollForCompletion(id);
      const cdnUrl = result.output[0]!;

      const response = await fetch(cdnUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download FASHN result: ${response.status} ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return await uploadFile(s3Key, buffer, 'image/jpeg');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[FASHN] product-to-model attempt ${attempt}/${MAX_RETRIES} failed:`, {
        message: lastError.message,
        inputs: { productImageUrl, prompt, aspectRatio, s3Key },
      });

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error('FASHN product-to-model generation failed after retries');
}

export async function generateModelSwap(
  modelImageUrl: string,
  faceReferenceUrl: string,
  s3Key: string,
): Promise<string> {
  if (!FASHN_API_KEY) {
    throw new Error('FASHN API is not configured — set FASHN_API_KEY env var');
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const runResponse = await fetch(`${FASHN_API_BASE}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FASHN_API_KEY}`,
        },
        body: JSON.stringify({
          model_name: 'model-swap',
          inputs: {
            model_image: modelImageUrl,
            face_reference: faceReferenceUrl,
          },
        }),
      });

      if (!runResponse.ok) {
        throw new Error(
          `FASHN model-swap submit failed: ${runResponse.status} ${runResponse.statusText}`,
        );
      }

      const { id } = await runResponse.json() as { id: string };
      const result = await pollForCompletion(id);
      const cdnUrl = result.output[0]!;

      const response = await fetch(cdnUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download FASHN result: ${response.status} ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return await uploadFile(s3Key, buffer, 'image/jpeg');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[FASHN] model-swap attempt ${attempt}/${MAX_RETRIES} failed:`, {
        message: lastError.message,
        inputs: { modelImageUrl, faceReferenceUrl, s3Key },
      });

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error('FASHN model-swap generation failed after retries');
}

// ─── Helpers ────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollForCompletion(
  predictionId: string,
  maxWaitMs = 120_000,
): Promise<{ status: string; output: string[] }> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    await delay(2000);
    const statusResponse = await fetch(
      `${FASHN_API_BASE}/status/${predictionId}`,
      { headers: { Authorization: `Bearer ${FASHN_API_KEY}` } },
    );
    const result = await statusResponse.json() as {
      status: string;
      output: string[];
      error?: unknown;
    };
    if (result.status === 'completed') return result;
    if (result.status === 'failed') {
      throw new Error(`FASHN prediction failed: ${JSON.stringify(result.error)}`);
    }
  }
  throw new Error('FASHN prediction timed out');
}
