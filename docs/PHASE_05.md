# PHASE 05 — Account/Profile + Sync

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `05` |
| Title | Account/Profile + Sync |
| Status | `⏳ pending` |
| Tag | `v0.05.0` |
| Depends on | PHASE_04 gate passing |

---

## Phase Goal

Persist progress for registered users, matching SPEC.md §3, §4.1, §5.1, and §5.2. This phase introduces the `user_attempts` table, completes the login and registration UI to production quality, adds a progress sync flow that merges guest `localStorage` attempts into server-side records after login or registration, and builds the `/profile` page with user stats, weak tasks, recent activity, and account deletion. Feedback, legal pages, SEO hardening, and production infrastructure remain out of scope.

---

## Design References

- `docs/assets/desktop/_ _ split.png` — Desktop login split layout: dark left brand panel with "27 задач. Один экран. Без лишнего." and product stats, light right panel with "С возвращением." heading, email/password fields, show/hide toggle, "запомнить меня" checkbox, coral "Войти" CTA, divider "или", secondary "Продолжить как гость" button, top-right "Нет аккаунта? Создать" link.
- `docs/assets/desktop/_ _ split (1).png` — Desktop register split layout: same brand panel, right side with "Создай аккаунт за минуту." heading, step indicator "ШАГ 1 / 1 · БЕСПЛАТНО", email/password with password-strength meter ("надёжный · 3/4"), 152-FZ consent checkbox with privacy/terms links, coral "Создать аккаунт" CTA, keyboard hints (⌘ Enter / Esc), top-right "Уже есть аккаунт? Войти".
- `docs/assets/mobile/_ (1).png` — Mobile login: back arrow, logo header (infraege), "С возвращением." heading, email/password fields with show/hide icon, "забыл пароль?" link, black pill "Войти" CTA, divider "или", outline pill "Решать как гость" secondary, bottom "Нет аккаунта? Зарегистрироваться" link.
- `docs/assets/mobile/_ _ 152-_.png` — Mobile register: back arrow, "ШАГ 1 ИЗ 1 · БЕСПЛАТНО" tag, "Создай аккаунт за минуту." heading, email/password with 4-segment strength bar (green "надёжный"), 152-FZ consent checkbox, coral pill "Создать аккаунт" CTA, bottom "Уже есть аккаунт? Войти".

---

## Scope

### Data
- [x] `D1` Add Alembic migration `0003_user_attempts` for the `user_attempts` table with cascade constraints — _Depends on:_ —

### Backend
- [x] `B1` Add `UserAttempt` SQLAlchemy model and Pydantic schemas for sync request/response and profile stats — _Depends on:_ `D1`
- [x] `B2` Implement `DELETE /api/v1/public/auth/me` — authenticated account deletion with cascaded `user_attempts` removal — _Depends on:_ `B1`
- [x] `B3` Implement `POST /api/v1/public/progress/sync` — bulk upsert guest attempts into `user_attempts` with `ON CONFLICT` merge — _Depends on:_ `B1`
- [x] `B4` Implement `GET /api/v1/public/progress/me` — compute profile stats, bottom-5 weak tasks by accuracy, and last-30-day activity — _Depends on:_ `B1`
- [x] `B5` Add backend tests for DELETE /me cascade, sync idempotency, progress/me response shape, and auth guards — _Depends on:_ `B2`, `B3`, `B4`

### Frontend
- [x] `F1` Complete `/login` page — email/password form, show/hide toggle, "запомнить меня", "забыл пароль?" deferred link, "Решать как гость" secondary CTA, split desktop layout and mobile layout matching design references — _Depends on:_ —
- [x] `F2` Complete `/register` page — email/password with 4-segment strength meter, 152-FZ consent checkbox with privacy/terms links, step indicator, split desktop layout and mobile layout matching design references — _Depends on:_ —
- [x] `F3` Progress sync flow — after successful login or register, if guest `localStorage` has attempts, call sync API then clear synced keys; expose sync state (idle / syncing / done / error) — _Depends on:_ `F1`, `F2`, `B3`
- [x] `F4` Build `/profile` page — user stats tiles, weak-task list, recent-activity chart, sync status indicator, account deletion with confirmation modal — _Depends on:_ `F3`, `B4`
- [x] `F5` Frontend unit and e2e tests for login/register forms, progress sync hook, and profile page states — _Depends on:_ `F1`, `F2`, `F3`, `F4`

<!-- Test execution is governed by `## Gate Checks` below + docs/STACK.md § Gate Commands.
     Do not duplicate that list here. -->

---

## Files

### Create / modify
~~~
alembic/versions/0003_user_attempts.py
app/modules/users/models.py
app/modules/users/schemas.py
app/modules/users/repository.py
app/modules/users/service.py
app/modules/users/api.py
app/api/v1/router.py
tests/test_progress_api.py
frontend/app/routes/login.tsx
frontend/app/routes/register.tsx
frontend/app/pages/auth/login.tsx
frontend/app/pages/auth/register.tsx
frontend/app/routes/profile.tsx
frontend/app/pages/profile/index.tsx
frontend/app/entities/user/model/user.types.ts
frontend/app/entities/user/api/users.ts
frontend/app/entities/user/api/user-queries.ts
frontend/app/features/progress-sync/progress-sync.ts
frontend/app/features/progress-sync/use-progress-sync.ts
frontend/app/shared/ui/password-input.tsx
frontend/app/shared/ui/password-strength.tsx
frontend/tests/auth-forms.test.tsx
frontend/tests/profile-page.test.tsx
frontend/tests/progress-sync.test.ts
frontend/tests/e2e/auth-flow.spec.ts
frontend/tests/e2e/profile.spec.ts
~~~

### Do NOT touch
- `docs/SPEC.md`
- `docs/CONTEXT.md`
- `content/tasks/**` and `content/assets/**` authored content
- Practice trainer, validation endpoint, guest `localStorage` schema internals — extend sync only
- Feedback form/review surface, `feedback_reports` table, privacy/terms, sitemap, robots, production backups, monitoring, TLS, analytics
- HTTP content import endpoints or content preview UI/API

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

```sql
user_attempts(
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_item_id UUID NOT NULL REFERENCES practice_items(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  attempts_count SMALLINT NOT NULL DEFAULT 1,
  last_answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, practice_item_id)
)
```

Constraints:
- Deletion of a `users` row cascades to all `user_attempts` rows for that user.
- Deletion of a `practice_items` row cascades to related `user_attempts`.
- `attempts_count` is incremented, not replaced, on sync upsert.
- `last_answered_at` takes the later of stored and incoming value on conflict.

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `DELETE` | `/api/v1/public/auth/me` | User (JWT) | `204 No Content`; cascades `user_attempts` |
| `POST` | `/api/v1/public/progress/sync` | User (JWT) | `{attempts: SyncAttemptItem[]}` → `{synced: number, updated: number}` |
| `GET` | `/api/v1/public/progress/me` | User (JWT) | `{stats: ProfileStats, weakTasks: WeakTask[], recentActivity: RecentActivity[]}` |

Constraints:
- Sync payload is capped at 300 attempts per request; excess returns `422`.
- `DELETE /me` is irreversible; response must be `204` with no body.
- `GET /progress/me` weak tasks are the bottom-5 by accuracy (correct / total attempts).
- Recent activity is last 30 days, grouped by calendar date, attempt count per day.

### New types / models / shared interfaces

- `UserAttempt`: `{ id: string; userId: string; practiceItemId: string; isCorrect: boolean; attemptsCount: number; lastAnsweredAt: string }`
- `SyncAttemptItem`: `{ practiceItemId: string; isCorrect: boolean; attemptsCount: number; lastAnsweredAt: string }`
- `ProgressSyncRequest`: `{ attempts: SyncAttemptItem[] }`
- `ProgressSyncResponse`: `{ synced: number; updated: number }`
- `ProfileStats`: `{ totalTasks: number; solvedTasks: number; correctAttempts: number; totalAttempts: number; streak: number; lastActivityAt: string | null }`
- `WeakTask`: `{ taskId: string; taskSlug: string; taskTitle: string; egeNumber: number; solvedCount: number; totalCount: number; accuracy: number }`
- `RecentActivity`: `{ date: string; count: number }`
- `ProfileMe`: `{ stats: ProfileStats; weakTasks: WeakTask[]; recentActivity: RecentActivity[] }`
- `PasswordStrength`: `0 | 1 | 2 | 3 | 4` — 4-segment visual strength (matches design "надёжный · 3/4")
- Frontend API client functions and TanStack Query keys for sync, progress/me, DELETE /me

Existing types reused from earlier phases:
- `AuthUser`, `AuthTokens`, `LoginRequest`, `RegisterRequest` — from Phase 01
- `GuestProgressState`, `GuestProgressAttempt` — from Phase 04 (source for sync payload)

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 05` before committing.

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
# Smoke: account deletion cascade
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/public/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.ru","password":"testpass"}' | jq -r '.access_token')
curl -s -X DELETE http://localhost:8000/api/v1/public/auth/me \
  -H "Authorization: Bearer $TOKEN"
# expected: 204 No Content; subsequent GET /auth/me returns 401

# Smoke: progress sync
curl -s -X POST http://localhost:8000/api/v1/public/progress/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"attempts":[{"practice_item_id":"[uuid]","is_correct":true,"attempts_count":1,"last_answered_at":"2026-05-29T10:00:00Z"}]}'
# expected: {"synced":1,"updated":0}

# Smoke: profile stats
curl -s http://localhost:8000/api/v1/public/progress/me \
  -H "Authorization: Bearer $TOKEN"
# expected: {stats:{...}, weakTasks:[...], recentActivity:[...]}
```

---

## Architect Review Notes

Use this section after manual product, UX, API, or workflow verification. This is the human-facing
channel for post-implementation fixes.

Add one unchecked checkbox per issue the agent must fix before the phase can close. Keep each item
independently fixable and describe observed behavior plus expected behavior. If the fix may change
SPEC/API/schema/security behavior, say so explicitly in the note.

The agent resolves these items through `/impl-review-notes 05`. Leave an item unchecked while it
is still open. Check it off only after the fix is implemented and re-verified. If manual
verification found nothing, keep the default checked line below.

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-05): account, profile, and progress sync
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_05_NOTES.md` complete — agent execution memory recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 05`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-05` branch
- [ ] Tag created after merge to develop: `git tag -a v0.05.0 -m "Phase 05: Account/Profile + Sync"`
