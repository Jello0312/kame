# Kame — Active Sprint Tasks

> Updated: 2026-03-09
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

---

## 🏗️ CURRENT FOCUS: Sprint 1.3 — Authentication Backend

### Sprint 1.3 — Authentication Backend
- [ ] POST /auth/register, POST /auth/login, GET /auth/me
- [ ] JWT middleware, Zod validation middleware

### Sprint 1.4 — Profile/Avatar/Preferences Backend + S3
- [ ] S3 upload utility (with local fallback)
- [ ] POST /api/profile, POST /api/avatar, POST /api/preferences
- [ ] GET endpoints for each

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
