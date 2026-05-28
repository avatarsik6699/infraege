# PHASE 02 — Agent Execution Memory

<!--
  WHAT to build -> docs/PHASE_02.md
  HOW it was built -> this file

  This file is agent-owned execution memory. It is not intended for human review or manual edits.
  The agent updates it during /impl-assist and /impl-review-notes so future sessions can resume
  without reconstructing context from chat history.

  Sync rule: task IDs (B1, F1, I1, D1, T1) must match the Scope checklist in PHASE_02.md.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete
  historical execution memory unless the phase file explicitly removes the task.
-->

_Phase:_ `02` · _Generated:_ `2026-05-28`

---

## B1 — Add SQLAlchemy/Pydantic content models and repositories for `tasks` and `practice_items` using the SPEC.md §3 schema

**Status:** implemented
**Depends on:** D1

### Contract Snapshot
Add persisted `tasks` and `practice_items` ORM/Pydantic models plus repository methods matching the Phase 02 schema. Depends on the migration.

### Exploration
Existing backend uses SQLAlchemy 2.0 typed models in `app/modules/*/models.py`, shared `UUIDMixin`/`TimestampMixin`, and async repositories over `AsyncSession`. Alembic imports module packages so model metadata is registered.

### Plan
**Done when:** task/practice models, schemas, and repository satisfy the Phase 02 fields and can create/update rows.
**Files:** `app/modules/tasks/*`, `app/db/base.py`, `alembic/env.py`.
**Steps:** add enums and ORM relationships; add Pydantic output schemas; add async repository upsert helpers; register metadata imports.
**Checks:** focused pytest content model/import tests.

### Implementation Log
Added `app/modules/tasks` ORM models, Pydantic schemas, and async repository upsert methods. Registered task metadata in Alembic/test imports.

### Verification
`uv run pytest tests/test_content_models.py tests/test_content_import.py` — PASS.

### Residual Risks

None

---

## B2 — Implement repository content parsing and validation for `content/tasks/ege-01.md` through `content/tasks/ege-27.md` plus `content/assets/<task-slug>/`

**Status:** implemented
**Depends on:** D2

### Contract Snapshot
Parse `content/tasks/ege-01.md` through `ege-27.md` as YAML frontmatter plus Markdown body, validate required fields, and require corresponding `content/assets/<slug>/` directories.

### Exploration
No content package exists yet. `PyYAML` is now available and docs confirm `yaml.safe_load` for safe parsing of repository-authored YAML.

### Plan
**Done when:** loader returns 27 validated task documents or path/field-specific errors.
**Files:** `app/content/schemas.py`, `app/content/errors.py`, `app/content/validators.py`, `content/tasks/*.md`, `content/assets/*/.gitkeep`.
**Steps:** define source schemas; implement frontmatter split and validation aggregation; create 27 skeleton files and asset dirs.
**Checks:** content validation tests and `uv run python -m app.content check`.

### Implementation Log
Added `app/content/schemas.py`, `errors.py`, and `validators.py` with safe YAML frontmatter parsing, 27-file loading, duplicate checks, asset directory checks, and path/field validation errors. Added `content/tasks/ege-01.md` through `ege-27.md` and matching asset directories.

### Verification
`uv run python -m app.content check` — PASS, 27 task files.
`uv run pytest tests/test_content_validation.py tests/test_content_cli.py` — PASS.

### Residual Risks

None

---

## B3 — Implement Markdown rendering, TOC extraction, HTML sanitization, and asset manifest preparation for theory, prompts, and explanations

**Status:** implemented
**Depends on:** B2

### Contract Snapshot
Render Markdown for theory, prompts, and explanations; extract heading TOC; sanitize generated HTML; prepare asset manifests from local asset dirs.

### Exploration
`markdown-it-py` docs show token parsing/rendering; Bleach official docs describe allow-list HTML sanitization with allowed tags/attributes/protocols. Pillow is already a dependency for image dimensions.

### Plan
**Done when:** rendered content is sanitized, headings produce deterministic ids/TOC entries, and asset manifest entries include source/public paths plus dimensions where available.
**Files:** `app/content/markdown.py`, `app/content/assets.py`.
**Steps:** implement renderer; sanitize allow-list; collect referenced/local assets; validate missing references.
**Checks:** markdown and asset validation tests.

### Implementation Log
Added Markdown rendering, deterministic heading TOC extraction, Bleach sanitization, and asset manifest preparation with image dimensions where available.

### Verification
`uv run pytest tests/test_content_markdown.py` — PASS.

### Residual Risks

None

---

## B4 — Implement CLI-first content tooling: `uv run python -m app.content check` and `uv run python -m app.content import`

**Status:** implemented
**Depends on:** B1, B2, B3, B5

### Contract Snapshot
Expose CLI commands `uv run python -m app.content check` for dry-run validation and `uv run python -m app.content import` for validate-render-sanitize-assets-upsert.

### Exploration
No CLI framework is currently used. The contract only requires `python -m`, so stdlib `argparse` avoids extra CLI surface.

### Plan
**Done when:** `check` exits nonzero on validation errors without DB writes; `import` writes/upserts tasks and practice items through the app session factory.
**Files:** `app/content/__init__.py`, `app/content/__main__.py`, `app/content/cli.py`, `app/content/importer.py`.
**Steps:** build content service orchestration; print concise command results; return shell-friendly exit codes.
**Checks:** CLI tests plus direct command smoke where feasible.

### Implementation Log
Added `python -m app.content` CLI with `check` and `import` commands plus import orchestration that validates, renders, prepares assets, and upserts rows. CLI now reports DB connectivity failures without a traceback. Added host-side fallback for local CLI imports when `.env` uses Docker Compose hostname `db`.

### Verification
`uv run python -m app.content check` — PASS.
`uv run python -m app.content import` — PASS, 27 tasks upserted against local Docker Postgres.
`uv run pytest tests/test_content_cli.py tests/test_content_import.py` — PASS.

### Residual Risks

None

---

## B5 — Validate answer metadata: `answer_pattern` length, regex compilation, unsafe-pattern denylist, and deterministic `expected_value` handling before import

**Status:** implemented
**Depends on:** B2

### Contract Snapshot
Validate `answer_pattern` length <= 200, regex compilation, deny unsafe nested quantifier patterns, and ensure deterministic `expected_value` before import.

### Exploration
`app/core/regex_safety.py` already has a basic denylist and compilation check used as the right place to extend shared regex safety.

### Plan
**Done when:** invalid answer patterns and blank/ambiguous expected values fail validation before import with source path and field path.
**Files:** `app/core/regex_safety.py`, `app/content/validators.py`.
**Steps:** strengthen unsafe regex detection; call it during document validation; validate expected values are non-empty bounded strings.
**Checks:** answer-pattern safety tests.

### Implementation Log
Strengthened regex safety checks for nested quantifiers and wired answer-pattern and deterministic expected-value validation into content document validation.

### Verification
`uv run pytest tests/test_content_validation.py` — PASS.

### Residual Risks

None

---

## B6 — Add backend tests for migrations, content validation errors, import upserts, sanitization, asset checks, and answer-pattern safety

**Status:** implemented
**Depends on:** B1, B2, B3, B4, B5

### Contract Snapshot
Add backend tests for migrations/models, content validation errors, import upserts, sanitization, asset checks, and answer-pattern safety.

### Exploration
Existing tests use SQLite async `Base.metadata.create_all`; `tests/conftest.py` already patches PostgreSQL JSONB/CITEXT compilation for SQLite.

### Plan
**Done when:** focused tests cover every Phase 02 behavior and pass under `uv run pytest`.
**Files:** `tests/test_content_*.py`, possibly `tests/conftest.py`.
**Steps:** add tests for schemas/loader, renderer/sanitizer, importer idempotence, and model constraints where practical.
**Checks:** `uv run pytest tests/test_content_models.py tests/test_content_validation.py tests/test_content_markdown.py tests/test_content_import.py tests/test_content_cli.py`.

### Implementation Log
Added focused tests for migration contract, model metadata, repository content validation, CLI behavior, import idempotence, sanitization, asset checks, and answer-pattern safety.

### Verification
`uv run pytest tests/test_content_models.py tests/test_content_validation.py tests/test_content_markdown.py tests/test_content_import.py tests/test_content_cli.py` — PASS, 12 tests.
`uv run pytest` — PASS, 35 tests.
`uv run ruff check app tests alembic` — PASS.

### Residual Risks

None

---

## D1 — Add Alembic migration for `tasks`, `practice_items`, `task_difficulty`, `content_status`, constraints, indexes, source audit fields, and cascade behavior

**Status:** implemented
**Depends on:** —

### Contract Snapshot
Create Alembic migration for `task_difficulty`, `content_status`, `tasks`, `practice_items`, constraints, indexes, audit fields, and `ON DELETE CASCADE`.

### Exploration
Existing migration style manually creates PostgreSQL enum types with `postgresql.ENUM(..., create_type=False)`, creates tables/indexes, and drops in reverse order.

### Plan
**Done when:** revision `0002_*` upgrades/downgrades the Phase 02 schema and chains after `0001_users_table`.
**Files:** `alembic/versions/0002_content_model.py`.
**Steps:** create enum types; create tables and indexes; include range/length constraints; downgrade drops tables then enum types.
**Checks:** migration test inspects revision and model metadata; full Alembic run deferred to phase gate unless local DB is available.

### Implementation Log
Added Alembic revision `0002_content_model.py` for PostgreSQL enums, `tasks`, `practice_items`, constraints, indexes, audit fields, and cascading task deletion.

### Verification
`uv run pytest tests/test_content_models.py` — PASS. Full Alembic upgrade against Postgres was not run because the local configured database host is unavailable.

### Residual Risks

Full Alembic upgrade against PostgreSQL still needs to run during `/phase-gate 02` with a reachable database.

---

## D2 — Add repository content skeleton for all 27 EGE task files and local asset directories according to the SPEC.md §2.3 schema

**Status:** implemented
**Depends on:** —

### Contract Snapshot
Add all 27 repository-authored task Markdown files and matching local asset directories.

### Exploration
No `content/` tree currently exists. Phase contract names `content/assets/ege-*`, so skeleton slugs will be `ege-01` through `ege-27` to keep files and directories deterministic.

### Plan
**Done when:** all 27 task files parse successfully and every matching asset directory exists.
**Files:** `content/tasks/ege-01.md` through `ege-27.md`, `content/assets/ege-*/.gitkeep`.
**Steps:** create minimal valid frontmatter and theory body per task; create empty asset dirs with `.gitkeep`.
**Checks:** content check and validation tests.

### Implementation Log
Created all 27 Markdown task skeletons with valid frontmatter and one practice item each. Created `content/assets/ege-01` through `ege-27` with `.gitkeep`.

### Verification
`uv run python -m app.content check` — PASS, 27 task files.
`uv run pytest tests/test_content_validation.py` — PASS.

### Residual Risks

None

---

<!-- /impl-review-notes appends this section when Architect Review Notes need fixes.

## Review Notes Fixes

### R1 — short note title

**Status:** open
**Source:** `docs/PHASE_02.md` § Architect Review Notes

#### Source Note

#### Safety Check

#### Exploration

#### Plan

#### Implementation Log

#### Verification

#### Residual Risks
-->
