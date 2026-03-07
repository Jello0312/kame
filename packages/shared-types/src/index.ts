// @kame/shared-types — Shared TypeScript interfaces and enums

// ─── Enums ───────────────────────────────────────────

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export enum BodyShape {
  HOURGLASS = 'HOURGLASS',
  PEAR = 'PEAR',
  APPLE = 'APPLE',
  RECTANGLE = 'RECTANGLE',
  INVERTED_TRIANGLE = 'INVERTED_TRIANGLE',
}

export enum MeasurementUnit {
  METRIC = 'METRIC',
  IMPERIAL = 'IMPERIAL',
}

export enum AvatarStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export enum BudgetRange {
  BUDGET = 'BUDGET',
  MID = 'MID',
  PREMIUM = 'PREMIUM',
  LUXURY = 'LUXURY',
}

export enum ProductPlatform {
  AMAZON = 'AMAZON',
  SHEIN = 'SHEIN',
  ZARA = 'ZARA',
}

export enum ProductGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNISEX = 'UNISEX',
}

export enum TryOnStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SwipeActionType {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
}

// ─── API Response Envelope ───────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
