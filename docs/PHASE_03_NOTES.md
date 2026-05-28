# PHASE 03 — Agent Execution Memory

<!--
  WHAT to build -> docs/PHASE_03.md
  HOW it was built -> this file

  This file is agent-owned execution memory. It is not intended for human review or manual edits.
  The agent updates it during /impl-assist and /impl-review-notes so future sessions can resume
  without reconstructing context from chat history.

  Sync rule: task IDs (B1, F1, I1, D1, T1) must match the Scope checklist in PHASE_03.md.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete
  historical execution memory unless the phase file explicitly removes the task.
-->

_Phase:_ `03` · _Generated:_ `2026-05-28`

---

## B1 — Implement public published-task catalog endpoint `GET /api/v1/public/tasks` with search and difficulty filters over imported Phase 02 task content

**Status:** implemented
**Depends on:** —

### Contract Snapshot
2026-05-28: Build `GET /api/v1/public/tasks` without auth. Response exposes published tasks only, supports optional search and `TaskDifficulty` filters, orders the imported task catalog consistently, and returns public summary fields without practice answer internals.

### Exploration
2026-05-28: Inspected `docs/STACK.md`, `docs/PHASE_03.md`, `docs/CONTEXT.md`, `docs/KNOWN_GOTCHAS.md`, `app/api/v1/router.py`, `app/modules/tasks/{models,repository,schemas}.py`, `tests/conftest.py`, and content import tests. Current tasks module has persisted `Task`/`PracticeItem` models and importer upsert repository methods, but no public router or service. Existing repository already eager-loads practice rows for slug/all reads.

### Plan
- **Done when:** public catalog endpoint returns only `ContentStatus.published` tasks, applies search/difficulty filters, includes practice counts, and excludes answer fields.
- **Files:** `app/modules/tasks/api.py`, `app/modules/tasks/repository.py`, `app/modules/tasks/schemas.py`, `app/modules/tasks/service.py`, `app/api/v1/router.py`, `tests/test_tasks_api.py`.
- **Steps:** add public schemas; add repository methods for published listing/detail; add service mapping from ORM to public DTOs; register FastAPI router; cover endpoint contracts with tests.
- **Checks:** `uv run pytest tests/test_tasks_api.py`.

### Implementation Log
2026-05-28: Added `app/modules/tasks/api.py` and `service.py`, registered the tasks router in `app/api/v1/router.py`, added public task summary/detail schemas, and added repository methods for published catalog/detail reads. Search filtering is applied after the published/difficulty DB filter with Python `casefold()` to keep Cyrillic behavior consistent in SQLite tests and PostgreSQL deployments.

### Verification
2026-05-28: `uv run pytest tests/test_tasks_api.py` — PASS. `uv run pytest` — PASS, 40 tests.

### Residual Risks

None

---

## B2 — Implement public published-task detail endpoint `GET /api/v1/public/tasks/{slug}` with theory HTML, TOC, metadata, and practice CTA data, while excluding draft tasks and answer internals

**Status:** implemented
**Depends on:** B1

### Contract Snapshot
2026-05-28: Build `GET /api/v1/public/tasks/{slug}` without auth. Response exposes published tasks only, includes theory HTML, TOC, asset manifest, metadata, and practice CTA preview rows, and must not expose `expected_value`, answer patterns, validation results, or draft tasks.

### Exploration
2026-05-28: Same backend task files inspected for B1. Existing `Task.task_metadata` maps to the database `metadata` column; public API must emit `metadata`. `PracticeItem` contains answer internals, so public detail needs a separate preview schema.

### Plan
- **Done when:** public detail endpoint returns the required detail payload for published slugs, returns 404 for drafts/missing slugs, and excludes all answer internals.
- **Files:** `app/modules/tasks/api.py`, `app/modules/tasks/repository.py`, `app/modules/tasks/schemas.py`, `app/modules/tasks/service.py`, `app/api/v1/router.py`, `tests/test_tasks_api.py`.
- **Steps:** add detail DTO and preview DTO; add published slug lookup; map ORM detail payload in service; raise HTTP 404 at API boundary.
- **Checks:** `uv run pytest tests/test_tasks_api.py`.

### Implementation Log
2026-05-28: Added public detail mapping with `theoryHtml`, `theoryToc`, `assetManifest`, `metadata`, and `practice` preview rows. The public practice schema only exposes `id`, `taskId`, `position`, and `year`; answer patterns, expected values, prompts, explanations, and validation details are not included.

### Verification
2026-05-28: `uv run pytest tests/test_tasks_api.py` — PASS. Detail tests cover published payload, draft/missing 404, and no answer-internal leakage.
2026-05-28: Phase gate smoke exposed real imported TOC items use `level` instead of fixture-only `depth`; updated the public TOC schema to accept both input keys while serializing `depth`, and updated the focused backend test fixture to cover the real importer shape.

### Residual Risks

None

---

## B3 — Add backend tests for catalog/detail contracts, published-only filtering, search/difficulty filters, not-found behavior, and no `expected_value` leakage

**Status:** implemented
**Depends on:** B1, B2

### Contract Snapshot
2026-05-28: Add backend tests for catalog/detail response contracts, published-only filtering, search/difficulty behavior, not-found responses, and absence of `expected_value` leakage.

### Exploration
2026-05-28: Existing async API tests use `httpx.AsyncClient` with the FastAPI app and a rollbacked SQLAlchemy session. SQLite test compatibility for JSONB/CITEXT is already patched in `tests/conftest.py`.

### Plan
- **Done when:** focused backend tests fail on the old placeholder implementation and pass after public task endpoints are implemented.
- **Files:** `tests/test_tasks_api.py`.
- **Steps:** create published/draft task fixtures directly through ORM; test catalog filters; test detail; assert draft/missing 404; assert serialized payloads do not contain answer internals.
- **Checks:** `uv run pytest tests/test_tasks_api.py`.

### Implementation Log
2026-05-28: Added `tests/test_tasks_api.py` with ORM fixtures for published basic/high tasks plus a draft task. Tests cover catalog ordering, published-only filtering, search/difficulty filters, detail contract, draft/missing 404s, and absence of `expected_value`/`answer_pattern` in public responses.

### Verification
2026-05-28: `uv run pytest tests/test_tasks_api.py` — PASS, 4 tests. `uv run pytest` — PASS, 40 tests.

### Residual Risks

None

---

## F1 — Replace the home route with the Phase 03 public landing experience linking to the catalog and trainer entry points, using Russian copy and design references

**Status:** implemented
**Depends on:** —

### Contract Snapshot
2026-05-28: Replace `/` placeholder with a Russian-first public landing page linking users to `/topics` and trainer/practice entry points. Follow Phase 03 visual references and do not implement future trainer behavior.

### Exploration
2026-05-28: Inspected `frontend/app/routes/_index.tsx`, `frontend/app/pages/home/index.tsx`, shared top bar/button/link UI, and `frontend/app/styles/app.css`. Current home page is a simple Phase 01 hero with links to `/topics` and `/practice/demo`.

### Plan
- **Done when:** home route renders a richer public landing experience with Russian copy, catalog CTA, trainer CTA, and responsive editorial layout.
- **Files:** `frontend/app/pages/home/index.tsx`, `frontend/app/routes/_index.tsx`, `frontend/app/styles/app.css`.
- **Steps:** replace hero copy/layout; keep public metadata; add route links only to in-scope public/catalog/practice entry paths.
- **Checks:** `cd frontend && pnpm test -- tasks-api.test.ts task-routes.test.tsx seo.test.ts smoke.test.ts`.

### Implementation Log
2026-05-28: Replaced the home page with a Russian-first public landing layout, catalog/trainer CTAs, quick links, and responsive CSS matching the existing warm paper/ink design tokens.

### Verification
2026-05-28: `cd frontend && pnpm test` — PASS, 19 files / 56 tests. `cd frontend && pnpm typecheck` — PASS. Scoped ESLint over phase-owned frontend files — PASS.

### Residual Risks

None

---

## F2 — Build `/topics` as an SSR public catalog for all published tasks with client search, difficulty filters, progress placeholders where server progress is unavailable, and mobile/desktop responsive layouts

**Status:** implemented
**Depends on:** B1, F4

### Contract Snapshot
2026-05-28: Build `/topics` as SSR public catalog over published tasks from `GET /api/v1/public/tasks`, with client-side search, difficulty filters, progress placeholders when server progress is unavailable, and responsive mobile/desktop layouts.

### Exploration
2026-05-28: Current `frontend/app/routes/topics.tsx` renders `PlaceholderPage`. `frontend/app/shared/api/client.ts` supports typed GET requests and query params. Tests run in Node via Vitest; existing e2e only checks SSR HTML metadata.

### Plan
- **Done when:** `/topics` route loader fetches public tasks, route component renders filterable catalog cards/table, empty/error states are available, and task links point to `/tasks/:slug`.
- **Files:** `frontend/app/routes/topics.tsx`, `frontend/app/pages/topics/index.tsx`, `frontend/app/features/task-filters/task-filter-bar.tsx`, `frontend/app/entities/task/ui/difficulty-chip.tsx`, `frontend/app/styles/app.css`, task API/type files.
- **Steps:** create catalog page component; implement client filtering; show progress placeholders; wire route loader and metadata.
- **Checks:** `cd frontend && pnpm test -- tasks-api.test.ts task-routes.test.tsx seo.test.ts smoke.test.ts`.

### Implementation Log
2026-05-28: Added SSR `/topics` loader backed by `listPublicTasks()`, created `TopicsPage`, client-side catalog filters, difficulty chips, empty state, progress placeholders, and responsive catalog card/table-like layouts.

### Verification
2026-05-28: `cd frontend && pnpm test` — PASS, 19 files / 56 tests. `cd frontend && pnpm typecheck` — PASS. Scoped ESLint over phase-owned frontend files — PASS.

### Residual Risks

None

---

## F3 — Build `/tasks/:slug` as an SSR theory page with metadata, TOC, sanitized content rendering, code block styling, asset rendering, and CTA to `/practice/:id` without implementing trainer behavior

**Status:** implemented
**Depends on:** B2, F4

### Contract Snapshot
2026-05-28: Build `/tasks/:slug` as SSR theory page over `GET /api/v1/public/tasks/{slug}` with metadata, TOC, sanitized theory HTML rendering, code block styling, asset rendering from imported HTML, and CTA to `/practice/:id` without implementing trainer behavior.

### Exploration
2026-05-28: Current `frontend/app/routes/task.tsx` renders `PlaceholderPage`. Existing `sanitizeTheoryHtml` is an allowlist sanitizer intended for Phase 02 Markdown HTML before `dangerouslySetInnerHTML`.

### Plan
- **Done when:** task route loader fetches detail by slug, route metadata uses task content, page renders theory/TOC/assets/practice CTA previews, and sanitized HTML is used for raw theory content.
- **Files:** `frontend/app/routes/task.tsx`, `frontend/app/pages/task/index.tsx`, `frontend/app/shared/ui/code-block.tsx`, `frontend/app/styles/app.css`, task API/type files.
- **Steps:** create theory page component; use sanitizer before raw HTML rendering; render TOC and metadata sidebars; link first practice preview to `/practice/:id`.
- **Checks:** `cd frontend && pnpm test -- tasks-api.test.ts task-routes.test.tsx seo.test.ts smoke.test.ts`.

### Implementation Log
2026-05-28: Added SSR `/tasks/:slug` loader backed by `getPublicTask()`, dynamic task metadata/canonical handling, sanitized theory HTML rendering, TOC sidebar, metadata/action area, and CTA links to `/practice/:id` without implementing trainer behavior. Preserved heading `id` attributes in the sanitizer for imported TOC anchors.

### Verification
2026-05-28: `cd frontend && pnpm test` — PASS, 19 files / 56 tests. `cd frontend && pnpm typecheck` — PASS. Scoped ESLint over phase-owned frontend files — PASS.

### Residual Risks

None

---

## F4 — Add frontend task API helpers, query keys, shared task types, loading/error/empty states, and route metadata/canonical helpers for public task pages

**Status:** implemented
**Depends on:** B1, B2

### Contract Snapshot
2026-05-28: Add frontend task API helpers, query keys, shared task types, loading/error/empty states, and route metadata/canonical helpers for public task pages.

### Exploration
2026-05-28: Inspected `frontend/app/shared/api/{client,keys,query-client}.ts`, `frontend/app/shared/lib/seo.ts`, `frontend/app/shared/types/schema.ts`, `frontend/app/shared/ui/{error-state,page-skeleton,section-skeleton}.tsx`, and package versions. Existing generated OpenAPI schema lacks task endpoints until backend schema generation is rerun.

### Plan
- **Done when:** task domain exposes shared types, API functions, query options/keys, reusable UI states, and SEO helpers for catalog/detail routes.
- **Files:** `frontend/app/entities/task/model/task.types.ts`, `frontend/app/entities/task/api/tasks.ts`, `frontend/app/entities/task/api/task-queries.ts`, `frontend/app/shared/api/keys.ts`, `frontend/app/shared/lib/seo.ts`, `frontend/app/shared/types/schema.ts`, page/route files.
- **Steps:** add task type aliases from OpenAPI schema; add API functions and query options; extend SEO helper public route handling; regenerate OpenAPI schema after backend endpoints exist.
- **Checks:** `cd frontend && pnpm typecheck`; focused Vitest route/API tests.

### Implementation Log
2026-05-28: Added task type aliases, API helper functions, TanStack Query options, task query keys, catalog/task SEO helpers, regenerated `frontend/app/shared/types/schema.ts` from backend OpenAPI, and added a reusable code block component/style surface.

### Verification
2026-05-28: `pnpm generate:api` — PASS against local FastAPI OpenAPI server. `cd frontend && pnpm typecheck` — PASS. Scoped ESLint over phase-owned frontend files — PASS.

### Residual Risks

None

---

## F5 — Add frontend unit and route/e2e coverage for home, catalog filters, theory rendering, responsive layout smoke checks, and public SEO metadata

**Status:** implemented
**Depends on:** F1, F2, F3, F4

### Contract Snapshot
2026-05-28: Add frontend unit and route/e2e coverage for home, catalog filters, theory rendering, responsive layout smoke checks, and public SEO metadata.

### Exploration
2026-05-28: Existing frontend tests are mostly pure Node Vitest tests plus Playwright SSR metadata smoke tests. No Testing Library/jsdom setup exists, so focused component checks should use server rendering or pure helpers where possible.

### Plan
- **Done when:** frontend tests cover task API helper URLs/query params, catalog filter behavior, route metadata and loader rendering assumptions, sanitized theory rendering, and e2e public SEO pages.
- **Files:** `frontend/tests/tasks-api.test.ts`, `frontend/tests/task-routes.test.tsx`, `frontend/tests/e2e/public-catalog.spec.ts`, `frontend/tests/e2e/seo.spec.ts`.
- **Steps:** mock fetch for API helpers; export pure catalog filter helper for tests; render React pages to static markup in Node tests; extend e2e metadata smoke checks for `/topics`.
- **Checks:** `cd frontend && pnpm test -- tasks-api.test.ts task-routes.test.tsx seo.test.ts smoke.test.ts`; `cd frontend && pnpm test:e2e:lint`.

### Implementation Log
2026-05-28: Added `frontend/tests/tasks-api.test.ts`, `frontend/tests/task-routes.test.tsx`, and `frontend/tests/e2e/public-catalog.spec.ts`; extended SEO tests for public task routes.

### Verification
2026-05-28: `cd frontend && pnpm test` — PASS, 19 files / 56 tests. `cd frontend && pnpm test:e2e:lint` — PASS, 2 spec files. Scoped ESLint over phase-owned frontend files — PASS. Full `pnpm lint` was attempted but still fails on pre-existing formatting in `frontend/app/features/auth/{login-form,register-form}.tsx` and `frontend/app/shared/ui/app-top-bar.tsx`; those files were outside Phase 03 scope. Full Playwright e2e was not run because this workflow does not start the built frontend/backend stack.
2026-05-28: Phase gate smoke exposed the Compose backend started with no public tasks because repository content was not imported by startup. Marked the 27 repository task files as `published`, copied `content/` into the backend image, and added startup content import after seeders so a fresh Compose database exposes the public catalog.

### Residual Risks
Full browser e2e remains for `/phase-gate 03`.

---

<!-- /impl-review-notes appends this section when Architect Review Notes need fixes.

## Review Notes Fixes

### R1 — short note title

**Status:** open
**Source:** `docs/PHASE_03.md` § Architect Review Notes

#### Source Note

#### Safety Check

#### Exploration

#### Plan

#### Implementation Log

#### Verification

#### Residual Risks
-->
