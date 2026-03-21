# Kame — Claude Code Implementation Guide v5 (FINAL)
## With Sub-Agent Strategy + Brand Design System

> Last Updated: 2026-03-10
> Done: Sprint 1.1 (scaffolding) ✅ + Sprint 1.1b (schema + seed.ts) ✅
> NOT done: Sprint 1.2 onwards — start with Step 1 below
> Sub-agents: Used in Steps 4, 5, 6, 7 for faster, cleaner builds
> Brand system: docs/BRAND_SYSTEM.md + apps/mobile/src/theme/constants.ts

---

## HOW TO USE THIS GUIDE

1. **One step per Claude Code session.** Clear context between sessions.
2. **Start every session with:** `Read CLAUDE.md, ROADMAP.md, and tasks/todo.md.`
3. **Frontend sessions also start with:** `Read docs/BRAND_SYSTEM.md.`
4. **Every prompt ends with "Plan first."** Review the plan before saying "Go ahead."
5. **After each step:** tell Claude Code to update ROADMAP.md and tasks/todo.md.
6. **Sub-agent steps (4-7):** you paste ONE prompt, the main agent delegates internally. You just watch and review.
7. **If Claude Code suggests cart, affiliate links, social login — say NO.**

---

## BRAND DESIGN SYSTEM (Steps 6-9 MUST follow these)

Full spec: `docs/BRAND_SYSTEM.md` | Tokens: `apps/mobile/src/theme/constants.ts`

**The 7 Rules:**
1. **WARM-WHITE-FIRST**: WarmWhite `#F5F0E8` background everywhere. White only inside cards/modals. Teal `#48E6CD` for text and buttons.
2. **TWO ACCENT COLORS**: Teal bright `#48E6CD` for interactive in-screen elements. Coral `#FA6869` for prices.
3. **FONT**: Plus Jakarta Sans everywhere. Loaded from `assets/fonts/`. Never system fonts.
4. **BUTTONS — TWO CTA TIERS**: Commerce CTAs (Buy Now, Checkout) = coral gradient. Navigation CTAs (Next, Save, Login) = teal solid.
5. **PRICES ALWAYS CORAL**: Every price uses `#FA6869` bold.
6. **TAB BAR = CORAL, IN-SCREEN = TEAL**: Active tabs use coral. All other interactive elements use teal.
7. **LOGO = ALL TEAL**: "Kame" = `#48E6CD` BoldItalic.

**Import tokens from:** `import { COLORS, GRADIENTS, FONTS, TYPE, SPACING, RADIUS, SHADOWS } from '@/src/theme/constants'`

---

## 11 STEPS TO BETA LAUNCH

---

### STEP 1: Run Migration + Seed + Validate Images
**Sprint:** 1.2 | **Type:** Database | **Time:** ~15 min | **Sub-agents:** No

```
Read CLAUDE.md and ROADMAP.md.

Database is now reachable. Run these operations:

1. Apply all pending Prisma migrations:
   npx prisma migrate dev
   If no migrations exist yet: npx prisma migrate dev --name init-full-schema

2. Seed the database:
   npx prisma db seed

3. Verify in Prisma Studio (npx prisma studio):
   - Products table: 84 rows
   - OutfitPairing table: 32 rows
   Report counts by category and gender.

4. Create apps/server/scripts/validate-images.ts:
   - HEAD request to first imageUrl for each product
   - Report working (200) vs broken (non-200) with product details
   - Fix broken URLs: find replacements, update seed.ts, re-seed
   - Goal: 100% working image URLs

Plan first.
```

---

### STEP 2: Authentication Backend
**Sprint:** 1.3 | **Type:** Backend | **Time:** ~20 min | **Sub-agents:** No

```
Read CLAUDE.md. Build authentication in apps/server/:

1. Create src/routes/auth.ts:
   - POST /auth/register — { email, password, name } → bcrypt hash, create User, return JWT
   - POST /auth/login — { email, password } → verify, return JWT
   - GET /auth/me — return current user from JWT (protected)

2. Create src/middleware/auth.ts:
   - Extract JWT from Authorization: Bearer <token>
   - Verify token, attach userId to request
   - 401 if invalid/missing

3. Create src/middleware/validate.ts:
   - Zod-based validation middleware
   - 400 with field-level errors

4. Response format: { success: boolean, data?: T, error?: string }
5. Register routes in src/index.ts
6. Test: register → login → /auth/me with token

Plan first.
```

---

### STEP 3: Profile, Avatar, Preferences Backend + S3
**Sprint:** 1.4 | **Type:** Backend | **Time:** ~20 min | **Sub-agents:** No

```
Read CLAUDE.md and docs/Architecture_Final_v3.md.

Build profile management in apps/server/:

1. Create src/integrations/s3.ts:
   - uploadFile(buffer, key, contentType) → public URL
   - If AWS vars missing: save to local /uploads, serve via Express static
   - Ensures dev works without AWS

2. Create src/routes/profile.ts:
   - POST /api/profile — upsert UserProfile { gender (REQUIRED), heightCm, weightKg, waistCm, bodyShape, measurementUnit }
   - GET /api/profile — return profile

3. Create src/routes/avatar.ts:
   - POST /api/avatar — multipart upload (face + body photos)
   - multer for handling, sharp for resize (min 576x864 for FASHN)
   - Upload to S3 or local, save URLs in UserAvatar

4. Create src/routes/preferences.ts:
   - POST /api/preferences — save { budgetRange, fashionStyles[], preferredPlatforms[] }
   - GET /api/preferences

5. All routes: auth middleware + Zod. Register in src/index.ts.

Plan first.
```

---

### STEP 4: Feed, Swipe, Favorites, Analytics Backend + FeedService
**Sprint:** 1.5 | **Type:** Backend | **Time:** ~30 min | **Sub-agents: YES (3)**

This is the most architecturally important step. Use sub-agents to build each piece independently, then integrate.

```
Read CLAUDE.md and docs/Architecture_Final_v3.md (Feed API, Swipe Behavior, Favorites, 
FeedService Abstraction sections).

Use sub-agents to build Step 4 in parallel. Each sub-agent creates SEPARATE files 
with no overlap.

SUB-AGENT 1 — FeedService (the critical abstraction layer):
"Create src/services/FeedService.ts with two methods:

a. getTryOnImageForFeed(userId: string, outfitPairingId: string): Promise<string | null>
   - MVP: query TryOnResult WHERE userId + outfitPairingId + status='ready' + layer='combined'
   - Return resultImageUrl or null
   - Add this exact comment block for future migration:
   // ═══════════════════════════════════════════════════════
   // FUTURE v1.2 — Option C Migration (85% cost reduction)
   // Replace the above with:
   // const shared = await prisma.sharedTryOn.findFirst({
   //   where: { outfitPairingId, modelId: user.selectedModelId }
   // });
   // return shared?.resultImageUrl ?? null;
   // This is the ONLY method that changes. Zero frontend changes.
   // ═══════════════════════════════════════════════════════

b. getFeedForUser(userId: string, cursor?: string, limit: number = 10): Promise<FeedCard[]>
   - Get user gender from UserProfile
   - Get style preferences from StylePreference
   - Query OutfitPairings WHERE (gender = user.gender OR gender = 'U')
   - If female: also query Products WHERE fashnCategory='one-pieces' AND gender='W'
   - Filter by style tag overlap with preferences
   - Exclude outfits where user already swiped BOTH products (check SwipeAction)
   - Shuffle for variety
   - Call getTryOnImageForFeed() for each
   - Return: { outfitPairingId, tryOnImageUrl, topProduct, bottomProduct, totalPrice, isSolo }

Export the FeedCard interface from this file."

SUB-AGENT 2 — Swipe + Favorites routes:
"Create two route files:

a. src/routes/swipe.ts:
   - POST /api/swipe — body: { productId: string, action: 'like'|'dislike', outfitGroupId?: string }
   - Validate with Zod, save SwipeAction to database
   - outfitGroupId is UUID linking paired items from same swipe (null for dresses)
   - Protected by auth middleware

b. src/routes/favorites.ts:
   - GET /api/favorites — query SwipeActions WHERE userId AND action='like'
   - Join with Products for full details
   - Return FLAT list of individual products: { id, name, brand, price, platform, imageUrl, productPageUrl }
   - Protected by auth middleware"

SUB-AGENT 3 — Feed + Analytics routes:
"Create two route files:

a. src/routes/feed.ts:
   - GET /api/feed?cursor=X&limit=10
   - Import and call FeedService.getFeedForUser()
   - Return: { success: true, data: { cards: FeedCard[], nextCursor: string | null } }
   - Protected by auth middleware

b. src/routes/analytics.ts:
   - POST /api/analytics/click — body: { productId: string, platform: string }
   - Save with userId (from auth) + timestamp
   - This tracks Buy Now taps from day 1 for future affiliate revenue
   - Protected by auth middleware"

AFTER ALL SUB-AGENTS COMPLETE:
- Register all new routes in src/index.ts (feed, swipe, favorites, analytics)
- Test the full flow:
  1. Create a user (POST /auth/register)
  2. Save profile with gender (POST /api/profile)
  3. Get feed (GET /api/feed) — should return outfit cards filtered by gender
  4. Swipe on an outfit (POST /api/swipe × 2 with same outfitGroupId)
  5. Get favorites (GET /api/favorites) — should return the liked products
  6. Log a click (POST /api/analytics/click)

Plan first. Verify no sub-agent edits files that another sub-agent creates.
```

---

### STEP 5: FASHN Try-On Pipeline
**Sprint:** 2.1 | **Type:** Backend + AI | **Time:** ~30 min | **Sub-agents: YES (2)**

```
Read CLAUDE.md and docs/Architecture_Final_v3.md (Try-On Pipeline section).

Use sub-agents to build the try-on system. Each creates separate files.

SUB-AGENT 1 — FASHN API client + S3 persistence:
"Create src/integrations/fashn.ts:

- FashnClient class wrapping FASHN API v1.6 tryon endpoint
- Use FASHN direct API (NOT fal.ai hosted)
- Method: async generateTryOn(personImageUrl: string, garmentImageUrl: string, 
  category: 'tops'|'bottoms'|'one-pieces'): Promise<string>
  
  Implementation:
  a. POST to FASHN API with model_image + garment_image + category
  b. FASHN is async: submit request → poll status endpoint → get result URL
  c. When result ready: download image from FASHN CDN
  d. Re-upload to our S3 using src/integrations/s3.ts (FASHN deletes after 72h)
  e. Return our S3 URL
  
- Config: mode='balanced' (~10 seconds), garment_photo_type='auto'
- API key from env: FASHN_API_KEY
- Retry up to 3 times on failure, throw after 3rd
- Export the FashnClient class"

SUB-AGENT 2 — BullMQ queue + generateTryOn worker:
"Create two files:

a. src/lib/queue.ts:
   - Import BullMQ, connect to Redis via REDIS_URL env var
   - Create and export 'tryon' Queue instance
   - If REDIS_URL is not set: log warning 'Redis not configured, job queue disabled'
     and export null queue (graceful degradation)

b. src/jobs/generateTryOn.ts:
   - BullMQ Worker that processes 'tryon' queue jobs
   - Import FashnClient from src/integrations/fashn.ts
   
   Job data has: { userId, outfitPairingId?, productId? }
   
   For OUTFIT PAIRS (outfitPairingId present):
   1. Fetch user body photo URL from UserAvatar
   2. Fetch OutfitPairing → get topProduct.imageUrls[0] and bottomProduct.imageUrls[0]
   3. PASS 1: fashn.generateTryOn(bodyPhotoUrl, topImageUrl, 'tops') → topResultUrl
   4. PASS 2: fashn.generateTryOn(topResultUrl, bottomImageUrl, 'bottoms') → combinedUrl
   5. Save TryOnResult: { userId, outfitPairingId, resultImageUrl: combinedUrl, 
      status: 'ready', layer: 'combined' }
   
   For SOLO DRESSES (productId present, no outfitPairingId):
   1. Fetch user body photo URL
   2. Fetch Product → get imageUrls[0]
   3. fashn.generateTryOn(bodyPhotoUrl, dressImageUrl, 'one-pieces') → resultUrl
   4. Save TryOnResult: { userId, productId, resultImageUrl: resultUrl, 
      status: 'ready', layer: 'solo' }
   
   On failure after 3 retries:
   Save TryOnResult with status='failed'
   
   Start the worker in the same process as Express for MVP simplicity."

AFTER BOTH SUB-AGENTS COMPLETE:
- Create src/routes/tryon.ts:
  - POST /api/tryon/batch — trigger pre-generation after onboarding
    Get user gender from UserProfile
    Query OutfitPairings matching gender (+ unisex)
    Cap at 20 (female) or 15 (male)
    If female: also queue up to 6 solo dresses
    Add each as a job to the BullMQ 'tryon' queue
    Return: { success: true, data: { totalQueued: number } }
  
  - GET /api/tryon/status — return generation progress
    Count TryOnResults for this user grouped by status
    Return: { total, completed, failed, pending }

- Register tryon routes in src/index.ts
- Test with ONE real FASHN API call:
  Use a sample person image URL + one product image URL from our seed data
  Verify: FASHN returns result → downloaded → uploaded to S3 → saved in TryOnResult

Plan first. The two-pass pipeline is the hardest part — get it right.
```

---

### STEP 5.5: Brand Infrastructure Setup (DO THIS BEFORE ANY FRONTEND)
**Sprint:** 2.1.5 | **Type:** Frontend setup | **Time:** ~10 min | **Sub-agents:** No

This step wires the brand system into the codebase. Run this ONCE before Step 6.

```
Read CLAUDE.md and docs/BRAND_SYSTEM.md.

Set up the Kame brand design system in apps/mobile/:

1. FONTS: Verify Plus Jakarta Sans .ttf files exist in assets/fonts/.
   Required files: PlusJakartaSans-Regular.ttf, PlusJakartaSans-Medium.ttf,
   PlusJakartaSans-SemiBold.ttf, PlusJakartaSans-Bold.ttf, PlusJakartaSans-BoldItalic.ttf
   If missing: download from https://fonts.google.com/specimen/Plus+Jakarta+Sans
   and place the static/*.ttf files into assets/fonts/

2. THEME: Verify src/theme/constants.ts exists with COLORS, GRADIENTS, FONTS,
   TYPE, SPACING, RADIUS, SHADOWS, SWIPE, COMPONENT exports.
   If missing: create it from the spec in docs/BRAND_SYSTEM.md section 9.

3. TAILWIND: Update tailwind.config.js to include Kame brand tokens:
   - colors: navy, navy-deep, teal, teal-bright, coral, coral-deep, gold,
     kame-green, kame-red, kame-purple
   - fontFamily: heading, heading-semi, body, body-medium
   - borderRadius: card (20px), card-sm (16px), button (26px), chip (18px), input (12px)

4. FONT LOADING: Update app/_layout.tsx to load fonts via expo-font:
   import { useFonts } from 'expo-font';
   Load all 5 PlusJakartaSans weights.
   Show splash screen until fonts loaded.
   Set StatusBar to light-content (white text on dark background).

5. LOGO COMPONENT: Create components/KameLogo.tsx:
   Renders "Kame" in teal-bright (#48E6CD) BoldItalic, configurable size.

6. VERIFY: Confirm fonts load in Expo Go. Text renders in Plus Jakarta Sans.
   Background is warm-white #F5F0E8.

Plan first.
```

---

### STEP 6: Mobile Auth Screens + Onboarding Wizard
**Sprint:** 2.2 | **Type:** Frontend | **Time:** ~40 min | **Sub-agents: YES (3)**

```
Read CLAUDE.md and docs/Architecture_Final_v3.md (Onboarding section).

Use sub-agents to build the mobile auth + onboarding flow. Each creates separate files.

SUB-AGENT 1 — Auth infrastructure + screens:
"Read docs/BRAND_SYSTEM.md first. Then create these files in apps/mobile/:

a. stores/authStore.ts (Zustand):
   - State: { token: string|null, user: object|null, isAuthenticated: boolean, isLoading: boolean }
   - Actions: login(email, password), register(email, password, name), logout(), checkAuth()
   - login/register: call API, store token in expo-secure-store, set isAuthenticated
   - logout: clear expo-secure-store, reset state
   - checkAuth: on app launch, read token from store, validate with GET /auth/me

b. services/api.ts:
   - Async fetch wrapper
   - Auto-attaches Authorization: Bearer <token> from authStore
   - Base URL from EXPO_PUBLIC_API_URL env
   - On 401 response: call authStore.logout(), redirect to login

c. app/auth/login.tsx:
   - Import COLORS, FONTS, TYPE, SPACING, RADIUS from src/theme/constants
   - WarmWhite (#F5F0E8) background for entire screen
   - Kame logo at top (teal-bright #48E6CD BoldItalic)
   - Email + password TextInputs (gray-100 bg, gray-200 border, teal-bright focus border, 12px radius)
   - 'Log In' button: TEAL solid #48E6CD (this is navigation CTA, not commerce)
   - 'Don't have an account? Sign Up' link in teal-bright
   - Error text in red #E3393C
   - All text in PlusJakartaSans font

d. app/auth/register.tsx:
   - Same brand treatment as login
   - Name + email + password TextInputs
   - 'Create Account' button: TEAL solid (navigation CTA)
   - 'Already have an account? Log In' link"

SUB-AGENT 2 — Onboarding Steps 1-2:
"Read docs/BRAND_SYSTEM.md first. Create these files in apps/mobile/app/onboarding/:

a. measurements.tsx (Step 1 of 4):
   - Navy background. All text in PlusJakartaSans.
   - FIRST FIELD at top: 'I'm shopping for:' with two large tappable cards side by side:
     'Women's Fashion' (with dress icon) | 'Men's Fashion' (with shirt icon)
     Selected card: teal-bright #48E6CD border + light teal tint. REQUIRED to proceed.
     Unselected: gray-200 border, transparent bg.
   - Height numeric input with unit label (cm or inches)
   - Weight numeric input with unit label (kg or lbs)
   - Waist numeric input with unit label (cm or inches)
   - Imperial/Metric toggle switch (teal-bright for active side)
   - Body shape selector: 4 tappable chips: Athletic / Curvy / Slim / Average
     Chip style: unselected = transparent + gray-200 border. Selected = teal-bright bg + navy text.
   - 'Next' button: TEAL solid #48E6CD (navigation CTA). Disabled (opacity 0.5) until gender selected.
   - Input fields: gray-100 bg, gray-200 border, teal-bright focus border, 12px radius, 52px height

b. photos.tsx (Step 2 of 4):
   - Navy background.
   - Face Photo section:
     Camera viewfinder using expo-camera with oval face guide overlay (teal-bright border)
     OR 'Choose from Gallery' button (ghost/outline style: teal-bright border + text)
     Show thumbnail preview after capture (16px rounded)
   - Full Body Photo section:
     Camera viewfinder with body silhouette guide overlay
     OR 'Choose from Gallery' button
     Show thumbnail preview after capture
   - 'Skip for now' text link (teal-bright color, 14px medium)
   - 'Next' button at bottom (teal solid)"

SUB-AGENT 3 — Onboarding Steps 3-4 + Navigation:
"Read docs/BRAND_SYSTEM.md first. Create these files in apps/mobile/app/onboarding/:

a. preferences.tsx (Step 3 of 4):
   - Navy background. All text in PlusJakartaSans.
   - 'Monthly Clothing Budget' — single-select chips:
     $0-50 | $50-100 | $100-200 | $200-500 | $500+
   - 'Favorite Shopping Platforms' — multi-select chips:
     SHEIN | Amazon | Taobao | Zalora | ASOS
   - 'Desired Fashion Style' — multi-select chips (minimum 1 required):
     Casual | Streetwear | Formal | Bohemian | Sporty | Minimalist
   - Chip style: unselected = transparent + gray-200 border. Selected = teal-bright #48E6CD bg + navy text. 36px height, 18px radius.
   - 'Generate My Styles ✨' button: CORAL GRADIENT (this IS a commerce-tier CTA: 
     linear-gradient 135deg, #CC4968 → #FA6869). Full width, 52px height, 26px radius.
     Shadow: rgba(204,73,104,0.3).

b. generating.tsx (Step 4 of 4):
   - Navy background, centered content.
   - Kame logo at top (teal-bright BoldItalic)
   - Animated loading spinner (teal-bright ActivityIndicator)
   - Text: 'Creating your AI shopping agent...' (white, headingMd)
   - Progress: 'Generating outfit 3 of 20...' (teal-bright, bodyMd)
   - This screen executes API calls in sequence:
     1. POST /api/profile (gender + measurements from Step 1)
     2. POST /api/avatar (photos from Step 2, skip if null)
     3. POST /api/preferences (from Step 3)
     4. POST /api/tryon/batch (trigger try-on pre-generation)
     5. Poll GET /api/tryon/status every 3 seconds
     6. Show progress: 'Generating outfit 3 of 20...'
     7. Navigate to main tabs when 5+ ready OR 60 seconds elapsed
   - If tryon/batch endpoint isn't available: skip steps 4-6, navigate after 1-3 complete

c. Update app/_layout.tsx for navigation routing:
   - Check authStore.isAuthenticated on mount
   - Not authenticated → render auth/login
   - Authenticated but no UserProfile in DB → render onboarding/measurements
   - Authenticated with profile → render (tabs) layout
   - Onboarding flow: measurements → photos → preferences → generating → tabs
   - StatusBar: light-content (white text for dark navy bg)"

AFTER ALL SUB-AGENTS COMPLETE:
- Verify navigation flow works: launch → login → register → onboarding step 1 → 2 → 3 → 4 → tabs
- Verify all API calls connect to backend properly
- Fix any import issues between the files sub-agents created

Plan first.
```

---

### STEP 7: Swipe Deck UI
**Sprint:** 2.3 | **Type:** Frontend (core experience) | **Time:** ~45 min | **Sub-agents: YES (2)**

```
Read CLAUDE.md and docs/Architecture_Final_v3.md (Card UI section).

Use sub-agents to build the swipe experience. Each creates separate component files.

SUB-AGENT 1 — SwipeCard component:
"Create apps/mobile/components/SwipeCard.tsx:

A full-screen card component that displays one outfit or dress.

Props: { card: FeedCard } where FeedCard has:
  outfitPairingId, tryOnImageUrl, topProduct, bottomProduct, totalPrice, isSolo

Layout:
- Full card background: try-on image (Image component, resizeMode='cover', fills card)
- If tryOnImageUrl is null: show product image(s) with a 'Generating your look...' 
  spinner overlay centered on the image area
- Bottom overlay: LinearGradient from transparent to rgba(26,43,61,0.85) (navy)
  containing:
  
  For outfit pairs (isSolo = false):
    - Top product name + price: 'White Linen Blouse — $24.90' (white text, 16px)
    - Thin horizontal divider line (teal, 1px)
    - Bottom product name + price: 'Wide Leg Trousers — $27.50' (white text, 16px)
    - Total price bold: 'Total: $52.40' (teal, 18px, bold)
  
  For solo dresses (isSolo = true):
    - Product name + price: 'Floral Midi Dress — $18.99' (white, 18px)

- Platform badge: small rounded chip in top-right corner
  'Amazon' (orange) or 'SHEIN' (black) based on topProduct.platform

Use NativeWind/Tailwind classes. Export as named export."

SUB-AGENT 2 — SwipeDeck component with animations:
"Create apps/mobile/components/SwipeDeck.tsx:

A card stack component that manages swiping gestures and animations.

Props: { cards: FeedCard[], onSwipe: (card: FeedCard, action: 'like'|'dislike') => void, 
         onEmpty: () => void }

Implementation:
- Render stack of 3 SwipeCard components (import from ./SwipeCard)
- Top card: full size, interactive (receives gestures)
- Card behind: slightly scaled down (scale: 0.95), translated down 10px
- Third card: scale 0.9, translated down 20px (creates depth illusion)

Gesture handling (react-native-gesture-handler PanGesture):
- Track X translation with useSharedValue (react-native-reanimated)
- Card follows finger horizontally
- Card rotates slightly: rotation = translationX * 0.1 degrees (tilt effect)
- Color overlay: translationX > 0 shows green tint, < 0 shows red tint (opacity based on distance)

Swipe thresholds:
- RIGHT > 120px: trigger like
  Spring animation: card flies off-screen right (x: 500, opacity: 0)
  Call onSwipe(card, 'like')
- LEFT < -120px: trigger dislike
  Spring animation: card flies off-screen left (x: -500, opacity: 0)
  Call onSwipe(card, 'dislike')
- Released within threshold: spring back to center (x: 0, rotation: 0)

After card exits:
- Remove top card from stack
- Next card scales up from 0.95 to 1.0 with spring animation
- If no cards remain: call onEmpty()

Spring config: damping 15, stiffness 150 (snappy but smooth)

Bottom action buttons (rendered below the card stack):
- Red circle (60px) with X icon → trigger left swipe animation programmatically
- Green circle (60px) with Heart icon → trigger right swipe animation
- Centered horizontally with 40px gap between them

Use: react-native-reanimated (useSharedValue, useAnimatedStyle, withSpring, runOnJS)
Use: react-native-gesture-handler (Gesture, GestureDetector)
Import SwipeCard from ./SwipeCard.
Export as named export."

AFTER BOTH SUB-AGENTS COMPLETE:
- Create/update app/(tabs)/explore.tsx:
  - Import SwipeDeck
  - Fetch cards from GET /api/feed using React Query (useQuery)
  - onSwipe handler:
    If action='like' and card has outfit (not solo):
      Generate UUID outfitGroupId
      POST /api/swipe { productId: card.topProduct.id, action: 'like', outfitGroupId }
      POST /api/swipe { productId: card.bottomProduct.id, action: 'like', outfitGroupId }
    If action='like' and card is solo dress:
      POST /api/swipe { productId: card.topProduct.id, action: 'like' }
    If action='dislike': same pattern with action='dislike'
  - When <3 cards remain: prefetch next batch (GET /api/feed?cursor=nextCursor)
  - onEmpty: show "All caught up! Check back later for new styles ✨"
  - Loading state: show skeleton cards while initial fetch happens

- Test: cards render → swipe right → API fires → swipe left → API fires → 
  cards reload → empty state shows

Plan first. This MUST feel like Bumble/Tinder. 60fps, spring physics, satisfying.
```

---

### STEP 8: Product Detail + Favorites + Profile Screens
**Sprint:** 3.1 | **Type:** Frontend | **Time:** ~30 min | **Sub-agents:** No

```
Read CLAUDE.md.

Build remaining screens in apps/mobile/:

1. components/ProductDetail.tsx (modal or bottom sheet):
   - Large try-on image at top (or product image if no try-on)
   - Product name, brand, price
   - Available sizes as tappable chips
   - Platform badge
   - "Buy Now" button (coral #FA6869, full-width):
     → Opens productPageUrl with expo-web-browser (Linking.openURL)
     → Also fires POST /api/analytics/click { productId, platform }
   - Close X button at top-right

2. app/(tabs)/favorites.tsx:
   - GET /api/favorites with React Query
   - 2-column FlatList grid
   - Each card: try-on thumbnail, product name, price, platform badge
   - Tap → open ProductDetail modal
   - Empty: "No favorites yet — start swiping! 👉"
   - Pull-to-refresh (onRefresh → refetch)

3. app/(tabs)/profile.tsx:
   - Name, email
   - Gender: "Shopping: Women's Fashion" or "Men's Fashion"
   - Measurements, body shape (read-only display)
   - Face + body photo thumbnails
   - Style preferences as chips
   - "Give Feedback" button → Linking.openURL to a Google Form (placeholder URL for now)
   - "Log Out" button → authStore.logout() → navigate to login

4. Tab bar (verify/update):
   - THREE tabs: Explore (compass icon), Favorites (heart icon), Profile (person icon)
   - NO cart tab
   - White background, 0.5px gray-200 top border
   - Active icon + label: CORAL #FA6869 (tab bar uses coral, not teal)
   - Inactive icon + label: gray-400 #9CA3AF
   - Icons: 24px, Lucide outline style
   - Height: 56px + safe area bottom

Brand rules for ALL screens in this step:
   - Import all colors/fonts from src/theme/constants.ts
   - Navy background for all screens
   - "Buy Now" button: CORAL GRADIENT (commerce CTA)
   - "Log Out" button: ghost/outline style (teal border + text)
   - Prices: always coral #FA6869 bold
   - Platform badges: Amazon=#FF9900, SHEIN=#000000, white text, 8px radius

Plan first.
```

---

### STEP 9: UI Polish + Error Handling
**Sprint:** 3.2 | **Type:** Full stack | **Time:** ~20 min | **Sub-agents:** No

```
Polish the entire app:

1. Loading: skeleton cards (swipe deck), grid skeleton (favorites), progress text (generating)
2. Errors: network retry buttons, auth expiry redirect, failed try-on shows product image
3. Empty states: "All caught up ✨" (feed), "No favorites yet 👉" (favorites)
4. Visuals: splash screen (navy + "Kame"), app icon, smooth onboarding transitions, 
   expo-image caching, keyboard-aware forms
5. End-to-end walkthrough:
   Signup → Onboard (all 4 steps) → Swipe 5 → Favorites → Buy Now → Profile → Logout → Login
   Fix ALL bugs found.
6. pnpm typecheck — resolve all TypeScript errors

Plan first.
```

---

### STEP 10: Deploy Backend
**Sprint:** 3.3 | **Type:** DevOps | **Time:** ~20 min | **Sub-agents:** No

```
Deploy for beta:

1. Deploy apps/server to Railway.app or Render
2. Set ALL env vars: DATABASE_URL, DIRECT_URL, REDIS_URL, JWT_SECRET, 
   FASHN_API_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_REGION
3. Verify: curl https://[deployed-url]/auth/me → returns 401
4. Update EXPO_PUBLIC_API_URL to deployed URL
5. Test full flow against production backend

Plan first.
```

---

### STEP 11: Beta Distribution
**Sprint:** 3.3 | **Type:** Launch | **Time:** ~15 min | **Sub-agents:** No

```
Ship to testers:

1. npx expo login → configure on expo.dev
2. npx expo start → get QR code / shareable link
3. Share with 10-20 testers (they download Expo Go app first)
4. Test on both iOS and Android
5. Add "Give Feedback" in profile → Google Form URL:
   "Rate try-on quality 1-5", "Swipes per session?", "Use weekly?", "Improve?"
6. Monitor: FASHN dashboard, server logs, DB swipe counts

Plan first.
```

---

## SUMMARY

| Step | Sprint | What | Sub-agents | Time |
|------|--------|------|------------|------|
| 1 | 1.2 | Migration + Seed + Validate | No | 15 min |
| 2 | 1.3 | Auth backend | No | 20 min |
| 3 | 1.4 | Profile/Avatar/Prefs + S3 | No | 20 min |
| **4** | **1.5** | **Feed/Swipe/Favorites + FeedService** | **3 sub-agents** | **30 min** |
| **5** | **2.1** | **FASHN pipeline + BullMQ** | **2 sub-agents** | **30 min** |
| **5.5** | **2.1.5** | **Brand infrastructure setup** | **No** | **10 min** |
| **6** | **2.2** | **Auth screens + Onboarding** | **3 sub-agents** | **40 min** |
| **7** | **2.3** | **Swipe deck UI** | **2 sub-agents** | **45 min** |
| 8 | 3.1 | Favorites + Detail + Profile | No | 30 min |
| 9 | 3.2 | Polish + E2E testing | No | 20 min |
| 10 | 3.3 | Deploy backend | No | 20 min |
| 11 | 3.3 | Beta distribution | No | 15 min |
| | | **TOTAL** | **10 sub-agents** | **~5 hrs** |

---

## SUB-AGENT RULES

1. Each sub-agent creates **separate files** — never the same file as another sub-agent
2. Main agent integrates after all sub-agents complete (registers routes, wires imports)
3. If a sub-agent fails or produces bad output, you can re-run just that sub-agent
4. You paste ONE prompt — main agent delegates internally. You just watch and review.
5. Sub-agent work appears in your Claude Code terminal — you can see everything happening

---

## SCOPE GUARD — Say NO to These

- ❌ Affiliate links (null by design, v1.1)
- ❌ Cart / CartItem / Cart tab
- ❌ Social login
- ❌ ML recommendations
- ❌ Push notifications
- ❌ Premium/Stripe
- ❌ Scraping pipeline
- ❌ Size prediction
- ❌ Community features

---

## TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| FASHN API error | Check FASHN_API_KEY in .env. Check credits at fashn.ai |
| Image URLs 404 | Re-run validate-images script. Replace broken URLs |
| Migration fails | Check DATABASE_URL + DIRECT_URL. Supabase needs both |
| Try-on slow | Expected: ~10s/call, ~20s/outfit. Runs in background |
| Feed empty | Check OutfitPairings seeded. Check user gender matches |
| Photo upload fails | Check S3 vars or local fallback. Check multer config |
| BullMQ jobs stuck | Check REDIS_URL. If missing, queue disabled gracefully |
| Sub-agent conflict | Two sub-agents edited same file. Re-run one of them |
