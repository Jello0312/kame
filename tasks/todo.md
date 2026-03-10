# Kame — Active Sprint Tasks

> Updated: 2026-03-10 (Sprint 2.2 complete)
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

### Sprint 1.5 — Feed/Swipe/Favorites/Analytics Backend ✅
- [x] AnalyticsClick model added to Prisma schema + migration ✅
- [x] src/services/FeedService.ts — getTryOnImageForFeed(), getFeedForUser(), Option C migration comment ✅
- [x] src/routes/feed.ts — GET /api/feed?cursor=X&limit=N with Zod query validation ✅
- [x] src/routes/swipe.ts — POST /api/swipe with upsert (re-swipe support) ✅
- [x] src/routes/favorites.ts — GET /api/favorites with offset/limit pagination ✅
- [x] src/routes/analytics.ts — POST /api/analytics/click ✅
- [x] All routes registered in index.ts ✅
- [x] All 13 endpoint tests verified ✅

### Review — Feed/Swipe/Favorites/Analytics (2026-03-10)
- **Architecture:** FeedService is a dedicated abstraction layer. Routes are thin handlers (validate → service/prisma → response). Analytics is inline (single create, no service needed).
- **Feed algorithm:** Gender-filtered pairings (user gender + 'U'), style-tag overlap filtering, swiped product exclusion (only when BOTH top+bottom swiped), Fisher-Yates shuffle, cursor-based pagination.
- **Solo dresses:** Female users also get one-piece/dress cards (`fashnCategory: 'one-pieces'`, `gender: 'FEMALE'`). These appear as `isSolo: true` feed cards with `soloProduct` instead of top/bottom.
- **Swipe upsert:** Uses Prisma compound unique `userId_productId`. Upsert handles re-swipe (user changes their mind). `outfitGroupId` links paired items from same swipe gesture.
- **Favorites:** Queries SwipeAction WHERE action='LIKE', includes product relation, maps to flat ProductSummary with `likedAt`.
- **Try-on images:** `getTryOnImageForFeed()` queries for COMPLETED + combined layer results. Returns null if no try-on exists yet. v1.2 migration comment documents Option C switch.
- **Feed stats:** 44 cards for female user (22 pairings + 22 solo dresses), drops to 43 after swiping both products of one pairing.

---

## ✅ Sprint 2.1 — FASHN AI Try-On Pipeline ✅
- [x] Install deps: fashn, bullmq, ioredis@5.9.3 ✅
- [x] src/integrations/fashn.ts — FASHN SDK v1.6 client with retry + S3 persistence ✅
- [x] src/lib/queue.ts — BullMQ + Redis connection with graceful degradation ✅
- [x] src/jobs/generateTryOn.ts — BullMQ worker (concurrency 2), two-pass outfit + solo dress pipelines ✅
- [x] src/routes/tryon.ts — POST /batch (trigger pre-gen) + GET /status (progress polling) ✅
- [x] src/index.ts — tryonRouter mount + conditional worker startup via dynamic import ✅
- [x] All 12 verification tests passed (health, 503 degradation, auth guards, status counts) ✅

### Review — FASHN AI Try-On Pipeline (2026-03-11)
- **Architecture:** Sub-agent parallel build — Agent 1 built fashn.ts, Agent 2 built queue.ts + worker. Main thread built routes + wired into index.ts. Zero file conflicts.
- **FASHN SDK:** `fashn` npm package with `client.predictions.subscribe()` auto-polls until terminal state. model_name `tryon-v1.6`, mode `balanced` (~8s), garment_photo_type `auto`.
- **Two-pass pipeline:** Pass 1: top garment on user body photo → S3. Pass 2: bottom garment on pass-1 result → S3. Solo dresses: single pass.
- **Graceful degradation:** Without REDIS_URL → queue exports null, worker doesn't start, routes return 503. Without FASHN_API_KEY → fashn client is null, routes return 503. Server runs cleanly in both cases.
- **Dynamic import:** Worker startup uses `import('./jobs/generateTryOn.js').then(...)` to avoid crash when Redis not configured.
- **ioredis pinning:** Must use ioredis@5.9.3 to match BullMQ's peer dependency. v5.10.0 causes TS2322 type incompatibility with ConnectionOptions.
- **Idempotent batch:** Skips outfit pairings that already have a TryOnResult record. Safe to call multiple times.
- **Pre-gen caps:** 20 female outfits + 6 solo dresses, 15 male outfits. DB record created as PENDING before job queued.

## ✅ Sprint 2.0 — Brand Design System Setup ✅
- [x] Verify Plus Jakarta Sans fonts (5 weights) in assets/fonts/ ✅
- [x] Verify src/theme/constants.ts (COLORS, FONTS, GRADIENTS, SPACING, RADIUS, SHADOWS) ✅
- [x] Rewrite tailwind.config.js — brand colors, font families, border radii, NativeWind preset ✅
- [x] Rewrite app/_layout.tsx — useFonts + SplashScreen + StatusBar light + navy bg ✅
- [x] Rewrite app/(tabs)/_layout.tsx — coral active tabs, gray inactive, Lucide icons, white tab bar ✅
- [x] Create components/KameLogo.tsx — teal-bright BoldItalic text ✅
- [x] Fix app.json splash/adaptive icon bg from #1A2B3D → #112836 ✅
- [x] Delete stale utils/colors.ts (wrong hex values, superseded by constants.ts) ✅
- [x] Install expo-font, expo-splash-screen, lucide-react-native, react-native-svg ✅
- [x] Align 18 Expo SDK 54 packages via npx expo install --fix ✅

### Review — Brand Design System (2026-03-10)
- **Tailwind config:** Full rewrite with brand tokens from BRAND_SYSTEM.md. Colors (navy, teal, coral, gold, kame-green/red/purple, grays), fontFamily (heading, heading-semi, body, body-medium), borderRadius (card, button, chip, input). NativeWind preset enabled.
- **Root layout:** expo-font loads 5 Plus Jakarta Sans weights at startup. SplashScreen.preventAutoHideAsync() prevents flash, hideAsync() on fonts loaded. Navy #112836 wrapper view. StatusBar light-content.
- **Tab layout:** Imports COLORS/FONTS from constants.ts (single source of truth). Coral #FA6869 active tint (tab-specific brand rule), gray-400 inactive. White background tab bar. Lucide icons: Compass (Explore), Heart (Favorites), User (Profile).
- **KameLogo:** Reusable component, teal-bright #48E6CD, PlusJakartaSans-BoldItalic, configurable size prop.
- **Cleanup:** Deleted utils/colors.ts (had wrong values #1A2B3D, #00BFA5, #FF4D6A from Sprint 1.1 scaffold). Grep confirmed nothing imported it.
- **Expo SDK alignment:** npx expo install --fix updated 18 packages to SDK 54 compatible versions. TypeScript typecheck passes clean.

---

## ✅ Sprint 2.2 — Mobile Auth + Onboarding ✅
- [x] stores/authStore.ts — Zustand + expo-secure-store (token, user, login, register, logout, checkAuth) ✅
- [x] services/api.ts — fetch wrapper with auto-JWT, 401→logout, FormData support ✅
- [x] app/auth/_layout.tsx — Stack with slide animation ✅
- [x] app/auth/login.tsx — email + password, navy bg, teal CTA ✅
- [x] app/auth/register.tsx — name + email + password, teal CTA ✅
- [x] stores/onboardingStore.ts — ephemeral Zustand store (measurements, photos, preferences) ✅
- [x] app/onboarding/_layout.tsx — Stack with gestureEnabled: false ✅
- [x] app/onboarding/measurements.tsx — gender cards, body shape chips (server enums), metric/imperial toggle ✅
- [x] app/onboarding/photos.tsx — face + body photo via expo-image-picker gallery ✅
- [x] app/onboarding/preferences.tsx — budget (4 chips), styles (6 multi), platforms (5 multi), coral gradient CTA ✅
- [x] app/onboarding/generating.tsx — sequential POSTs (profile→avatar→preferences→tryon/batch), poll status ✅
- [x] app/_layout.tsx — auth-based routing (auth↔onboarding↔tabs), splash timing ✅
- [x] TypeScript typecheck passes clean ✅

### Review — Mobile Auth + Onboarding (2026-03-10)
- **Architecture:** 3 parallel sub-agents built 11 files with zero conflicts. Auth infra (Sub-Agent 1), onboarding steps 1-2 (Sub-Agent 2), onboarding steps 3-4 + navigation (Sub-Agent 3).
- **Auth routing:** `_layout.tsx` uses `useSegments()` + `useEffect` + `router.replace()` to redirect based on `isAuthenticated` and `hasCompletedOnboarding`. Splash visible until fonts + checkAuth() both complete.
- **Circular dependency:** api.ts ↔ authStore.ts resolved via lazy `require()` in api.ts. Zustand's `getState()` is runtime lookup, safe for circular refs.
- **Onboarding probe:** `checkAuth()` probes `GET /api/profile` — 200 means onboarded, 404 means not. No extra backend endpoint needed.
- **Server enum alignment:** Body shape chips use server values directly (HOURGLASS, PEAR, APPLE, RECTANGLE, INVERTED_TRIANGLE). Budget uses 4 friendly labels mapped to server enum (BUDGET, MID, PREMIUM, LUXURY).
- **Imperial conversion:** Client-side conversion before storing in onboardingStore (inches×2.54, lbs×0.453592). Server always receives metric.
- **Generating flow:** Sequential POSTs to 4 endpoints, graceful 503 handling for tryon/batch, poll status with early exit (5+ ready or all done), auto-redirect to tabs on completion.
- **Typed routes:** Must run `npx expo customize tsconfig.json` after adding new route files to regenerate expo-router's TypeScript definitions.

---

## ✅ Sprint 2.3 — Swipe Deck UI ✅
- [x] types/feed.ts — FeedCard, ProductSummary, FeedResponse shared types ✅
- [x] app/_layout.tsx — GestureHandlerRootView + QueryClientProvider wrappers ✅
- [x] components/SwipeCard.tsx — try-on image, product info overlay, platform badges, LIKE/NOPE stamps ✅
- [x] components/SwipeDeck.tsx — Gesture.Pan(), spring physics, card stack, action buttons, fire-and-forget API ✅
- [x] app/(tabs)/explore.tsx — useInfiniteQuery + SwipeDeck + loading/error/empty states ✅
- [x] TypeScript typecheck passes clean ✅

### Review — Swipe Deck UI (2026-03-10)
- **Architecture:** 2 parallel sub-agents built SwipeCard.tsx (pure presentational) and SwipeDeck.tsx (gesture engine) with zero conflicts. Pre-reqs (types, _layout wrappers) done before sub-agents. explore.tsx wired after.
- **Gesture API:** Gesture.Pan() composable API (not legacy PanGestureHandler). GestureDetector wraps top card only. onUpdate tracks position, onEnd threshold-checks → spring exit or snap back.
- **Spring physics:** All constants from SWIPE object in constants.ts — threshold=120px, springDamping=15, springStiffness=150, exitX=500, rotationFactor=0.08.
- **Card stack:** 3 visible cards with z-order via render order (third→second→top). Second/third cards interpolate scale+translateY as top card drags away. All animated styles on UI thread via useAnimatedStyle.
- **Swipe API:** Fire-and-forget POST /api/swipe. Solo dress = 1 POST. Outfit pair = 2 parallel POSTs with shared crypto.randomUUID() outfitGroupId. Failures logged but don't interrupt UX.
- **Feed pagination:** useInfiniteQuery with cursor-based pagination. Auto-fetches next page when <3 cards remain. allCards = data.pages.flatMap(p => p.cards).
- **Programmatic swipe:** Button taps trigger withSpring with completion callback (3rd arg) for precise timing before handleSwipeComplete fires.
- **Platform badges:** Amazon = #FF9900 bg, SHEIN = #000 bg, white bold text, rounded 8px.
- **LinearGradient type fix:** GRADIENTS.cardOverlay typed as readonly tuple needs `as unknown as [string, string]` cast for expo-linear-gradient's colors prop.

---

## 🏗️ CURRENT FOCUS: Sprint 3.1 — Product Detail + Favorites + Profile

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
