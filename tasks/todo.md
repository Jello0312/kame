# Kame — Active Sprint Tasks

> Updated by Claude Code at the start and end of each session.
> See ROADMAP.md for the full multi-week plan.

---

## Completed: Sprint 1.1 — Project Scaffolding ✅

- [x] Initialize pnpm monorepo workspace (pnpm-workspace.yaml, root package.json)
- [x] Create apps/mobile with Expo SDK 54 + expo-router + TypeScript
- [x] Create apps/server with Express + TypeScript (health endpoint on port 3001)
- [x] Create packages/shared-types with base interfaces and enums
- [x] Set up tsconfig.base.json + per-package tsconfig extending base
- [x] Create .env.example with all required environment variables
- [x] Verify `pnpm dev:server` launches Express on port 3001

## Completed: Sprint 1.1b — Database + Seed Data ✅

- [x] Set up Prisma in apps/server with PostgreSQL (Supabase)
- [x] Create full schema: User, UserProfile, UserAvatar, StylePreference, Product, TryOnResult, SwipeAction
- [x] Add OutfitPairing model with named relations (OutfitTop/OutfitBottom)
- [x] Add gender field to UserProfile ("M" | "W")
- [x] Add outfitPairingId + layer to TryOnResult, make productId optional
- [x] Add outfitGroupId to SwipeAction
- [x] Add Platform enum values: ZALORA, ZALANDO, TAOBAO, ASOS
- [x] Add TryOnLayer and OutfitGender enums to shared-types
- [x] Update .env.example with DIRECT_URL for Supabase connection pooling
- [x] Rewrite seed.ts with 84 real Amazon/SHEIN products + 32 outfit pairings
- [x] Prisma generate succeeds (client valid)
- [x] Push schema to Supabase via GitHub Actions (`prisma db push`)
- [x] Seed database via GitHub Actions (84 products + 32 outfit pairings)
- [x] Set up GitHub Actions CI workflow (`db-migrate.yml`) for DB operations

## Current Focus: Sprint 1.2 — Authentication

_Plan to be written._

---

## Backlog
See ROADMAP.md for full sprint breakdown (Weeks 1-3 MVP, then v1.1-v2.0).

---

## Git Commits (this sprint)
| Hash | Message |
|------|---------|
| `a97f9b2` | feat: initialize kame monorepo with pnpm workspaces |
| `904eb64` | chore: add pnpm lockfile and approve build scripts |
| `21f7e0d` | fix: update launch.json to use node+tsx directly |
| `1a8a357` | feat: add Prisma schema, seed script, and shared types (Sprint 1.1b) |
| `34348a8` | fix: remove .claude/ from tracking and add to .gitignore |
| `bf9c3bd` | fix: replace placeholder images with real Unsplash garment photos |
| `2cdabe5` | feat: add ZALORA, ZALANDO, TAOBAO, ASOS to Platform enum |
| `2b7f9d4` | feat: add OutfitPairing model, gender on UserProfile, outfit context on TryOnResult/SwipeAction |
| `458d602` | feat: rewrite seed.ts with 84 real products and 32 outfit pairings |
| `74621da` | ci: add GitHub Actions workflow for DB migrate and seed |
