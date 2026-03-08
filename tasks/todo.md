# Kame — Active Sprint Tasks

> Updated: 2026-03-10
> See ROADMAP.md for full multi-week plan.

---

## ✅ COMPLETED

### Sprint 1.1 — Project Scaffolding ✅
- [x] Monorepo (pnpm workspaces, Expo, Express, shared-types)
- [x] TypeScript, ESLint, Prettier, NativeWind configured
- [x] .env.example created
- [x] Both apps start with pnpm dev

### Sprint 1.1b — Database Schema + Seed Script ✅
- [x] Prisma schema: User, UserProfile, UserAvatar, StylePreference, Product, TryOnResult, SwipeAction, OutfitPairing
- [x] Gender field on UserProfile
- [x] OutfitPairing model (top + bottom + gender + styleTags)
- [x] outfitGroupId on SwipeAction
- [x] Platform enum expanded (AMAZON, SHEIN, ZALORA, ZALANDO, TAOBAO, ASOS)
- [x] seed.ts with 67 verified Amazon products + 24 outfit pairings
- [x] DIRECT_URL added to .env.example

### Sprint 1.2 — Migration + Seed Execution ✅
- [x] Create + run validate-images.ts script (HEAD request all image URLs) ✅
- [x] Fix broken image URLs — rebuilt catalog with 67 verified Amazon products ✅
- [x] Extract + add 74 SHEIN products to catalog (filtered from 105 raw, removed 30 placeholder images + 1 non-clothing) ✅
- [x] Add 18 SHEIN outfit pairings (8 Women + 10 Men) ✅
- [x] Run prisma migrate reset (cleared drift from previous db push) ✅
- [x] Run prisma migrate dev --name init (created initial migration) ✅
- [x] Run prisma db seed (141 products + 42 pairings seeded) ✅
- [x] Verified: 141 products, 42 pairings, 141/141 images HTTP 200 ✅

### Review — Image Fix (2026-03-08)
- **Problem:** All 84 original image URLs were returning HTTP 404
- **Root cause:** Amazon image IDs were fabricated (correct ASIN but wrong image hash); SHEIN URLs had entirely fake hash segments
- **Solution:** Scraped real product data from Amazon search results via browser DevTools; rebuilt catalog.ts with 67 verified products (all Amazon)
- **Validation:** 67/67 images confirmed HTTP 200 via validate-images.ts

### Review — SHEIN Expansion (2026-03-09)
- **Source:** Extracted 105 products from SHEIN via DevTools console script
- **Filtered:** Removed 30 products with placeholder gray images + 1 non-clothing item (iron-on sticker)
- **Result:** 74 valid SHEIN products added (14 W Tops + 10 W Bottoms + 10 W Dresses + 10 M Tees + 10 M Polos + 10 M Bottoms + 10 M Hoodies)
- **Total catalog:** 141 products (67 Amazon + 74 SHEIN) + 42 outfit pairings (24 Amazon + 18 SHEIN)
- **Distribution:** 72 Women + 65 Men + 4 Unisex

### Review — Migration + Seed (2026-03-09)
- **Problem:** `prisma migrate dev` detected drift — DB had tables from previous `db push` but no migration history
- **Solution:** `prisma migrate reset --force` to wipe clean, then `prisma migrate dev --name init` to create initial migration
- **Result:** Initial migration `20260308162943_init` created and applied; 141 products + 42 pairings seeded successfully
- **Added:** Prisma seed config to package.json (`"prisma": { "seed": "tsx prisma/seed.ts" }`)
- **Note:** Prisma 7 will deprecate package.json#prisma — migrate to `prisma.config.ts` later

### Sprint 1.3 — Authentication Backend ✅
- [x] Install deps: bcryptjs, jsonwebtoken, zod ✅
- [x] src/utils/errors.ts — AppError, AuthError, ValidationError, NotFoundError ✅
- [x] src/middleware/validate.ts — Zod validation middleware factory ✅
- [x] src/middleware/auth.ts — JWT Bearer token verification ✅
- [x] src/types/express.d.ts — Request.userId augmentation ✅
- [x] src/services/AuthService.ts — register, login, getMe ✅
- [x] src/routes/auth.ts — POST /register, POST /login, GET /me ✅
- [x] src/index.ts — dotenv, route wiring, global error handler ✅
- [x] packages/shared-types/tsconfig.json — fixed composite + noEmit for project references ✅
- [x] All 10 endpoint tests verified ✅

### Review — Authentication (2026-03-09)
- **Architecture:** Thin route handlers (validate → service → response). Business logic in AuthService.ts.
- **Security:** bcryptjs (10 rounds), JWT with configurable expiry, same error for bad email/password (prevents enumeration), passwordHash never in responses
- **Validation:** Zod schemas colocated with routes. Email trimmed + lowercased. Password min 8 on register.
- **Error handling:** Global error handler catches AppError hierarchy + Prisma P2002 + unknown errors. Stack traces hidden in production.
- **Note:** Used bcryptjs (pure JS) instead of bcrypt (native C++) to avoid Windows native build issues.

### Sprint 1.4 — Profile/Avatar/Preferences Backend + S3 ✅
- [x] Install deps: multer, sharp, @aws-sdk/client-s3 ✅
- [x] src/integrations/s3.ts — S3 upload with local filesystem fallback ✅
- [x] src/services/ProfileService.ts — upsert/get user profile (gender, measurements, bodyShape) ✅
- [x] src/routes/profile.ts — POST/GET /api/profile with Zod validation ✅
- [x] src/services/AvatarService.ts — sharp resize (body min 576x864, face max 512x512), S3 upload ✅
- [x] src/routes/avatar.ts — POST/GET /api/avatar with multer (10MB, JPEG/PNG only) ✅
- [x] src/services/PreferenceService.ts — upsert/get style preferences ✅
- [x] src/routes/preferences.ts — POST/GET /api/preferences with Zod validation ✅
- [x] src/index.ts — registered 3 route groups + conditional static middleware ✅
- [x] All 15 endpoint tests verified ✅

### Review — Profile/Avatar/Preferences (2026-03-10)
- **Architecture:** Same thin-handler pattern as auth. Upsert pattern for all 1:1 relationships (profile, avatar, preferences).
- **S3 integration:** Checks AWS env vars at startup. If missing, falls back to local `uploads/` directory with Express static middleware. Seamless switch — no code changes needed when AWS is configured.
- **Avatar processing:** sharp validates body photo min 576x864 (FASHN AI requirement), face photo resized to max 512x512. Both converted to JPEG quality 90.
- **Multer:** memoryStorage (buffers go straight to sharp), 10MB limit, JPEG/PNG only. Custom error handler for oversized/invalid files.
- **Validation:** Zod enums match Prisma enums exactly (gender M/W, bodyShape, budgetRange, platform names).
- **Note:** sharp requires `pnpm.onlyBuiltDependencies` in root package.json for native build approval.

---

## 🏗️ CURRENT FOCUS: Sprint 1.5 — Feed/Swipe/Favorites/Analytics Backend

### Sprint 1.5 — Feed/Swipe/Favorites/Analytics Backend
- [ ] FeedService with abstraction layer
- [ ] GET /api/feed, POST /api/swipe, GET /api/favorites, POST /api/analytics/click

### Sprint 2.1 — FASHN Try-On Pipeline
- [ ] BullMQ + Redis setup
- [ ] FASHN API client
- [ ] Two-pass outfit generation job
- [ ] POST /api/tryon/batch, GET /api/tryon/status

### Sprint 2.2 — Mobile Auth + Onboarding
- [ ] Auth store, API client, login/register screens
- [ ] 4-step onboarding wizard (gender → measurements → photos → preferences → generating)
- [ ] Navigation routing (auth → onboarding → tabs)

### Sprint 2.3 — Swipe Deck UI
- [ ] SwipeCard, SwipeDeck components
- [ ] Reanimated spring animations + gesture handler
- [ ] Feed loading + pagination

### Sprint 3.1 — Favorites + Product Detail + Profile
- [ ] ProductDetail modal with Buy Now
- [ ] Favorites grid, Profile screen
- [ ] Tab bar: Explore / Favorites / Profile

### Sprint 3.2 — Polish
- [ ] Loading states, error states, empty states
- [ ] Splash screen, app icon
- [ ] End-to-end walkthrough + bug fixes

### Sprint 3.3 — Deploy + Beta
- [ ] Backend deployment (Railway/Render)
- [ ] Expo Go distribution to beta testers
- [ ] Feedback form

---

## Backlog (Post-MVP)
See ROADMAP.md for v1.1 through v2.0 roadmap.
