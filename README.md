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

The normal development path is Docker Compose. Avoid starting backend/frontend
services directly on the host unless you are doing emergency debugging; mixed
host/container processes often lead to port conflicts and stale OpenAPI schemas.

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
VITE_API_BASE_URL=http://localhost:8000 pnpm build
```

## API type sync

Frontend API request and response types come from the backend OpenAPI schema.
After every backend route or schema change, start the backend and run:

```bash
cd frontend
pnpm generate:api
pnpm typecheck
```

`frontend/app/shared/types/schema.ts` is generated. Do not hand-edit it and do
not duplicate API DTOs by hand in frontend code. Use
`components['schemas']['Name']` or the typed `api` client from
`@shared/api/client`.

## Mandatory frontend conventions

These rules are part of the template contract. They intentionally favor
deterministic, stable implementation output.

- File and directory names use kebab-case.
- One React component per file.
- Components are arrow functions typed as `React.FC<Props>`.
- Use `type`, not `interface`, for hand-written frontend types.
- Component props are accessed through `props.name`; do not destructure props.
- Hook return objects are assigned to a variable and accessed with dot notation; do not destructure them. `useState` tuple destructuring is allowed.
- Every `useEffect` callback is a named function ending in `Fx`.
- Do not import React Router primitives directly in feature/page code. Use `@shared/hooks/use-router`.
- Do not use raw `useSearchParams`. Use `@shared/hooks/use-typed-search-params` with a Zod schema.
- Do not access `window.localStorage` directly. Use `@shared/lib/safe-ls`.
- Do not use raw `JSON.parse` / `JSON.stringify` for storage. Use `@shared/lib/safe-json`. JSON request bodies are the explicit exception.
- Do not read `import.meta.env` directly outside `@shared/config/env` and `@shared/config/runtime`.
- Do not inline date formatting in components. Use `@shared/lib/date`.

## Backend conventions

- Use `datetime.now(UTC)`, never naive `datetime.now()`.
- Timestamp ORM columns must use `DateTime(timezone=True)`.
- Alembic timestamp columns must use `sa.DateTime(timezone=True)`.
- SQLite tests may return naive datetimes for timezone columns; normalize before datetime arithmetic.
- Production disables `/docs`, `/redoc`, and `/openapi.json` through `APP_ENV=production`.
- Add project seeders under `app/seeders/` and register them in `app/seeders/__init__.py`.

Seeder commands:

```bash
uv run python scripts/seed.py --list
uv run python scripts/seed.py --seeder name
uv run python scripts/seed.py --dry-run
```

## Production setup

Generate a production `.env` and replace nginx domain placeholders:

```bash
./scripts/setup-prod.sh my-project example.com
```

Production frontend builds require an explicit public API base URL:

```bash
API_BASE_URL=https://example.com \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
