# Kame — Development Roadmap

> Last updated: 2026-03-14
> Current phase: **MVP Sprint (Weeks 1-3)**
> Current step: **Sprint 3.4 — UI Enhancements** (complete)

## Progress Tracking Convention
- `[ ]` = Todo
- `[-]` = In Progress 🏗️
- `[x]` = Completed ✅
- `[!]` = Blocked ⚠️

---

## 🎯 MVP Sprint Goal
**Validate:** Will users find it delightful to swipe through outfits visualized on their own body?
**Deliverable:** Working app distributed to 10-20 beta testers via Expo Go.
**Timeline:** 3 weeks (21 days)

---

## Week 1: Foundation + Onboarding

### Sprint 1.1 — Project Scaffolding ✅ COMPLETE
- [x] Initialize pnpm monorepo workspace ✅
- [x] Create apps/mobile with Expo SDK 54 + expo-router + TypeScript ✅
- [x] Create apps/server with Express + TypeScript ✅
- [x] Create packages/shared-types ✅
- [x] Set up tsconfig.base.json + per-package tsconfig ✅
- [x] Set up ESLint + Prettier shared config ✅
- [x] Configure NativeWind (Tailwind) in mobile app ✅
- [x] Create .env.example with all required variables ✅
- [x] Verify `pnpm dev` starts both apps ✅

### Sprint 1.1b — Database + Seed Data ✅ COMPLETE
- [x] Set up Prisma in apps/server ✅
- [x] Create full schema (User, UserProfile, UserAvatar, StylePreference, Product, TryOnResult, SwipeAction, OutfitPairing) ✅
- [x] Add gender field to UserProfile ✅
- [x] Add OutfitPairing model (top+bottom pairing with gender) ✅
- [x] Add outfitGroupId to SwipeAction ✅
- [x] Add Platform enum values (AMAZON, SHEIN, ZALORA, ZALANDO, TAOBAO, ASOS) ✅
- [x] Create seed.ts with 141 products (67 Amazon + 74 SHEIN) + 42 outfit pairings ✅
- [x] Add DIRECT_URL to .env.example for Supabase ✅

### Sprint 1.2 — Migration + Seed Execution ✅ COMPLETE
- [x] Run: npx prisma migrate dev (apply all pending migrations) ✅
- [x] Run: npx prisma db seed (populate 141 products + 42 pairings) ✅
- [x] Verify seeded data: 141 products, 42 outfit pairings ✅
- [x] Validate all product image URLs (run validate-images script) ✅
- [x] Fix broken image URLs — rebuilt catalog with 67 verified Amazon products ✅
- [x] Extract + add 74 SHEIN products to catalog (filtered from 105 raw) ✅
- [x] Add 18 SHEIN outfit pairings (8 Women + 10 Men) ✅

### Sprint 1.3 — Authentication Backend ✅ COMPLETE
- [x] POST /auth/register (email + password, Zod validation, bcryptjs) ✅
- [x] POST /auth/login (returns JWT access token) ✅
- [x] GET /auth/me (returns current user from token) ✅
- [x] Auth middleware (JWT verification on protected routes) ✅
- [x] Zod validation middleware ✅
- [x] Custom error classes (AppError, AuthError, ValidationError, NotFoundError) ✅
- [x] Global error handler with Prisma P2002 handling ✅
- [x] All 10 endpoint tests verified ✅

### Sprint 1.4 — Profile, Avatar, Preferences Backend + S3 ✅ COMPLETE
- [x] Create src/integrations/s3.ts (upload utility with local fallback) ✅
- [x] POST /api/profile (save gender + measurements) ✅
- [x] GET /api/profile (return user profile) ✅
- [x] POST /api/avatar (upload face + body photos, resize with sharp, store in S3) ✅
- [x] GET /api/avatar (return avatar) ✅
- [x] POST /api/preferences (save style preferences) ✅
- [x] GET /api/preferences (return preferences) ✅

### Sprint 1.5 — Feed, Swipe, Favorites, Analytics Backend ✅ COMPLETE
- [x] Create src/services/FeedService.ts with abstraction layer ✅
- [x] getTryOnImageForFeed() — with Option C migration comment ✅
- [x] getFeedForUser() — gender-filtered, style-matched, exclude swiped ✅
- [x] GET /api/feed?cursor=X — outfit cards endpoint ✅
- [x] POST /api/swipe — save like/dislike with outfitGroupId ✅
- [x] GET /api/favorites — flat list of liked products ✅
- [x] POST /api/analytics/click — log Buy Now taps ✅

---

## Week 2: Try-On + Swipe Core

### Sprint 2.0 — Brand Design System Setup ✅ COMPLETE
- [x] Verify Plus Jakarta Sans .ttf files in assets/fonts/ (5 weights) ✅
- [x] Verify src/theme/constants.ts with all brand tokens ✅
- [x] Rewrite tailwind.config.js with brand color/font/radius tokens ✅
- [x] Rewrite app/_layout.tsx with expo-font loading + splash screen ✅
- [x] Rewrite app/(tabs)/_layout.tsx with brand colors + Lucide icons ✅
- [x] Create components/KameLogo.tsx (teal-bright BoldItalic) ✅
- [x] Fix app.json splash colors (#1A2B3D → #112836) ✅
- [x] Delete stale utils/colors.ts (superseded by constants.ts) ✅
- [x] Install deps: expo-font, expo-splash-screen, lucide-react-native, react-native-svg ✅
- [x] Align all 18 Expo SDK 54 package versions via `npx expo install --fix` ✅

### Sprint 2.1 — FASHN AI Try-On Pipeline ✅ COMPLETE
- [x] Create src/lib/queue.ts (BullMQ + Redis connection with graceful degradation) ✅
- [x] Create src/integrations/fashn.ts (FASHN SDK v1.6 client with retry + S3 persistence) ✅
- [x] generateTryOn(personImageUrl, garmentImageUrl, category, s3Key) method ✅
- [x] Create src/jobs/generateTryOn.ts (BullMQ worker, concurrency 2) ✅
- [x] Two-pass outfit pipeline: top on body → bottom on result → upload to S3 ✅
- [x] Single-pass dress pipeline: dress on body → upload to S3 ✅
- [x] POST /api/tryon/batch — trigger pre-gen (cap 20 female / 15 male + 6 solo dresses) ✅
- [x] GET /api/tryon/status — return generation progress (groupBy status) ✅
- [x] Error handling: retry 3x with linear backoff, then mark failed ✅
- [x] Graceful degradation: 503 when Redis/FASHN not configured ✅

### Sprint 2.2 — Mobile Auth Screens + Onboarding Wizard ✅ COMPLETE
- [x] stores/authStore.ts (Zustand + expo-secure-store) ✅
- [x] services/api.ts (fetch wrapper with auto-JWT) ✅
- [x] app/auth/login.tsx (email + password) ✅
- [x] app/auth/register.tsx (name + email + password) ✅
- [x] app/_layout.tsx routing (auth → onboarding → tabs) ✅
- [x] app/onboarding/measurements.tsx (gender selector + body measurements) ✅
- [x] app/onboarding/photos.tsx (face + body photo capture) ✅
- [x] app/onboarding/preferences.tsx (budget + platforms + styles) ✅
- [x] app/onboarding/generating.tsx (loading + API calls + tryon/batch trigger) ✅
- [x] Onboarding navigation flow (1→2→3→4→tabs) ✅

### Sprint 2.3 — Swipe Deck UI ✅ COMPLETE
- [x] components/SwipeCard.tsx (try-on image + product overlay + prices) ✅
- [x] components/SwipeDeck.tsx (card stack + reanimated + gesture-handler) ✅
- [x] Swipe right animation → like (2x POST /api/swipe for outfits) ✅
- [x] Swipe left animation → dislike ✅
- [x] Bottom action buttons (X / Heart) ✅
- [x] Feed loading + pagination (auto-fetch when <3 cards) ✅
- [x] Empty state: "All caught up!" ✅
- [x] Wire into app/(tabs)/explore.tsx ✅

---

## Week 3: Favorites + Polish + Beta

### Sprint 3.1 — Product Detail + Favorites + Profile ✅ COMPLETE
- [x] components/ProductDetailModal.tsx (modal: image + details + Buy Now) ✅
- [x] "Buy Now" → opens productPageUrl via expo-web-browser + fires POST /api/analytics/click ✅
- [x] components/FavoriteCard.tsx (2-column grid card) ✅
- [x] app/(tabs)/favorites.tsx (2-column grid of liked products, pull-to-refresh) ✅
- [x] app/(tabs)/profile.tsx (measurements + photos + preferences + logout) ✅
- [x] components/ProfileSection.tsx (reusable section wrapper) ✅
- [x] types/profile.ts + hooks/useAnalyticsClick.ts (shared types + analytics hook) ✅
- [x] Tab bar: Explore / Favorites / Profile (NO cart tab) — verified ✅

### Sprint 3.2 — UI Polish ✅ COMPLETE
- [x] Splash screen (navy bg, SplashScreen.preventAutoHideAsync holds until fonts load) ✅
- [x] App icon placeholder (1024x1024 navy solid, generated via sharp) ✅
- [x] Skeleton loading screens (SkeletonSwipeCard for explore, SkeletonFavoriteCard 2x2 grid for favorites) ✅
- [x] Error states with retry buttons (all screens: explore, favorites, profile, generating) ✅
- [x] Empty states ("No favorites yet" + Heart icon, "All caught up!" + Refresh) ✅
- [x] Smooth onboarding transitions (contentStyle navy bg on all Stack navigators, no white flash) ✅
- [x] Image caching (expo-image default caching, transition: 200) ✅
- [x] Keyboard-aware forms (KeyboardAvoidingView on login, register, measurements) ✅
- [x] ErrorBoundary wrapping entire app (class component, branded fallback UI) ✅
- [x] app.json: userInterfaceStyle set to "dark" ✅
- [x] End-to-end walkthrough: signup → onboard → swipe → favorite → buy → profile → logout ✅
- [x] Dead code cleanup (unused statusText styles removed) ✅
- [x] TypeScript: zero type errors ✅

### Sprint 3.3 — Deploy Infrastructure + Beta Readiness
- [x] Fix shared-types package.json (main/types → dist/, add build script) ✅
- [x] Fix server package.json (prisma generate in build, db:deploy script, type: module) ✅
- [x] Fix server tsconfig.json (noEmit: false for production build) ✅
- [x] Fix server index.ts (bind 0.0.0.0, DATABASE_URL env validation, startup diagnostics) ✅
- [x] Create railway.json (Nixpacks build config, healthcheck, restart policy) ✅
- [x] Create Google Form feedback survey (4 questions: quality, swipes, weekly use, improvements) ✅
- [x] Wire feedback URL into profile.tsx (replaces placeholder) ✅
- [x] Version bump to 0.1.0 (app.json + profile footer) ✅
- [x] Server build verified: prisma generate → tsc → dist/ emitted ✅
- [x] Server boot verified: 0.0.0.0 binding, diagnostics printed, /health reachable ✅
- [x] TypeScript: zero errors across workspace ✅
- [ ] Deploy backend to Railway/Render (user: set env vars in dashboard)
- [ ] Update EXPO_PUBLIC_API_URL to deployed backend URL
- [ ] Set up Expo project on expo.dev (npx expo login)
- [ ] Test on iOS + Android via Expo Go
- [ ] Distribute to 10-20 beta testers


### Sprint 3.4 — UI Enhancements (Visual Redesign) ✅ COMPLETE
- [x] SwipeCard glow overlay — replace LIKE/NOPE text stamps with inner glow + centered icon ✅
- [x] Auth screen redesign — floating particles background, floating label inputs, form card entrance animation ✅
- [x] FloatingParticles.tsx component — animated teal dot background (20 particles, seeded random) ✅
- [x] FloatingLabelInput.tsx component — animated floating label + Eye/EyeOff password toggle ✅
- [x] Floating pill tab bar — CustomTabBar.tsx with animated pill indicator, spring physics ✅
- [x] Tab layout updated to use custom tabBar prop ✅
- [x] Glow gradient tokens added to theme constants ✅
- [x] TypeScript: zero type errors ✅

---

## Post-MVP Roadmap

### v1.1 — Cart & Affiliate Revenue (Weeks 4-5)
- [ ] Unified cart screen (liked items grouped by platform)
- [ ] Auto size selection from user profile + brand size charts
- [ ] Affiliate link integration (populate affiliate_url for all products)
- [ ] "Buy Now" switches from product_page_url to affiliate_url
- [ ] Click tracking + conversion analytics dashboard
- [ ] Apply for Amazon Associates + SHEIN Affiliate programs
- [ ] Order history / purchase tracking

### v1.2 — Smart Feed + Scale Migration (Weeks 6-7)
- [ ] Product scraping engine (Amazon + SHEIN)
- [ ] BullMQ auto-ingest pipeline
- [ ] Content-based recommendation (style matching)
- [ ] Swipe history → preference learning
- [ ] Expand catalog to 500+ products
- [ ] **Option C migration**: shared model try-ons in feed, personalize on like only
- [ ] Pre-generate outfits on 6 diverse AI models (one-time $75)

### v1.3 — Premium & Growth (Weeks 8-10)
- [ ] Freemium/Premium tier system
- [ ] Stripe subscription integration
- [ ] Social login (Google + Apple Sign-In)
- [ ] Push notifications
- [ ] Daily limits for free tier

### v1.4 — Scale & Community (Weeks 11-14)
- [ ] 3+ more platforms (Zalora, ASOS, Zalando)
- [ ] ML recommendation engine
- [ ] Size prediction model per brand
- [ ] OOTD sharing / swipe streaks
- [ ] Referral system

### v2.0 — Full Vision (Weeks 15-20)
- [ ] Headless checkout automation
- [ ] Self-hosted FASHN VTON v1.5
- [ ] Influencer tools
- [ ] Sponsored product placements
- [ ] App Store + Google Play production launch

---

## Key Metrics to Track
| Metric | Target | How |
|--------|--------|-----|
| Onboarding completion | >50% | step 1 start vs step 4 complete |
| Swipes per session | >10 | count swipe actions per session |
| Try-on success rate | >95% | TryOnResult ready / total |
| Like rate | 15-30% | right swipes / total swipes |
| Buy Now tap rate | >5% of likes | click events / like events |
| Day-3 return rate | >30% | unique users day 3 / day 1 signups |

---

## Dependencies / Blockers
| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| FASHN AI API key | [x] Done ✅ | Founder | Key obtained |
| Database (Supabase) | [x] Done ✅ | CTO | Firewall resolved |
| Redis (Upstash) | [x] Done ✅ | CTO | Upstash Redis configured |
| AWS S3 bucket | [ ] Needed | CTO | For photo + try-on storage (local fallback available) |
| Product catalog | [x] Done ✅ | CTO | 141 products (67 Amazon + 74 SHEIN) + 42 pairings in catalog.ts |
| Expo account | [ ] Needed | CTO | expo.dev signup, needed for beta |
| Domain name | [ ] Needed | Founder | kame.app or similar |
| 10-20 beta testers | [ ] Needed | Founder | Recruit by Week 3 |
| Apple Developer ($99/yr) | [ ] Needed | Founder | For App Store (not needed for beta) |
| Google Play Console ($25) | [ ] Needed | Founder | For Play Store (not needed for beta) |
