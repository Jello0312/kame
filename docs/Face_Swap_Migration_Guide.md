# Kame — Face-Swap Architecture Migration Guide
## For Claude Code — Execute in Order

> Date: 2026-03-16
> Context: Beta is fully built (Sprints 1.1–3.8 complete). This migrates the try-on pipeline
> from "garment on user body" to "face-swap onto pre-generated professional model photos".
> Estimated time: ~2 hours across 4 Claude Code sessions.

---

## CRITICAL: READ BEFORE STARTING

1. **Read CLAUDE.md, ROADMAP.md, tasks/todo.md, tasks/lessons.md** at the start of EACH session
2. **This is a MIGRATION, not a rebuild** — most of the app stays untouched
3. **Plan first** for every session
4. **Update tasks/todo.md and ROADMAP.md** after each session
5. The OutfitPairing table and data STAY in the database — we just stop using them for try-on generation

---

## SESSION 1: Schema + FASHN Client Update (~30 min)

```
Read CLAUDE.md, ROADMAP.md, tasks/todo.md, tasks/lessons.md.

We are migrating the try-on pipeline from "garment on user body" (tryon-v1.6) to 
"face-swap onto pre-generated model photos" (product-to-model + model-swap).

This session: update the database schema and FASHN integration client.

STEP 1: Add BaseProductImage model to Prisma schema

Add this model to prisma/schema.prisma:

model BaseProductImage {
  id          String   @id @default(cuid())
  productId   String   @unique
  imageUrl    String
  prompt      String
  status      String   @default("PENDING")
  createdAt   DateTime @default(now())

  product     Product  @relation(fields: [productId], references: [id])
}

Also add to the Product model:
  baseImage   BaseProductImage?

Run: npx prisma migrate dev --name add-base-product-image

Verify: npx prisma studio shows the new BaseProductImage table.

STEP 2: Add new FASHN methods to src/integrations/fashn.ts

KEEP the existing generateTryOn() function — do not delete it.
ADD two new exported async functions:

a) generateProductToModel(productImageUrl: string, prompt: string, aspectRatio: string, s3Key: string): Promise<string>
   - Uses client.predictions.subscribe({
       model_name: 'product-to-model',
       inputs: { product_image: productImageUrl, prompt, aspect_ratio: aspectRatio }
     })
   - Downloads result from FASHN CDN → re-uploads to S3 via uploadFile → returns S3 URL
   - Same retry logic as generateTryOn (3 retries, linear backoff)

b) generateModelSwap(modelImageUrl: string, faceReferenceUrl: string, s3Key: string): Promise<string>
   - Uses client.predictions.subscribe({
       model_name: 'model-swap',
       inputs: { model_image: modelImageUrl, face_reference: faceReferenceUrl }
     })
   - Same download → S3 → return pattern
   - Same retry logic

Both must check if client is null and throw same error as generateTryOn.

STEP 3: Verify
- pnpm typecheck passes
- Both new methods exported from fashn.ts
- BaseProductImage table exists in database

Plan first.
```

---

## SESSION 2: Admin Script + Worker Rewrite (~40 min)

```
Read CLAUDE.md, ROADMAP.md, tasks/todo.md, tasks/lessons.md.

Continuing face-swap migration.

STEP 1: Create apps/server/scripts/generate-base-images.ts

Standalone admin script (NOT part of server runtime). Run once to pre-generate 
professional model photos for all 141 products.

Logic:
1. Import prisma and generateProductToModel from ../src/integrations/fashn.js
2. Fetch all products that do NOT have a BaseProductImage with status='COMPLETED'
3. For each product, with concurrency 3 (simple Promise pool, not BullMQ):
   a. Create or update BaseProductImage record with status='PENDING'
   b. Call generateProductToModel with:
      - productImageUrl: product.imageUrls[0]
      - prompt: "full body shot, standing, in a daily life setting background (e.g., street, office, cafe)"
      - aspectRatio: "3:4"
      - s3Key: "base-images/" + product.id + ".jpg"
   c. On success: update status='COMPLETED', imageUrl=result
   d. On failure: update status='FAILED', log error, continue
4. Log progress: "Generated 45/141 base images..."
5. Final summary: "Done: 138 completed, 3 failed"

Add to server package.json scripts:
  "generate-base-images": "tsx scripts/generate-base-images.ts"

Add --dry-run flag that logs what would happen without calling FASHN.

STEP 2: Rewrite src/jobs/generateTryOn.ts

Replace the current two-pass outfit pipeline with single-pass face-swap.

New TryOnJobData interface (replaces current one):
  {
    tryOnResultId: string;
    userId: string;
    facePhotoUrl: string;
    productId: string;
    baseImageUrl: string;
  }

New worker logic — ONE path for ALL products (no outfit vs solo branching):
  1. Mark TryOnResult as PROCESSING
  2. Call generateModelSwap(
       resolveToPublicUrl(data.baseImageUrl),
       resolveToPublicUrl(data.facePhotoUrl),
       "tryon/" + data.userId + "/" + data.productId + "/result.jpg"
     )
  3. Success: update TryOnResult status='COMPLETED', resultImageUrl=result
  4. Failure: update TryOnResult status='FAILED', throw error

DELETE: processOutfitPairing() and processSoloDress() helper functions.
KEEP: resolveToPublicUrl(), all BullMQ worker config (concurrency 2, drainDelay 60, 
stalledInterval 300_000, lockDuration 600_000 — Upstash tuning from lessons.md).
KEEP: all error event handlers on worker and Redis connection.

STEP 3: Verify
- pnpm typecheck passes
- Run: npx tsx scripts/generate-base-images.ts --dry-run (should log plan without calling FASHN)

Plan first. Use sub-agent if helpful
```

---

## SESSION 3: Routes + FeedService Rewrite (~40 min)

```
Read CLAUDE.md, ROADMAP.md, tasks/todo.md, tasks/lessons.md.

Continuing face-swap migration.

STEP 1: Rewrite src/routes/tryon.ts POST /batch

Key changes:
- REMOVE body photo requirement. REQUIRE face photo instead:
  if (!avatar?.facePhotoUrl) throw new NotFoundError('UserAvatar with face photo');

- REMOVE outfit pairing logic entirely. Query individual PRODUCTS:
  a. Get user gender + style preferences
  b. Query products WHERE gender IN (user.gender, 'UNISEX')
  c. Filter by style tag overlap if user has preferences
  d. Exclude products that already have TryOnResult for this user
  e. Cap at 20 products (single constant MAX_CARDS = 20 for all genders)
  f. For each product:
     - Look up BaseProductImage WHERE productId AND status='COMPLETED'
     - If no base image, skip (log warning)
     - Create TryOnResult: status='PENDING', productId, layer='single'
     - Queue job: { tryOnResultId, userId, facePhotoUrl, productId, baseImageUrl }

- REMOVE: MAX_FEMALE_OUTFITS, MAX_MALE_OUTFITS, MAX_SOLO_DRESSES constants
- ADD: const MAX_CARDS = 20;
- REMOVE: solo dress section
- BatchResult simplifies to: { totalQueued: number }

GET /status: NO CHANGES (still groups by status, works the same).

STEP 2: Rewrite src/services/FeedService.ts

Simplify to serve individual products instead of outfit pairings.

New FeedCard interface:
  {
    productId: string;
    tryOnImageUrl: string | null;
    product: ProductSummary;
    isSolo: true;
  }

Remove: outfitPairingId, topProduct, bottomProduct, soloProduct fields from FeedCard.

Rewrite getFeedForUser():
  1. Get user profile (gender) — same
  2. Get style preferences — same
  3. Get swiped product IDs — same
  4. Query products WHERE gender IN (user.gender, 'UNISEX'), id NOT IN swipedIds
  5. Filter by style tag overlap — same logic
  6. Deterministic shuffle — KEEP existing seeded PRNG (seedFromString, mulberry32, shuffleArray)
  7. For each product: query TryOnResult WHERE userId + productId + status='COMPLETED'
  8. Cursor pagination — cursor is now productId
  9. Return { cards: FeedCard[], nextCursor }

Replace getTryOnImageForFeed() and getSoloTryOnImageForFeed() with single:
  getTryOnImageForProduct(userId: string, productId: string): Promise<string | null>

Update Option C migration comment:
  // FUTURE v1.2 — Optimization
  // Base images are already shared. Face-swap results could be cached
  // across sessions for returning users (skip re-generation if unchanged).

STEP 3: Verify
- pnpm typecheck passes
- Server boots: pnpm dev:server
- If you can test: GET /api/feed returns simplified FeedCard objects

Plan first. Use sub-agent if helpful
```

---

## SESSION 4: Mobile Frontend Updates (~30 min)

```
Read CLAUDE.md, ROADMAP.md, tasks/todo.md, tasks/lessons.md.

Final migration session: update mobile app to match simplified backend.

STEP 1: Update types/feed.ts

Replace FeedCard with simplified version:
  export interface FeedCard {
    productId: string;
    tryOnImageUrl: string | null;
    product: ProductSummary;
    isSolo: true;
  }

Remove any references to outfitPairingId, topProduct, bottomProduct, soloProduct.

STEP 2: Update components/SwipeCard.tsx

Simplify the product info overlay:
- REMOVE the outfit pair layout (top name + divider + bottom name + "Total: $X")
- ALWAYS show: product name + single price
- Card layout becomes:
    [Full body try-on image with user face]
    [Gradient overlay at bottom]
    [Product name — $price]
    [Platform badge in corner]
- KEEP: "Generating your look..." spinner when tryOnImageUrl is null
- KEEP: platform badge, gradient overlay, all animation/glow logic

Access product data via: card.product (not card.topProduct/card.soloProduct)

STEP 3: Update components/SwipeDeck.tsx

Simplify swipe handler:
- REMOVE: outfitGroupId UUID generation
- REMOVE: conditional 2x POST for outfit pairs
- ALWAYS: 1x POST /api/swipe { productId: card.product.id, action: 'like' or 'dislike' }
- Fire-and-forget pattern stays the same

STEP 4: Update app/(tabs)/explore.tsx

Adapt to new FeedCard type. Should be minimal — verify useInfiniteQuery 
still parses the response correctly.

STEP 5: Update onboarding photos step

Find the photo capture step (in OnboardingWizard.tsx or app/onboarding/photos.tsx).
- Face photo: stays REQUIRED
- Body photo: make clearly OPTIONAL
  - Add prominent "Skip" button or text: "Optional — for future sizing features"
  - Do NOT block Next/Continue if body photo is skipped
  - The onboardingStore should allow bodyPhoto to be null

STEP 6: Update onboarding generating step

- Progress text: change "Generating outfit X of Y" to "Personalizing your feed... X of 20"
- POST /api/tryon/batch still works the same (returns 202 with totalQueued)
- Verify it handles the case where body photo was skipped (route now uses face photo)

STEP 7: Full end-to-end verification

Test the complete flow:
  Register → Onboarding (upload face photo, SKIP body photo) → Preferences → 
  Generating screen → Explore (cards show single product with name + price) → 
  Swipe right → Check favorites → Swipe left → Profile → Logout → Login back in

Verify:
- No TypeScript errors: pnpm typecheck
- No console errors in Metro
- Cards display correctly (single product per card, not outfit pairs)
- Swipe fires 1 API call per swipe (not 2)
- Favorites shows individual products (should already work — no change needed)

Plan first.
```

---

## POST-MIGRATION: Run Base Image Generation (Manual Step)

After all 4 Claude Code sessions complete:

1. Ensure FASHN_API_KEY and S3 credentials are in apps/server/.env
2. Run:
   cd apps/server
   npx tsx scripts/generate-base-images.ts
3. Wait ~15-20 minutes (141 products × ~12 seconds each ÷ concurrency 3)
4. Check: npx prisma studio → BaseProductImage → expect ~141 rows with status=COMPLETED
5. If some failed, re-run (script skips completed products)
6. Cost: $10.58 one-time

After base images exist, new users who onboard will get face-swapped cards
within ~2 minutes (20 model-swap calls × ~12 seconds ÷ concurrency 2).

---

## FILES TO UPDATE IN YOUR PROJECT

After Claude Code completes all sessions, also manually update these docs:

### CLAUDE.md — Find and update the FASHN AI Integration section:
Replace:
  - **Endpoint**: tryon-v1.6
  - **Inputs**: model_image (user body photo) + garment_image (product image)
With:
  - **Endpoints**: product-to-model (base generation) + model-swap (per-user face swap)
  - **Inputs**: product_image + prompt (Phase 1); model_image + face_reference (Phase 2)
  - **Base image prompt**: "full body shot, standing, in a daily life setting background (e.g., street, office, cafe)"
  - **Aspect ratio**: 3:4 for all base images

### CLAUDE.md — Update Try-On Pre-Generation Strategy:
Replace the current text with:
  Phase 1 (one-time admin): Run generate-base-images.ts to create professional model photos 
  for all 141 products using product-to-model endpoint. Stored in BaseProductImage table.
  Phase 2 (per-user): After onboarding, run model-swap on 20 products using user's face photo.
  Results stored in TryOnResult. Feed serves from TryOnResult, falls back to product image.

### tasks/todo.md — Add new sprint section:
  ## Sprint 4.0 — Face-Swap Architecture Migration
  - [ ] Session 1: BaseProductImage schema + FASHN client methods
  - [ ] Session 2: Admin script + worker rewrite
  - [ ] Session 3: tryon routes + FeedService rewrite
  - [ ] Session 4: Mobile frontend updates
  - [ ] Post-migration: Run generate-base-images.ts ($10.58)
  - [ ] Post-migration: Test full flow with real user

### ROADMAP.md — Add after Sprint 3.7:
  ### Sprint 4.0 — Face-Swap Architecture Migration
  - [ ] Migrate try-on from tryon-v1.6 to product-to-model + model-swap
  - [ ] Pre-generate 141 base model images (one-time $10.58)
  - [ ] Simplify feed to individual products (remove outfit pairing dependency)
  - [ ] Simplify swipe to 1 API call per card
  - [ ] Make body photo optional in onboarding
