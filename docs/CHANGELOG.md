# CHANGELOG — Spec & Architecture History

> Records changes to `docs/SPEC.md` and `docs/CONTEXT.md`. This is **NOT** a git commit log.
> Purpose: capture *why* the contract changed and which phases were affected.
> Format: newest entry at top.

---

## 2026-05-29 — Phase 05 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_05 gate passed and committed

### Changes
- Added `user_attempts` table with cascade constraints on user and practice-item deletion, ON CONFLICT upsert semantics for sync merging.
- Added `DELETE /api/v1/public/auth/me` — authenticated account deletion with cascaded `user_attempts` removal.
- Added `POST /api/v1/public/progress/sync` — bulk upsert of guest localStorage attempts into `user_attempts` (max 300 per request).
- Added `GET /api/v1/public/progress/me` — profile stats, bottom-5 weak tasks by accuracy, and last-30-day activity heatmap data.
- Completed `/login` and `/register` pages with split desktop layout, mobile layout, show/hide password toggle, 4-segment strength meter, 152-FZ consent checkbox, and "Решать как гость" CTA.
- Added progress sync flow: after successful login/register, guest localStorage attempts are synced to server then cleared.
- Built `/profile` page with stats tiles, weak-task list, recent-activity chart, sync status indicator, and account deletion with confirmation modal.
- Added backend tests (DELETE /me cascade, sync idempotency, progress/me shape, auth guards) and frontend unit + e2e tests (login/register forms, sync hook, profile page states).

### Affected Phases
- None (additive change)

### Contract Updates
- Added `user_attempts` table (Alembic head: `0003_user_attempts`).
- Added `DELETE /api/v1/public/auth/me`: 204 No Content; cascades user_attempts.
- Added `POST /api/v1/public/progress/sync`: `{attempts: SyncAttemptItem[]}` → `{synced, updated}`; 300-attempt cap.
- Added `GET /api/v1/public/progress/me`: `{stats: ProfileStats, weakTasks: WeakTask[], recentActivity: RecentActivity[]}`.
- Added interface contracts: `UserAttempt`, `SyncAttemptItem`, `ProgressSyncRequest`, `ProgressSyncResponse`, `ProfileStats`, `WeakTask`, `RecentActivity`, `ProfileMe`, `PasswordStrength`.
- No new environment variables.

### Notes
Progress sync is idempotent: re-sending the same attempts increments `attempts_count` and advances `last_answered_at` rather than duplicating rows. Account deletion is irreversible and cascades all user data at the DB layer with no soft-delete.

---

## 2026-05-29 — Phase 04 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_04 gate passed and committed

### Changes
- Added public practice read API returning published practice items without answer internals.
- Added public validation API accepting `{item_id, answer}` and returning correctness feedback with safe regex execution and capped input length.
- Added client-side practice trainer page (`/practice/:id`) with answer input, validation feedback states, code block rendering, streak/progress UI, and guest-first flow.
- Added versioned `localStorage` guest progress store for attempts, streak, solved state, and migration-safe reads/writes.
- Added frontend practice API helpers, TanStack Query keys, and shared practice/validation types.
- Added backend and frontend test coverage for practice reads, draft-task exclusion, answer-internal leakage prevention, validation correctness, and trainer interactions.

### Affected Phases
- None (additive change)

### Contract Updates
- Added `GET /api/v1/public/practice/{task_id}`: published-only practice items without `expected_value`; draft tasks return 404.
- Added `POST /api/v1/public/validate`: `{item_id, answer}` → `{correct, expected_value?, explanation_html?}`; input length capped, regex hard-timeout enforced.
- Added interface contracts: `PublicPracticeItem`, `PracticeValidationRequest`, `PracticeValidationResponse`, `GuestProgressAttempt`, `GuestProgressState`, `PracticeTrainerState`.
- No new persistent data, DB migrations, or environment variables.

### Notes
Guest progress is browser-owned and stored in a versioned `localStorage` schema (v1). Server-side `user_attempts` persistence is reserved for Phase 05. Validation runtime never logs raw answers — only IDs and metadata.

---

## 2026-05-28 — Phase 03 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_03 gate passed

### Changes
- Added published-only public task catalog and task theory detail API endpoints.
- Replaced placeholder public home, catalog, and theory routes with Russian-first SSR pages.
- Added frontend task API helpers, query keys, shared task types, SEO metadata helpers, and public route coverage.

### Affected Phases
- None (additive change)

### Contract Updates
- Added `GET /api/v1/public/tasks` for published task catalog reads with optional search and difficulty filters.
- Added `GET /api/v1/public/tasks/{slug}` for published task theory detail reads with TOC, metadata, asset manifest, and public practice CTA preview data.
- Added public DTO/interface contracts: `PublicTaskSummary`, `PublicTaskDetail`, `TheoryTocItem`, `PublicPracticePreview`, and `CatalogFilters`.
- No new persistent data, migrations, or environment variables.

### Notes
Public APIs, SSR pages, sitemap, and SEO surfaces expose published tasks only; `/topics` remains a frontend catalog label, not a backend topic entity.

## 2026-05-28 — Phase 02 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_02 gate passed

### Changes
- Added task-first persisted content models for `tasks` and `practice_items`.
- Added repository-authored Markdown/frontmatter content skeletons for all 27 EGE tasks plus matching local asset directories.
- Added content validation, Markdown rendering, HTML sanitization, asset manifest preparation, and CLI import tooling.

### Affected Phases
- None (additive change)

### Contract Updates
- Added `tasks` and `practice_items` tables with source audit fields, imported HTML fields, JSONB metadata/manifests, and cascading practice-item ownership.
- Added `task_difficulty` and `content_status` enum contracts.
- Added active CLI contracts for `uv run python -m app.content check` and `uv run python -m app.content import`.
- Set Alembic current head to `0002_content_model`.

### Notes
Content import remains intentionally CLI-only for MVP; no HTTP import endpoint or preview UI was added.

## 2026-05-28 — Phase 01 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_01 gate passed

### Changes
- Added FastAPI foundation, typed settings, structured startup, health checks, auth shell, and users persistence.
- Added React Router SSR route shell, infraege design tokens, auth skeleton screens, and placeholder MVP routes.
- Added Docker Compose development infrastructure for backend, frontend, PostgreSQL, Redis, and Nginx.

### Affected Phases
- None (additive change)

### Contract Updates
- Added `users` table with `citext`, `user_role`, consent, active flag, and timestamp fields.
- Added public health endpoint and Phase 01 auth endpoints for register, login, refresh, logout, and current-user reads.
- Added Phase 01 auth/user/health shared interface names and environment variable keys.
- Set Alembic current head to `0001_users_table`.

### Notes
Refresh token rotation remains stateless in Phase 01; persistent refresh-token storage and cookie hardening are deferred by the phase contract.

## v2.1 — 2026-05-28 — Content authoring workflow clarified

**Type**: spec-change
**Author**: AI (spec-sync)
**Triggered by**: User clarified that content is authored locally in repository Markdown files with local assets, while the agent implements tooling and validation.

### Changes
- `SPEC.md` now defines a task-first content model without a required backend `topics` table.
- Production content source of truth is `content/tasks/ege-01.md` through `content/tasks/ege-27.md` plus `content/assets/<task-slug>/`.
- Each task file uses YAML frontmatter for metadata and practice items, with extended Markdown theory body.
- Phase 02 now requires CLI-first `content check` and `content import` commands.
- Draft/published lifecycle, placeholder policy, local-assets handling, and content validation rules are now explicit.
- HTTP content import and preview UI/API are out of MVP scope.

### Affected Phases
- None — no concrete `docs/PHASE_XX.md` implementation files exist yet.

### Contract Updates
- Planned core models are now `tasks`, `practice_items`, `users`, `user_attempts`, `feedback_reports`.
- Removed planned `topics` backend table from MVP.
- Removed optional HTTP content import endpoint from MVP.
- Added planned CLI content tooling and task-file schema.

### Notes
The `/topics` frontend route remains as the user-facing "Темы" catalog label, but it is backed by the task catalog rather than a separate `topics` entity.

## v2.0 — 2026-05-28 — Template App replaced with infraege SPEC

**Type**: spec-change
**Author**: AI (spec-sync)
**Triggered by**: User requested a new actualized specification based on `tmp/RAW_SPEC.md`, `tmp/design-system-spec.md`, and `docs/assets`.

### Changes
- `SPEC.md` now defines `infraege`, a Russian-only EGE computer science preparation product for `infraege.ru`.
- MVP scope now includes a 27-task catalog model, theory pages, trainer, guest progress, account sync/profile, feedback, legal/SEO pages, and production readiness.
- Auth decisions are resolved: no email verification in MVP and password reset is deferred.
- Content source is repository Markdown/seed data; rich-text CMS and full content CRUD backoffice are out of MVP scope.
- Design references and tokens from `tmp/design-system-spec.md` and `docs/assets` are now implementation requirements.

### Affected Phases
- None — no concrete `docs/PHASE_XX.md` implementation files exist yet.

### Contract Updates
- Planned core models: `topics`, `tasks`, `practice_items`, `users`, `user_attempts`, `feedback_reports`.
- Planned public API: health, topics, tasks, practice, validation, auth, progress sync/profile, feedback.
- Planned admin/operational API: minimal feedback review and optional content import endpoint or CLI.
- `CONTEXT.md` updated with the product identity; no active implemented runtime contracts exist yet.

### Notes
The current implementation state remains empty. Future phases must be initialized from the new `infraege` SPEC, not from the old Template App placeholder.

## v1.0 — 2026-05-28 — Initial Setup

**Type**: initial-setup
**Author**: v.godlevskiy
**Triggered by**: Project initialization with SDD workflow

### Changes
- `SPEC.md` created: project goals, roles, data model, API/contract, phase plan
- `CONTEXT.md` v1.0 created: initial stack snapshot
- `STACK.md` populated with build/test/run commands

### Affected Phases
- None (initial state)

### Contract Updates
- `CONTEXT.md` initialized at `v1.0`

---

<!--
ENTRY TEMPLATE — copy this block when adding a new entry:

## [CONTEXT_VERSION] — [YYYY-MM-DD] — [Short Title]

**Type**: spec-change | arch-decision | breaking-change | phase-completion | addendum
**Author**: [name / AI skill]
**Triggered by**: [What caused this? User request, bug discovery, new requirement, etc.]

### Changes
- [bullet: what specifically changed in SPEC.md or the architecture]

### Affected Phases
- PHASE_XX — [why it is affected]

### Contract Updates
- `CONTEXT.md` bumped from `vX.Y` to `vX.Z`
- [list schema / endpoint / type changes]

### Notes
[Trade-offs, decisions, context not captured elsewhere]

-->
