# CHANGELOG — Spec & Architecture History

> Records changes to `docs/SPEC.md` and `docs/CONTEXT.md`. This is **NOT** a git commit log.
> Purpose: capture *why* the contract changed and which phases were affected.
> Format: newest entry at top.

---

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
