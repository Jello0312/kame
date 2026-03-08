import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// ─── Configuration ──────────────────────────────────

const S3_CONFIGURED =
  !!process.env.AWS_ACCESS_KEY_ID &&
  !!process.env.AWS_SECRET_ACCESS_KEY &&
  !!process.env.AWS_S3_BUCKET;

const s3Client = S3_CONFIGURED
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const BUCKET = process.env.AWS_S3_BUCKET || '';
const REGION = process.env.AWS_REGION || 'us-east-1';
const LOCAL_UPLOAD_DIR = path.resolve('uploads');

// ─── Exports ────────────────────────────────────────

export function isS3Configured(): boolean {
  return S3_CONFIGURED;
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
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  }

  // Local fallback
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${key}`;
}

export function getPublicUrl(key: string): string {
  if (S3_CONFIGURED) {
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  }
  return `/uploads/${key}`;
}
