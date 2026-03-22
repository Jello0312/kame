# Kame — AI Fashion Shopping App

> "See It, Swipe It, Own It"

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Demand Elegance**: For non-trivial changes, pause and ask "is there a more elegant way?" If a fix feels hacky: "Knowing everything I know now, implement the elegant solution." Skip this for simple, obvious fixes — don't over-engineer. Challenge your own work before presenting it.

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections
7. **Update Roadmap**: Mark ROADMAP.md checkboxes as tasks complete

### Progress Convention
```
- [ ] Todo
- [-] In Progress 🏗️
- [x] Completed ✅
- [!] Blocked ⚠️
```

---

## Project Overview

Kame is a mobile-first fashion shopping app where users create a personal avatar from their photos, swipe through outfits visualized on their body via AI virtual try-on, and purchase items from multiple retailers.

**Current Phase:** MVP (3-week sprint)
**Goal:** Validate the core swipe-to-try-on loop with 10-20 beta testers.
**Roadmap:** See ROADMAP.md for full sprint breakdown with checkable tasks.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Mobile | React Native + Expo SDK 54 | expo-router for navigation |
| Backend | Node.js + Express + TypeScript | Single server for MVP |
| Database | PostgreSQL via Prisma ORM | Supabase/Neon hosting |
| Job Processing | In-memory queue | No external dependency; add Redis at 10K+ users |
| AI Try-On | FASHN AI API v1.6 (direct, not fal.ai) | REST API; ~$0.075/image |
| Storage | Cloudflare R2 | User photos + try-on results |
| State Mgmt | Zustand | Lightweight, TypeScript-first |
| Data Fetching | TanStack React Query | Caching, offline, loading states |
| Styling | NativeWind (Tailwind for RN) | Utility-first |
| Animations | react-native-reanimated + gesture-handler | 60fps swipe cards |
| Auth | JWT (bcrypt + jsonwebtoken) | Email/password for MVP |
| Security | helmet + cors + express-rate-limit | Headers, CORS, rate limiting |
| Hosting | Railway or Render | ~$20/mo for MVP |

---

## Monorepo Structure

```
kame/
├── apps/
│   ├── mobile/                  # React Native + Expo
│   │   ├── app/                 # expo-router file-based routes
│   │   │   ├── (tabs)/          # Tab navigator
│   │   │   │   ├── explore.tsx  # Swipe deck (main screen)
│   │   │   │   ├── favorites.tsx# Liked items grid
│   │   │   │   └── profile.tsx  # User profile & settings
│   │   │   ├── auth/            # Login, register
│   │   │   ├── onboarding/      # 4-step wizard
│   │   │   └── _layout.tsx      # Root layout
│   │   ├── components/          # Reusable UI
│   │   │   ├── SwipeCard.tsx
│   │   │   ├── SwipeDeck.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   └── ui/              # Buttons, chips, inputs
│   │   ├── hooks/               # useAuth, useSwipe, useTryOn
│   │   ├── stores/              # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── feedStore.ts
│   │   │   └── profileStore.ts
│   │   ├── services/            # API client layer
│   │   │   └── api.ts           # Fetch wrapper with JWT
│   │   ├── utils/               # Helpers, constants
│   │   │   ├── colors.ts        # Brand color tokens
│   │   │   └── types.ts         # Frontend types
│   │   └── assets/              # Images, fonts
│   │
│   └── server/                  # Express backend
│       ├── src/
│       │   ├── index.ts         # Server entry
│       │   ├── routes/          # auth, profile, products, feed, swipe, tryon
│       │   ├── middleware/       # auth.ts, validate.ts, rateLimiter.ts
│       │   ├── services/        # Business logic (AuthService, FeedService, TryOnService, ProfileService)
│       │   ├── jobs/            # Async job handlers (generateTryOn.ts)
│       │   ├── integrations/    # fashn.ts, s3.ts
│       │   └── utils/           # errors.ts
│       ├── prisma/              # schema.prisma, migrations/, seed.ts
│       └── tsconfig.json
│
├── packages/
│   └── shared-types/            # TypeScript interfaces shared across apps
│
├── tasks/                       # Task management (Boris workflow)
│   ├── todo.md                  # Current sprint plan with checkboxes
│   └── lessons.md               # Self-improvement rules from corrections
│
├── CLAUDE.md                    # THIS FILE
├── ROADMAP.md                   # Sprint progress tracker
├── package.json                 # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

---

## Architecture Rules

### API Response Format
Every endpoint returns:
```typescript
{ success: boolean; data?: T; error?: string; message?: string; }
```

### Request Validation
- Every route uses Zod schemas for request body/params/query validation.
- Validation middleware wraps Zod and returns 400 with error details.

### Async Processing
- Try-on generation is async via in-memory job processor. Never block the request.
- Flow: POST /api/tryon/batch → queue jobs → client polls GET /api/tryon/status/:id

### Separation of Concerns
- Route handlers are thin: validate → call service → return response.
- Business logic lives in services/ — NEVER in route handlers.
- Database access ONLY through Prisma in services layer.
- External API calls ONLY in integrations/ — services call integrations, never routes.

### Error Handling
- Custom error classes: AppError, NotFoundError, AuthError, ValidationError.
- Global error middleware catches all, formats response, never exposes stack traces in production.

### Rate Limiting
- 4 tiered rate limiters in `src/middleware/rateLimiter.ts`:
  - Auth: 5 req/15min (login, register) — `skipSuccessfulRequests: true`
  - Upload: 10 req/15min (avatar, tryon)
  - Write: 30 req/15min (swipe, profile, preferences)
  - General: 100 req/15min (all other routes)
- Applied BEFORE routes in index.ts. Specific limiters override the general catch-all.
- Returns `{ success: false, error: 'Too many requests...' }` with 429 status.

### Security Headers
- `helmet` middleware adds 12+ security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
- CORS configured: permissive in development, restricted via `ALLOWED_ORIGIN` in production.

### Authentication
- JWT in `Authorization: Bearer <token>` header.
- Auth middleware on all routes except POST /auth/register and POST /auth/login.
- Tokens stored client-side in expo-secure-store.

---

## Coding Standards

### TypeScript
- Strict mode everywhere. No `any`. Use `unknown` + type guards when needed.
- Prefer interfaces over type aliases for object shapes.
- All shared types exported from packages/shared-types.

### React Native
- Functional components only. No class components.
- All side effects in hooks (useEffect, custom hooks).
- Named exports: `export function SwipeCard()` not `export default`.
- Error boundaries on every screen.
- All API calls through TanStack React Query with loading/error/success states.

### Styling
- NativeWind (Tailwind classes) for all styling. No inline style objects unless necessary.
- Brand colors defined in `src/theme/constants.ts` — import from there, never hardcode hex values:
  - Primary background: #F5F0E8 (warmWhite)
  - Teal (text, buttons, interactive): #48E6CD
  - Coral (prices, commerce CTAs): #FA6869
  - Gray (secondary text): #6B7280

### Naming
- Files: PascalCase components, camelCase utilities.
- Variables: camelCase. Constants: UPPER_SNAKE_CASE.
- DB columns: snake_case (Prisma maps automatically).
- API routes: kebab-case (/api/try-on/batch).

### State Management
- Zustand for client-side state (auth, UI preferences).
- React Query for all server state (products, feed, try-ons).
- Never duplicate server state in Zustand.

### Testing
- Jest + React Native Testing Library. Test files co-located: `Component.test.tsx`.
- Services layer: minimum 80% coverage.
- Before marking any feature complete: run tests, verify manually.

---

## Key Commands
```bash
pnpm dev              # Start all apps
pnpm dev:mobile       # Expo dev server only
pnpm dev:server       # Express server only
pnpm test             # Run all tests
pnpm lint             # ESLint all packages
pnpm typecheck        # TypeScript check all packages
pnpm db:migrate       # Prisma migrations
pnpm db:seed          # Seed product catalog
pnpm db:studio        # Prisma Studio
```

---

## Infrastructure

- **RAILWAY_DEPLOYED = true** — The backend is deployed on Railway.
- **API_BASE_URL**: always use `process.env.EXPO_PUBLIC_API_URL` (set in `apps/mobile/.env`).
- **Never use ngrok, localtunnel, or any tunnel.**
- **Never hardcode localhost in mobile API config.**
- Beta testing: `npx expo start` — testers scan QR code with Expo Go.
- **Windows Terminal (PowerShell)**: Does NOT support `&&` chaining. Always provide commands one-per-line when targeting Windows users.

### Beta Testing Setup (Windows — other laptop)
Run these commands one at a time in Windows Terminal/PowerShell:
```
cd ~\Desktop\Claude\KAME
git pull
cd apps\mobile
npx expo start --clear
```
**Important**: `--clear` is required after any env var or code changes to bust Metro cache.

---

## Environment Variables
```
# Server
DATABASE_URL=postgresql://...
JWT_SECRET=<random-32-char-string>
FASHN_API_KEY=<from-fashn.ai-settings>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET=kame-uploads
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Mobile
EXPO_PUBLIC_API_URL=https://<your-railway-url>.railway.app
```

---

## FASHN AI Integration

- **Use FASHN direct API** (not fal.ai hosted)
- **SDK**: fashn npm SDK for tryon-v1.6; raw REST fetch for product-to-model & model-swap (SDK types outdated for newer endpoints)
- **Endpoints**: tryon-v1.6 (legacy), product-to-model (base generation), model-swap (per-user face swap)
- **Inputs**:
  - tryon-v1.6: model_image (user body photo) + garment_image (product image)
  - product-to-model: product_image + prompt + aspect_ratio (phase 1)
  - model-swap: model_image (base product photo) + face_reference (user face photo) (phase 2)
- **Base image prompt**: "full body shot, standing, in a daily life setting background (e.g., street, office, cafe)"
- **Aspect ratio**: 3:4 for all base images
- **Output**: image URL hosted by FASHN for 72h — download and re-upload to our S3 for persistence
- **Error handling**: retry failed calls up to 3 times with linear backoff, then mark as failed
- **Raw API pattern**: POST `https://api.fashn.ai/v1/run` → get `{ id }` → poll `GET /v1/status/{id}` until completed/failed

### Try-On Pre-Generation Strategy
Phase 1 (one-time admin): Run `generate-base-images.ts` to create professional model photos
for all 141 products using product-to-model endpoint. Stored in BaseProductImage table.
Phase 2 (per-user): After onboarding, run model-swap on 10 products using user's face photo.
Each model-swap + face_reference = 5 FASHN credits ($0.375/image, 50 credits/session).
User can refresh every 15 mins for next batch of 10. Results stored in TryOnResult.
Feed serves from TryOnResult (prioritized first), falls back to product image.

---

## Database Schema (Key Models)

**User**: id, email, password_hash, name, subscription_tier (free|premium), created_at, updated_at

**UserProfile**: user_id (FK unique), height_cm, weight_kg, waist_cm, body_shape (athletic|curvy|slim|average), measurement_unit (metric|imperial)

**UserAvatar**: user_id (FK unique), face_photo_url, body_photo_url, status (processing|ready|failed), created_at

**StylePreference**: user_id (FK unique), budget_range, fashion_styles (text[]), preferred_platforms (text[])

**Product**: id, external_id, platform, name, brand, price, currency, image_urls (text[]), product_page_url, affiliate_url (nullable — future use), category, fashn_category (tops|bottoms|one-pieces), available_sizes (text[]), style_tags (text[]), gender (M|W|U), created_at

**TryOnResult**: id, user_id (FK), product_id (FK), result_image_url, status (queued|processing|ready|failed), created_at

**SwipeAction**: id, user_id (FK), product_id (FK), action (like|dislike), created_at

**BaseProductImage**: id, product_id (FK unique), image_url, prompt, status (PENDING|COMPLETED|FAILED), created_at

---

## Design Decisions to Remember

### Affiliate Links — Future-Ready
Product model includes `affiliate_url` (nullable). MVP uses `product_page_url` for "Buy Now" links. When we add affiliates later, populate `affiliate_url` and switch frontend target. Build `POST /api/analytics/click` from day 1 to log every "Buy Now" tap — valuable data even without affiliate attribution.

### Feed Algorithm (MVP)
Simple: filter by user's preferred styles + gender, exclude already-swiped products, order by recency. No ML. Recommendation engine comes in v1.2.

---

## MVP Scope Guard — What NOT To Build
- ❌ Social login (Google/Apple) — email/password only
- ❌ Multi-platform product scraping — curated catalog only
- ❌ ML recommendation engine — simple filter/sort only
- ❌ Unified cart / cross-platform checkout — favorites + "Buy Now" link only
- ❌ Premium subscription / Stripe — all features free in beta
- ❌ Push notifications — not needed for 10-20 beta users
- ❌ Community features / social sharing — post-MVP
- ❌ Size prediction ML — manual size display only
- ❌ Affiliate link integration — deferred to v1.1, foundation only

---
# KAME BRAND INSTRUCTIONS FOR CLAUDE CODE
## Add this entire section to CLAUDE.md in the project root

---

## Brand Design System (READ BEFORE ANY UI WORK)

Full brand spec is at: `docs/BRAND_SYSTEM.md` — READ IT before building any screen.
Synced from official Kame Brand Kit — Production Guide (PDF, March 21, 2026).

### Quick Reference — The 8 Rules

1. **WARM WHITE FIRST**: `#F5F0E8` (warmWhite / bone) is the primary background everywhere. White `#FFFFFF` surfaces inside cards and modals. No navy.

2. **TEAL = BRAND + INTERACTIVE**: `#48E6CD` is the ONLY teal. For the wordmark, buttons, selected chips, links, active states, and primary text accents. **`#1AA39C` is RETIRED — do not use.**

3. **CORAL = COMMERCE + PRICES**: Coral `#FA6869` for every price tag and commerce CTAs (Buy Now, Checkout). Active tab icons also use coral to distinguish navigation from content.

4. **FONT**: Plus Jakarta Sans everywhere (6 weights: Regular, Medium, SemiBold, Bold, BoldItalic, ExtraBold). Files in `assets/fonts/`. Load via expo-font in `_layout.tsx`. Never use system fonts, Inter, or Roboto.

5. **BUTTONS — TWO CTA TIERS**:
   - Commerce CTAs (Buy Now, Checkout, Generate Styles) = coral solid `#FA6869`, bone text `#F5F0E8`
   - Navigation CTAs (Next, Save, Login, Register, Continue) = teal `#48E6CD` solid, bone text
   - Both fully rounded (borderRadius 26px). Swipe like = green `#289B62` circle. Swipe dislike = red `#E3393C` circle.

6. **PRICES ALWAYS CORAL**: Every price tag in the app uses `#FA6869` bold. No exceptions.

7. **LOGO = OFFICIAL ASSET**: Use the `<KameLogo>` component — "Kame" in teal BoldItalic + "FASHION AI" in SemiBold teal @ 50% opacity below. Do not rebuild from scratch.

8. **KAME SIGNATURE DIVIDER**: Double-line divider (teal bar + coral accent, 4px gap). Never use a single line divider.

### Color Tokens (import from `src/theme/constants.ts`)
```
warmWhite=#F5F0E8  tealBright=#48E6CD  body=#5A5A58  bodyLight=#7A7A78
coral=#FA6869  coralDeep=#CC4968  gold=#F7C13D  green=#289B62
red=#E3393C  purple=#744DA6  white=#FFFFFF  gray100=#F8F9FB
gray200=#E5E7EB  gray400=#9CA3AF  gray500=#6B7280  gray700=#374151
```
> **Retired**: `teal=#1AA39C` — kept as `@deprecated` in constants.ts for backward compat only.

### Component Patterns
- **Chips (3 variants)**: `tag-teal` = teal bg + bone text. `tag-coral` = coral bg + bone text. `tag-ghost` = teal tint bg + teal text. All: 14px radius, 9px uppercase bold, no borders.
- **Inputs**: gray-100 bg, gray-200 border, teal focus border, 12px radius.
- **Tab bar**: White bg, coral active icon+label, gray-400 inactive. 3 tabs only: Explore/Favorites/Profile.
- **Platform badges**: Amazon = orange `#FF9900` bg. SHEIN = black bg. White text, rounded 8px.
- **Premium banner**: Purple gradient `#744DA6→#9B6BC7`, 16px radius.
- **Step numbers**: Teal circle (01-02), coral circle (03), 32px, ExtraBold.
- **Icon circles**: 34px, teal/coral tint backgrounds, 15px stroke icons.

