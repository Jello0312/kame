import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// ─── Configuration (Cloudflare R2) ──────────────────

const R2_CONFIGURED =
  !!process.env.R2_ENDPOINT &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY;

const s3Client = R2_CONFIGURED
  ? new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const BUCKET = process.env.R2_BUCKET ?? 'kame-uploads';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';
const LOCAL_UPLOAD_DIR = path.resolve('uploads');

// ─── Exports ────────────────────────────────────────

export function isS3Configured(): boolean {
  return R2_CONFIGURED;
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return `${R2_PUBLIC_URL}/${key}`;
  }

  // Local fallback
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${key}`;
}

export function getPublicUrl(key: string): string {
  if (R2_CONFIGURED) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  return `/uploads/${key}`;
}

export async function deleteFilesByPrefix(prefix: string): Promise<void> {
  if (!s3Client) return;

  const listResult = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    }),
  );

  const objects = listResult.Contents;
  if (!objects || objects.length === 0) return;

  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: objects.map((obj) => ({ Key: obj.Key })),
        Quiet: true,
      },
    }),
  );
}
