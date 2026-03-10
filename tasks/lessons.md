# Kame — Lessons Learned

> Updated after every correction or mistake.
> Claude Code: review this at the START of every session.

---

## Rules

### 2026-03-08 — Never use placeholder product data
**What happened:** Seed.ts was created with Lorem Picsum images and example.com URLs. FASHN AI produced nonsense try-ons from random stock photos. "Buy Now" linked to nothing.
**Root cause:** CTO provided a catalog template with "[TO FILL]" placeholders instead of real data. Claude Code filled with garbage.
**Rule:** ALWAYS provide real product URLs, real image URLs, and real product page URLs. Every product must have a matched triplet: (garment image that shows the actual product) + (product page URL where user can buy it) + (correct FASHN category). Never seed with placeholder data.

### 2026-03-08 — Backend-first build order
**What happened:** Original implementation guide mixed backend and frontend steps, causing confusion about what to build when.
**Root cause:** Steps weren't ordered by dependency. Frontend screens were being built before the APIs they call existed.
**Rule:** Build ALL backend APIs first (auth → profile → feed → try-on), THEN build frontend screens that call them. The order is: data layer → API layer → UI layer → polish → deploy.

### 2026-03-08 — Corporate firewall blocks database ports
**What happened:** Prisma migration failed with P1001 (can't reach DB). Supabase default port 5432 was blocked by corporate laptop firewall.
**Root cause:** Corporate firewalls block non-standard ports regardless of WiFi network.
**Rule:** Use Supabase pooled connection on port 6543. Always set both DATABASE_URL (port 6543, pgbouncer=true) and DIRECT_URL (also 6543 if 5432 blocked). If all ports blocked, install PostgreSQL locally. Test DB connectivity before starting any migration.

### 2026-03-08 — Track sprint completion status precisely
**What happened:** CTO marked Sprint 1.2 (Auth) as complete when it wasn't. Implementation guide was built on wrong assumption.
**Root cause:** Assumed completion without verifying. seed.ts being written ≠ seed being run.
**Rule:** A sprint is DONE only when: code is written AND tested AND verified. "Script compiles" ≠ "data is in the database." Always verify actual state before planning next steps.

### 2026-03-08 — Outfit pairing must be designed before individual product pipeline
**What happened:** Initial architecture treated products individually. Later realized FASHN needs two passes for outfits (top+bottom) and feed must show complete looks, not isolated garments.
**Root cause:** Didn't think through the full try-on pipeline before starting product data design.
**Rule:** Design the complete data flow (product → outfit pairing → FASHN pipeline → feed card → swipe → favorites) BEFORE building any individual component. The outfit pairing decision affects schema, seed data, API, try-on pipeline, and UI.

### 2026-03-08 — Gender filtering is a first-class concern
**What happened:** Initial catalog and feed had no gender awareness. Male users would see women's dresses.
**Root cause:** Gender wasn't in the original UserProfile schema or feed algorithm.
**Rule:** Gender must be in UserProfile (set during onboarding), in Product (M/W/U), in OutfitPairing (M/W/U), and in the feed query filter. Every feed query must filter by user.gender + "U" (unisex).

### 2026-03-08 — AI-generated product data contains fabricated URLs
**What happened:** All 84 product image URLs in catalog.ts returned HTTP 404. Amazon products had real ASINs but wrong image IDs (e.g., ASIN `B0D45FH56H` had fabricated image hash `71SiGa1A5ML` instead of real `71bbTwYqrpL`). SHEIN URLs had obviously fake hash segments like `abc123456789abcdef`.
**Root cause:** When Claude Code generated the catalog data, it invented plausible-looking image URLs instead of sourcing real ones. Amazon CDN image IDs are not derivable from the ASIN — they're separate identifiers.
**Rule:** NEVER let an LLM generate image URLs, product IDs, or CDN hashes. These MUST be scraped from real product pages. Always run `validate-images.ts` after any catalog change. A product entry is not valid until its image URL returns HTTP 200.

### 2026-03-08 — E-commerce sites aggressively block automated scraping
**What happened:** Three approaches were tried to fix broken URLs: (1) Node.js fetch scraper — all 36 Amazon requests got CAPTCHAd, (2) Browser automation via Chrome extension — worked for ~5 pages then both Amazon and SHEIN triggered CAPTCHAs, (3) User-assisted browser DevTools extraction — worked.
**Root cause:** Amazon and SHEIN have aggressive anti-bot protections. Server-side requests with any User-Agent get blocked. Browser automation gets flagged after a few pages. Rate limiting kicks in after ~4 page loads.
**Rule:** For product data extraction, use the DevTools console script approach: give the user a copy-paste script that extracts data from category/search pages they navigate to manually. Never rely on server-side scraping of e-commerce sites. Store extraction scripts in `scripts/extract-products.html` for reuse.

### 2026-03-08 — Separate product data from Prisma dependencies
**What happened:** The validation script needed product data but couldn't import from seed.ts because Prisma Client requires a database connection at import time.
**Root cause:** Product data was tightly coupled to Prisma in seed.ts.
**Rule:** Keep product catalog data in `prisma/catalog.ts` with NO Prisma imports (use string literals like `'AMAZON'` instead of `Platform.AMAZON`). Then `seed.ts` imports from catalog.ts and casts strings to Prisma enums. This lets validation scripts, extraction tools, and other utilities access product data without needing a database connection.

### 2026-03-09 — Prisma migrate dev vs db push: drift is real
**What happened:** `prisma migrate dev` failed with drift error because the database had tables from a previous `db push` but no migration history in `_prisma_migrations` table.
**Root cause:** `db push` creates/alters tables without creating migration files. When `migrate dev` runs, it expects the DB to match the migration history — finding tables with no history = drift.
**Rule:** In development, always use `prisma migrate dev` (not `db push`) to evolve the schema. If drift occurs, run `prisma migrate reset --force` to wipe clean, then `migrate dev --name init` for a fresh baseline. Never mix `db push` and `migrate dev` on the same database.

### 2026-03-09 — Prisma AI safety check blocks destructive actions
**What happened:** `prisma migrate reset --force` was blocked because Prisma detected Claude Code as an AI agent and required explicit user consent via `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var.
**Root cause:** Prisma v6+ has safety checks for AI agents running destructive operations like `migrate reset`.
**Rule:** When running destructive Prisma commands in Claude Code, set `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="I confirm this destructive action"` as an environment variable. Always get explicit user consent first before running any destructive DB operation.

### 2026-03-09 — Seed script must handle empty tables gracefully
**What happened:** After `migrate reset` wiped the DB, the seed script ran before the migration was applied (no tables existed). `deleteMany()` on non-existent tables threw P2021 error.
**Root cause:** `migrate reset` runs seed automatically after dropping the DB, but if there are no migration files yet, no tables get created before seeding.
**Rule:** Run `migrate reset` first to wipe the DB, then `migrate dev --name init` to create the initial migration AND apply it (which also runs the seed). Don't rely on `migrate reset` alone when there are no migration files.

### 2026-03-09 — SHEIN placeholder images have a specific URL pattern
**What happened:** 30 out of 105 extracted SHEIN products had gray placeholder images instead of real product photos.
**Root cause:** SHEIN uses lazy loading; some images haven't loaded when the DevTools extraction script runs. The placeholder URL is `sc.ltwebstatic.com/she_dist/images/bg-grey-solid-color-fc04c1310d.png`.
**Rule:** When extracting SHEIN products, always filter out any image URL containing `bg-grey-solid-color` — these are placeholders. Real SHEIN images use `img.ltwebstatic.com/images3_pi/` or `img.ltwebstatic.com/v4/j/`. Scroll through all products before running extraction to ensure images are loaded.

### 2026-03-09 — Add Prisma seed config to package.json
**What happened:** `prisma migrate dev` didn't auto-run the seed after applying migration because no seed command was configured.
**Root cause:** Prisma needs `"prisma": { "seed": "tsx prisma/seed.ts" }` in package.json to know how to run the seed.
**Rule:** Always configure the Prisma seed command in package.json. Note: Prisma 7 will deprecate the `package.json#prisma` config — will need to migrate to `prisma.config.ts` later.

### 2026-03-09 — Use bcryptjs instead of bcrypt on Windows
**What happened:** `pnpm add bcrypt` installed but `pnpm approve-builds` required interactive input to approve native C++ build scripts. The interactive prompt blocked in Claude Code.
**Root cause:** bcrypt uses native Node.js addons (C++ compilation via node-gyp). pnpm v10+ blocks build scripts by default and requires interactive approval via `pnpm approve-builds`.
**Rule:** Use `bcryptjs` (pure JavaScript) instead of `bcrypt` (native C++). Identical API (`hash`, `compare`), no native build needed. Slightly slower but functionally equivalent. Avoids Windows build toolchain issues entirely.

### 2026-03-09 — shared-types needs composite + noEmit:false for project references
**What happened:** `tsc --noEmit` in apps/server failed with TS6306/TS6310 — "Referenced project must have composite:true" and "may not disable emit".
**Root cause:** tsconfig.base.json sets `noEmit: true` globally. When apps/server references packages/shared-types via project references, TypeScript requires the referenced project to have `composite: true` AND `noEmit: false` so it can emit declaration files.
**Rule:** Any package used as a TypeScript project reference must override base config with `"composite": true, "noEmit": false` in its own tsconfig.json. Run `npx tsc` in the package to build declarations before typechecking the consuming app.

### 2026-03-09 — Router export needs explicit type annotation
**What happened:** `const router = Router()` caused TS2742 — "inferred type cannot be named without reference to express-serve-static-core".
**Root cause:** TypeScript's declaration emit can't infer the Router type across package boundaries without an explicit annotation.
**Rule:** Always annotate Express router declarations: `const router: Router = Router()`.

### 2026-03-10 — sharp needs onlyBuiltDependencies in pnpm
**What happened:** `pnpm add sharp` installed the package but its native build scripts were ignored. `pnpm approve-builds` requires interactive input that Claude Code can't provide.
**Root cause:** pnpm v10+ blocks native build scripts by default. `pnpm approve-builds` is interactive-only.
**Rule:** Add `"sharp"` to `pnpm.onlyBuiltDependencies` array in root package.json, then run `pnpm install` to trigger the build. Same pattern used for `@prisma/client`, `esbuild`, etc.

### 2026-03-10 — Double cast needed for req.query with Zod
**What happened:** `req.query as z.infer<typeof schema>` failed with TS2352 because Express's `ParsedQs` type doesn't overlap with the Zod inferred type.
**Root cause:** TypeScript's type assertion requires some overlap between source and target types. `ParsedQs` (all string values) doesn't overlap with typed Zod output (numbers, booleans, etc.).
**Rule:** Always use double cast for req.query: `req.query as unknown as z.infer<typeof schema>`. This is safe because the Zod `validate` middleware has already parsed and coerced the values.

### 2026-03-10 — Non-null assertions needed in generic array swap
**What happened:** Fisher-Yates shuffle `[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]` failed with TS2322 — `T | undefined` not assignable to `T`.
**Root cause:** TypeScript infers array indexing as `T | undefined` with strict mode. The swap is safe because indices are bounds-checked in the for loop, but TS can't verify this.
**Rule:** Use non-null assertions for array element swaps: `[shuffled[j]!, shuffled[i]!]`.

### 2026-03-10 — Bash escapes ! in double-quoted strings
**What happened:** Test scripts using `node -e "...!c.isSolo..."` failed because bash's history expansion converted `!c` to a history reference.
**Root cause:** In bash, `!` inside double quotes triggers history expansion. This breaks JavaScript expressions like `!c.isSolo`.
**Rule:** For inline node -e test scripts, use single quotes or write to a .mjs file and execute. Avoid double-quoted strings with `!` in bash.

### 2026-03-11 — Pin ioredis version to match BullMQ peer dependency
**What happened:** `pnpm add ioredis` installed v5.10.0 but BullMQ internally depends on ioredis@5.9.3. TypeScript errored: `Type 'Redis' is not assignable to type 'ConnectionOptions'` (TS2322).
**Root cause:** ioredis 5.10.0's `Redis` class has slightly different type signatures than what BullMQ's `ConnectionOptions` expects from 5.9.3.
**Rule:** Always install ioredis at the exact version BullMQ uses: `pnpm add ioredis@5.9.3`. Check BullMQ's package.json for the ioredis peer dep version before installing.

### 2026-03-11 — Dynamic import for conditional module loading
**What happened:** Importing `generateTryOn.ts` at top level in `index.ts` crashed the server when REDIS_URL wasn't configured, because the module creates a Redis connection at import time.
**Root cause:** Top-level module imports execute immediately. If a module has side effects (like connecting to Redis), importing it unconditionally breaks graceful degradation.
**Rule:** Use dynamic `import('./path.js').then(...)` for modules that have external dependencies (Redis, third-party APIs). Guard with an env var check: `if (process.env.REDIS_URL) { import(...) }`.

### 2026-03-11 — BullMQ requires maxRetriesPerRequest: null
**What happened:** BullMQ worker threw an error about Redis connection configuration.
**Root cause:** BullMQ requires `maxRetriesPerRequest: null` on the ioredis connection to disable per-request retry limits and use its own retry logic.
**Rule:** When creating ioredis connections for BullMQ (both Queue and Worker), always pass `{ maxRetriesPerRequest: null }`. BullMQ also needs separate Redis connections for Queue and Worker — don't share one connection.

### 2026-03-10 — Run `npx expo install --fix` after adding Expo dependencies
**What happened:** After installing expo-font, expo-splash-screen, and other deps, Metro bundler failed with version mismatch warnings and missing module errors. 18 packages were out of sync with SDK 54.
**Root cause:** `pnpm add` installs latest versions which may not match the installed Expo SDK. Expo SDK pins specific compatible versions for all its packages.
**Rule:** After adding any Expo-related dependency, run `npx expo install --fix` to align all package versions to the installed SDK. This auto-corrects version mismatches. Follow up with `pnpm install` if needed.

### 2026-03-10 — Regenerate typed routes after adding new route files
**What happened:** After creating auth/ and onboarding/ route directories, TypeScript had 10 errors — expo-router's generated types only knew about old routes ((tabs), explore, favorites, profile). New paths like "/auth/login" were not assignable to the router's union type.
**Root cause:** expo-router with `experiments.typedRoutes: true` auto-generates route types from the file structure, but only when the dev server runs or when explicitly triggered.
**Rule:** After adding/removing route files, run `npx expo customize tsconfig.json` to regenerate typed route definitions. Then re-run `npx tsc --noEmit` to verify.

### 2026-03-10 — Lazy require() resolves circular imports with Zustand
**What happened:** api.ts needs authStore (for JWT token + logout on 401). authStore needs api.ts (for login/register/checkAuth API calls). Top-level imports would create a circular dependency.
**Root cause:** ES module circular imports can cause one module to see `undefined` exports from the other during initialization.
**Rule:** Use lazy `require()` inside methods (not at top level) for the circular direction. Zustand's `getState()` is a runtime lookup — the store is always initialized by the time any API call runs. Pattern: `const { useAuthStore } = require('../stores/authStore');` inside ApiClient methods.

### 2026-03-10 — OneDrive EPERM on pnpm install — use --force
**What happened:** `npx expo install expo-linear-gradient` (which runs pnpm) failed with `EPERM: operation not permitted, rename` on node_modules files.
**Root cause:** OneDrive file sync locks files during rename operations. pnpm's hardlink/symlink approach conflicts with OneDrive's file watching.
**Rule:** When pnpm install fails with EPERM on OneDrive-synced repos, retry with `pnpm install --force`. This bypasses the lockfile check and retries file operations.

### 2026-03-10 — Upsert pattern for 1:1 user relationships
**What happened:** Profile, avatar, and preferences all have a unique 1:1 relationship with User. Using separate create/update endpoints would require the client to track whether a record exists.
**Root cause:** Onboarding creates records initially, but users may revisit settings to update them later.
**Rule:** Use Prisma `upsert` (where: { userId }, create: {...}, update: {...}) for all 1:1 relationships. Single POST endpoint handles both create and update. Client doesn't need to know if the record exists.

---

## Patterns to Watch For

### React Native / Expo
- expo-camera requires permissions — handle permission denied gracefully
- NativeWind classes may not apply if Tailwind config isn't set up correctly
- expo-secure-store has size limits — only store tokens, not full user objects

### Authentication
- bcryptjs (pure JS) over bcrypt (native) — avoids Windows build issues
- JWT payload: `{ userId }` only — minimal claims, verified via `jwt.verify(token, JWT_SECRET)`
- Same error message for bad email AND bad password in login — prevents user enumeration
- Use Prisma `select` clause (not destructuring) to exclude passwordHash — prevents hash from entering app memory
- Zod `.trim().toLowerCase()` on email in schemas — prevents duplicate accounts from case differences
- Express Request.userId augmentation via `src/types/express.d.ts` — standard namespace merge pattern
- `const router: Router = Router()` — explicit type annotation required for declaration emit

### Express / Prisma
- Supabase needs BOTH DATABASE_URL and DIRECT_URL for Prisma
- Always use pgbouncer=true on DATABASE_URL for Supabase pooled connections
- Prisma enum changes require a new migration — can't just modify and push
- seed.ts must resolve product externalIds to actual DB ids for OutfitPairing foreign keys
- Never mix `db push` and `migrate dev` — causes drift that requires a full reset
- `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var needed for destructive ops in AI agents
- Prisma seed config goes in package.json under `"prisma": { "seed": "..." }` (until Prisma 7)
- `migrate reset` without migration files = empty DB + failed seed. Always create migration first

### FASHN AI Integration
- FASHN processes tops and bottoms SEPARATELY — must run twice for outfit pairs
- Two-pass pipeline: top on user body → bottom on pass-1 result → final combined image
- FASHN CDN deletes results after 72 hours — must re-upload to our S3 for persistence
- Use mode="balanced" for MVP — good quality/speed tradeoff (~10 seconds)
- garment_photo_type="auto" lets FASHN detect flat-lay vs on-model automatically

### Product Catalog / Image URLs
- Always verify image URLs resolve (HTTP 200) before using in try-on pipeline
- Run `pnpm --filter @kame/server validate-images` after ANY catalog change
- Amazon image IDs ≠ ASINs — they are separate identifiers that must be scraped
- Amazon image URL format: `https://m.media-amazon.com/images/I/{IMAGE_ID}._AC_SX679_.jpg`
- catalog.ts must have NO Prisma dependencies — use string literals for enums
- seed.ts dynamically reads catalog length — no hardcoded product counts in log messages
- Corporate network may timeout on first batch of concurrent requests — re-run validation to confirm transient vs real failures
- Product scraping helper page: `scripts/extract-products.html` — reuse for future catalog updates

### File Uploads / S3
- S3 integration: check AWS env vars at startup, fallback to local `uploads/` dir if missing
- sharp: body photo min 576x864 for FASHN AI, face photo max 512x512 (resize down if larger)
- multer memoryStorage — buffers go directly to sharp, no temp files on disk
- multer fileFilter: validate MIME type (image/jpeg, image/png), reject others with AppError(400)
- MulterError handling: wrap in middleware that converts to AppError (LIMIT_FILE_SIZE → 400)
- `pnpm.onlyBuiltDependencies` in root package.json — add sharp (and any future native deps)

### Feed / Swipe / Favorites
- Feed gender filtering: query OutfitPairing where `gender IN [userGender, 'U']` (string match, not Prisma enum)
- Product.gender uses Prisma enum (MALE/FEMALE/UNISEX) but OutfitPairing.gender and UserProfile.gender use plain strings (M/W/U)
- Solo dress cards: only for female users, query Product where `fashnCategory: 'one-pieces'` AND `gender: 'FEMALE'`
- Swiped exclusion: only exclude pairings where BOTH top AND bottom products are swiped (not just one)
- SwipeAction upsert: compound unique `userId_productId` — upsert handles re-swipe without error
- Feed cursor: uses outfitPairingId for pairings, soloProduct.id for solo cards
- TryOnResult query: status must be `'COMPLETED'` (not "ready") and layer `'combined'`
- Favorites: query SwipeAction WHERE action='LIKE', join product, map to flat summary
- `req.query as unknown as z.infer<typeof schema>` — double cast required for Zod coerced queries

### BullMQ / Job Queue
- ioredis must match BullMQ's peer dep version exactly — pin `ioredis@5.9.3`
- `maxRetriesPerRequest: null` required on all ioredis connections used by BullMQ
- Separate Redis connections for Queue and Worker — don't share one connection
- Dynamic import for worker startup: `if (process.env.REDIS_URL) { import('./jobs/...').then(...) }`
- Create DB record (PENDING) BEFORE queueing job — DB is source of truth, not the queue
- Worker concurrency 2: each outfit job makes 2 sequential FASHN calls → max 4 concurrent FASHN requests (within 6-concurrent API limit)
- Job data carries all URLs/IDs needed — worker never queries for product data, only updates TryOnResult status
- `msgpackr-extract` build warning is harmless — BullMQ falls back to pure JS serialization

### General
- affiliateUrl is intentionally null in MVP — do NOT populate with fake URLs
- Tabs are Explore/Favorites/Profile — NEVER add a Cart tab in MVP
- outfitGroupId on SwipeAction links paired items from same swipe — generate UUID client-side
