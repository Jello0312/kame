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
| Cache/Queue | Redis + BullMQ | Upstash hosting; async try-on jobs |
| AI Try-On | FASHN AI API v1.6 (direct, not fal.ai) | REST API; ~$0.075/image |
| Storage | AWS S3 or Cloudflare R2 | User photos + try-on results |
| State Mgmt | Zustand | Lightweight, TypeScript-first |
| Data Fetching | TanStack React Query | Caching, offline, loading states |
| Styling | NativeWind (Tailwind for RN) | Utility-first |
| Animations | react-native-reanimated + gesture-handler | 60fps swipe cards |
| Auth | JWT (bcrypt + jsonwebtoken) | Email/password for MVP |
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
│       │   ├── middleware/       # auth.ts, validate.ts
│       │   ├── services/        # Business logic (AuthService, FeedService, TryOnService, ProfileService)
│       │   ├── jobs/            # BullMQ workers (generateTryOn.ts)
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
- Try-on generation is ALWAYS async via BullMQ. Never block the request.
- Flow: POST /api/tryon/batch → queue jobs → client polls GET /api/tryon/status/:id

### Separation of Concerns
- Route handlers are thin: validate → call service → return response.
- Business logic lives in services/ — NEVER in route handlers.
- Database access ONLY through Prisma in services layer.
- External API calls ONLY in integrations/ — services call integrations, never routes.

### Error Handling
- Custom error classes: AppError, NotFoundError, AuthError, ValidationError.
- Global error middleware catches all, formats response, never exposes stack traces in production.

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
- Brand colors in utils/colors.ts and tailwind.config.js:
  - Navy (primary): #1A2B3D
  - Teal (accent): #00BFA5
  - Coral (CTA): #FF4D6A
  - Gray (secondary): #6B7280

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
REDIS_URL=redis://...
JWT_SECRET=<random-32-char-string>
FASHN_API_KEY=<from-fashn.ai-settings>
AWS_ACCESS_KEY_ID=<s3-key>
AWS_SECRET_ACCESS_KEY=<s3-secret>
AWS_S3_BUCKET=kame-uploads
AWS_REGION=us-east-1

# Mobile
EXPO_PUBLIC_API_URL=https://<your-railway-url>.railway.app
```

---

## FASHN AI Integration

- **Use FASHN direct API** (not fal.ai hosted)
- **SDK**: fashn-typescript-sdk (npm) or raw REST calls
- **Endpoint**: tryon-v1.6
- **Inputs**: model_image (user body photo) + garment_image (product image) — URLs or base64
- **Parameters**: category ("tops"|"bottoms"|"one-pieces"), garment_photo_type ("auto"|"model"|"flat-lay"), mode ("performance"|"balanced"|"quality")
- **MVP default**: mode="balanced" (~10 seconds, good quality/speed tradeoff)
- **Output**: image URL hosted by FASHN for 72h — download and re-upload to our S3 for persistence
- **Error handling**: retry failed try-ons up to 3 times, then mark as failed

### Try-On Pre-Generation Strategy
After onboarding, trigger batch try-on for top ~30 products matching user preferences. Store results in S3. Feed serves pre-generated images. If user reaches a product without a pre-generated try-on, show product image with "Generating..." state and generate on-demand.

---

## Database Schema (Key Models)

**User**: id, email, password_hash, name, subscription_tier (free|premium), created_at, updated_at

**UserProfile**: user_id (FK unique), height_cm, weight_kg, waist_cm, body_shape (athletic|curvy|slim|average), measurement_unit (metric|imperial)

**UserAvatar**: user_id (FK unique), face_photo_url, body_photo_url, status (processing|ready|failed), created_at

**StylePreference**: user_id (FK unique), budget_range, fashion_styles (text[]), preferred_platforms (text[])

**Product**: id, external_id, platform, name, brand, price, currency, image_urls (text[]), product_page_url, affiliate_url (nullable — future use), category, fashn_category (tops|bottoms|one-pieces), available_sizes (text[]), style_tags (text[]), gender (M|W|U), created_at

**TryOnResult**: id, user_id (FK), product_id (FK), result_image_url, status (queued|processing|ready|failed), created_at

**SwipeAction**: id, user_id (FK), product_id (FK), action (like|dislike), created_at

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

### Quick Reference — The 6 Rules

1. **DARK-FIRST**: Navy `#112836` is the primary background everywhere. White surfaces only inside form cards and modals.

2. **TWO ACCENT COLORS**: Teal bright `#48E6CD` for interactive elements (buttons, selected chips, links, active states). Coral `#FA6869` for prices and the CTA gradient.

3. **FONT**: Plus Jakarta Sans everywhere. Files in `assets/fonts/`. Load via expo-font in `_layout.tsx`. Never use system fonts, Inter, or Roboto.

4. **BUTTONS — TWO CTA TIERS**: 
   - Commerce CTAs (Buy Now, Checkout, Generate Styles) = coral gradient (`#CC4968` → `#FA6869`, 135deg)
   - Navigation CTAs (Next, Save, Login, Register, Continue) = teal bright `#48E6CD` solid
   - Both fully rounded (borderRadius 26px). Swipe like = green `#289B62` circle. Swipe dislike = red `#E3393C` circle.

5. **PRICES ALWAYS CORAL**: Every price tag in the app uses `#FA6869` bold. No exceptions.

6. **TAB BAR = CORAL, IN-SCREEN = TEAL**: Active tab icons/labels use coral `#FA6869`. All other interactive elements inside screens (buttons, links, selected chips, toggles, focus borders) use teal bright `#48E6CD`. This separation makes navigation vs content visually distinct.

7. **LOGO = ALL TEAL**: Render "Kame" as a single teal-bright `#48E6CD` BoldItalic text. Not split colors.

### Color Tokens (import from `src/theme/constants.ts`)
```
navy=#112836  navyDeep=#03213B  teal=#1AA39C  tealBright=#48E6CD
coral=#FA6869  coralDeep=#CC4968  gold=#F7C13D  green=#289B62  
red=#E3393C  purple=#744DA6  white=#FFFFFF  gray100=#F8F9FB
gray200=#E5E7EB  gray400=#9CA3AF  gray500=#6B7280  gray700=#374151
```

### Component Patterns
- **Chips**: Unselected = transparent + gray border. Selected = teal bright bg + navy text.
- **Inputs**: gray-100 bg, gray-200 border, teal-bright focus border, 12px radius.
- **Tab bar**: White bg, coral active icon+label, gray-400 inactive. 3 tabs only: Explore/Favorites/Profile.
- **Platform badges**: Amazon = orange `#FF9900` bg. SHEIN = black bg. White text, rounded 8px.
- **Premium banner**: Purple gradient `#744DA6→#9B6BC7`, 16px radius.

### Files to Create (Sprint 2 setup)
1. `apps/mobile/src/theme/constants.ts` — All color, font, spacing, radius tokens
2. `apps/mobile/assets/fonts/` — Plus Jakarta Sans .ttf files (5 weights)
3. Update `tailwind.config.js` — Add Kame color/font tokens to NativeWind
4. Update `app/_layout.tsx` — Load fonts via expo-font before rendering

