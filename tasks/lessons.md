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

---

## Patterns to Watch For

### React Native / Expo
- expo-camera requires permissions — handle permission denied gracefully
- NativeWind classes may not apply if Tailwind config isn't set up correctly
- expo-secure-store has size limits — only store tokens, not full user objects

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

### General
- affiliateUrl is intentionally null in MVP — do NOT populate with fake URLs
- Tabs are Explore/Favorites/Profile — NEVER add a Cart tab in MVP
- outfitGroupId on SwipeAction links paired items from same swipe — generate UUID client-side
