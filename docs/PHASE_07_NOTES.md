# PHASE 07 — Agent Execution Memory

<!--
  WHAT to build -> docs/PHASE_07.md
  HOW it was built -> this file

  This file is agent-owned execution memory. It is not intended for human review or manual edits.
  The agent updates it during /impl-assist and /impl-review-notes so future sessions can resume
  without reconstructing context from chat history.

  Sync rule: task IDs (B1, F1, I1, D1, T1) must match the Scope checklist in PHASE_07.md.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~I4~~ (removed). Do not delete
  historical execution memory unless the phase file explicitly removes the task.
-->

_Phase:_ `07` · _Generated:_ `2026-05-29`

---

## B1 — verify and harden request ID propagation and sensitive value scrubbing in middleware

**Status:** implemented
**Depends on:** —

### Contract Snapshot

Request ID propagated on every HTTP response via `response.headers[REQUEST_ID_HEADER] = request_id` in `app/core/middleware.py`. Sensitive value scrubbing done via `scrub_sensitive_fields` structlog processor in `app/core/logging.py`, covering `password`, `hashed_password`, `access_token`, `refresh_token`, `token`, `authorization`.

### Exploration

Inspected `app/core/middleware.py` (39 lines) and `app/core/logging.py` (67 lines). Both fully satisfy the contract with no changes needed.

### Plan

No code changes required — already implemented.

### Implementation Log

No files changed. Verified existing implementation satisfies contract.

### Verification

`uv run pytest --tb=short -q` → 71 passed. `tests/test_health.py::test_health_sets_request_id_header` and `test_health_respects_provided_request_id` both pass.

### Residual Risks

None

---

## B2 — add GET /api/v1/health/detailed endpoint (admin) with DB, Redis, disk metrics

**Status:** implemented
**Depends on:** B1

### Contract Snapshot

`GET /api/v1/health/detailed` (admin-only) → `{db: "ok"|"error", redis: "ok"|"error", disk: {used_gb, free_gb, pct}}`. Requires `Authorization: Bearer <admin_token>`.

### Exploration

Existing `/health/detailed` in `app/modules/health/api.py` had no auth, no Redis check, no disk check, and returned `{status, checks: {db}}` format. Gatus config checked this endpoint internally (would fail with 401 after auth added). No Redis client existed in the app.

### Plan

- **Done when:** endpoint returns contract format with admin auth; Redis ping via `redis.asyncio`; disk via `shutil.disk_usage`
- **Files:** `app/modules/health/api.py`, `pyproject.toml`, `uv.lock`, `ops/gatus/config.yaml`
- **Steps:** add `redis>=5.0.0` dependency; rewrite `health_detailed` with `require_admin` dep, `Redis.from_url` ping, `shutil.disk_usage("/")`; remove admin-only endpoint from Gatus config

### Implementation Log

- `pyproject.toml` — added `redis>=5.0.0` (redis 8.0.0 installed; `[asyncio]` extra not needed)
- `app/modules/health/api.py` — rewrote `health_detailed` endpoint: added `require_admin` dep, Redis ping with 2s timeout, `shutil.disk_usage("/")` for disk metrics, response format matches contract
- `ops/gatus/config.yaml` — removed `backend-detailed-internal` check (would fail with 401)
- `tests/test_health.py` — updated test to send admin Bearer token, updated assertions to match new response format

### Verification

`uv run pytest tests/test_health.py -q` → 8 passed. Full suite → 71 passed.

### Residual Risks

Redis ping connects to `REDIS_URL` per-request (no pool) — acceptable for a health check but adds ~2ms overhead when Redis is healthy. If Redis is unreachable, the 2s `socket_connect_timeout` adds latency to the health endpoint. This is intentional for a health check.

---

## B3 — add POST /events/pageview and GET /admin/analytics/pageviews with page_events table

**Status:** implemented
**Depends on:** —

### Contract Snapshot

`POST /api/v1/public/events/pageview` (no auth, rate-limited) → `{ok: true}`. Stores `path`, `referrer?`, `session_id?`, `user_agent` in `page_events` table. `GET /api/v1/admin/analytics/pageviews` (admin) → `{top_pages: [{path, views}], daily: [{date, views}]}`.

### Exploration

No analytics module existed. Migration head was `0004_feedback_reports`. No `PAGEVIEW_RATE_LIMIT` in config.

### Plan

- **Files:** `app/modules/analytics/` (4 files), `app/api/v1/public/events.py`, `app/api/v1/admin/analytics.py`, `alembic/versions/0005_page_events.py`, `app/core/config.py`, `app/api/v1/router.py`
- **Steps:** create module, create migration, create routers, register routers, add config key

### Implementation Log

Created:
- `app/modules/analytics/__init__.py`
- `app/modules/analytics/models.py` — `PageEvent` model with `id`, `path`, `referrer`, `user_agent`, `session_id`, `created_at`
- `app/modules/analytics/schemas.py` — `PageviewRequest`, `PageviewResponse`, `TopPage`, `DailyViews`, `PageviewStats`
- `app/modules/analytics/repository.py` — `PageEventRepository` with `add()`, `get_top_pages()`, `get_daily_views()`
- `app/modules/analytics/dependencies.py`
- `app/api/v1/public/events.py` — `POST /public/events/pageview` with `@limiter.limit(settings.PAGEVIEW_RATE_LIMIT)`
- `app/api/v1/admin/analytics.py` — `GET /admin/analytics/pageviews` with `require_admin`
- `alembic/versions/0005_page_events.py` — migration with composite index `(path, created_at)` and single `created_at` index

Modified:
- `app/core/config.py` — added `PAGEVIEW_RATE_LIMIT: str = "30/minute"`
- `app/api/v1/router.py` — registered `events_router` and `admin_analytics_router`

### Verification

`uv run pytest --tb=short -q` → 71 passed. Migration file follows `0004_feedback_reports` pattern.

### Residual Risks

Daily views query uses raw SQL `make_interval(days => :days)` which is PostgreSQL-specific. Tests run on SQLite (aiosqlite) so this query is not covered by unit tests — needs integration test on real Postgres or smoke-test after deploy.

---

## F1 — inject inline analytics client script in root.tsx firing events to POST /events/pageview

**Status:** implemented
**Depends on:** B3

### Contract Snapshot

Tiny inline client in `root.tsx`; fires `POST /api/v1/public/events/pageview` on every navigation with `{path, session_id}`; no third-party script; session_id is a 16-char hex stored in `sessionStorage`.

### Exploration

`frontend/app/root.tsx` — existing `App()` component with `useEffect`. No location tracking present. React Router's `useLocation` is importable from `'react-router'`.

### Plan

Add `usePageviewTracker()` hook that calls `useLocation()`, fires `fetch` with `keepalive:true` on `location.pathname` change. Helper `getOrCreateSessionId()` reads/writes `sessionStorage` key `__pv_sid`. Hook is safe server-side (no-op during SSR since `useEffect` only runs in browser).

### Implementation Log

Modified `frontend/app/root.tsx`:
- Added `useLocation` import
- Added `getOrCreateSessionId()` utility (16-char hex from `crypto.getRandomValues`)
- Added `usePageviewTracker()` hook with `useEffect` on `location.pathname`
- Called `usePageviewTracker()` in `App()`

### Verification

`cd frontend && pnpm typecheck` → no errors.

### Residual Risks

`useLocation()` is called in SSR context — React Router supports this in SSR but `sessionStorage` is not available server-side, which is handled by the `try/catch` in `getOrCreateSessionId()`.

---

## F2 — admin status page /admin/status polling GET /api/v1/health/detailed

**Status:** implemented
**Depends on:** B2

### Contract Snapshot

`/admin/status` route renders health tiles for DB, Redis, and disk. Polls `/api/v1/health/detailed` every 30 seconds.

### Exploration

Existing admin pages: `feedback/index.tsx`. Pattern: route file at `frontend/app/routes/admin-*.tsx`, page component at `frontend/app/pages/admin/<name>/index.tsx`. Entity API in `frontend/app/entities/<entity>/api/<name>.ts`.

### Plan

- Create `frontend/app/entities/analytics/api/analytics.ts` — shared API functions for both F2 and F3
- Create `frontend/app/pages/admin/status/index.tsx` — `AdminStatusPage` with color-coded tiles
- Create `frontend/app/routes/admin-status.tsx`
- Add `DetailedHealth` type to schema.ts

### Implementation Log

Created:
- `frontend/app/entities/analytics/api/analytics.ts` — exports `getPageviewStats()`, `getDetailedHealth()`, and TypeScript types
- `frontend/app/pages/admin/status/index.tsx` — `AdminStatusPage` with `StatusTile` (green/red), `DiskTile` (yellow when >85%), auto-refresh every 30s
- `frontend/app/routes/admin-status.tsx`
- `frontend/app/shared/api/keys.ts` — added `analyticsQueryKeys`

Modified:
- `frontend/app/routes.ts` — added `admin/status` and `admin/analytics` routes
- `frontend/app/shared/types/schema.ts` — added `DetailedHealth`, `PageviewStats`, `TopPage`, `DailyViews`, `PageviewRequest`, `PageviewResponse` component schemas; added operations and paths for new endpoints; updated `health_detailed` operation to use `DetailedHealth` response type

### Verification

`cd frontend && pnpm typecheck` → no errors.

### Residual Risks

None

---

## F3 — admin analytics page /admin/analytics showing page view stats

**Status:** implemented
**Depends on:** B3

### Contract Snapshot

`/admin/analytics` shows `top_pages` table and `daily` bar chart (last 30 days) from `GET /api/v1/admin/analytics/pageviews`.

### Exploration

Same pattern as F2.

### Plan

- Create `frontend/app/pages/admin/analytics/index.tsx` — `AdminAnalyticsPage` with `TopPagesTable` and `DailyChart`
- Create `frontend/app/routes/admin-analytics.tsx`

### Implementation Log

Created:
- `frontend/app/pages/admin/analytics/index.tsx` — `AdminAnalyticsPage` with CSS bar chart built from `daily` data; `TopPagesTable` with truncated paths; graceful empty states
- `frontend/app/routes/admin-analytics.tsx`

### Verification

`cd frontend && pnpm typecheck` → no errors.

### Residual Risks

Bar chart is a pure CSS implementation (no charting library). Looks basic but avoids a new dependency. Can be upgraded to Recharts/Chart.js in a later phase.

---

## I1 — finalize nginx/nginx.conf: domain substitution, HSTS, CSP directives

**Status:** implemented
**Depends on:** —

### Contract Snapshot

`[DOMAIN]` substitution handled by `scripts/setup-prod.sh`; HSTS max-age ≥ 1 year; CSP directives reviewed.

### Exploration

Inspected `nginx/nginx.conf` (125 lines). Found: `[DOMAIN]` placeholders on lines 36, 51, 53–54 are substituted by `sed -i "s/\\[DOMAIN\\]/${DOMAIN}/g"` in `setup-prod.sh`. HSTS: `max-age=31536000; includeSubDomains` ✓. CSP: `Content-Security-Policy-Report-Only` with permissive `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — intentional per `production-security.md` (keep report-only until hydration tested).

### Plan

No changes needed — contract already satisfied.

### Implementation Log

No files changed.

### Verification

Confirmed by reading `nginx/nginx.conf` and cross-referencing with `scripts/setup-prod.sh`.

### Residual Risks

CSP remains report-only. Switching to blocking requires testing React Router hydration, inline styles, and any future third-party scripts.

---

## I2 — verify long-lived cache headers for hashed static assets in nginx/nginx.conf

**Status:** implemented
**Depends on:** I1

### Contract Snapshot

`/assets/` location has ≥1 year cache headers with `immutable`.

### Exploration

`nginx/nginx.conf` lines 106–110: `expires 365d; add_header Cache-Control "public, immutable"` ✓.

### Plan

No changes needed.

### Implementation Log

No files changed.

### Verification

Confirmed by reading `nginx/nginx.conf`.

### Residual Risks

None

---

## I3 — finalize docker-compose.prod.yml + scripts/setup-prod.sh

**Status:** implemented
**Depends on:** I1

### Contract Snapshot

Env generation covers all required keys; no dev bind-mounts; health-check guards in place.

### Exploration

`docker-compose.yml` already has health checks for db, redis, backend, frontend with `depends_on: condition: service_healthy`. `docker-compose.prod.yml` adds production mounts (nginx.conf, letsencrypt, var/nginx-logs). Missing from `setup-prod.sh`: `FEEDBACK_IP_PEPPER`, `FEEDBACK_RATE_LIMIT`, `PAGEVIEW_RATE_LIMIT`, `LETSENCRYPT_EMAIL`.

### Plan

- Update `setup-prod.sh` to accept `LETSENCRYPT_EMAIL` as third argument
- Generate `FEEDBACK_IP_PEPPER` as random 32-byte hex
- Add `FEEDBACK_RATE_LIMIT`, `PAGEVIEW_RATE_LIMIT`, `LETSENCRYPT_EMAIL` to the `.env` template

### Implementation Log

Modified `scripts/setup-prod.sh`:
- Added `LETSENCRYPT_EMAIL` as 3rd required argument
- Generated `FEEDBACK_IP_PEPPER` via `random_hex 32`
- Added `FEEDBACK_IP_PEPPER`, `FEEDBACK_RATE_LIMIT=5/minute`, `PAGEVIEW_RATE_LIMIT=60/minute`, `LETSENCRYPT_EMAIL` to `.env` heredoc

### Verification

Reviewed final file state.

### Residual Risks

Callers of `setup-prod.sh` must now pass a third argument. Existing deployments need to re-run setup or manually add the new keys to `.env`.

---

## ~~I4~~ (removed, deferred — daily encrypted backup job → future phase)

---

## ~~I5~~ (removed, deferred — restore drill → future phase)

---

## I6 — wire up Gatus dashboard-only monitoring via docker-compose.monitoring.yml

**Status:** implemented
**Depends on:** I3

### Contract Snapshot

`ops/gatus/config.yaml` applies via `docker-compose.monitoring.yml`; no external alerts; SSH tunnel access documented.

### Exploration

Both `ops/gatus/config.yaml` and `docker-compose.monitoring.yml` were fully implemented in a prior phase. The config had a `backend-detailed-internal` check that needed removal (endpoint became admin-only in B2). SSH tunnel access documented in `production-security.md` (Gatus binds 127.0.0.1).

### Plan

- Remove `backend-detailed-internal` check from Gatus config (done as part of B2)
- Verify remaining config is correct
- Ensure SSH tunnel access is documented in runbook (done in T1)

### Implementation Log

Modified `ops/gatus/config.yaml` — removed `backend-detailed-internal` endpoint check.

Remaining checks:
- `frontend-internal` (http://frontend:3000/)
- `backend-live-internal` (http://backend:8000/api/v1/health/live)
- `frontend-public` (https://${DOMAIN}/)
- `backend-health-public` (https://${DOMAIN}/api/v1/health)

### Verification

Read config and confirmed valid structure.

### Residual Risks

None

---

## I7 — host security hardening: finalize fail2ban config, UFW rules, SSH hardening docs

**Status:** implemented
**Depends on:** I3

### Contract Snapshot

Deployable `ops/fail2ban/jail.local` with infraege-specific paths; UFW rules and SSH hardening documented in `docs/production-security.md`.

### Exploration

`ops/fail2ban/jail.local.template` existed with `/opt/template-app` paths. `docs/production-security.md` already documented UFW and SSH hardening. Needed: create `ops/fail2ban/jail.local` with `/opt/infraege` paths.

### Plan

Create `ops/fail2ban/jail.local` from template replacing `template-app` with `infraege`.

### Implementation Log

Created `ops/fail2ban/jail.local` from template with `/opt/infraege/var/nginx-logs/` paths.

### Verification

File created and reviewed.

### Residual Risks

Admin IP must still be replaced manually (`REPLACE_WITH_ADMIN_IP` placeholder). This is intentional — the admin IP is VPS-specific and not committed to the repository.

---

## T1 — verify and update docs/production-runbook.md for revised Phase 07 scope

**Status:** implemented
**Depends on:** I6, I7

### Contract Snapshot

Runbook covers deployment, rollback, monitoring via SSH tunnel, and security response; backup-drill steps removed (deferred).

### Exploration

`docs/production-runbook.md` had outdated references to backup scripts (`scripts/backup.sh`, `scripts/restore-check.sh`), generic `yourdomain.com` references, and lacked SSH tunnel monitoring and security response sections.

### Plan

Rewrite runbook with: deployment steps, rollback steps, site-down triage, SSH tunnel section for Gatus, disk management, security incident response, TLS renewal, and first VPS acceptance checklist. Remove all backup-drill references.

### Implementation Log

Rewrote `docs/production-runbook.md` with `infraege.ru`-specific commands and sections for: Deployment, Rollback, Site Is Down, Monitoring via SSH Tunnel, Disk Is Filling, Security Incident Response, TLS Certificate Renewal, First VPS Acceptance Checklist.

### Verification

Reviewed final file state.

### Residual Risks

None

---

---

## Review Notes Fixes

### R1 — Fix 404 on POST /api/v1/public/events/pageview

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

При открытии приложения в браузере сразу получается ошибка на эндпоинте `/api/v1/public/events/pageview` POST 404 Not Found с телом `{"path": "/login","session_id": "6059ebc648f5f456"}`. Выяснить причину и исправить.

#### Safety Check

No schema, API contract, auth, or SPEC-level change. The endpoint and payload are unchanged. Only the URL construction in the client-side tracker is being fixed — same request, correct target server.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `frontend/app/root.tsx:34` — `fetch('/api/v1/public/events/pageview', ...)` uses a hardcoded relative URL
- `frontend/app/shared/api/client.ts:67-68` — all other API calls use `env.client.apiBaseUrl` (absolute URL, `VITE_API_BASE_URL` or `http://localhost:8000` fallback)
- `frontend/app/shared/config/env.ts:82-87` — `readClientApiBaseUrl()` resolves to `http://localhost:8000/` in dev

**Observed issue:**
- When the browser accesses the app directly at `http://localhost:3000` (Vite dev server / React Router SSR port), the relative URL `/api/v1/public/events/pageview` resolves to `http://localhost:3000/api/v1/public/events/pageview`
- The React Router SSR server has no route for this path → returns 404
- The nginx dev config at port 80 would proxy `/api/` correctly, but `VITE_API_BASE_URL` defaults to `http://localhost:8000` for all other API calls — the tracker is the only call using a relative URL

**Risk areas:**
- None; `env.client.apiBaseUrl` is already used for all other API calls and has a robust default

#### Plan

- **Done when:** `usePageviewTracker` constructs the full URL using `env.client.apiBaseUrl`, consistent with the rest of the API client; no 404 when opening the app in dev
- **Files:** `frontend/app/root.tsx`
- **Steps:**
  1. Import `env` from `@shared/config/env`
  2. Replace hardcoded `/api/v1/public/events/pageview` with an absolute URL built from `env.client.apiBaseUrl`
- **Checks:** `cd frontend && pnpm typecheck`

#### Implementation Log

Modified `frontend/app/root.tsx`:
- Added `import { env } from '@shared/config/env'`
- Added `buildPageviewUrl()` helper that constructs an absolute URL from `env.client.apiBaseUrl`
- Replaced hardcoded `/api/v1/public/events/pageview` with `buildPageviewUrl()` call in `usePageviewTracker`

#### Verification

`cd frontend && pnpm typecheck` → no errors. `uv run pytest tests/ -q` → 71 passed.

#### Residual Risks

None. `env.client.apiBaseUrl` defaults to `http://localhost:8000` in dev (same as all other API calls), and is set to the production domain in production builds.

---

### R2 — Add dev-only credential pre-fill section to login form

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

При входе в систему в dev-режиме/при разработке всегда нужно вручную вводить тестовые данные. Добавить в форму входа секцию с предзаполнением данных для студента и администратора. Только в dev-режиме.

#### Safety Check

Dev-only UI change (`import.meta.env.DEV`). No API contract, schema, auth behavior, or SPEC change. Pre-fills form fields only — the same login mutation is called on submit. No credentials stored beyond the component state that already exists.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `frontend/app/features/auth/login-form.tsx` — `LoginForm` component with `email`/`password` state and controlled inputs; `setEmail`/`setPassword` setters are already available
- `app/seeders/users.py:12-23` — seed credentials: admin `admin@example.com` / `Admin1234!`; student `user@example.com` / `User1234!`

**Observed issue:**
- No quick-fill mechanism exists; developer must type credentials manually each time

**Risk areas:**
- Must guard with `import.meta.env.DEV` so the section is tree-shaken in production builds

#### Plan

- **Done when:** Login form in dev mode shows a collapsible "Dev quick-fill" section with two buttons that pre-fill email + password for admin and student accounts
- **Files:** `frontend/app/features/auth/login-form.tsx`
- **Steps:**
  1. Add `DEV_ACCOUNTS` constant inside the `DEV` guard
  2. Add a small "Quick fill" UI block below the main form (visible only when `import.meta.env.DEV`)
  3. Each button calls `setEmail` + `setPassword` with the account credentials
- **Checks:** `cd frontend && pnpm typecheck`

#### Implementation Log

Modified `frontend/app/features/auth/login-form.tsx`:
- Added a `{import.meta.env.DEV ? (...) : null}` block after the existing form buttons
- Two buttons: "Администратор" (fills `admin@example.com` / `Admin1234!`) and "Студент" (fills `user@example.com` / `User1234!`)
- Uses existing `setEmail`/`setPassword` state setters — no new state or deps
- Credentials match `app/seeders/users.py` seed data

#### Verification

`cd frontend && pnpm typecheck` → no errors. `uv run pytest tests/ -q` → 71 passed.

#### Residual Risks

None. `import.meta.env.DEV` is a Vite compile-time constant; the block is tree-shaken in production builds.

---

### R3 — Skip stale guest progress attempts during sync

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

After logging in as admin/student, `POST /api/v1/public/progress/sync` returned `500 Internal Server Error` for guest attempts whose `practiceItemId` values came from browser storage.

#### Safety Check

No schema, endpoint path, request body, response body, auth, or SPEC-level change. Existing `{synced, updated}` response stays unchanged. The sync service now ignores stale guest attempt IDs that no longer exist in `practice_items`.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `app/modules/users/repository.py` — `bulk_sync()` inserted every incoming `practice_item_id` directly into `user_attempts`
- `tests/test_progress_api.py` — sync endpoint tests covered valid inserts, idempotency, auth, and payload cap, but not stale localStorage IDs

**Observed issue:**
- Browser guest progress can outlive DB reseeds/content imports. When a stale `practiceItemId` is synced, the database foreign key can reject the insert and surface as a 500.

**Risk areas:**
- Skipped stale attempts are not included in `synced` or `updated`; this matches the unchanged response contract but intentionally discards unusable guest data.

#### Plan

- **Done when:** stale `practiceItemId` values return 200 and are skipped; mixed payloads still sync valid attempts
- **Files:** `app/modules/users/repository.py`, `tests/test_progress_api.py`
- **Steps:** prefetch existing `PracticeItem.id` values, skip missing IDs before insert/update, add regression tests
- **Checks:** `uv run pytest tests/test_progress_api.py -q`

#### Implementation Log

Modified `UserAttemptRepository.bulk_sync()` to:
- return early for empty payloads
- query existing practice item IDs once per sync payload
- skip attempts whose `practice_item_id` is not present

Added backend regression tests for unknown-only and mixed unknown/valid sync payloads.

#### Verification

`uv run pytest tests/test_progress_api.py -q` → 11 passed.

#### Residual Risks

None.

---

### R6 — Minimal global scrollbar styling

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

Improve app scrollbar styling in a minimal style with stronger UI/UX.

#### Safety Check

CSS-only frontend change. No API, schema, auth, persistence, or SPEC-level behavior changed.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `frontend/app/styles/app.css` — global Tailwind layers and design tokens
- Context7 Tailwind docs — custom global styles belong in `@layer base`

**Observed issue:**
- The app relied on browser-default scrollbars, which looked visually disconnected from the restrained UI.

**Risk areas:**
- Scrollbar pseudo-elements are browser-specific, so styles include both standards-based `scrollbar-color` / `scrollbar-width` and WebKit pseudo-elements.

#### Plan

- **Done when:** global scrollbars are thin, neutral, transparent-track, hover-responsive, and theme-aware
- **Files:** `frontend/app/styles/app.css`
- **Steps:** add global base-layer scrollbar styling using foreground tokens and preserve transparent tracks
- **Checks:** `cd frontend && pnpm typecheck`

#### Implementation Log

Added minimal global scrollbar styling in `@layer base`: thin standards scrollbars, WebKit width/height, transparent tracks, rounded thumbs, and hover contrast using `--foreground` so dark mode remains legible.

#### Verification

`cd frontend && pnpm typecheck` → passed.

#### Residual Risks

None.

---

### R7 — Replace loading text with skeleton states

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

Improve loading component styling; use skeletons where possible and keep loading work parallel where reasonable.

#### Safety Check

Frontend-only rendering change. No API, data contract, auth, schema, or SPEC-level behavior changed.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `frontend/app/shared/ui/page-skeleton.tsx` and `section-skeleton.tsx` — existed but used ad hoc divs
- `frontend/app/pages/admin/status/index.tsx`, `admin/analytics/index.tsx`, `admin/feedback/index.tsx`, `pages/profile/index.tsx`, `features/practice-trainer/practice-trainer.tsx` — visible loading text placeholders
- Context7 shadcn docs — Skeleton primitive pattern is `animate-pulse` plus muted rounded block

**Observed issue:**
- Several pages swapped compact loading text for full content, creating abrupt visual changes and less polished perceived performance.

**Risk areas:**
- Loading text is kept as screen-reader-only text where tests and accessibility benefit from a named loading state.

#### Plan

- **Done when:** common loading states use reusable skeleton blocks that approximate final layout dimensions
- **Files:** `frontend/app/shared/ui/skeleton.tsx`, `frontend/app/shared/ui/page-skeleton.tsx`, `frontend/app/shared/ui/section-skeleton.tsx`, admin pages, profile page, practice trainer
- **Steps:** add shadcn-style `Skeleton`, refactor generic skeletons, replace page-level loading text with skeleton layouts, keep `aria-busy` / `aria-live`
- **Checks:** `cd frontend && pnpm test -- admin-feedback profile-page practice-routes navigation-progress`, `cd frontend && pnpm typecheck`

#### Implementation Log

Added `@shared/ui/skeleton` and refactored shared skeleton components to use it. Replaced admin status, admin analytics, admin feedback, profile, and practice trainer loading states with skeleton layouts that reserve final content structure. Existing independent queries still execute through React Query without adding artificial sequencing.

#### Verification

`cd frontend && pnpm test -- admin-feedback profile-page practice-routes navigation-progress` → 28 files passed, 94 tests passed.
`cd frontend && pnpm typecheck` → passed.

#### Residual Risks

None.

---

### R8 — Prevent scrollbar-driven layout shift

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

Investigate and plan a fix for global layout shifting caused by scrollbars appearing and disappearing across pages.

#### Safety Check

CSS-only layout stability change. No API, schema, auth, persistence, or SPEC-level behavior changed.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `frontend/app/styles/app.css` — global `html` / `body` base styles
- Multiple pages use content-dependent heights, so route transitions can cross the viewport-height threshold and toggle the page scrollbar

**Observed issue:**
- When a route changes from non-scrollable to scrollable content or back, the viewport width can change on platforms with classic scrollbars, shifting centered shells and fixed-width layouts horizontally.

**Risk areas:**
- `scrollbar-gutter` support varies by browser; `overflow-y: scroll` on `html` is used as the compatibility baseline.

#### Plan

- **Done when:** the document reserves vertical scrollbar space consistently so page shells do not jump when content height changes
- **Files:** `frontend/app/styles/app.css`
- **Steps:** add `scrollbar-gutter: stable` on document roots and force a stable vertical scroll container with `html { overflow-y: scroll; }`
- **Checks:** `cd frontend && pnpm typecheck`

#### Implementation Log

Added `scrollbar-gutter: stable` to `html, body` and `overflow-y: scroll` to `html`, keeping the vertical scrollbar gutter stable across pages. This implements the plan directly for the root cause without per-page layout hacks.

#### Verification

`cd frontend && pnpm typecheck` → passed.

#### Residual Risks

None.

---

### R4 — Remove false logged-out profile flicker on reload

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

After logging in and reloading the browser, `/profile` briefly showed the logged-out message `Войди в аккаунт, чтобы видеть прогресс` before auth finished initializing.

#### Safety Check

Frontend-only rendering change. No token storage format, auth endpoint, backend auth behavior, schema, or SPEC-level contract changed.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `frontend/app/pages/profile/index.tsx` — rendered logged-out CTA immediately when `isAuthenticated` was false
- `frontend/app/shared/api/auth.ts` — token state is read from localStorage, which cannot be known in SSR markup
- `frontend/app/shared/ui/app-top-bar.tsx` and `frontend/app/features/auth/use-auth-guard.ts` — also used auth state before client readiness

**Observed issue:**
- SSR and first hydration render cannot safely know localStorage tokens, so auth-dependent UI can momentarily render the logged-out branch for an authenticated browser session.

**Risk areas:**
- A neutral loading state is shown until the client mounts; this avoids false unauthenticated UI without introducing cookie-based server auth.

#### Plan

- **Done when:** `/profile` renders a neutral loading state before client auth readiness and never shows the logged-out CTA for cached authenticated sessions during hydration
- **Files:** `frontend/app/shared/hooks/use-client-mounted.ts`, `frontend/app/shared/api/auth.ts`, `frontend/app/pages/profile/index.tsx`, `frontend/app/shared/ui/app-top-bar.tsx`, `frontend/app/features/auth/use-auth-guard.ts`, `frontend/app/entities/user/api/user-queries.ts`, `frontend/tests/profile-page.test.tsx`
- **Steps:** add client-mounted readiness hook, expose `isAuthReady`, gate profile/top-bar/auth-guard rendering, and disable progress query until auth is ready and authenticated
- **Checks:** `cd frontend && pnpm test -- profile-page navigation-progress`, `cd frontend && pnpm typecheck`

#### Implementation Log

Added `useClientMounted()` and exposed `isAuthReady` from `useSessionSummary()`. Updated profile rendering to show the existing neutral statistics loading message before readiness, updated top-bar auth actions to reserve space without showing a false login link, and delayed auth-guard redirects until auth readiness. `useProgressMeQuery()` now accepts an `enabled` option so profile does not fire authenticated progress calls before auth state is settled.

Updated profile tests to assert the logged-out CTA is not rendered before client auth readiness, including with cached auth token data.

#### Verification

`cd frontend && pnpm test -- profile-page navigation-progress` → 28 files passed, 94 tests passed.
`cd frontend && pnpm typecheck` → passed.

#### Residual Risks

None. SSR still cannot know localStorage auth, but it now renders neutral UI instead of an incorrect logged-out state.

---

### R5 — Add NavigationProgress for pending route transitions

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

Add a `NavigationProgress` element and implement it for shadcn + React Router v7.

#### Safety Check

Frontend-only UI addition. No API, schema, auth, security, or SPEC-level behavior changed.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `frontend/components.json` — shadcn aliases map UI primitives to `@shared/ui`
- `frontend/app/root.tsx` — root app shell where a global navigation indicator belongs
- Context7 React Router docs — global pending UI uses `useNavigation()` and checks `navigation.state` / `navigation.location`
- Context7 shadcn docs — `Progress` primitive exposes `<Progress value={...} />`

**Observed issue:**
- No global pending route UI existed, so route transitions with loaders could feel unresponsive.

**Risk areas:**
- Very fast navigations should not flash; a short show delay is used.

#### Plan

- **Done when:** root app renders a fixed top progress bar during pending React Router navigations and hides it while idle
- **Files:** `frontend/app/shared/ui/progress.tsx`, `frontend/app/shared/ui/navigation-progress.tsx`, `frontend/app/root.tsx`, `frontend/tests/navigation-progress.test.tsx`
- **Steps:** add shadcn-style Progress primitive, add NavigationProgress with `useNavigation()` and a short delay, mount it in root, add render tests for hidden/visible states
- **Checks:** `cd frontend && pnpm test -- profile-page navigation-progress`, `cd frontend && pnpm typecheck`

#### Implementation Log

Added `Progress` primitive in `@shared/ui/progress`, added `NavigationProgress` and `NavigationProgressView` in `@shared/ui/navigation-progress`, and mounted `NavigationProgress` inside `AppProvider` in `root.tsx`. The indicator uses `navigation.state !== "idle"` or `navigation.location`, appears after 120ms, and renders a slim fixed top bar.

Added `navigation-progress.test.tsx` for hidden and visible progress rendering.

#### Verification

`cd frontend && pnpm test -- profile-page navigation-progress` → 28 files passed, 94 tests passed.
`cd frontend && pnpm typecheck` → passed.

#### Residual Risks

None.

---

### R9 — Add reachable admin navigation and e2e route coverage

**Status:** fixed
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

В рамках 7 фазы был реализован функционал и маршруты роутинга, на которые нельзя перейти и посмотреть информацию. Вероятно, недостаточно e2e тестов, которые проверяют сценарии и реализованный функционал. Решить проблему.

#### Safety Check

Frontend navigation and test coverage change only. No API path, API payload, persistent schema, auth policy, secrets, or SPEC-level behavior is changed.

#### Exploration

_Explored:_ 2026-05-29 · _Verdict:_ ready

**Relevant code:**
- `frontend/app/routes.ts` — declares `/admin/feedback`, `/admin/status`, and `/admin/analytics`
- `frontend/app/shared/ui/app-top-bar.tsx` — authenticated admins only get one generic `Админ` link to `/admin/feedback`
- `frontend/app/pages/admin/feedback/index.tsx`, `frontend/app/pages/admin/status/index.tsx`, `frontend/app/pages/admin/analytics/index.tsx` — admin pages exist but do not expose cross-links to the other Phase 07 admin pages
- `frontend/tests/e2e/` — no e2e coverage for newly added Phase 07 admin routes
- Context7 React Router docs — route config uses `route("path", "./file.tsx")`; navigation should use `Link`/`NavLink` style links to concrete paths
- Context7 Playwright docs — prefer accessible locators like `getByRole('link', { name })` and web-first assertions such as `toBeVisible()` / `toHaveURL()`

**Observed issue:**
- The new Phase 07 routes are technically declared, but there is no discoverable in-app way to move from the admin entry point to status or analytics.
- Route smoke coverage only checks `admin/feedback`; e2e tests do not cover reaching the new admin surfaces.

**Risk areas:**
- E2E tests must mock admin-authenticated API responses with broad URL matchers because the client API base URL can be absolute (`http://localhost:8000`) in dev.

#### Plan

- **Done when:** an admin can navigate from the admin area to Feedback, Status, and Analytics; tests verify declared routes and clickable admin navigation.
- **Files:** `frontend/app/shared/ui/admin-nav.tsx`, `frontend/app/pages/admin/feedback/index.tsx`, `frontend/app/pages/admin/status/index.tsx`, `frontend/app/pages/admin/analytics/index.tsx`, `frontend/tests/smoke.test.ts`, `frontend/tests/e2e/admin-navigation.spec.ts`, `docs/PHASE_07.md`, `docs/PHASE_07_NOTES.md`
- **Steps:**
  1. Add a reusable admin sub-navigation with links to all admin Phase 07 pages.
  2. Render the sub-navigation on every admin page.
  3. Extend route smoke coverage for `/admin/status` and `/admin/analytics`.
  4. Add a Playwright e2e scenario that authenticates as admin via mocked APIs and clicks through all admin links.
- **Checks:** `cd frontend && pnpm test -- smoke`, `cd frontend && pnpm test:e2e:lint`, `cd frontend && pnpm typecheck`

#### Implementation Log

Added `AdminNav` with accessible links to Feedback, Status, and Analytics and rendered it on every admin page. Updated route smoke coverage to include `admin/status` and `admin/analytics`. Added `admin-navigation.spec.ts`, which mocks an admin session and Phase 07 admin API responses, then clicks through `/admin/feedback` → `/admin/status` → `/admin/analytics` → `/admin/feedback`.

#### Verification

`cd frontend && pnpm test -- smoke` → 28 files passed, 94 tests passed.
`cd frontend && pnpm test:e2e:lint` → clean, 6 spec files checked.
`cd frontend && pnpm typecheck` → passed.
`cd frontend && PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test tests/e2e/admin-navigation.spec.ts --project=chromium` with local `pnpm dev` server → 1 passed.

#### Residual Risks

None.
