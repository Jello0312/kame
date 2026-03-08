import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { BudgetRange } from '@prisma/client';

interface PreferenceData {
  budgetRange?: BudgetRange;
  fashionStyles?: string[];
  preferredPlatforms?: string[];
}

export async function upsertPreferences(userId: string, data: PreferenceData) {
  return prisma.stylePreference.upsert({
    where: { userId },
    create: {
      userId,
      budgetRange: data.budgetRange ?? 'MID',
      fashionStyles: data.fashionStyles ?? [],
      preferredPlatforms: data.preferredPlatforms ?? [],
    },
    update: {
      ...(data.budgetRange !== undefined && { budgetRange: data.budgetRange }),
      ...(data.fashionStyles !== undefined && { fashionStyles: data.fashionStyles }),
      ...(data.preferredPlatforms !== undefined && { preferredPlatforms: data.preferredPlatforms }),
    },
  });
}

export async function getPreferences(userId: string) {
  const prefs = await prisma.stylePreference.findUnique({
    where: { userId },
  });

  if (!prefs) {
    throw new NotFoundError('StylePreference');
  }

  return prefs;
}
