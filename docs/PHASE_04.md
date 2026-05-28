# PHASE 04 — Practice Trainer + Guest Progress

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `04` |
| Title | Practice Trainer + Guest Progress |
| Status | `✅ done` |
| Tag | `v0.04.0` |
| Depends on | PHASE_03 gate passing |

---

## Phase Goal

Let guests practice immediately and keep local progress, matching SPEC.md §4.1, §5.1, §5.2, and §5.3. This phase adds the public practice read and validation API, replaces the placeholder trainer route with a Russian-first client trainer, and stores guest attempts in a versioned browser `localStorage` schema. Account progress sync, profile statistics, account deletion, feedback, legal pages, and production hardening remain out of scope.

---

## Design References

- `tmp/design-system-spec.md` — tokenized visual contract for warm paper/ink/coral/green/amber UI, trainer controls, feedback states, fields, progress bars, code blocks, and responsive navigation.
- `docs/assets/mobile/` — 390px references for sticky top bars, bottom tabbar, practice-oriented screens, and stable mobile controls.
- `docs/assets/desktop/` — 1440px references for slim top nav, editorial layouts, dense task metadata, and desktop trainer surfaces.

---

## Scope

### Backend
- [x] `B1` Implement public practice endpoint `GET /api/v1/public/practice/{task_id}` returning published task practice items without `expected_value` internals — _Depends on:_ —
- [x] `B2` Implement public validation endpoint `POST /api/v1/public/validate` for `{item_id, answer}` returning correct/incorrect feedback with safe regex execution and capped input length — _Depends on:_ `B1`
- [x] `B3` Add backend tests for practice reads, draft-task exclusion, answer-internal leakage prevention, validation correctness, unsafe runtime behavior, and not-found/error contracts — _Depends on:_ `B1`, `B2`

### Frontend
- [x] `F1` Add frontend practice API helpers, query keys, shared practice/validation types, and loading/error/empty states for trainer data — _Depends on:_ `B1`, `B2`
- [x] `F2` Implement a versioned guest progress `localStorage` store for attempts, streak, solved state, and migration-safe reads/writes — _Depends on:_ `F1`
- [x] `F3` Build `/practice/:id` as a CSR trainer with answer input, validation feedback states, code block rendering, streak/progress UI, next actions, and guest-first flow without login blocking practice — _Depends on:_ `F1`, `F2`
- [x] `F4` Add frontend unit and route/e2e coverage for trainer loading/error/empty states, validation interactions, local progress persistence, responsive mobile/desktop layout smoke checks, and no text/control overlap — _Depends on:_ `F1`, `F2`, `F3`

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
tests/test_practice_api.py
frontend/app/routes/practice.tsx
frontend/app/pages/practice/index.tsx
frontend/app/entities/task/model/task.types.ts
frontend/app/entities/task/api/tasks.ts
frontend/app/entities/task/api/task-queries.ts
frontend/app/entities/practice/model/practice.types.ts
frontend/app/entities/practice/api/practice.ts
frontend/app/entities/practice/api/practice-queries.ts
frontend/app/features/guest-progress/guest-progress-store.ts
frontend/app/features/guest-progress/use-guest-progress.ts
frontend/app/features/practice-trainer/practice-trainer.tsx
frontend/app/shared/lib/safe-ls.ts
frontend/app/shared/ui/code-block.tsx
frontend/app/shared/ui/input.tsx
frontend/app/styles/app.css
frontend/tests/practice-api.test.ts
frontend/tests/guest-progress.test.ts
frontend/tests/practice-routes.test.tsx
frontend/tests/e2e/practice-trainer.spec.ts
~~~

### Do NOT touch
- `docs/SPEC.md`
- `docs/CONTEXT.md`
- `content/tasks/**` authoring content, except when a focused test fixture is genuinely required outside production content
- `content/assets/**` authored assets, except when a focused test fixture is genuinely required outside production content
- Registration/login completion, server-side progress sync, `/profile`, weak tasks/recent activity, and account deletion
- Feedback form/review surface, privacy/terms, sitemap, robots, production backups, monitoring, TLS, analytics, and alerting behavior
- HTTP content import endpoints or content preview UI/API

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

None

Guest progress is browser-owned and stored in a versioned `localStorage` schema. Server-side `user_attempts` persistence is reserved for Phase 05.

### New API endpoints / RPC methods / events

| Method | Path / Topic | Auth | Response / Payload |
|--------|--------------|------|--------------------|
| `GET` | `/api/v1/public/practice/{task_id}` | No | Practice items without `expected_value` internals until validation |
| `POST` | `/api/v1/public/validate` | No | `{item_id, answer}` -> `{correct, expected_value?, explanation_html?}` |

Response constraints:
- Public practice APIs expose only practice items that belong to published tasks.
- Practice reads and pre-validation trainer payloads must not expose `expected_value`, raw answer patterns, or validation results.
- Validation input length is capped; regex execution has a hard timeout and logs only IDs/metadata, never raw answers.
- `answer_pattern` safety remains enforced at import time; runtime validation must not hang a worker.

### New types / models / shared interfaces

- `PublicPracticeItem`: `{ id: string; taskId: string; taskSlug: string; taskTitle: string; egeNumber: number; position: number; year: number | null; promptHtml: string; codeBlock: CodeBlock | null }`
- `PracticeValidationRequest`: `{ itemId: string; answer: string }`
- `PracticeValidationResponse`: `{ correct: boolean; expectedValue?: string; explanationHtml?: string }`
- `GuestProgressAttempt`: `{ itemId: string; taskId: string; answer: string; isCorrect: boolean; attemptsCount: number; lastAnsweredAt: string }`
- `GuestProgressState`: `{ version: 1; attempts: Record<string, GuestProgressAttempt>; streak: number; updatedAt: string }`
- `PracticeTrainerState`: neutral, correct, and incorrect UI states with stable layout
- Frontend practice API client functions and TanStack Query keys for practice reads and validation writes
- Versioned `localStorage` store for guest progress

Existing types reused from earlier phases:
- `TaskDifficulty`: `basic | medium | high`
- `CodeBlock`: language/title/code data rendered with the established code block UI
- `PublicPracticePreview`: public task detail practice CTA data without answer internals

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 04` before committing.

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
curl -s http://localhost:8000/api/v1/public/practice/{task_id}
curl -s -X POST http://localhost:8000/api/v1/public/validate \
  -H 'Content-Type: application/json' \
  -d '{"item_id":"{practice_item_id}","answer":"11"}'
# expected: published practice only before validation; no answer internals except validation feedback response
```

---

## Architect Review Notes

Use this section after manual product, UX, API, or workflow verification. This is the human-facing
channel for post-implementation fixes.

Add one unchecked checkbox per issue the agent must fix before the phase can close. Keep each item
independently fixable and describe observed behavior plus expected behavior. If the fix may change
SPEC/API/schema/security behavior, say so explicitly in the note.

The agent resolves these items through `/impl-review-notes 04`. Leave an item unchecked while it
is still open. Check it off only after the fix is implemented and re-verified. If manual
verification found nothing, keep the default checked line below.

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-04): practice trainer and guest progress
```

---

## Post-Phase Checklist

- [x] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [x] `docs/PHASE_04_NOTES.md` complete — agent execution memory recorded
- [x] All automated gate checks green
- [x] All architect review notes resolved
- [x] `docs/CONTEXT.md` updated — run `/context-update 04`
- [x] `docs/STATE.md` phase row updated to `✅ done`
- [x] `docs/CHANGELOG.md` entry added (if contracts changed)
- [x] Committed atomically on `feat/phase-04` branch
- [x] Tag created after merge to develop: `git tag -a v0.04.0 -m "Phase 04: Practice Trainer + Guest Progress"`
