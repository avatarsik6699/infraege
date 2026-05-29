# PHASE 06 — Feedback, Legal, SEO Hardening

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `06` |
| Title | Feedback, Legal, SEO Hardening |
| Status | `⏳ pending` |
| Tag | `v0.06.0` |
| Depends on | PHASE_05 gate passing |

---

## Phase Goal

Phase 06 completes the public trust and discoverability layer required before production launch. It wires up the feedback form (`POST /api/v1/public/feedback`) with honeypot and rate-limit protection, adds the admin review surface (`GET/PATCH /api/v1/admin/feedback`), replaces placeholder `/privacy` and `/terms` routes with real legal content, and hardens SEO — production-ready sitemap with task slugs, Open Graph tags on all SSR routes, and Lighthouse/accessibility fixes across public pages. See SPEC.md §1.2, §4.1, §4.2, §5.1, and §7.

---

## Scope

<!-- Group tasks by area (Backend / Frontend / Infra / Data, etc.).
     ID scheme: B=Backend · F=Frontend · I=Infra · D=Data · T=other (ungrouped)
     Each item: `ID` description — _Depends on:_ ID, ID or —
     IDs are stable after assignment — never renumber. Mark removed tasks as ~~BN~~ (removed). -->

### Data
- [x] `D1` Alembic migration `0004_feedback_reports`: add `feedback_status` enum (`new | reviewed | archived`) and `feedback_reports` table — _Depends on:_ —

### Backend
- [x] `B1` `FeedbackReport` SQLAlchemy model, `FeedbackRequest` / `FeedbackResponse` / `FeedbackReportAdmin` / `FeedbackStatusUpdate` / `FeedbackListResponse` Pydantic schemas, and `FeedbackRepository` — _Depends on:_ `D1`
- [x] `B2` `POST /api/v1/public/feedback` — honeypot field check, `sha256(ip + FEEDBACK_IP_PEPPER)` ip_hash, Redis-backed rate-limit, message length cap — _Depends on:_ `B1`
- [x] `B3` `GET /api/v1/admin/feedback` paginated list and `PATCH /api/v1/admin/feedback/{id}` status update; add `require_admin` FastAPI dependency — _Depends on:_ `B1`
- [x] `B4` Backend tests: feedback submit flow, honeypot rejection, rate-limit guard, admin list pagination, status patch, and auth guard for admin routes — _Depends on:_ `B2`, `B3`

### Frontend
- [x] `F1` Feedback form feature component — accessible honeypot field, controlled textarea, submit / loading / success / error states, design-system styling — _Depends on:_ —
- [x] `F2` `/privacy` page — replace `PlaceholderPage` stub with real SSR 152-FZ privacy policy content — _Depends on:_ —
- [x] `F3` `/terms` page — replace `PlaceholderPage` stub with real SSR terms of use content — _Depends on:_ —
- [x] `F4` `/admin/feedback` CSR page — paginated admin table using `adm-tbl` design tokens, status chip, PATCH status action — _Depends on:_ `F1`, `B3`
- [x] `F5` Sitemap production readiness — add task page slugs to `publicIndexableRoutes` in `site-config.mjs`; confirm `robots.txt` Sitemap URL uses `VITE_PUBLIC_SITE_URL` — _Depends on:_ —
- [x] `F6` SEO / OG metadata polish — add `og:title`, `og:description`, `og:type` to all SSR route `meta()` exports; canonical URL audit across `/`, `/topics`, `/tasks/:slug`, `/privacy`, `/terms` — _Depends on:_ `F2`, `F3`
- [x] `F7` Lighthouse / accessibility fixes — ARIA roles for dynamic regions, keyboard focus management, `skip-to-content` link, colour-contrast audit, 44 px tap targets on mobile — _Depends on:_ `F5`, `F6`
- [x] `F8` Frontend tests — feedback form submission / error states unit test, admin-feedback page render test, updated sitemap route coverage — _Depends on:_ `F1`, `F4`, `F5`

<!-- Test execution is governed by `## Gate Checks` below + docs/STACK.md § Gate Commands.
     Do not duplicate that list here. -->

---

## Files

### Create / modify
~~~
# Data / Backend
alembic/versions/0004_feedback_reports.py
app/modules/feedback/__init__.py
app/modules/feedback/models.py
app/modules/feedback/schemas.py
app/modules/feedback/repository.py
app/modules/feedback/service.py
app/modules/feedback/api.py
app/api/v1/admin/__init__.py
app/api/v1/admin/feedback.py
app/api/v1/router.py
app/core/config.py
app/modules/auth/dependencies.py
tests/test_feedback_api.py

# Frontend — feature
frontend/app/features/feedback/feedback-form.tsx
frontend/app/features/feedback/use-feedback.ts
frontend/app/entities/feedback/api/feedback.ts
frontend/app/shared/api/keys.ts

# Frontend — pages
frontend/app/pages/legal/privacy-page.tsx
frontend/app/pages/legal/terms-page.tsx
frontend/app/pages/admin/feedback/index.tsx

# Frontend — routes (replace placeholders)
frontend/app/routes/privacy.tsx
frontend/app/routes/terms.tsx
frontend/app/routes/admin-feedback.tsx

# Frontend — SEO / sitemap
frontend/scripts/site-config.mjs
frontend/public/sitemap.xml
frontend/public/robots.txt

# Frontend — tests
frontend/tests/feedback-form.test.tsx
frontend/tests/admin-feedback.test.tsx
~~~

### Do NOT touch
- `alembic/versions/0001_users_table.py` through `0003_user_attempts.py`
- `app/modules/auth/` (except adding `require_admin` to `dependencies.py`)
- `app/modules/tasks/`, `app/modules/users/`, `app/modules/health/`
- `frontend/app/pages/profile/`, `frontend/app/features/practice-trainer/`
- `content/` — task content files

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

```sql
-- New enum
feedback_status: new | reviewed | archived

-- New table
feedback_reports(
  id           UUID PRIMARY KEY,
  page_url     VARCHAR(500) NOT NULL,
  message      TEXT NOT NULL,
  ip_hash      CHAR(64) NOT NULL,            -- sha256(ip + FEEDBACK_IP_PEPPER)
  user_agent   VARCHAR(300),
  status       feedback_status NOT NULL DEFAULT 'new',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

Notes (from SPEC.md §3): raw IP addresses are never stored; `ip_hash = sha256(ip + FEEDBACK_IP_PEPPER)`. No FK to `users`.

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `POST` | `/api/v1/public/feedback` | No | `{page_url, message, honeypot?}` → `{ok: true}`; honeypot must be empty; rate-limited; ip_hash stored; no raw answers logged |
| `GET` | `/api/v1/admin/feedback` | Admin | `{items: FeedbackReportAdmin[], total: int, page: int, per_page: int}`; query params: `?page=1&per_page=20&status=new` |
| `PATCH` | `/api/v1/admin/feedback/{id}` | Admin | `{status: feedback_status}` → `FeedbackReportAdmin` |

### New types / models / shared interfaces

```typescript
// Feedback API — client-facing
interface FeedbackRequest {
  pageUrl: string;       // VARCHAR(500)
  message: string;       // TEXT, max length enforced server-side
  honeypot?: string;     // hidden field, must be empty string; never sent to real API
}

interface FeedbackResponse {
  ok: boolean;
}

// Admin API
type FeedbackStatus = 'new' | 'reviewed' | 'archived';

interface FeedbackReportAdmin {
  id: string;            // UUID
  pageUrl: string;
  message: string;
  ipHash: string;        // CHAR(64)
  userAgent: string | null;
  status: FeedbackStatus;
  submittedAt: string;   // TIMESTAMPTZ ISO string
}

interface FeedbackStatusUpdate {
  status: FeedbackStatus;
}

interface FeedbackListResponse {
  items: FeedbackReportAdmin[];
  total: number;
  page: number;
  perPage: number;
}
```

Stores introduced this phase: None (feedback form uses local `useState` only).

### New env vars

| Key | Example value | Required |
|-----|---------------|----------|
| `FEEDBACK_IP_PEPPER` | `changeme-feedback-pepper-32ch` | yes |
| `FEEDBACK_RATE_LIMIT` | `5/minute` | no (default: `5/minute`) |

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 06` before committing.

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

Phase-specific smoke check:

```bash
# Submit feedback (should return 200 + {ok: true})
curl -s -X POST http://localhost:8000/api/v1/public/feedback \
  -H "Content-Type: application/json" \
  -d '{"page_url":"/topics","message":"Тест обратной связи","honeypot":""}' | jq .
# expected: {"ok": true}

# Honeypot rejection (should return 200 to not leak detection, but discard)
# Or 422 if explicit rejection is chosen — verify against impl contract.

# Sitemap should include at least one task slug URL
curl -s http://localhost:3000/sitemap.xml | grep 'ege-'
# expected: at least one <loc> containing /tasks/ege-
```

---

## Architect Review Notes

Use this section after manual product, UX, API, or workflow verification. This is the human-facing
channel for post-implementation fixes.

Add one unchecked checkbox per issue the agent must fix before the phase can close. Keep each item
independently fixable and describe observed behavior plus expected behavior. If the fix may change
SPEC/API/schema/security behavior, say so explicitly in the note.

The agent resolves these items through `/impl-review-notes 06`. Leave an item unchecked while it
is still open. Check it off only after the fix is implemented and re-verified. If manual
verification found nothing, keep the default checked line below.

- [x] Я запустил проект через docker compose up. Сид данные были применены. Я зашел на страницу /login, ввёл данные для авторизации, но получил ошибку 422 Unprocessable Content http://localhost:8000/api/v1/public/auth/login; payload {
    "email": "admin@dev.local",
    "password": "Admin1234!"
}; response {
    "detail": [
        {
            "type": "value_error",
            "loc": [
                "body",
                "email"
            ],
            "msg": "value is not a valid email address: The part after the @-sign is a special-use or reserved name that cannot be used with email.",
            "input": "admin@dev.local",
            "ctx": {
                "reason": "The part after the @-sign is a special-use or reserved name that cannot be used with email."
            }
        }
    ]
}, изучи в чем проблема и исправь ошибку.

- [x] На стороне frontend присутствует компонент AppTopBar, который был изначально в шаблоне на основе которого был создан данный проект. Т.к. этот компонент не предусмотрен в дизайн системе, от него нужнл избавиться, т.к. он ломает текущую дизайн систему и структуру сайта.

- [x] После удаления AppTopBar из проекта пропала навигация и ряд другого функционала. Я предлагаю вернуть AppTopBar, но в корректном виде, соответствующем дизайн системе /home/niquetamerewsl/projects/infraege/tmp/design-system-spec.md и дизайн референсам /home/niquetamerewsl/projects/infraege/docs/assets. Также сейчас при входе в профиль, нет возможности перейти из профиля к задачам, темам и т.д. Но возможно это будет исправлено вместе с возвратом AppTopBar.

- [x] Не получается авторизоваться за админа login: admin@example.com password: Admin1234! на странице /login. Получаю ошибку 401 Unauthorized http://localhost:8000/api/v1/public/auth/login {"detail": "Invalid email or password"}"Invalid email or password". Разберись в чем причина и исправь её. Также сделай e2e/integration/unit тесты на frontend для проверки подобных сценариев, чтобы не сталкиваться с этим далее.

- [x] На данный момент внизу сайта постоянно отображается секция с кнопками/навигацией, которая должна отображаться только на маленьких экранах. Предлагаю вообще на данный момент убрать нижнюю секцию. Должна быть только полнофункциональная шапка со всем необходимым функционалом, навигацей, информацией и т.д. При этом адаптируй шапку под маленькие, средние и большие экраны. Шрифт и размер элементов также должен адатпироваться под размеры экранов.

- [x] На данный момент флоу работы с профилем закончен не полностью. Например отсутствует возможность выйти из системы (logout). Также в профиле отсутствует информация о текущей сессии, токене авторизации и другая метаинформация, связанная с логином/авторизацией в системе, которая могла бы пригодиться.

- [x] В текущей фазе был реализован функционал обратной связи, однако со стороны пользователя я не вижу никаких кнопок, ссылок, форм в интерфейсе, где я могу оставить обратную связь. Разберись в чем причина и исправь.

- [x] Сейчас, когда я авторизован за пользователя с ролью админ, то у меня нет никаких кнопок, ссылок и т.д. для перехода в админ панель. Разберись в чем причина и исправь.

- [x] В шапке присутствует ссылка "Тренажёр", при клике на которую открывается /practice/demo, где присутствует блок с ошибкой "Практика недоступна
Не удалось получить задания. Попробуйте обновить страницу.". Выясни есть ли вообще функционал "Тренажёр"? Реализован ли и должен ли присутствовать.
---

## Atomic Commit Message

```
feat(phase-06): feedback form, legal pages, seo hardening
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_06_NOTES.md` complete — agent execution memory recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 06`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-06` branch
- [ ] Tag created after merge to develop: `git tag -a v0.06.0 -m "Phase 06: Feedback, Legal, SEO Hardening"`
