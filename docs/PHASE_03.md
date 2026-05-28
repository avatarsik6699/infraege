# PHASE 03 — Public Catalog + SSR Theory

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `03` |
| Title | Public Catalog + SSR Theory |
| Status | `✅ done` |
| Tag | `v0.03.0` |
| Depends on | PHASE_02 gate passing |

---

## Phase Goal

Ship SEO-readable public learning pages matching SPEC.md §5.1 and §5.3. This phase exposes published task content from the Phase 02 content model through public read APIs, replaces placeholder catalog/theory screens with Russian-first SSR pages, and keeps practice, progress sync, legal, feedback, and production hardening out of scope.

---

## Design References

- `tmp/design-system-spec.md` — tokenized visual contract for warm paper/ink/coral/green/amber UI, editorial typography, catalog controls, code blocks, chips, cards, and responsive navigation.
- `docs/assets/mobile/` — 390px references for sticky top bars, bottom tabbar, catalog, theory, and task-oriented screens.
- `docs/assets/desktop/` — 1440px references for slim top nav, wide editorial layouts, dense catalog table, and three-column theory pages.

---

## Scope

### Backend
- [x] `B1` Implement public published-task catalog endpoint `GET /api/v1/public/tasks` with search and difficulty filters over imported Phase 02 task content — _Depends on:_ —
- [x] `B2` Implement public published-task detail endpoint `GET /api/v1/public/tasks/{slug}` with theory HTML, TOC, metadata, and practice CTA data, while excluding draft tasks and answer internals — _Depends on:_ `B1`
- [x] `B3` Add backend tests for catalog/detail contracts, published-only filtering, search/difficulty filters, not-found behavior, and no `expected_value` leakage — _Depends on:_ `B1`, `B2`

### Frontend
- [x] `F1` Replace the home route with the Phase 03 public landing experience linking to the catalog and trainer entry points, using Russian copy and design references — _Depends on:_ —
- [x] `F2` Build `/topics` as an SSR public catalog for all published tasks with client search, difficulty filters, progress placeholders where server progress is unavailable, and mobile/desktop responsive layouts — _Depends on:_ `B1`, `F4`
- [x] `F3` Build `/tasks/:slug` as an SSR theory page with metadata, TOC, sanitized content rendering, code block styling, asset rendering, and CTA to `/practice/:id` without implementing trainer behavior — _Depends on:_ `B2`, `F4`
- [x] `F4` Add frontend task API helpers, query keys, shared task types, loading/error/empty states, and route metadata/canonical helpers for public task pages — _Depends on:_ `B1`, `B2`
- [x] `F5` Add frontend unit and route/e2e coverage for home, catalog filters, theory rendering, responsive layout smoke checks, and public SEO metadata — _Depends on:_ `F1`, `F2`, `F3`, `F4`

<!-- Test execution is governed by `## Gate Checks` below + docs/STACK.md § Gate Commands.
     Do not duplicate that list here. -->

---

## Files

### Create / modify
~~~
app/api/v1/router.py
app/modules/tasks/api.py
app/modules/tasks/repository.py
app/modules/tasks/schemas.py
app/modules/tasks/service.py
tests/test_tasks_api.py
frontend/app/routes/_index.tsx
frontend/app/routes/topics.tsx
frontend/app/routes/task.tsx
frontend/app/pages/home/index.tsx
frontend/app/pages/topics/index.tsx
frontend/app/pages/task/index.tsx
frontend/app/entities/task/model/task.types.ts
frontend/app/entities/task/api/tasks.ts
frontend/app/entities/task/api/task-queries.ts
frontend/app/entities/task/ui/difficulty-chip.tsx
frontend/app/features/task-filters/task-filter-bar.tsx
frontend/app/shared/lib/seo.ts
frontend/app/shared/types/schema.ts
frontend/app/shared/ui/code-block.tsx
frontend/app/styles/app.css
frontend/tests/tasks-api.test.ts
frontend/tests/task-routes.test.tsx
frontend/tests/e2e/public-catalog.spec.ts
frontend/tests/e2e/seo.spec.ts
~~~

### Do NOT touch
- `docs/SPEC.md`
- `docs/CONTEXT.md`
- `content/tasks/**` authoring content, except when a focused test fixture is genuinely required outside production content
- `content/assets/**` authored assets, except when a focused test fixture is genuinely required outside production content
- Auth token strategy, progress sync, validation endpoint behavior, feedback, legal pages, admin feedback UI, production backup, monitoring, TLS, and alerting behavior
- HTTP content import endpoints or content preview UI/API

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

None

### New API endpoints / RPC methods / events

| Method | Path / Topic | Auth | Response / Payload |
|--------|--------------|------|--------------------|
| `GET` | `/api/v1/public/tasks` | No | 27-task catalog with filters: search, difficulty, solved state where available |
| `GET` | `/api/v1/public/tasks/{slug}` | No | Published task theory, metadata, TOC, progress summary where available |

Response constraints:
- Only `published` tasks are exposed by public APIs, SSR pages, sitemap, and SEO surfaces.
- Draft tasks remain available only in local development after import; separate preview UI/API is out of MVP scope.
- Practice rows included for theory/practice CTA data must not expose `expected_value`, answer internals, or validation results.
- `/topics` is a user-facing catalog label only; do not add a backend `topics` table or `/api/v1/public/topics` endpoint.

### New types / models / shared interfaces

- `PublicTaskSummary`: `{ id: string; egeNumber: number; slug: string; title: string; summary: string | null; difficulty: TaskDifficulty; estimatedMinutes: number | null; practiceCount: number; publishedAt: string | null }`
- `PublicTaskDetail`: summary fields plus `theoryHtml`, `theoryToc`, `assetManifest`, `metadata`, and public practice CTA data without answer internals
- `TheoryTocItem`: heading id/title/depth data derived from imported Markdown
- `PublicPracticePreview`: `{ id: string; taskId: string; position: number; year: number | null }`
- `CatalogFilters`: search text plus optional `TaskDifficulty`
- Frontend task API client functions and TanStack Query keys for catalog and task detail reads

Existing types reused from Phase 02:
- `TaskDifficulty`: `basic | medium | high`
- `AssetManifestItem`: derived public asset URL plus `alt`, `width`, `height`, `originalPath`, and optional `optimizedPath`

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 03` before committing.

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
curl -s http://localhost:8000/api/v1/public/tasks
curl -s http://localhost:8000/api/v1/public/tasks/ege-01
# expected: published tasks only; no answer internals in any response
```

---

## Architect Review Notes

Use this section after manual product, UX, API, or workflow verification. This is the human-facing
channel for post-implementation fixes.

Add one unchecked checkbox per issue the agent must fix before the phase can close. Keep each item
independently fixable and describe observed behavior plus expected behavior. If the fix may change
SPEC/API/schema/security behavior, say so explicitly in the note.

The agent resolves these items through `/impl-review-notes 03`. Leave an item unchecked while it
is still open. Check it off only after the fix is implemented and re-verified. If manual
verification found nothing, keep the default checked line below.

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-03): public catalog and SSR theory pages
```

---

## Post-Phase Checklist

- [x] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [x] `docs/PHASE_03_NOTES.md` complete — agent execution memory recorded
- [x] All automated gate checks green
- [x] All architect review notes resolved
- [x] `docs/CONTEXT.md` updated — run `/context-update 03`
- [x] `docs/STATE.md` phase row updated to `✅ done`
- [x] `docs/CHANGELOG.md` entry added (if contracts changed)
- [x] Committed atomically on `feat/phase-03` branch
- [x] Tag created after merge to develop: `git tag -a v0.03.0 -m "Phase 03: Public Catalog + SSR Theory"`
