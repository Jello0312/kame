# Kame — MVP Roadmap

> 3-Week Sprint Plan | Target: Validate the swipe-to-try-on loop
> Updated: 2026-03-07

---

## Week 1: Foundation + Onboarding

### Sprint 1.1 — Project Scaffolding (Day 1–2)
- [x] Initialize pnpm monorepo (apps/mobile, apps/server, packages/shared-types)
- [x] Set up tsconfig, .eslintrc, .prettierrc in each package
- [x] Create CLAUDE.md with project conventions
- [x] Create ROADMAP.md with sprint plan
- [ ] Database schema + migrations (User, UserProfile, UserAvatar, StylePreference, Product, SwipeAction, TryOnResult)
- [ ] Seed script: 50–100 curated products with real images

### Sprint 1.2 — Authentication (Day 3–4)
- [ ] Auth endpoints: POST /auth/register, POST /auth/login (JWT), GET /auth/me
- [ ] bcrypt + jsonwebtoken + Zod validation
- [ ] Auth middleware for protected routes
- [ ] Mobile: LoginScreen + RegisterScreen
- [ ] Zustand authStore + expo-secure-store token persistence
- [ ] API client (services/api.ts) with auto-JWT headers

### Sprint 1.3 — Onboarding Wizard (Day 5–7)
- [ ] Step 1: MeasurementsScreen (height, weight, waist, body shape)
- [ ] Step 2: PhotoCaptureScreen (face + full body via expo-camera/picker)
- [ ] Step 3: StylePreferencesScreen (budget, platforms, fashion styles)
- [ ] Step 4: GeneratingScreen ("Creating your AI agent..." animation)
- [ ] Upload photos to S3, save profile data via API

---

## Week 2: Try-On + Swipe Core

### Sprint 2.1 — FASHN AI Integration (Day 8–9)
- [ ] FASHN API client (src/integrations/fashn.ts) — tryon-v1.6 endpoint
- [ ] BullMQ job: generate-tryon (user photo + garment → result)
- [ ] Try-on result storage (S3 + TryOnResults table)
- [ ] POST /api/tryon/batch — queue try-ons for product list
- [ ] Batch pre-generation after onboarding (top 30 style-matched products)

### Sprint 2.2 — Swipe Interface (Day 10–12)
- [ ] SwipeCard component (full-screen try-on image, product overlay)
- [ ] SwipeDeck with react-native-reanimated + gesture-handler
- [ ] Swipe right → save to favorites (POST /api/swipe)
- [ ] Swipe left → dismiss with animation
- [ ] 60fps spring-physics animations, haptic feedback
- [ ] Bottom action buttons (X / Heart)

### Sprint 2.3 — Product Detail + Buy (Day 13–14)
- [ ] Product detail modal (tap card to expand)
- [ ] Full try-on image, product info, sizes, platform badge
- [ ] "Buy Now" button → affiliate URL in expo-web-browser
- [ ] Feed pagination: GET /api/feed?cursor=X (auto-fetch when <3 cards)

---

## Week 3: Favorites + Polish + Beta

### Sprint 3.1 — Favorites + Profile + Tabs (Day 15–16)
- [ ] Favorites tab: grid of liked items with try-on thumbnails
- [ ] Profile tab: view/edit measurements, photos, preferences
- [ ] Tab navigation: Explore | Favorites | Profile (with icons)

### Sprint 3.2 — UI Polish (Day 17–18)
- [ ] Skeleton loading screens for swipe deck
- [ ] Error states with retry buttons
- [ ] Empty state for favorites
- [ ] Onboarding step transitions + animations
- [ ] Splash screen with Kame logo
- [ ] Image caching (expo-image)
- [ ] Fix any TypeScript errors

### Sprint 3.3 — Beta Launch (Day 19–21)
- [ ] End-to-end testing of full user journey
- [ ] Bug fixing from internal testing
- [ ] Deploy backend to Railway/Render
- [ ] Distribute beta via Expo Go to 10–20 testers
- [ ] Collect feedback: swipe engagement, try-on quality, retention

---

## Post-MVP Roadmap

| Release | Timeline | Theme | Key Features |
|---------|----------|-------|-------------|
| v1.1 | Weeks 4–5 | Cart & Checkout | Unified cart, auto size selection, affiliate checkout, order history |
| v1.2 | Weeks 6–7 | Smart Feed | Product scraping (Amazon + SHEIN), auto-ingest, content-based recs |
| v1.3 | Weeks 8–10 | Premium & Growth | Freemium/Premium tiers, Stripe, social login, push notifications |
| v1.4 | Weeks 11–14 | Scale & Community | 3+ platforms, ML recs, size prediction, OOTD sharing, referrals |
| v2.0 | Weeks 15–20 | Full Vision | Headless checkout, self-hosted VTON, influencer tools, app store launch |

---

## MVP Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Onboarding completion | >50% | Validates flow isn't too long |
| Swipes per session | >10 | Core engagement — is swiping fun? |
| Try-on quality rating | >3.5/5 | Are try-on images realistic enough? |
| Like rate (right swipes) | 15–30% | Recommendation quality check |
| Buy Now tap rate | >5% of likes | Purchase intent validation |
| Day-3 return rate | >30% | The hook works |
| NPS from beta testers | >40 | Would they recommend? |
