# PHASE 01 — Foundation, Auth Shell, Design Tokens

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `01` |
| Title | Foundation, Auth Shell, Design Tokens |
| Status | `⏳ pending` |
| Tag | `v0.01.0` |
| Depends on | None |

---

## Phase Goal

Establish the runnable product foundation for `infraege`: backend settings, health, Docker-based local infrastructure, frontend route shell, and design tokens. This phase also creates the MVP auth shell without email verification, matching SPEC.md §4 and §5 while leaving content, trainer, progress sync, and production hardening to later phases.

---

## Design References

- `tmp/design-system-spec.md` — tokenized visual contract for warm paper/ink/coral/green/amber UI, typography, cards, chips, buttons, fields, navigation, and auth layouts.
- `docs/assets/mobile/` — 390px mobile references for sticky bars, bottom tabbar, auth, catalog, trainer, and profile-oriented screens.
- `docs/assets/desktop/` — 1440px desktop references for slim top nav, editorial layouts, catalog density, split auth layout, and wide page structure.

---

## Scope

### Backend
- [x] `B1` Establish FastAPI app foundation with environment-backed Pydantic settings, structured startup, and no hardcoded secrets — _Depends on:_ —
- [x] `B2` Implement `GET /api/v1/health` with application and database connectivity status — _Depends on:_ `B1`, `I1`
- [x] `B3` Implement auth API shell without email verification for registration, login, refresh, logout, and current-user reads; include password hashing, Pydantic max lengths, JWT TTLs, and login rate limiting — _Depends on:_ `B1`, `D1`
- [x] `B4` Add backend tests for settings, health, registration, login, auth edge cases, password/consent validation, token refresh, and login abuse protection — _Depends on:_ `B2`, `B3`

### Frontend
- [x] `F1` Establish React Router SSR frontend shell with route placeholders for MVP pages listed in SPEC.md §5.1; placeholders must not implement catalog, content, trainer, profile, legal, or admin business logic — _Depends on:_ `I1`
- [x] `F2` Implement base `infraege` design tokens, global styles, fonts, shared shell navigation, and replace user-facing Template App branding with `infraege` — _Depends on:_ `F1`
- [x] `F3` Build `/login` and `/register` skeleton screens with guest continuation affordance and 152-FZ consent checkbox — _Depends on:_ `F1`, `F2`, `B3`
- [x] `F4` Add frontend tests for environment handling, API client basics, route shell smoke behavior, and auth UI foundations — _Depends on:_ `F1`, `F3`

### Infra
- [x] `I1` Establish Docker Compose development stack for backend, frontend, PostgreSQL, Redis, and Nginx — _Depends on:_ —
- [x] `I2` Add container health checks and smoke-friendly local commands aligned with docs/STACK.md Gate Commands — _Depends on:_ `I1`, `B2`

### Data
- [x] `D1` Add users persistence foundation for auth: `users` table, `citext` support, `user_role` enum, timestamps, consent fields, and Alembic migration — _Depends on:_ `B1`

<!-- Test execution is governed by `## Gate Checks` below + docs/STACK.md § Gate Commands.
     Do not duplicate that list here. -->

---

## Files

### Create / modify
~~~
pyproject.toml
uv.lock
alembic.ini
alembic/env.py
alembic/script.py.mako
alembic/versions/*.py
app/__init__.py
app/main.py
app/api/__init__.py
app/api/v1/__init__.py
app/api/v1/router.py
app/api/v1/public/__init__.py
app/core/__init__.py
app/core/config.py
app/core/constants.py
app/core/exceptions.py
app/core/logging.py
app/core/middleware.py
app/core/rate_limit.py
app/db/__init__.py
app/db/base.py
app/db/session.py
app/modules/health/__init__.py
app/modules/health/api.py
app/modules/auth/__init__.py
app/modules/auth/api.py
app/modules/auth/config.py
app/modules/auth/constants.py
app/modules/auth/dependencies.py
app/modules/auth/exceptions.py
app/modules/auth/models.py
app/modules/auth/repository.py
app/modules/auth/schemas.py
app/modules/auth/service.py
app/modules/auth/utils.py
app/modules/users/__init__.py
app/modules/users/api.py
app/modules/users/config.py
app/modules/users/constants.py
app/modules/users/dependencies.py
app/modules/users/exceptions.py
app/modules/users/models.py
app/modules/users/repository.py
app/modules/users/schemas.py
app/modules/users/service.py
app/modules/users/utils.py
app/shared/__init__.py
app/shared/dependencies.py
app/shared/schemas.py
app/shared/types.py
tests/conftest.py
tests/test_config.py
tests/test_health.py
tests/test_auth_api.py
tests/test_register_api.py
frontend/package.json
frontend/pnpm-lock.yaml
frontend/react-router.config.ts
frontend/vite.config.ts
frontend/vitest.config.ts
frontend/tsconfig.json
frontend/app/routes.ts
frontend/app/styles/app.css
frontend/app/pages/home/index.tsx
frontend/app/pages/dashboard/ui/dashboard-page.tsx
frontend/app/features/auth/login-form.tsx
frontend/app/features/auth/register-form.tsx
frontend/app/features/auth/use-auth-guard.ts
frontend/app/shared/api/client.ts
frontend/app/shared/api/auth.ts
frontend/app/shared/api/keys.ts
frontend/app/shared/api/query-client.ts
frontend/app/shared/config/env.ts
frontend/app/shared/config/runtime.ts
frontend/app/shared/services/jwt-service/*
frontend/app/shared/ui/app-top-bar.tsx
frontend/app/shared/ui/input.tsx
frontend/tests/*.test.ts
frontend/tests/e2e/seo.spec.ts
Dockerfile.backend
Dockerfile.frontend
docker-compose.yml
docker-compose.override.yml
docker-compose.ci.yml
nginx/nginx.conf
nginx/nginx.dev.conf
nginx/conf.d/template-app.conf
.env.example
Makefile
~~~

### Do NOT touch
- `docs/SPEC.md`
- `docs/CONTEXT.md`
- `content/tasks/**`
- `content/assets/**`
- Production-only backup, monitoring, TLS, and alerting behavior beyond keeping existing files compatible

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

```text
users(
  id UUID PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  hashed_password VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',       -- user | admin
  consent_152fz BOOLEAN NOT NULL DEFAULT false,
  consent_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

Migration notes:
- Enable PostgreSQL `citext` before creating `users.email`.
- Create `user_role` enum with `user | admin`.
- Keep timestamps timezone-aware (`TIMESTAMPTZ`) and server-owned.

### New API endpoints / RPC methods / events

| Method | Path / Topic | Auth | Response / Payload |
|--------|--------------|------|--------------------|
| `GET` | `/api/v1/health` | No | Health status and DB connectivity |
| `POST` | `/api/v1/public/auth/register` | No | Email, password, `consent_152fz=true`; returns tokens and user |
| `POST` | `/api/v1/public/auth/login` | No | Email/password; returns tokens and user |
| `POST` | `/api/v1/public/auth/refresh` | Refresh token | New access token |
| `POST` | `/api/v1/public/auth/logout` | User | Stateless logout response |
| `GET` | `/api/v1/public/auth/me` | User | Current user profile |

`DELETE /api/v1/public/auth/me` is specified in SPEC.md §4.1, but account deletion is a Phase 05 key output. Keep it out of Phase 01; Phase 01 implements only register, login, refresh, logout, and current-user reads.

### New types / models / shared interfaces

- `UserRole`: `user | admin`
- `User`: `{ id: string; email: string; role: UserRole; consent152fz: boolean; consentAt: string | null; isActive: boolean; createdAt: string; updatedAt: string }`
- `AuthUser`: public current-user response shape, excluding `hashed_password`
- `AuthTokens`: access token and refresh token response shape
- `RegisterRequest`: email, password, `consent152fz`
- `LoginRequest`: email, password
- `HealthResponse`: status plus database connectivity details
- Frontend auth API client functions for register, login, refresh, logout, and current-user reads
- Auth implementation constraints:
  - Passwords are hashed with bcrypt or argon2 through a vetted library.
  - Register/login payloads use Pydantic max lengths and explicit validation.
  - Registration requires `consent_152fz=true` and records `consent_at`.
  - Access and refresh token TTLs come from typed settings.
  - Login has rate limiting through the existing rate-limit foundation.
  - Refresh token rotation is preferred if it fits the Phase 01 shell without adding persistent token storage; otherwise document the deferral in `docs/PHASE_01_NOTES.md`.
- Frontend auth token persistence stays on the existing simplified architecture: `client.ts` reads tokens through `jwt-service.ts`, and `jwt-service.ts` persists the token pair through safe localStorage. Phase 05 must revisit this and either migrate refresh-token persistence to backend-controlled `HttpOnly`, `Secure`, `SameSite` cookies or explicitly defer that hardening to Phase 07 production readiness.

### New env vars

| Key | Example value | Required |
|-----|---------------|----------|
| `DATABASE_URL` | `postgresql+asyncpg://app_user:changeme@db:5432/template_app` | yes |
| `POSTGRES_USER` | `app_user` | yes |
| `POSTGRES_PASSWORD` | `changeme` | yes |
| `POSTGRES_DB` | `template_app` | yes |
| `REDIS_URL` | `redis://redis:6379/0` | yes |
| `SECRET_KEY` | `CHANGE_ME_generate_a_secure_random_hex_string` | yes |
| `ALGORITHM` | `HS256` | yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | yes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `14` | yes |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | yes |
| `APP_ENV` | `development` | yes |
| `LOG_LEVEL` | `INFO` | yes |
| `AUTH_RATE_LIMIT` | `20/minute` | yes |
| `API_BASE_URL` | `http://localhost:8000` | yes |
| `API_BASE_INTERNAL_URL` | `http://backend:8000` | yes |
| `VITE_API_BASE_URL` | `http://localhost:8000` | yes |
| `VITE_PUBLIC_SITE_URL` | `http://localhost:3000` | yes |
| `VITE_PUBLIC_APP_NAME` | `infraege` | yes |

These names follow the existing typed settings, frontend env reader, Docker Compose config, and `.env.example`. Product-specific values may replace current template defaults during implementation, but names should stay stable unless the code is updated in the same phase.

Existing optional or production-adjacent env vars may remain in `.env.example` without becoming Phase 01 implementation scope, including backup health and deployment-domain variables. If an existing variable is kept, it must not conflict with the Phase 01 app defaults or expose secrets.

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 01` before committing.

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
# Optional phase-specific smoke override
curl -s http://localhost:8000/api/v1/health
# expected: {"status":"ok","db":"connected"}
```

Later phases may add or rely on detailed readiness checks such as dependency maps, but Phase 01 smoke keeps `/api/v1/health` intentionally simple.

---

## Architect Review Notes

Use this section after manual product, UX, API, or workflow verification. This is the human-facing
channel for post-implementation fixes.

Add one unchecked checkbox per issue the agent must fix before the phase can close. Keep each item
independently fixable and describe observed behavior plus expected behavior. If the fix may change
SPEC/API/schema/security behavior, say so explicitly in the note.

The agent resolves these items through `/impl-review-notes 01`. Leave an item unchecked while it
is still open. Check it off only after the fix is implemented and re-verified. If manual
verification found nothing, keep the default checked line below.

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-01): foundation, auth shell, and design tokens
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_01_NOTES.md` complete — agent execution memory recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 01`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-01` branch
- [ ] Tag created after merge to develop: `git tag -a v0.01.0 -m "Phase 01: Foundation, Auth Shell, Design Tokens"`
