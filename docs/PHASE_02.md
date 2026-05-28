# PHASE 02 — Content Model + Authoring Pipeline

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `02` |
| Title | Content Model + Authoring Pipeline |
| Status | `✅ done` |
| Tag | `v0.02.0` |
| Depends on | PHASE_01 gate passing |

---

## Phase Goal

Add the task-first EGE content schema and repository-authored content import required by SPEC.md §2.3 and §3. This phase makes Markdown/frontmatter files in `content/tasks/*.md` and local assets the production content source of truth, while generated database HTML and static asset manifests remain derived artifacts.

---

## Scope

### Backend
- [x] `B1` Add SQLAlchemy/Pydantic content models and repositories for `tasks` and `practice_items` using the SPEC.md §3 schema — _Depends on:_ `D1`
- [x] `B2` Implement repository content parsing and validation for `content/tasks/ege-01.md` through `content/tasks/ege-27.md` plus `content/assets/<task-slug>/` — _Depends on:_ `D2`
- [x] `B3` Implement Markdown rendering, TOC extraction, HTML sanitization, and asset manifest preparation for theory, prompts, and explanations — _Depends on:_ `B2`
- [x] `B4` Implement CLI-first content tooling: `uv run python -m app.content check` and `uv run python -m app.content import` — _Depends on:_ `B1`, `B2`, `B3`, `B5`
- [x] `B5` Validate answer metadata: `answer_pattern` length, regex compilation, unsafe-pattern denylist, and deterministic `expected_value` handling before import — _Depends on:_ `B2`
- [x] `B6` Add backend tests for migrations, content validation errors, import upserts, sanitization, asset checks, and answer-pattern safety — _Depends on:_ `B1`, `B2`, `B3`, `B4`, `B5`

### Data
- [x] `D1` Add Alembic migration for `tasks`, `practice_items`, `task_difficulty`, `content_status`, constraints, indexes, source audit fields, and cascade behavior — _Depends on:_ —
- [x] `D2` Add repository content skeleton for all 27 EGE task files and local asset directories according to the SPEC.md §2.3 schema — _Depends on:_ —

<!-- Test execution is governed by `## Gate Checks` below + docs/STACK.md § Gate Commands.
     Do not duplicate that list here. -->

---

## Files

### Create / modify
~~~
pyproject.toml
uv.lock
alembic/versions/*.py
app/db/base.py
app/content/__init__.py
app/content/__main__.py
app/content/assets.py
app/content/cli.py
app/content/errors.py
app/content/importer.py
app/content/markdown.py
app/content/schemas.py
app/content/validators.py
app/modules/tasks/__init__.py
app/modules/tasks/models.py
app/modules/tasks/repository.py
app/modules/tasks/schemas.py
app/core/regex_safety.py
content/tasks/ege-01.md
content/tasks/ege-02.md
content/tasks/ege-03.md
content/tasks/ege-04.md
content/tasks/ege-05.md
content/tasks/ege-06.md
content/tasks/ege-07.md
content/tasks/ege-08.md
content/tasks/ege-09.md
content/tasks/ege-10.md
content/tasks/ege-11.md
content/tasks/ege-12.md
content/tasks/ege-13.md
content/tasks/ege-14.md
content/tasks/ege-15.md
content/tasks/ege-16.md
content/tasks/ege-17.md
content/tasks/ege-18.md
content/tasks/ege-19.md
content/tasks/ege-20.md
content/tasks/ege-21.md
content/tasks/ege-22.md
content/tasks/ege-23.md
content/tasks/ege-24.md
content/tasks/ege-25.md
content/tasks/ege-26.md
content/tasks/ege-27.md
content/assets/ege-*/.gitkeep
tests/test_content_cli.py
tests/test_content_import.py
tests/test_content_markdown.py
tests/test_content_models.py
tests/test_content_validation.py
~~~

### Do NOT touch
- `docs/SPEC.md`
- `docs/CONTEXT.md`
- `frontend/**`
- Auth, progress, feedback, legal, SEO, production backup, monitoring, TLS, and alerting behavior
- HTTP content import endpoints or content preview UI/API

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

```text
tasks(
  id UUID PRIMARY KEY,
  ege_number SMALLINT UNIQUE NOT NULL,          -- 1..27
  slug VARCHAR(120) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary TEXT,
  difficulty task_difficulty NOT NULL,          -- basic | medium | high
  estimated_minutes SMALLINT,
  theory_html TEXT NOT NULL,
  theory_toc JSONB NOT NULL DEFAULT '[]',
  asset_manifest JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  status content_status NOT NULL DEFAULT 'draft', -- draft | published
  source_path VARCHAR(300) NOT NULL,
  source_hash CHAR(64) NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

practice_items(
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  source_key VARCHAR(80) NOT NULL,
  position SMALLINT NOT NULL DEFAULT 0,
  year SMALLINT,
  prompt_html TEXT NOT NULL,
  code_block JSONB,
  answer_pattern VARCHAR(200) NOT NULL,
  expected_value VARCHAR(80) NOT NULL,
  explanation_html TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, source_key)
)
```

Repository content files:

```text
content/
├── tasks/
│   ├── ege-01.md
│   ├── ege-02.md
│   └── ...
│       ege-27.md
└── assets/
    ├── ege-01/
    ├── ege-02/
    └── ...
        ege-27/
```

Required frontmatter fields:

```yaml
ege_number: 5
slug: ege-05-analiz-algoritma
title: Анализ алгоритма
summary: Короткое описание для каталога и SEO.
difficulty: medium # basic | medium | high
estimated_minutes: 6
status: draft # draft | published
practice_items:
  - id: ege-05-001
    position: 1
    year: 2024
    prompt: "Дан фрагмент программы..."
    code_block:
      language: python
      title: фрагмент
      code: |
        n = int(input())
        while n > 5:
            n = n - 3
        print(n)
    answer_pattern: "^11$"
    expected_value: "11"
    explanation: "Минимальное n = 11."
```

### New API endpoints / RPC methods / events

None. Content import is intentionally not exposed over HTTP in MVP.

CLI contracts:

| Command | Contract |
|---------|----------|
| `uv run python -m app.content check` | Dry-run validation without DB writes |
| `uv run python -m app.content import` | Validate -> render -> sanitize -> prepare assets -> upsert DB rows |

Validation errors must include the source file path and field path.

### New types / models / shared interfaces

- `TaskDifficulty`: `basic | medium | high`
- `ContentStatus`: `draft | published`
- `Task`: persisted task content row with `egeNumber`, `slug`, `title`, `summary`, `difficulty`, `estimatedMinutes`, `theoryHtml`, `theoryToc`, `assetManifest`, `metadata`, `status`, `sourcePath`, `sourceHash`, and optional `publishedAt`
- `PracticeItem`: persisted practice row with `taskId`, `sourceKey`, `position`, `year`, `promptHtml`, optional `codeBlock`, `answerPattern`, `expectedValue`, and optional `explanationHtml`
- `CodeBlock`: `{ language: string; title?: string; code: string }`
- `AssetManifestItem`: derived public asset URL plus `alt`, `width`, `height`, `originalPath`, and optional `optimizedPath`
- `ContentTaskDocument`: parsed Markdown/frontmatter source file for one EGE task
- `ContentValidationError`: source file path plus field path and message

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 02` before committing.

`/phase-gate` returns full PASS only when:
- Automated checks are green
- All architect review items below are resolved (checked off)

Use the commands in [docs/STACK.md](./STACK.md#gate-commands) as the source of truth for:
- infrastructure / bootstrap
- migrations (if applicable)
- backend / unit tests
- frontend prep, type-check, unit tests (if a frontend exists)
- e2e (if an e2e suite exists)
- the default smoke check

If this phase needs a custom smoke target or other phase-specific note, record it here:

```bash
uv run python -m app.content check
uv run python -m app.content import
```

---

## Architect Review Notes

Use this section after manual product, UX, API, or workflow verification. This is the human-facing
channel for post-implementation fixes.

Add one unchecked checkbox per issue the agent must fix before the phase can close. Keep each item
independently fixable and describe observed behavior plus expected behavior. If the fix may change
SPEC/API/schema/security behavior, say so explicitly in the note.

The agent resolves these items through `/impl-review-notes 02`. Leave an item unchecked while it
is still open. Check it off only after the fix is implemented and re-verified. If manual
verification found nothing, keep the default checked line below.

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-02): add content model and import pipeline
```

---

## Post-Phase Checklist

- [x] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [x] `docs/PHASE_02_NOTES.md` complete — agent execution memory recorded
- [x] All automated gate checks green
- [x] All architect review notes resolved
- [x] `docs/CONTEXT.md` updated — run `/context-update 02`
- [x] `docs/STATE.md` phase row updated to `✅ done`
- [x] `docs/CHANGELOG.md` entry added (if contracts changed)
- [x] Committed atomically on `feat/phase-02` branch
- [x] Tag created after merge to main: `git tag -a v0.02.0 -m "Phase 02: Content Model + Authoring Pipeline"`
