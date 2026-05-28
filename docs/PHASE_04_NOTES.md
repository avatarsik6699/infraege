# PHASE 04 — Agent Execution Memory

<!--
  WHAT to build -> docs/PHASE_04.md
  HOW it was built -> this file

  This file is agent-owned execution memory. It is not intended for human review or manual edits.
  The agent updates it during /impl-assist and /impl-review-notes so future sessions can resume
  without reconstructing context from chat history.

  Sync rule: task IDs (B1, F1, I1, D1, T1) must match the Scope checklist in PHASE_04.md.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete
  historical execution memory unless the phase file explicitly removes the task.
-->

_Phase:_ `04` · _Generated:_ `2026-05-28`

---

## B1 — Implement public practice endpoint `GET /api/v1/public/practice/{task_id}` returning published task practice items without `expected_value` internals

**Status:** implemented
**Depends on:** —

### Contract Snapshot
2026-05-28: Add `GET /api/v1/public/practice/{task_id}` for published-task practice items only. Response must include `PublicPracticeItem` fields and exclude `expected_value`, `answer_pattern`, and validation state.

### Exploration
2026-05-28: Existing task API is in `app/modules/tasks/api.py` under `/public/tasks`; service/repository already load `Task.practice_items` via `selectinload` and phase 03 tests assert answer internals do not leak from catalog/detail.

### Plan
2026-05-28:
- Done when: published task ID returns ordered public practice items; draft/missing task IDs return 404; no answer internals appear in response.
- Files: `app/modules/tasks/api.py`, `app/modules/tasks/repository.py`, `app/modules/tasks/schemas.py`, `app/modules/tasks/service.py`, `tests/test_practice_api.py`.
- Steps: add public schemas, repository lookup by published task ID, service mapper, API route.
- Checks: `uv run pytest tests/test_practice_api.py`.

### Implementation Log
2026-05-28: Added `PublicPracticeItem`, repository lookup by published task UUID, service mapper, and `GET /api/v1/public/practice/{task_id}` under the public router. Practice response maps code blocks and task metadata but omits answer internals.

### Verification
2026-05-28: `uv run pytest tests/test_practice_api.py tests/test_tasks_api.py` — PASS. `uv run pytest` — PASS, 46 tests. `uv run ruff check app tests` — PASS.

### Residual Risks

None

---

## B2 — Implement public validation endpoint `POST /api/v1/public/validate` for `{item_id, answer}` returning correct/incorrect feedback with safe regex execution and capped input length

**Status:** implemented
**Depends on:** B1

### Contract Snapshot
2026-05-28: Add `POST /api/v1/public/validate` accepting `{item_id, answer}` and returning correctness with expected value/explanation only after validation. Cap answer length; validate regex safety at runtime; execute match with timeout behavior and never log raw answers.

### Exploration
2026-05-28: `app/core/regex_safety.py` enforces import-time pattern safety. Existing logging uses `structlog`; no practice validation service exists yet.

### Plan
2026-05-28:
- Done when: validation checks only items belonging to published tasks, enforces capped answer length, handles unsafe/slow patterns as 422, and returns safe feedback.
- Files: `app/modules/tasks/api.py`, `app/modules/tasks/repository.py`, `app/modules/tasks/schemas.py`, `app/modules/tasks/service.py`, `tests/test_practice_api.py`.
- Steps: add request/response schemas, item lookup, safe validation helper, API route.
- Checks: `uv run pytest tests/test_practice_api.py`.

### Implementation Log
2026-05-28: Added `PracticeValidationRequest`/`PracticeValidationResponse`, published-item lookup, answer length cap, runtime safety re-check, isolated regex fullmatch with process timeout, metadata-only rejection logging, and `POST /api/v1/public/validate`.

### Verification
2026-05-28: `uv run pytest tests/test_practice_api.py tests/test_tasks_api.py` — PASS. `uv run pytest` — PASS, 46 tests. `uv run ruff check app tests` — PASS.

### Residual Risks

None

---

## B3 — Add backend tests for practice reads, draft-task exclusion, answer-internal leakage prevention, validation correctness, unsafe runtime behavior, and not-found/error contracts

**Status:** implemented
**Depends on:** B1, B2

### Contract Snapshot
2026-05-28: Cover practice reads, draft exclusion, no answer leakage, validation correct/incorrect behavior, unsafe runtime behavior, and not-found/error contracts.

### Exploration
2026-05-28: `tests/test_tasks_api.py` has reusable task fixture patterns with published and draft tasks. Backend tests run against async FastAPI via `httpx.AsyncClient` and sqlite-compatible SQLAlchemy metadata.

### Plan
2026-05-28:
- Done when: backend phase 04 API behavior is covered in focused tests and all tests pass.
- Files: `tests/test_practice_api.py`.
- Steps: create practice fixture, add GET/POST tests for public behavior and failure cases.
- Checks: `uv run pytest tests/test_practice_api.py`.

### Implementation Log
2026-05-28: Added `tests/test_practice_api.py` covering public practice reads, draft/missing 404s, answer-internal leakage prevention, correct/incorrect validation feedback, answer length cap, unsafe pattern rejection, and draft/missing validation 404s.

### Verification
2026-05-28: `uv run pytest tests/test_practice_api.py tests/test_tasks_api.py` — PASS. `uv run pytest` — PASS, 46 tests.

### Residual Risks

None

---

## F1 — Add frontend practice API helpers, query keys, shared practice/validation types, and loading/error/empty states for trainer data

**Status:** implemented
**Depends on:** B1, B2

### Contract Snapshot
2026-05-28: Add practice API helpers, query keys, shared practice/validation types, and trainer-consumable loading/error/empty states.

### Exploration
2026-05-28: Existing API helpers use `@shared/api/client` with OpenAPI path types; task query options use TanStack Query v5 `queryOptions`. Current schema is generated and lacks phase 04 endpoints.

### Plan
2026-05-28:
- Done when: frontend has typed `getPublicPractice`, `validatePracticeAnswer`, query/mutation keys, and UI states consuming them.
- Files: `frontend/app/entities/practice/**`, `frontend/app/shared/api/keys.ts`, `frontend/app/shared/types/schema.ts`, `frontend/tests/practice-api.test.ts`.
- Steps: add practice types/API/query helpers and update generated schema from backend OpenAPI.
- Checks: `cd frontend && pnpm test -- practice-api.test.ts`.

### Implementation Log
2026-05-28: Regenerated `frontend/app/shared/types/schema.ts`; added practice model/API/query helpers and practice query keys. Trainer provides loading, error, and empty data states.

### Verification
2026-05-28: `cd frontend && pnpm test` — PASS, 65 tests. `cd frontend && pnpm typecheck` — PASS. Targeted eslint for new/touched practice files — PASS.

### Residual Risks

None

---

## F2 — Implement a versioned guest progress `localStorage` store for attempts, streak, solved state, and migration-safe reads/writes

**Status:** implemented
**Depends on:** F1

### Contract Snapshot
2026-05-28: Add versioned browser `localStorage` guest progress for attempts, streak, solved state, and migration-safe reads/writes.

### Exploration
2026-05-28: `frontend/app/shared/lib/safe-ls.ts` stores versioned envelopes and removes invalid/mismatched data. Existing tests cover safe JSON/localStorage helpers.

### Plan
2026-05-28:
- Done when: progress store persists version 1 state, tolerates invalid/old data, tracks attempts count, streak, solved state, and updated timestamps.
- Files: `frontend/app/features/guest-progress/guest-progress-store.ts`, `frontend/app/features/guest-progress/use-guest-progress.ts`, `frontend/tests/guest-progress.test.ts`.
- Steps: add guards/store operations, React hook wrapper, and focused tests.
- Checks: `cd frontend && pnpm test -- guest-progress.test.ts`.

### Implementation Log
2026-05-28: Added version 1 guest progress store and hook using `safeLs`, with attempt counts, streak, solved selectors, invalid/old-data removal, subscriber notifications, and tests.

### Verification
2026-05-28: `cd frontend && pnpm test` — PASS, 65 tests. `cd frontend && pnpm typecheck` — PASS. Targeted eslint for new/touched practice files — PASS.

### Residual Risks

None

---

## F3 — Build `/practice/:id` as a CSR trainer with answer input, validation feedback states, code block rendering, streak/progress UI, next actions, and guest-first flow without login blocking practice

**Status:** implemented
**Depends on:** F1, F2

### Contract Snapshot
2026-05-28: Replace `/practice/:id` placeholder with guest-first CSR trainer: answer input, validation feedback states, code block rendering, streak/progress UI, next actions, no login block.

### Exploration
2026-05-28: Route currently renders `PlaceholderPage`. Task page links to the first practice item ID; phase 04 API is task-based, so task page CTAs need to route to task ID. Existing UI uses warm paper/ink tokens and `CodeBlock`, `Input`, `Button`, lucide icons.

### Plan
2026-05-28:
- Done when: `/practice/:id` renders trainer states from public practice data and validates answers while persisting guest progress.
- Files: `frontend/app/routes/practice.tsx`, `frontend/app/pages/practice/index.tsx`, `frontend/app/pages/task/index.tsx`, `frontend/app/features/practice-trainer/practice-trainer.tsx`, `frontend/app/styles/app.css`.
- Steps: update route metadata/page, build trainer component, update task CTA to task ID, add stable responsive styles.
- Checks: `cd frontend && pnpm test -- practice-routes.test.tsx`.

### Implementation Log
2026-05-28: Replaced practice placeholder with CSR route/page/trainer; updated task page CTAs to `/practice/{task.id}`; added answer validation feedback, code rendering, progress/streak UI, next/back actions, and responsive trainer styles.

### Verification
2026-05-28: `cd frontend && pnpm test` — PASS, 65 tests. `cd frontend && pnpm typecheck` — PASS. `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e:chromium -- practice-trainer.spec.ts` — PASS, 2 tests.

### Residual Risks

None

---

## F4 — Add frontend unit and route/e2e coverage for trainer loading/error/empty states, validation interactions, local progress persistence, responsive mobile/desktop layout smoke checks, and no text/control overlap

**Status:** implemented
**Depends on:** F1, F2, F3

### Contract Snapshot
2026-05-28: Add frontend unit and route/e2e coverage for trainer loading/error/empty states, validation interactions, local progress persistence, responsive desktop/mobile smoke, and no text/control overlap.

### Exploration
2026-05-28: Vitest runs in node and existing route tests use `renderToStaticMarkup`/`MemoryRouter`. Playwright config has a chromium project only and existing e2e tests use request/browser APIs against `PLAYWRIGHT_BASE_URL`.

### Plan
2026-05-28:
- Done when: frontend tests cover API helpers, guest progress store, trainer route rendering/interactions, and e2e responsive smoke selectors.
- Files: `frontend/tests/practice-api.test.ts`, `frontend/tests/guest-progress.test.ts`, `frontend/tests/practice-routes.test.tsx`, `frontend/tests/e2e/practice-trainer.spec.ts`.
- Steps: add unit tests for helpers/store and component states; add e2e smoke with mocked API responses.
- Checks: `cd frontend && pnpm test -- practice-api.test.ts guest-progress.test.ts practice-routes.test.tsx`; `cd frontend && pnpm test:e2e:lint`.

### Implementation Log
2026-05-28: Added frontend API, guest progress, route rendering, and Playwright trainer tests. E2E covers validation, local progress persistence, mobile/desktop viewport smoke, and horizontal overflow/control sizing checks.

### Verification
2026-05-28: `cd frontend && pnpm test` — PASS, 65 tests. `cd frontend && pnpm typecheck` — PASS. `cd frontend && pnpm test:e2e:lint` — PASS. `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e:chromium -- practice-trainer.spec.ts` — PASS, 2 tests. Targeted eslint for new/touched practice files — PASS. Full `pnpm lint` was attempted and still fails on pre-existing formatting issues in `frontend/app/features/auth/login-form.tsx`, `frontend/app/features/auth/register-form.tsx`, and `frontend/app/shared/ui/app-top-bar.tsx`.

### Residual Risks

None

---

<!-- /impl-review-notes appends this section when Architect Review Notes need fixes.

## Review Notes Fixes

### R1 — short note title

**Status:** open
**Source:** `docs/PHASE_04.md` § Architect Review Notes

#### Source Note

#### Safety Check

#### Exploration

#### Plan

#### Implementation Log

#### Verification

#### Residual Risks
-->
