import sharp from 'sharp';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { uploadFile } from '../integrations/s3.js';

interface AvatarFiles {
  facePhoto?: Buffer;
  bodyPhoto?: Buffer;
}

const BODY_MIN_WIDTH = 576;
const BODY_MIN_HEIGHT = 864;
const FACE_MAX_SIZE = 512;

export async function uploadAvatar(userId: string, files: AvatarFiles) {
  let facePhotoUrl: string | undefined;
  let bodyPhotoUrl: string | undefined;

  if (files.bodyPhoto) {
    const metadata = await sharp(files.bodyPhoto).metadata();
    if (!metadata.width || !metadata.height) {
      throw new ValidationError('Invalid body photo', {
        'body.bodyPhoto': ['Unable to read image dimensions'],
      });
    }

    // Ensure minimum dimensions for FASHN AI
    if (metadata.width < BODY_MIN_WIDTH || metadata.height < BODY_MIN_HEIGHT) {
      throw new ValidationError('Body photo too small', {
        'body.bodyPhoto': [`Minimum resolution is ${BODY_MIN_WIDTH}x${BODY_MIN_HEIGHT}px`],
      });
    }

    const processed = await sharp(files.bodyPhoto)
      .jpeg({ quality: 90 })
      .toBuffer();

    bodyPhotoUrl = await uploadFile(
      `avatars/${userId}/body.jpg`,
      processed,
      'image/jpeg',
    );
  }

  if (files.facePhoto) {
    const metadata = await sharp(files.facePhoto).metadata();
    if (!metadata.width || !metadata.height) {
      throw new ValidationError('Invalid face photo', {
        'body.facePhoto': ['Unable to read image dimensions'],
      });
    }

    // Resize down if larger than max size
    let pipeline = sharp(files.facePhoto);
    if (metadata.width > FACE_MAX_SIZE || metadata.height > FACE_MAX_SIZE) {
      pipeline = pipeline.resize(FACE_MAX_SIZE, FACE_MAX_SIZE, { fit: 'inside' });
    }

    const processed = await pipeline.jpeg({ quality: 90 }).toBuffer();

    facePhotoUrl = await uploadFile(
      `avatars/${userId}/face.jpg`,
      processed,
      'image/jpeg',
    );
  }

  const avatar = await prisma.userAvatar.upsert({
    where: { userId },
    create: {
      userId,
      facePhotoUrl: facePhotoUrl ?? null,
      bodyPhotoUrl: bodyPhotoUrl ?? null,
      status: 'READY',
    },
    update: {
      ...(facePhotoUrl !== undefined && { facePhotoUrl }),
      ...(bodyPhotoUrl !== undefined && { bodyPhotoUrl }),
      status: 'READY',
    },
  });

  return avatar;
}

export async function getAvatar(userId: string) {
  const avatar = await prisma.userAvatar.findUnique({
    where: { userId },
  });

  if (!avatar) {
    throw new NotFoundError('UserAvatar');
  }

  return avatar;
}
