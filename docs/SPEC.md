# TECHNICAL SPECIFICATION (SPEC.md): `infraege`

> **For AI agent**: Read this file in full before starting any phase.
> Confirm understanding of constraints and the phased development model.
> When this file changes, run `/spec-sync [description of change]` immediately.

## Metadata

| Field | Value |
|-------|-------|
| Document Version | `v2.1` |
| Date | `2026-05-28` |
| Architect / Owner | `v.godlevskiy` |
| Contract Version | `v1.0` (see `docs/CONTEXT.md`) |
| Stack | See [docs/STACK.md](./STACK.md) |
| Product | `infraege` |
| Production Domain | `infraege.ru` |
| Domain | Russian Unified State Exam (EGE) preparation in computer science for Russian 10-11 grade students. Content and UI are Russian-only for MVP. |

---

## 1. Project Overview and Goals

### 1.1 Problem

Students preparing for the EGE in computer science need a focused, mobile-first product that combines concise theory, immediate practice, and progress tracking. Existing free resources are fragmented, often desktop-biased, and mix learning with ads, noisy gamification, or outdated task structure.

`infraege` solves this by presenting all 27 EGE computer science tasks as a clear catalog with theory pages, a fast trainer, and progress that works for guests first and can later be synced into an account.

### 1.2 Goal and Success Metrics

Build a free, SEO-indexable web platform for EGE computer science preparation with:

- Catalog model for all 27 EGE tasks.
- Theory pages written in Russian and optimized for fast reading.
- Trainer with instant answer validation and clear feedback states.
- Guest progress stored in the browser.
- Account progress sync, profile statistics, and account deletion.
- Feedback, legal pages, sitemap/robots, and production observability.
- Visual implementation matching `tmp/design-system-spec.md` and references in `docs/assets`.

Success metrics for MVP launch:

- `/`, `/topics`, `/tasks/:slug`, `/practice/:id`, `/login`, `/register`, and `/profile` are implemented and usable on mobile 390px and desktop 1440px.
- Catalog supports 27 task records even if the initial content set is partially filled.
- Guest can complete practice without registration and see local progress.
- Registered user can sync guest progress, view profile statistics, and delete the account.
- Lighthouse mobile scores are at least 90 for Performance, Accessibility, Best Practices, and SEO on public SSR pages.
- Public API p99 latency is under 300 ms for task reads and validation under normal MVP load.
- Validation cannot hang a worker: unsafe patterns are rejected at content import/write time and runtime validation has a hard timeout.
- `/privacy`, `/terms`, `sitemap.xml`, and `robots.txt` are published before production launch.
- Production runs on `infraege.ru` with TLS, backups, monitoring, and analytics events.

### 1.3 Project Boundaries

| Included | Excluded |
|----------|----------|
| Russian-only EGE computer science preparation | OGE, other school grades, other subjects |
| Catalog model for all 27 EGE tasks | Guarantee that all 27 tasks have full content on day one |
| Repository Markdown-based theory and practice content | Rich-text CMS for theory editing |
| Guest trainer with `localStorage` progress | Mandatory registration before practice |
| Email/password auth without email verification | Email verification in MVP |
| Account profile, progress sync, account deletion | Password reset in MVP |
| Feedback form and review surface | Comments, community, social features |
| SEO, legal pages, PWA-friendly UX foundations | Native mobile apps |
| Production readiness for one VPS / Docker Compose | Multi-region deployment, Kubernetes |

---

## 2. Domain Context

### 2.1 Roles and Permissions

| Role | Capabilities | Restrictions |
|------|--------------|--------------|
| `Guest` | Read theory, solve practice, keep progress in `localStorage`, submit feedback | No server-side progress or profile |
| `User` | All guest capabilities, sync progress, view profile statistics, delete account | No admin or content-write access |
| `Admin` | Review operational feedback where exposed | No MVP content CRUD, content import UI, rich-text CMS, or hidden mini-CMS |
| `Architect` | Defines SPEC/phase contracts and reviews product behavior | Does not implement outside the SDD workflow |
| `AI_Agent` | Implements phase-scoped tasks and runs gates | Does not push to `main`/`develop`; respects scope lock |

### 2.2 Key Entities

`Task -> PracticeItem -> UserAttempt`

`User -> UserAttempt`

`FeedbackReport` is independent from user identity and stores no raw IP address.

A `Task` represents one of the 27 EGE task numbers and owns theory, metadata, practice items, and local assets. A `PracticeItem` is the smallest gradable unit. A `UserAttempt` stores the latest known server-side progress for a registered user. Guest progress uses a versioned browser `localStorage` schema and is merged through progress sync after login or registration.

Theory and practice content are authored in repository files. Database HTML is a derived artifact from sanitized Markdown import, not the primary authoring surface. `Seed` data means dev/test fixtures used to quickly populate a local or test environment; seed fixtures are not the source of truth for production learning content.

### 2.3 Content Authoring Workflow

The human author writes task theory, practice prompts, explanations, and local assets in the repository. The agent implements and maintains the schema, validation, import tooling, tests, rendering, and database integration.

Canonical content layout:

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

Each `content/tasks/ege-XX.md` file is one EGE task page. It contains YAML frontmatter for metadata and practice items, followed by extended Markdown theory body.

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

Markdown body requirements:

- Allowed authoring features: headings, paragraphs, ordered/unordered lists, tables, inline code, fenced code blocks, internal anchors, callouts, and local images.
- Local images must live under `content/assets/<task-slug>/` and be referenced from the task Markdown with alt text.
- Theory body, practice prompts, and explanations are rendered to sanitized HTML during import.
- Original content files and original assets remain in `content/`; generated HTML and prepared static assets are derived artifacts.

Publication lifecycle:

- `status` is controlled only by task frontmatter.
- Public APIs, SSR pages, sitemap, and SEO surfaces expose only `published` tasks.
- Draft tasks are available only in local development after importing into a local DB; separate preview UI/API is out of MVP scope.
- Placeholder files for all 27 tasks are allowed, but a `published` task must have non-empty theory, valid metadata, valid assets, and at least one valid practice item.

Content tooling contract:

- Phase 02 must provide `uv run python -m app.content check` for dry-run validation without DB writes.
- Phase 02 must provide `uv run python -m app.content import` for validate -> render -> sanitize -> prepare assets -> upsert DB rows.
- Validation errors must include the source file path and field path.
- HTTP content import endpoints are excluded from MVP. Content import is CLI-first to avoid building a hidden mini-CMS.
- Dev/test seed fixtures may be added for automated tests and fast local experiments, but production content comes from `content/tasks/*.md` and `content/assets/**`.

Content validation rules:

- Validate that `content/tasks/ege-01.md` through `content/tasks/ege-27.md` exist, unless a phase explicitly narrows the local fixture set for tests.
- Validate unique `ege_number`, `slug`, and practice item `id`.
- Validate `ege_number` is `1..27`, `difficulty` is `basic | medium | high`, and `status` is `draft | published`.
- Validate `answer_pattern` length, compilation, and ReDoS denylist before import.
- Validate local image paths, supported file types, alt text, and image metadata.
- Reject `published` tasks with empty theory, broken assets, or zero practice items.
- Reject generated HTML that fails sanitization.

---

## 3. Data Model

Persistent storage uses PostgreSQL through SQLAlchemy async and Alembic. All server-owned rows use UUID primary keys, `TIMESTAMPTZ` audit fields, and explicit indexes for public reads.

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

user_attempts(
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_item_id UUID NOT NULL REFERENCES practice_items(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  attempts_count SMALLINT NOT NULL DEFAULT 1,
  last_answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, practice_item_id)
)

feedback_reports(
  id UUID PRIMARY KEY,
  page_url VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(300),
  status feedback_status NOT NULL DEFAULT 'new', -- new | reviewed | archived
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

Model requirements:

- `tasks.ege_number` is constrained to `1..27` and is the primary catalog structure for MVP.
- Difficulty maps to UI chips: `basic` -> green, `medium` -> amber, `high` -> coral.
- `asset_manifest` stores derived public asset URLs plus alt, width, height, original path, and optional optimized path.
- `source_path` and `source_hash` make content imports deterministic and auditable.
- `practice_items.source_key` maps DB rows back to frontmatter `practice_items[].id`.
- `answer_pattern` is validated during import and never executed without a timeout.
- User deletion cascades attempts and leaves no server-side progress for that user.
- Raw IP addresses are never stored; feedback uses `sha256(ip + FEEDBACK_IP_PEPPER)`.

---

## 4. API / Backend Contract

Backend uses FastAPI, Pydantic v2, async SQLAlchemy sessions, Redis-backed rate limiting where needed, and structured JSON logs with request IDs.

### 4.1 Public API

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `GET` | `/api/v1/health` | No | Health status and DB connectivity |
| `GET` | `/api/v1/public/tasks` | No | 27-task catalog with filters: search, difficulty, solved state where available |
| `GET` | `/api/v1/public/tasks/{slug}` | No | Published task theory, metadata, TOC, progress summary where available |
| `GET` | `/api/v1/public/practice/{task_id}` | No | Practice items without `expected_value` internals until validation |
| `POST` | `/api/v1/public/validate` | No | `{item_id, answer}` -> `{correct, expected_value?, explanation_html?}` |
| `POST` | `/api/v1/public/auth/register` | No | Email, password, `consent_152fz=true`; returns tokens and user |
| `POST` | `/api/v1/public/auth/login` | No | Email/password; returns tokens and user |
| `POST` | `/api/v1/public/auth/refresh` | Refresh token | New access token |
| `POST` | `/api/v1/public/auth/logout` | User | Stateless logout response |
| `GET` | `/api/v1/public/auth/me` | User | Current user profile |
| `DELETE` | `/api/v1/public/auth/me` | User | Deletes account and cascades attempts |
| `POST` | `/api/v1/public/progress/sync` | User | Bulk upsert of local attempts |
| `GET` | `/api/v1/public/progress/me` | User | Profile stats, weak tasks, recent activity |
| `POST` | `/api/v1/public/feedback` | No | Stores feedback with honeypot/captcha/rate-limit protection |

### 4.2 Admin / Operational API

MVP does not include a full content CRUD backoffice. Admin scope is intentionally narrow:

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `GET` | `/api/v1/admin/feedback` | Admin | Paginated feedback reports |
| `PATCH` | `/api/v1/admin/feedback/{id}` | Admin | Update feedback status |

Content import is intentionally not exposed over HTTP in MVP. It is a local CLI workflow.

### 4.3 Backend Requirements

- No hardcoded secrets; all secrets come from environment-backed settings.
- Email verification is not implemented in MVP.
- Password reset is explicitly deferred.
- JWT access token TTL is short-lived; refresh token rotation is preferred.
- Password hashing uses bcrypt or argon2 through a vetted library.
- All write payloads have Pydantic max lengths and explicit validation.
- Login, validation, and feedback endpoints have abuse protection.
- Validation input length is capped; regex execution has a hard timeout and logs only IDs/metadata, never raw answers.
- Content import sanitizes Markdown output before storing `theory_html`, `prompt_html`, or `explanation_html`.
- The `/topics` frontend route is a user-facing catalog label only; MVP does not require a backend `topics` table or `/api/v1/public/topics` endpoint.

---

## 5. Frontend / Client Contract

Frontend uses React 19, React Router SSR, Vite, TypeScript, and Tailwind. React Router route modules stay thin and delegate page implementation to the project page/component structure.

### 5.1 Pages and Rendering

| Route | Render | Purpose |
|-------|--------|---------|
| `/` | SSR | Landing page, product promise, method blocks, CTA to trainer/topics |
| `/topics` | SSR + client filters | User-facing "Темы" catalog of all 27 EGE tasks with search, difficulty filters, progress |
| `/tasks/:slug` | SSR | Theory page with TOC, metadata, code blocks, callouts, CTA to practice |
| `/practice/:id` | CSR | Trainer with answer input, validation feedback, streak, next actions |
| `/login` | CSR | Login, guest continuation, link to registration |
| `/register` | CSR | Registration with 152-FZ consent checkbox |
| `/profile` | CSR | User stats, weak tasks, activity, sync status, account actions |
| `/privacy` | SSR | Personal data and privacy page |
| `/terms` | SSR | Terms of use |
| `/admin/feedback` | CSR | Minimal admin feedback review surface if admin UI is implemented |

### 5.2 Client State

- Server state is handled through TanStack Query or the repository-standard equivalent chosen in Phase 01.
- Guest progress uses a versioned `localStorage` schema.
- Auth tokens are persisted only through the selected secure frontend strategy documented in the phase contract.
- Progress sync merges local guest attempts into server attempts after login/registration.
- Pages must preserve a usable guest-first path; login cannot block practice.

### 5.3 Design Contract

The UI must follow `tmp/design-system-spec.md` and the visual references in:

- `docs/assets/mobile/` for mobile 390px layouts.
- `docs/assets/desktop/` for desktop 1440px layouts.

Required design characteristics:

- Product name/logo text is `infraege`; visual style follows the provided reference images while using the `infraege` brand text.
- Interface language is Russian; copy addresses the student as "ты"; no emoji.
- Palette is warm paper/ink/coral/green/amber as specified by design tokens.
- Typography uses serif editorial headings, sans UI text, and mono metadata/code labels.
- Mobile uses sticky top bars and a bottom tabbar with four tabs: "Главная", "Темы", "Практика", "Профиль".
- Desktop uses a slim top nav, wide editorial layouts, dense catalog table, and three-column theory pages.
- Trainer states are visually explicit: neutral, correct green, incorrect red, with stable layout.
- Code blocks use the dark ink background, mono font, line numbers, and Python-oriented highlighting.
- Cards, chips, buttons, fields, progress bars, callouts, metric tiles, admin tables, and auth split layout follow the tokenized specs.
- UI must be verified at mobile 390px and desktop 1440px for no text overlap, stable controls, and reference-level spacing.

---

## 6. Infrastructure

Infrastructure follows `docs/STACK.md`:

- Backend: FastAPI app container.
- Frontend: React Router SSR app container.
- Database: PostgreSQL.
- Cache/rate-limit support: Redis.
- Reverse proxy: Nginx.
- Local and production orchestration: Docker Compose.

Production requirements:

- Primary domain: `infraege.ru`.
- TLS via Let's Encrypt or equivalent.
- HTTP redirects to HTTPS.
- Nginx serves security headers and caches public SSR where safe.
- Generated/static assets use long-lived cache headers where applicable.
- Plausible analytics or project-approved equivalent tracks public product events.
- Monitoring is configured for host/container health and alerting.
- Daily encrypted backups cover PostgreSQL and required static/runtime assets.
- Restore procedure is documented and tested before launch.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Accessibility | Public pages and trainer controls must be keyboard usable and screen-reader coherent. |
| Performance | Public SSR pages target Lighthouse mobile 90+ and stable layouts on slow mobile devices. |
| Security | No hardcoded secrets, sanitized HTML, hashed passwords, short-lived access tokens, no raw IP persistence. |
| Privacy | Registration requires 152-FZ consent; user can delete account; privacy and terms pages ship before launch. |
| Validation safety | Regex patterns are capped, screened for unsafe constructs, and executed with a hard timeout. |
| Observability | Structured logs include request IDs; sensitive values are scrubbed. |
| Testing | Backend tests cover auth, content reads, validation safety, progress sync, feedback. Frontend tests cover core page states and trainer interactions. |
| SEO | Public SSR pages expose metadata, canonical URLs, sitemap, robots, and useful Russian titles/descriptions. |
| Mobile UX | Mobile 390px is a first-class target; tap targets are at least 44px where interactive. |

---

## 8. Phased Delivery Plan

| Phase | Title | Goal | Key Outputs |
|-------|-------|------|-------------|
| `01` | Foundation, Auth Shell, Design Tokens | Establish runnable stack, settings, health, base frontend shell, and design foundations. | Docker health, Pydantic settings, frontend routes shell, fonts/tokens, login/register skeleton, auth API without email verification. |
| `02` | Content Model + Authoring Pipeline | Add task-first EGE content schema and repository-authored content import. | Migrations for tasks/practice items, `content/tasks/ege-01.md`..`ege-27.md` schema, local assets, `content check`, `content import`, Markdown sanitization, safe answer metadata, import tests. |
| `03` | Public Catalog + SSR Theory | Ship SEO-readable public learning pages matching design references. | `/`, `/topics`, `/tasks/:slug`, filters, theory renderer, code blocks, metadata, responsive mobile/desktop layouts. |
| `04` | Practice Trainer + Guest Progress | Let guests practice immediately and keep local progress. | `/practice/:id`, validation endpoint, trainer feedback states, streak/progress UI, versioned `localStorage`. |
| `05` | Account/Profile + Sync | Persist progress for registered users. | Registration/login completion, progress sync, `/profile`, weak tasks/recent activity, account deletion. |
| `06` | Feedback, Legal, SEO Hardening | Complete public trust and discoverability requirements. | Feedback form/review surface, privacy/terms, sitemap, robots, metadata polish, Lighthouse/accessibility fixes. |
| `07` | Production Readiness | Prepare `infraege.ru` for release. | Nginx/TLS, backups/restore drill, monitoring/alerts, analytics events, production runbook. |

---

## 9. Out of Scope

- Email verification.
- Password reset.
- Rich-text CMS for theory.
- Full admin CRUD backoffice for tasks/practice items.
- HTTP content import endpoint or content preview UI/API.
- Paid content, subscriptions, and premium hints.
- Server-side execution sandbox for task 27 code.
- Comments, leaderboards, social login, notifications, SMS, native mobile apps.
- OGE or non-computer-science subjects.

---

## 10. Open Questions

- Remote backup storage for production encrypted backups: Backblaze B2, Yandex Object Storage, AWS S3, or another provider.
- Production alert channel for monitoring: Telegram, email, or another approved channel.

### Resolved Decisions

- Product name: `infraege`.
- Production domain: `infraege.ru`.
- Registration ships without email verification.
- Password reset is deferred out of MVP.
- Guest-first practice is required.
- Content source of truth is `content/tasks/*.md` and `content/assets/**`; seed fixtures are dev/test helpers only.
- MVP does not include full content CRUD backoffice.
- MVP uses a task-first model without a required backend `topics` table.
