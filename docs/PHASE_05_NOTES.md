# PHASE 05 — Agent Execution Memory

<!--
  WHAT to build -> docs/PHASE_05.md
  HOW it was built -> this file

  This file is agent-owned execution memory. It is not intended for human review or manual edits.
  The agent updates it during /impl-assist and /impl-review-notes so future sessions can resume
  without reconstructing context from chat history.

  Sync rule: task IDs (D1, B1-B5, F1-F5) must match the Scope checklist in PHASE_05.md.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete
  historical execution memory unless the phase file explicitly removes the task.
-->

_Phase:_ `05` · _Generated:_ `2026-05-29` · _Implemented:_ `2026-05-29`

---

## D1 — Alembic migration 0003_user_attempts

**Status:** implemented
**Depends on:** —

### Contract Snapshot

Creates `user_attempts` table: `id UUID PK`, `user_id UUID FK→users CASCADE`, `practice_item_id UUID FK→practice_items CASCADE`, `is_correct BOOLEAN`, `attempts_count SMALLINT DEFAULT 1`, `last_answered_at TIMESTAMPTZ DEFAULT now()`. UNIQUE(user_id, practice_item_id). Indexes on user_id and (user_id, last_answered_at).

### Exploration

Followed pattern from `alembic/versions/0002_content_model.py`. No enums needed. SQLite tests use `Base.metadata.create_all` — migration only runs in production.

### Plan

- **Done when:** `alembic/versions/0003_user_attempts.py` exists with correct table DDL.
- **Files:** `alembic/versions/0003_user_attempts.py`
- **Steps:** Copy 0002 header pattern, add table DDL with FK constraints and indexes.
- **Checks:** `uv run alembic upgrade head` (requires live DB)

### Implementation Log

Created `alembic/versions/0003_user_attempts.py`. Used `postgresql.UUID(as_uuid=True)` for FK columns, matching 0002 pattern. Named unique constraint `uq_user_attempts_user_item`.

### Verification

Backend tests pass (56/56). SQLite creates the table via `Base.metadata.create_all` after `UserAttempt` was added to models and imported in conftest.py.

### Residual Risks

None

---

## B1 — UserAttempt model and Pydantic schemas

**Status:** implemented
**Depends on:** D1

### Contract Snapshot

`UserAttempt` ORM model in `app/modules/users/models.py`. Pydantic schemas: `SyncAttemptItem`, `ProgressSyncRequest` (max 300 items), `ProgressSyncResponse`, `ProfileStats`, `WeakTask`, `RecentActivity`, `ProfileMe` — all using camelCase aliases with `populate_by_name=True` to match frontend expectations.

### Exploration

- Existing models: `User` in `app/modules/users/models.py`, `PracticeItem` in `app/modules/tasks/models.py`.
- Schema pattern: camelCase `Field(alias="camelCase")` with `ConfigDict(populate_by_name=True)` (matches tasks/schemas.py).
- `TimestampMixin` not used for `UserAttempt` since `last_answered_at` is the only timestamp and has different semantics.

### Plan

- **Done when:** `UserAttempt` model importable from `app.modules.users.models`, schemas importable from `app.modules.users.schemas`.
- **Files:** `app/modules/users/models.py`, `app/modules/users/schemas.py`, `app/modules/users/__init__.py`, `tests/conftest.py`
- **Steps:** Add model, add schemas with camelCase aliases, export from `__init__.py`, import in conftest for SQLite test support.

### Implementation Log

- Added `UserAttempt` to `models.py` with relationship back to `User` (cascade all, delete-orphan).
- Added 7 new Pydantic schemas to `schemas.py`. `ProgressSyncRequest.attempts` uses `Field(max_length=300)` for the 300-item cap.
- Added import in `tests/conftest.py`: `from app.modules.users.models import User, UserAttempt, UserRole  # noqa: F401`.
- Exported all new symbols from `__init__.py`.

### Verification

56/56 backend tests pass. `UserAttempt` table created in SQLite test DB via `Base.metadata.create_all`.

### Residual Risks

None

---

## B2 — DELETE /api/v1/public/auth/me endpoint

**Status:** implemented
**Depends on:** B1

### Contract Snapshot

`DELETE /api/v1/public/auth/me` → 204 No Content. Requires JWT auth. Cascades `user_attempts` via DB FK ON DELETE CASCADE. Irreversible.

### Exploration

- `app/modules/auth/api.py` already has GET /me and POST /logout.
- `UserService.delete(user)` already exists — calls `self._repository.delete(user)` → `session.delete(user)`.
- DB-level CASCADE handles `user_attempts` deletion.
- Existing test `test_account_deletion_is_out_of_phase_01` asserted 405 — updated to assert 204.

### Plan

- **Done when:** `DELETE /api/v1/public/auth/me` returns 204 with valid JWT.
- **Files:** `app/modules/auth/api.py`, `tests/test_auth_api.py`
- **Steps:** Add endpoint to auth router, import `UserService`/`get_user_service`, update old test.

### Implementation Log

- Added `delete_me` endpoint in `app/modules/auth/api.py` using `Depends(get_user_service)`.
- Replaced `test_account_deletion_is_out_of_phase_01` with `test_delete_me_returns_204` and `test_delete_me_without_token`.

### Verification

`test_delete_me_returns_204` and `test_delete_me_without_token` both pass.

### Residual Risks

The cascade relies on `ON DELETE CASCADE` FK constraint existing in production DB (via migration D1). SQLite tests simulate cascade via ORM `cascade="all, delete-orphan"` on `User.attempts` relationship.

---

## B3 — POST /api/v1/public/progress/sync endpoint

**Status:** implemented
**Depends on:** B1

### Contract Snapshot

`POST /api/v1/public/progress/sync` with `{ attempts: SyncAttemptItem[] }` (max 300). Returns `{ synced: number, updated: number }`. On conflict: `attempts_count` += incoming, `last_answered_at` = max(stored, incoming), `is_correct` = incoming. Requires JWT.

### Exploration

- New `UserAttemptRepository.bulk_sync()` method handles the upsert logic.
- SQLite doesn't support PostgreSQL's `INSERT ... ON CONFLICT DO UPDATE`, so used read-then-update ORM pattern (same semantics, works in tests).
- Datetime naive/aware comparison issue: `existing.last_answered_at` from SQLite is naive, `item.last_answered_at` from JSON is timezone-aware. Fixed with `_as_utc()` helper.

### Plan

- **Done when:** `POST /progress/sync` returns `{synced, updated}` with correct counts.
- **Files:** `app/modules/users/repository.py`, `app/modules/users/service.py`, `app/modules/users/api.py`, `app/modules/users/dependencies.py`, `app/api/v1/router.py`

### Implementation Log

- Added `UserAttemptRepository` with `bulk_sync()` to repository.py.
- Added `ProgressService` with `sync()` method to service.py.
- Added `get_user_attempt_repository()` and `get_progress_service()` to dependencies.py.
- Changed `users/api.py` prefix from `/users` to `/public/progress`, added `POST /sync` endpoint.
- Registered `progress_router` in `app/api/v1/router.py`.
- Added `_as_utc()` helper to normalize datetime comparisons.

### Verification

`test_sync_inserts_new_attempt`, `test_sync_idempotency`, `test_sync_cap_422` all pass.

### Residual Risks

The read-then-update pattern has a TOCTOU race condition under concurrent requests for the same user+item. For MVP this is acceptable; can be migrated to native PostgreSQL upsert later.

---

## B4 — GET /api/v1/public/progress/me endpoint

**Status:** implemented
**Depends on:** B1

### Contract Snapshot

`GET /api/v1/public/progress/me` → `ProfileMe { stats, weakTasks, recentActivity }`. Stats: `totalTasks` (distinct tasks touched), `solvedTasks` (tasks with ≥1 correct), `correctAttempts`, `totalAttempts`, `streak` (consecutive calendar days ending today), `lastActivityAt`. Weak tasks: bottom-5 by accuracy. Recent activity: last 30 days by calendar day.

### Exploration

- `UserAttemptRepository.get_profile_me()` joins `user_attempts` → `practice_items` → `tasks` for task metadata.
- SQLite supports the JOINs and sub-queries used.
- Streak computed by walking backwards from today counting days with activity.

### Plan

- **Done when:** `GET /progress/me` returns `ProfileMe` shape with correct field names.
- **Files:** `app/modules/users/repository.py` (get_profile_me), `app/modules/users/api.py` (GET /me)

### Implementation Log

- `get_profile_me()` loads all user_attempts, then JOINs to tasks for metadata.
- Used `_as_utc()` for consistent datetime comparison in streak/activity calculations.
- Activity grouped by `strftime("%Y-%m-%d")` on UTC-normalized datetime.

### Verification

`test_progress_me_empty`, `test_progress_me_with_attempts` both pass.

### Residual Risks

Performance: loading all user_attempts in Python for stats aggregation may be slow for users with thousands of attempts. For MVP (typical <300 synced attempts) this is fine.

---

## B5 — Backend tests for DELETE /me, sync, and progress/me

**Status:** implemented
**Depends on:** B2, B3, B4

### Contract Snapshot

Tests in `tests/test_progress_api.py`: sync unauthenticated (401), sync empty payload (200 + 0/0), sync inserts new (synced=1), sync idempotency (second call: updated=1), sync cap 422 (301 items), progress/me unauthenticated (401), progress/me empty (200 + zeros), progress/me with attempts (correct shape), delete me cascade (204 + 401 on reuse).

### Exploration

- Used `TaskDifficulty.basic`, `ContentStatus.published` for fixture task.
- SQLite requires Python `datetime` objects for `last_answered_at`, not strings → used `FIXED_DT = datetime(2026, 5, 29, 10, 0, 0, tzinfo=timezone.utc)`.

### Implementation Log

Created `tests/test_progress_api.py` with 11 tests. Fixed datetime fixtures after initial run revealed SQLite `TypeError` on string timestamps.

### Verification

All 11 new tests + 9 existing auth tests = 56 total backend tests pass.

### Residual Risks

None

---

## F1 — Complete /login page

**Status:** implemented
**Depends on:** —

### Contract Snapshot

Split layout (dark brand panel left on desktop, light auth panel right). Password show/hide toggle. "Запомнить меня" checkbox (UI-only). "Забыл пароль?" deferred text. "Решать как гость" → /topics. "Нет аккаунта? Создать" link. After login → redirect to /profile. Progress sync triggered after login.

### Exploration

- `frontend/app/features/auth/login-form.tsx` had default email/password prefilled and no password toggle.
- `frontend/app/pages/auth/login/index.tsx` used a simple card layout.
- `useRouter()` hook uses `useMatches()` which requires a data router context for tests.

### Plan

- **Files:** `frontend/app/shared/ui/password-input.tsx` (new), `frontend/app/features/auth/login-form.tsx`, `frontend/app/pages/auth/login/index.tsx`

### Implementation Log

- Created `password-input.tsx` with inline show/hide toggle button, accessible `aria-label`.
- Rewrote `login-form.tsx`: removed default credentials, added remember-me, "забыл пароль?" deferred text, register link, `useProgressSync` call before navigate.
- Rewrote `login/index.tsx` with `BrandPanel` (hidden on mobile) + auth panel split grid.

### Verification

Frontend typecheck passes. 79/79 unit tests pass (auth-forms tests cover LoginForm rendering).

### Residual Risks

"Запомнить меня" is UI-only — does not extend token expiry. "Забыл пароль?" is a deferred text, not a link.

---

## F2 — Complete /register page

**Status:** implemented
**Depends on:** —

### Contract Snapshot

Split layout matching login. 4-segment password strength meter. 152-FZ consent with privacy/terms links. Step indicator "ШАГ 1 / 1 · БЕСПЛАТНО". After register → /profile. Progress sync triggered.

### Plan

- **Files:** `frontend/app/shared/ui/password-strength.tsx` (new), `frontend/app/features/auth/register-form.tsx`, `frontend/app/pages/auth/register/index.tsx`

### Implementation Log

- Created `password-strength.tsx` with `computePasswordStrength()` (4 criteria: length ≥8, uppercase, digit, special char) and `PasswordStrengthBar` (4-segment color bar).
- Rewrote `register-form.tsx`: added PasswordInput, PasswordStrengthBar, privacy/terms links, `useProgressSync` before navigate.
- Rewrote `register/index.tsx` with same split layout pattern as login.

### Verification

Frontend typecheck passes. 79/79 unit tests pass (computePasswordStrength tests cover all 4 strength levels).

### Residual Risks

None

---

## F3 — Progress sync flow

**Status:** implemented
**Depends on:** F1, F2, B3

### Contract Snapshot

After successful login or register, if guest localStorage has attempts, call `POST /progress/sync`, then clear synced keys. Expose sync state: idle/syncing/done/error.

### Exploration

- `guestProgressStore` in `frontend/app/features/guest-progress/guest-progress-store.ts` has `clear()` method.
- Frontend API client strongly typed via `schema.ts` paths — needed to add new endpoints.

### Implementation Log

- Added new paths/operations/schemas to `schema.ts` (DELETE /auth/me, POST /progress/sync, GET /progress/me).
- Added `progressQueryKeys.me` to `keys.ts`.
- Added `useDeleteAccountMutation` to `auth.ts`.
- Created `frontend/app/entities/user/model/user.types.ts` with re-exports from schema.
- Created `frontend/app/entities/user/api/users.ts` with `syncProgress()` and `getProgressMe()`.
- Created `frontend/app/entities/user/api/user-queries.ts` with `useProgressMeQuery` and `useSyncProgressMutation`.
- Created `progress-sync.ts`: maps guest attempts to `SyncAttemptItem[]`, calls API, clears store.
- Created `use-progress-sync.ts`: `{ syncState, syncResult, triggerSync }` hook with in-flight guard.
- Wired `triggerSync()` into both `LoginForm.onSubmit` and `RegisterForm.onSubmit` (fire-and-forget style, sync errors silenced to not block navigation).

### Verification

Frontend typecheck passes. `progress-sync.test.ts` covers empty store (no API call) and store-clearing behavior.

### Residual Risks

Sync errors are silently ignored (user still navigates to /profile). This is intentional for MVP — a future phase can add a sync error toast.

---

## F4 — /profile page

**Status:** implemented
**Depends on:** F3, B4

### Contract Snapshot

`/profile` page: stats tiles (6), weak-task list (bottom-5), recent-activity bar chart (30 days), account deletion with confirmation modal. Unauthenticated → login CTA. Sync status indicator not needed since sync is fire-and-forget before navigation.

### Exploration

- `useSessionSummary()` available from `auth.ts` to check auth state.
- `useProgressMeQuery()` from user-queries.ts fetches `ProfileMe`.
- `useDeleteAccountMutation()` added to auth.ts.

### Implementation Log

Created `frontend/app/pages/profile/index.tsx` with:
- `StatTile`: single stat display.
- `StatsGrid`: 6-tile responsive grid.
- `WeakTasksList`: linked task list with accuracy %.
- `ActivityBar`: proportional bar chart for 30-day activity.
- `DeleteAccountModal`: accessible dialog with cancel/confirm.
- `ProfileContent`: orchestrates all sections.
- `ProfilePage`: auth guard → loading → error → content.

Updated `frontend/app/routes/profile.tsx` to render `ProfilePage` instead of placeholder.

### Verification

Frontend typecheck passes. profile-page.test.tsx covers unauthenticated state and type shape.

### Residual Risks

`ActivityBar` renders all 30 days if present; sparse activity (few days out of 30) may look visually sparse. Acceptable for MVP.

---

## F5 — Frontend unit and e2e tests

**Status:** implemented
**Depends on:** F1, F2, F3, F4

### Contract Snapshot

Unit tests: auth-forms, profile-page, progress-sync. E2E: auth-flow (login/register UI), profile (auth guard + mocked API).

### Exploration

- `useRouter()` uses `useMatches()` which requires a data router. Test files must use `createMemoryRouter` + `RouterProvider` instead of `MemoryRouter`.
- Profile page cannot be trivially tested as authenticated because jwtService reads from localStorage and queryClient; opted for testing the unauthenticated state and type contracts.

### Implementation Log

- `tests/auth-forms.test.tsx`: LoginForm renders (fields, links), RegisterForm renders (fields, links), `computePasswordStrength` unit tests.
- `tests/profile-page.test.tsx`: ProfilePage renders login CTA when unauthenticated, `ProfileMe` type shape assertions.
- `tests/progress-sync.test.ts`: empty store returns zero counts, store-clearing behavior.
- `tests/e2e/auth-flow.spec.ts`: register UI checks, password strength on input, consent validation, login layout, show/hide toggle, error message, cross-link navigation.
- `tests/e2e/profile.spec.ts`: unauthenticated redirect, authenticated view with mocked APIs, regression check on /topics.

### Verification

79/79 frontend unit tests pass. E2E tests require a running app (gate command: `pnpm test:e2e:chromium`).

### Residual Risks

E2E tests not run in this session (require live stack). Lint pass (`pnpm test:e2e:lint`) should be run before gate.

---

<!-- /impl-review-notes appends this section when Architect Review Notes need fixes.

## Review Notes Fixes

### R1 — short note title

**Status:** open
**Source:** `docs/PHASE_05.md` § Architect Review Notes

#### Source Note

#### Safety Check

#### Exploration

#### Plan

#### Implementation Log

#### Verification

#### Residual Risks
-->
