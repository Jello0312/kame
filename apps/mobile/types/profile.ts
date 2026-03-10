// ═══════════════════════════════════════════════════════════════
// Profile & Favorites Types
// ═══════════════════════════════════════════════════════════════
// Shared type definitions for Favorites, Profile, Avatar, and
// Style Preferences screens. Matches server API response shapes.
// ═══════════════════════════════════════════════════════════════

// ── Favorites ─────────────────────────────────────────────────

export interface FavoriteItem {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  currency: string;
  platform: string;
  imageUrl: string;
  productPageUrl: string;
  likedAt: string;
}

// ── User (from GET /auth/me) ──────────────────────────────────

export interface UserMe {
  id: string;
  email: string;
  name: string;
  subscriptionTier: string;
  createdAt: string;
}

// ── Profile (from GET /api/profile) ───────────────────────────

export interface UserProfile {
  gender: 'M' | 'W';
  heightCm: number | null;
  weightKg: number | null;
  waistCm: number | null;
  bodyShape: string | null;
  measurementUnit: 'METRIC' | 'IMPERIAL';
}

// ── Avatar (from GET /api/avatar) ─────────────────────────────

export interface UserAvatar {
  facePhotoUrl: string | null;
  bodyPhotoUrl: string | null;
  status: string;
}

// ── Preferences (from GET /api/preferences) ───────────────────

export interface StylePreferences {
  budgetRange: string;
  fashionStyles: string[];
  preferredPlatforms: string[];
}
