# KAME Security Hardening — Claude Code Prompt
# Copy everything below this line into Claude Code

---

Read CLAUDE.md, tasks/todo.md, and tasks/lessons.md.

## Task: Security Hardening for 10K Beta Launch

Implement these security measures in priority order. This is a single session — do all steps, 
then verify at the end. Plan first.

### STEP 1: Rate Limiting (Critical)

Install `express-rate-limit` in apps/server.

Create `src/middleware/rateLimiter.ts` with FOUR separate limiters:

```typescript
// 1. Auth limiter — strictest (prevents brute-force password guessing)
//    5 requests per 15 minutes per IP
//    Apply to: POST /auth/login, POST /auth/register
//    skipSuccessfulRequests: true (only count failures)

// 2. Upload limiter — expensive operations  
//    10 requests per 15 minutes per IP
//    Apply to: POST /api/avatar, POST /api/tryon/batch

// 3. Write limiter — moderate protection
//    30 requests per 15 minutes per IP
//    Apply to: POST /api/swipe, POST /api/profile, POST /api/preferences

// 4. General limiter — catch-all
//    100 requests per 15 minutes per IP
//    Apply to: all other routes (GET /api/feed, GET /api/favorites, etc.)
```

All limiters must:
- Use `standardHeaders: 'draft-8'` (returns RateLimit header)
- Set `legacyHeaders: false`
- Return JSON error: `{ success: false, error: 'Too many requests. Please try again later.' }`
- Use the consistent API response format

Wire into src/index.ts — apply specific limiters to specific route groups BEFORE the route handlers.
Apply general limiter globally AFTER specific ones (so specific routes use their own limits).

### STEP 2: Helmet + CORS (Critical)

Install `helmet` and `cors` in apps/server.

In src/index.ts, add BEFORE all routes:

```typescript
import helmet from 'helmet';
import cors from 'cors';

// Helmet adds 12+ security headers automatically
app.use(helmet());

// CORS: In production, only allow our own mobile app
// For Expo Go development, we need to be permissive
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.ALLOWED_ORIGIN || '*'] 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

Add `ALLOWED_ORIGIN` to .env.example with comment.

### STEP 3: Delete Account (High)

Backend — create `src/routes/account.ts`:
- DELETE /api/account — requires auth
- Must delete ALL user data in this order (to respect foreign keys):
  1. Delete TryOnResult records for this userId
  2. Delete SwipeAction records for this userId  
  3. Delete AnalyticsClick records for this userId
  4. Delete StylePreference for this userId
  5. Delete UserAvatar for this userId (AND delete the actual photo files from S3/local storage)
  6. Delete UserProfile for this userId
  7. Delete BaseProductImage records? (No — these are shared, not per-user)
  8. Delete User record
- Wrap everything in a Prisma transaction
- If S3 is configured, delete the user's photo folder: `avatars/{userId}/`
- Return { success: true, message: 'Account and all data permanently deleted' }

Register in src/index.ts with auth middleware.

Frontend — in apps/mobile, update profile.tsx:
- Add "Delete Account" button at the bottom (red text, no fill — dangerous action styling)
- On tap: show Alert.alert with title "Delete Account?", 
  message "This will permanently delete your account, photos, and all data. This cannot be undone.",
  buttons: "Cancel" (default) and "Delete Everything" (destructive style)
- On confirm: call DELETE /api/account, then call authStore.logout(), 
  which clears the token and redirects to auth screen

### STEP 4: Row-Level Access Control Audit (High)

Audit EVERY route that queries user data. Verify each one includes `userId: req.userId` 
in its WHERE clause. The routes to check:

- GET /api/profile → must filter by req.userId ✓ (verify)
- POST /api/profile → must use req.userId for upsert ✓ (verify)
- GET /api/avatar → must filter by req.userId ✓ (verify)  
- POST /api/avatar → must use req.userId ✓ (verify)
- GET /api/preferences → must filter by req.userId ✓ (verify)
- POST /api/preferences → must use req.userId ✓ (verify)
- GET /api/feed → FeedService must use req.userId for exclusions ✓ (verify)
- POST /api/swipe → must use req.userId ✓ (verify)
- GET /api/favorites → must filter by req.userId ✓ (verify)
- POST /api/tryon/batch → must use req.userId ✓ (verify)
- GET /api/tryon/status → must filter by req.userId ✓ (verify)

If ANY route is missing userId filtering, fix it immediately.
Report findings as a checklist in the terminal output.

### STEP 5: JWT Expiry + Refresh (High)

In src/services/AuthService.ts:
- Set JWT access token expiry to 7 days: `jwt.sign({ userId }, secret, { expiresIn: '7d' })`
- (Refresh tokens are post-MVP — for now, 7-day expiry + re-login is acceptable for beta)

In the mobile authStore.ts:
- In checkAuth(), if GET /auth/me returns 401, clear the stored token and redirect to login
  (This already happens via the 401 interceptor in api.ts — verify it works)

### VERIFICATION

After all steps, verify:
1. `pnpm --filter @kame/server typecheck` passes with zero errors
2. `pnpm --filter @kame/mobile typecheck` passes (or only has pre-existing route type warnings)  
3. Server boots successfully
4. Test rate limiting: send 6 rapid POST requests to /auth/login — 6th should get 429
5. Test security headers: `curl -I https://your-railway-url.railway.app/health` — should show 
   X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security headers
6. Test delete account: register test user → delete account → verify 401 on subsequent requests
7. Test privacy policy: GET /legal/privacy-policy returns HTML page
8. Report: list all files created/modified

Update tasks/todo.md with a new "Sprint 5.0 — Security Hardening" section.
Update tasks/lessons.md with any new patterns learned.
Update CLAUDE.md with:
- Add helmet, cors, express-rate-limit to the Tech Stack table
- Add rate limiting rules to Architecture Rules section

Plan first. Show me the full plan before implementing.
