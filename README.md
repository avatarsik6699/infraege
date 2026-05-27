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
pnpm lint
pnpm typecheck
pnpm test
VITE_API_BASE_URL=http://localhost:8000 \
VITE_PUBLIC_SITE_URL=http://localhost:3000 \
VITE_PUBLIC_APP_NAME="Template App" \
pnpm build:ci
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

- The frontend uses FSD. Do not create `frontend/app/components` or
  `frontend/app/lib`.
- shadcn/ui uses Base UI primitives by default. Shared shadcn components live
  in `frontend/app/shared/ui`, and shadcn utilities live in
  `frontend/app/shared/lib`.
- Import reusable UI through `@shared/ui/*`, not `@/components/ui/*`.
- Add new shadcn components through the configured `frontend/components.json`
  so the CLI writes to `app/shared/ui` and reuses `app/shared/lib/utils`.
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
- Do not rely on implicit truthy/falsy checks for typed values. Use explicit
  comparisons or the guards from `@shared/lib/type-guards`, such as `isNil`,
  `isNull`, `isUndefined`, `isNonNil`, `isNumber`, `isString`,
  `isNonEmptyString`, `isBoolean`, `isRecord`, and `isArrayOf`.
- Shared project-wide type helpers live in `frontend/app/shared/types/types.ts`.
  Add reusable type utilities under `Utils` and cross-project domain-neutral
  types under `GlobalTypes`; keep feature-specific types close to their feature.

## Frontend SEO, SSR, and PWA contract

The frontend is a React Router SSR application. SSR is enabled in
`frontend/react-router.config.ts`, and production runs through
`react-router-serve`. Keep this model unless the deployment architecture is
explicitly changed.

### Public environment

Production frontend builds require a canonical public site URL:

```env
VITE_API_BASE_URL=https://example.com
VITE_PUBLIC_SITE_URL=https://example.com
VITE_PUBLIC_APP_NAME=Template App
```

`VITE_PUBLIC_SITE_URL` is used for canonical URLs, `robots.txt`, and
`sitemap.xml`. Do not hard-code production origins in route files.

### Route metadata

Every route should use `buildRouteMeta` from `frontend/app/shared/lib/seo.ts`.

```ts
export function meta() {
	return buildRouteMeta({
		pathname: '/pricing',
		title: 'Pricing',
		description: 'Pricing plans for Template App.',
		profile: 'publicIndexable',
	});
}
```

Use `publicIndexable` only for pages that should appear in search results. Use
`privateNoIndex` for auth, dashboard, account, admin, and user-specific pages.
The current `/login`, `/register`, and `/dashboard` routes are intentionally
`noindex,nofollow`.

### Sitemap and robots

The sitemap is an explicit allowlist, not an automatic dump of all routes. When
adding a public indexable route, add it to:

- `frontend/app/shared/lib/seo.ts`
- `frontend/scripts/site-config.mjs`

Then regenerate:

```bash
cd frontend
pnpm generate:sitemap
pnpm check:seo
```

Private routes must never be added to the sitemap.

### PWA behavior

The template uses a conservative PWA setup through `vite-plugin-pwa`.

- The app is installable through `manifest.webmanifest`.
- The service worker registers only in production.
- Static assets and icons are precached.
- API responses, auth pages, dashboard pages, and SSR HTML navigations are not
  treated as offline-first resources.

If you add new private route chunks, update `globIgnores` in
`frontend/vite.config.ts` and extend `frontend/scripts/check-pwa.mjs`.

### i18n SEO note

The current language switcher updates `<html lang>`, but language is not encoded
in the URL. Do not add `hreflang` under this model. If the product needs
multilingual SEO, redesign routing around locale URLs such as `/en/...` and
`/ru/...` in a separate phase.

### Production headers

Nginx sets production edge headers, including HSTS, `Referrer-Policy`,
`Permissions-Policy`, and CSP in report-only mode. Keep CSP report-only until
third-party scripts, analytics, error tracking, fonts, images, and hydration are
tested against a blocking policy.

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

### Environment files

Environment configuration is split by operational layer:

- `.env` contains application runtime settings for backend, frontend, DB, Redis, and public URLs.
- `.env.backup` contains restic backup, restore-check, and backup freshness settings.
- `.env.monitoring` contains Gatus, alerting, and optional proxy/VPN settings.

Generate production env files and replace nginx domain placeholders:

```bash
./scripts/setup-prod.sh my-project example.com
```

This creates `.env`, `.env.backup`, and `.env.monitoring`.

Production frontend builds require explicit public frontend URLs:

```bash
API_BASE_URL=https://example.com \
VITE_PUBLIC_SITE_URL=https://example.com \
VITE_PUBLIC_APP_NAME="Template App" \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Monitoring is started separately and reads app plus monitoring env files:

```bash
docker compose \
  --env-file .env \
  --env-file .env.monitoring \
  -f docker-compose.monitoring.yml \
  up -d
```

After the first successful backup, verify its freshness marker:

```bash
./scripts/backup.sh
./scripts/check-backup-freshness.sh
```

Production backup setup, restore checks, Docker log rotation, and S3-compatible
off-site storage are documented in
[`docs/production-backups.md`](docs/production-backups.md).

Optional uptime checks and alerting through Gatus are documented in
[`docs/production-monitoring.md`](docs/production-monitoring.md).
