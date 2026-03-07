# Kame — Development Roadmap

> Last updated: 2026-03-08
> Current phase: **MVP Sprint (Weeks 1-3)**

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

### Sprint 1.1 — Project Scaffolding (Day 1-2) ✅
- [x] Initialize pnpm monorepo workspace
- [x] Create apps/mobile with Expo SDK 54 + expo-router + TypeScript
- [x] Create apps/server with Express + TypeScript
- [x] Create packages/shared-types
- [x] Set up tsconfig.base.json + per-package tsconfig
- [ ] Set up ESLint + Prettier shared config
- [ ] Configure NativeWind (Tailwind) in mobile app
- [x] Create .env.example with all required variables
- [x] Verify `pnpm dev` starts both apps

### Sprint 1.1b — Database + Seed Data (Day 2) ✅
- [x] Set up Prisma in apps/server
- [x] Create full schema (User, UserProfile, UserAvatar, StylePreference, Product, TryOnResult, SwipeAction)
- [x] Add OutfitPairing model, gender on UserProfile, outfit context on TryOnResult/SwipeAction
- [x] Add Platform enum values (ZALORA, ZALANDO, TAOBAO, ASOS)
- [x] Push schema to Supabase DB via GitHub Actions (`prisma db push`)
- [x] Rewrite seed.ts with 84 real Amazon/SHEIN products + 32 outfit pairings
- [x] Verify `pnpm db:seed` populates database (via GitHub Actions)
- [x] Set up GitHub Actions CI workflow for DB migrate & seed
- [ ] Set up Prisma Studio for debugging (`pnpm db:studio`)

### Sprint 1.2 — Authentication (Day 3-4)
- [ ] Backend: POST /auth/register (email + password, Zod validation, bcrypt)
- [ ] Backend: POST /auth/login (returns JWT access token)
- [ ] Backend: GET /auth/me (returns current user from token)
- [ ] Backend: Auth middleware (JWT verification on protected routes)
- [ ] Mobile: LoginScreen (email + password form)
- [ ] Mobile: RegisterScreen (email + password + name)
- [ ] Mobile: authStore.ts (Zustand + expo-secure-store for token)
- [ ] Mobile: services/api.ts (fetch wrapper with auto-JWT headers)
- [ ] Mobile: Auth flow routing (logged out → auth, logged in → tabs)

### Sprint 1.3 — Onboarding Wizard (Day 5-7)
- [ ] Backend: POST /api/profile (save measurements)
- [ ] Backend: POST /api/avatar (upload face + body photos to S3)
- [ ] Backend: POST /api/preferences (save style preferences)
- [ ] Mobile: MeasurementsScreen (height, weight, waist, body shape, metric/imperial toggle)
- [ ] Mobile: PhotoCaptureScreen (expo-camera face + body with framing guides, gallery fallback)
- [ ] Mobile: StylePreferencesScreen (budget chips, platform chips, style chips)
- [ ] Mobile: GeneratingScreen (animated loading while uploading + saving)
- [ ] Mobile: Onboarding navigation flow (1→2→3→4→tabs)
- [ ] S3 integration: upload user photos, store URLs in UserAvatar
- [ ] Trigger batch try-on generation after onboarding completes

---

## Week 2: Try-On + Swipe Core

### Sprint 2.1 — FASHN AI Integration (Day 8-9)
- [ ] Create src/integrations/fashn.ts (FASHN API client)
- [ ] Install fashn-typescript-sdk (or raw REST client)
- [ ] Implement: sendTryOnRequest(personImageUrl, garmentImageUrl, category) → resultImageUrl
- [ ] Create BullMQ job: generateTryOn (fetches images, calls FASHN, uploads result to S3)
- [ ] Create POST /api/tryon/batch (queues try-on jobs for list of products)
- [ ] Create GET /api/tryon/status/:id (returns status + result URL)
- [ ] Handle FASHN result: download from FASHN CDN → re-upload to our S3 for persistence
- [ ] Error handling: retry failed try-ons, mark as failed after 3 attempts
- [ ] Test with real user photo + real product image → verify quality

### Sprint 2.2 — Swipe Deck UI (Day 10-12)
- [ ] Create SwipeCard.tsx (full-screen card: try-on image background, product info overlay)
- [ ] Create SwipeDeck.tsx (stack of 3-5 cards, renders top card interactable)
- [ ] Implement pan gesture (react-native-gesture-handler)
- [ ] Implement swipe animations (react-native-reanimated, spring physics)
- [ ] Swipe right (>120px): like animation → POST /api/swipe {action: "like"}
- [ ] Swipe left (<-120px): dislike animation → POST /api/swipe {action: "dislike"}
- [ ] Bottom action buttons: X (dislike), Heart (like) — trigger same logic as swipe
- [ ] Card stack: when top card swiped, next card animates up
- [ ] Haptic feedback on swipe threshold
- [ ] Backend: POST /api/swipe (save SwipeAction)
- [ ] Backend: GET /api/feed?cursor=X (return next batch of products with try-on URLs)

### Sprint 2.3 — Product Detail + Buy Now (Day 13-14)
- [ ] Create ProductDetail modal (tap card to expand)
- [ ] Show: large try-on image, product name, brand, price, platform badge, available sizes
- [ ] "Buy Now" button → opens product_page_url in expo-web-browser (WebView)
- [ ] Backend: POST /api/analytics/click (log click: user_id, product_id, timestamp, platform)
- [ ] Feed pagination: auto-fetch next batch when deck has <3 cards
- [ ] Handle "no more products" state gracefully
- [ ] Loading state: show skeleton card while try-on images load

---

## Week 3: Favorites + Polish + Beta

### Sprint 3.1 — Favorites + Profile + Navigation (Day 15-16)
- [ ] Create (tabs)/favorites.tsx (grid view of liked items)
- [ ] Each favorite: try-on thumbnail, product name, price, "Buy Now" link
- [ ] Tap favorite → open ProductDetail modal
- [ ] Create (tabs)/profile.tsx (view/edit profile)
- [ ] Profile: display measurements, uploaded photos, style preferences
- [ ] Edit mode: allow changing preferences (triggers new try-on batch)
- [ ] Tab bar: Explore (compass icon), Favorites (heart icon), Profile (person icon)
- [ ] Tab bar styling: match Kame brand (navy background, teal active indicator)

### Sprint 3.2 — UI Polish (Day 17-18)
- [ ] Splash screen with Kame logo
- [ ] App icon (use placeholder design)
- [ ] Loading skeleton screens for swipe deck
- [ ] Error states with retry buttons
- [ ] Empty states: "No favorites yet — start swiping!", "All caught up! Check back later"
- [ ] Smooth transitions between onboarding steps
- [ ] Image caching with expo-image
- [ ] Pull-to-refresh on favorites
- [ ] Keyboard-aware views on auth/onboarding forms

### Sprint 3.3 — Testing + Beta Deploy (Day 19-21)
- [ ] End-to-end test: signup → onboarding → swipe → favorite → buy now
- [ ] Fix critical bugs from internal testing
- [ ] Deploy backend to Railway/Render
- [ ] Configure production environment variables
- [ ] Set up Expo project on expo.dev
- [ ] Test on iOS + Android via Expo Go
- [ ] Distribute to 10-20 beta testers
- [ ] Set up feedback collection (Google Form or Typeform link in app)
- [ ] Monitor: server logs, FASHN API usage, error rates

---

## Post-MVP Roadmap

### v1.1 — Cart & Checkout (Weeks 4-5)
- [ ] Unified cart screen (liked items grouped by platform)
- [ ] Auto size selection from user profile + brand size charts
- [ ] Affiliate link integration (populate affiliate_url for all products)
- [ ] "Buy Now" switches from product_page_url to affiliate_url
- [ ] Click tracking + conversion analytics dashboard
- [ ] Apply for Amazon Associates + SHEIN Affiliate programs
- [ ] Order history / purchase tracking

### v1.2 — Smart Feed (Weeks 6-7)
- [ ] Product scraping engine (Amazon + SHEIN)
- [ ] BullMQ auto-ingest pipeline (scheduled scraping)
- [ ] Content-based recommendation (style preference matching)
- [ ] Swipe history → preference learning (weight liked styles higher)
- [ ] Expand catalog to 500+ products

### v1.3 — Premium & Growth (Weeks 8-10)
- [ ] Freemium/Premium tier system
- [ ] Stripe subscription integration
- [ ] Social login (Google + Apple Sign-In)
- [ ] Push notifications (new recommendations daily)
- [ ] Daily limits: 5 try-ons/day + 30 swipes/day for free tier
- [ ] Premium upgrade screen with paywall

### v1.4 — Scale & Community (Weeks 11-14)
- [ ] 3+ more platforms (Zalora, ASOS, Zalando)
- [ ] ML recommendation engine (collaborative filtering)
- [ ] Size prediction model per brand
- [ ] OOTD sharing / swipe streaks gamification
- [ ] Referral system

### v2.0 — Full Vision (Weeks 15-20)
- [ ] Headless checkout automation (Playwright)
- [ ] Self-hosted FASHN VTON v1.5 (cost reduction)
- [ ] Influencer tools (try-on image download for premium)
- [ ] Sponsored product placements (ad revenue)
- [ ] App Store + Google Play production launch

---

## Key Metrics to Track
| Metric | Target | How |
|--------|--------|-----|
| Onboarding completion | >50% | Analytics: step 1 start vs step 4 complete |
| Swipes per session | >10 | Backend: count swipe actions per session |
| Try-on success rate | >95% | Backend: TryOnResult status=ready / total |
| Like rate | 15-30% | Backend: right swipes / total swipes |
| Buy Now tap rate | >5% of likes | Backend: click events / like events |
| Day-3 return rate | >30% | Analytics: unique users day 3 / day 1 signups |

---

## Dependencies / Blockers
| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| FASHN AI API key | [ ] Needed | Founder | Sign up at fashn.ai |
| AWS S3 bucket | [ ] Needed | CTO | Create bucket + IAM credentials |
| PostgreSQL URL | [ ] Needed | CTO | Supabase or Neon free tier |
| Redis URL | [ ] Needed | CTO | Upstash free tier |
| Product catalog (100 items) | [ ] In progress | CTO | Curating from SHEIN + Amazon |
| Expo account | [ ] Needed | CTO | expo.dev signup |
| Domain name | [ ] Needed | Founder | kame.app or similar |
| 10-20 beta testers | [ ] Needed | Founder | Recruit by Week 3 |
