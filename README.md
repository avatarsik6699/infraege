# Template App

Reusable starter based on the current stack:
- Backend: FastAPI, SQLAlchemy async, Alembic, Pydantic v2
- Frontend: React 19, React Router SSR, Vite, TypeScript, Tailwind
- Infra: PostgreSQL, Redis, Docker Compose, Nginx

## Prerequisites

- `docker` + `docker compose`
- `uv`
- `node` + `pnpm`

## Run

```bash
cp .env.example .env
docker compose up --build
```

## Backend checks

```bash
uv run alembic upgrade head
uv run pytest tests/ -v
```

## Frontend checks

```bash
cd frontend
pnpm install
pnpm typecheck
pnpm test
pnpm build
```
