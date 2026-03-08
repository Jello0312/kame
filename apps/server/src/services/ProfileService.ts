import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { BodyShape, MeasurementUnit } from '@prisma/client';

interface ProfileData {
  gender: string;
  heightCm?: number;
  weightKg?: number;
  waistCm?: number;
  bodyShape?: BodyShape;
  measurementUnit?: MeasurementUnit;
}

export async function upsertProfile(userId: string, data: ProfileData) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      gender: data.gender,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      waistCm: data.waistCm,
      bodyShape: data.bodyShape,
      measurementUnit: data.measurementUnit ?? 'METRIC',
    },
    update: {
      gender: data.gender,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      waistCm: data.waistCm,
      bodyShape: data.bodyShape,
      measurementUnit: data.measurementUnit,
    },
  });
}

export async function getProfile(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('UserProfile');
  }

  return profile;
}
