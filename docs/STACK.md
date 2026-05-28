# Stack Guide

> **Source of truth for this project's concrete technologies, tools, and conventions.**
>
> The SDD pipeline (phases, gates, skills, contracts) is stack-agnostic. This file is the only
> place where the workflow learns what to actually run. The `phase-gate` playbook reads
> [`Gate Commands`](#gate-commands) below verbatim — keep that table accurate.
>
> **Stack status:** CONFIGURED

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy async, Alembic, Pydantic v2 |
| Frontend | React 19, React Router SSR, Vite, TypeScript, Tailwind |
| Database | PostgreSQL |
| Cache | Redis |
| Infra | Docker Compose, Nginx |
| Package managers | uv (backend), pnpm (frontend) |
| CI | [fill in] |

---

## Prerequisites

```bash
# Examples — replace with the actual versions this project requires
docker --version
node --version
python --version
uv --version
pnpm --version
```

---

## Initial setup

```bash
# How a developer brings the stack up the first time.
# Examples:
cp .env.example .env
uv sync --dev
cd frontend && pnpm install
docker compose up --build
```

---

## Gate Commands

This section is the human-readable command source for the [`phase-gate`](playbooks/phase-gate.md)
workflow. Fill every row that applies to this project. Mark `n/a` for rows that do not apply
(e.g. no frontend → frontend rows are `n/a`). The phase-gate playbook will report `SKIPPED — n/a in
STACK.md` for those.

| Gate check | Command | Preconditions / notes |
|------------|---------|-----------------------|
| Infrastructure / bootstrap | `docker compose up --build` | Requires `.env`; normal development path is Docker Compose. |
| Migrations | `uv run alembic upgrade head` | Run from repository root. |
| Backend / unit tests | `uv run pytest` | Run from repository root after `uv sync --dev`. |
| Frontend prep | `cd frontend && pnpm install` | Requires Node >=22 and pnpm 10.33.0. |
| Frontend type-check | `cd frontend && pnpm typecheck` | |
| Frontend unit tests | `cd frontend && pnpm test` | |
| E2E lint / determinism | `cd frontend && pnpm test:e2e:lint` | Checks Playwright anti-flake rules. |
| E2E | `cd frontend && PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e:chromium` | Start the built frontend first. |
| Smoke | `make ops-check` | Runs shell, compose config, and health smoke checks. |

If the project ships a helper script, declare it:

```bash
# n/a
```

---

## Testing

### Backend

```bash
uv run pytest
```

### Frontend (if applicable)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e:lint
```

---

## Project structure

```
.
├── docs/                   # SPEC, CONTEXT, STATE, CHANGELOG, PHASE_XX, STACK (this file), playbooks
├── .claude/skills/         # Claude Code skill wrappers (5 SDD skills)
├── plugins/sdd-workflow/   # Codex plugin (skills, commands, MCP, hooks)
├── [your source dirs]
└── AGENTS.md / CLAUDE.md   # AI agent rules
```

---

## Common operations

```bash
# Start the stack
docker compose up --build

# Stop everything
docker compose down

# Add a new migration / schema change
uv run alembic revision --autogenerate -m "describe change"

# Format / lint
make lint
cd frontend && pnpm lint
```
