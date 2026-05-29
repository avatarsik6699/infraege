# PHASE 07 — Production Readiness

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `07` |
| Title | Production Readiness |
| Status | `⏳ pending` |
| Tag | `v0.07.0` |
| Depends on | PHASE_06 gate passing |

---

## Phase Goal

Phase 07 prepares `infraege.ru` for public release. It finalizes existing production infrastructure (Nginx/TLS, Docker Compose overrides, Gatus monitoring) and adds five net-new deliverables: a detailed health endpoint, an internal page-view analytics system backed by PostgreSQL, admin panel pages for system status and analytics, and host security hardening (fail2ban/sshguard, UFW). No external alert channels or backup infra in this phase — those are deferred. No new DB migrations beyond `page_events`.

---

## Scope

<!-- Group tasks by area (Backend / Frontend / Infra / Data, etc.).
     ID scheme: B=Backend · F=Frontend · I=Infra · D=Data · T=other (ungrouped)
     Each item: `ID` description — _Depends on:_ ID, ID or —
     IDs are stable after assignment — never renumber. Mark removed tasks as ~~BN~~ (removed). -->

### Backend

- [ ] `B1` Verify and harden `app/core/middleware.py` — request ID propagation on every response, sensitive value scrubbing from logs (`password`, `token`, `authorization`) — _Depends on:_ —
- [ ] `B2` Add `GET /api/v1/health/detailed` (admin-only) — returns DB connectivity, Redis ping, and host disk usage — _Depends on:_ `B1`
- [ ] `B3` Add `POST /api/v1/public/events/pageview` and `GET /api/v1/admin/analytics/pageviews` — page view logging to `page_events` table; rate-limited; admin aggregation endpoint — _Depends on:_ —

### Frontend

- [ ] `F1` Internal analytics client — inject a tiny inline script in `root.tsx` that fires `POST /api/v1/public/events/pageview` on navigation; no third-party script — _Depends on:_ `B3`
- [ ] `F2` Admin page `/admin/status` — polls `GET /api/v1/health/detailed`, displays DB / Redis / disk health tiles with color-coded status — _Depends on:_ `B2`
- [ ] `F3` Admin page `/admin/analytics` — shows page view stats from `GET /api/v1/admin/analytics/pageviews`: top pages table, views per day chart (last 30 days) — _Depends on:_ `B3`

### Infra

- [ ] `I1` Finalize `nginx/nginx.conf` — confirm `[DOMAIN]` substitution handled by `scripts/setup-prod.sh`, verify HSTS max-age ≥ 1 year, review CSP directives — _Depends on:_ —
- [ ] `I2` Verify long-lived cache headers in `nginx/nginx.conf` for hashed static assets (`/assets/`) — _Depends on:_ `I1`
- [ ] `I3` Finalize `docker-compose.prod.yml` + `scripts/setup-prod.sh` — verify env generation covers all required keys, no dev bind-mounts leak, health-check guards in place — _Depends on:_ `I1`
- [ ] ~~`I4`~~ (removed, deferred — daily encrypted backup job → future phase)
- [ ] ~~`I5`~~ (removed, deferred — restore drill → future phase)
- [ ] `I6` Wire up Gatus monitoring (dashboard-only, no external alerts) — apply `ops/gatus/config.yaml` via `docker-compose.monitoring.yml`; document SSH tunnel access in runbook — _Depends on:_ `I3`
- [ ] `I7` Host security hardening — finalize `ops/fail2ban/jail.local.template` into a deployable `ops/fail2ban/jail.local`; document UFW rules and SSH hardening steps in `docs/production-security.md` — _Depends on:_ `I3`

### Other

- [ ] `T1` Verify and update `docs/production-runbook.md` — cover deployment, rollback, monitoring via SSH tunnel, and security response; remove backup-drill steps (deferred) — _Depends on:_ `I6`, `I7`

---

## Files

### Create / modify

~~~
# Backend
app/core/middleware.py                          # modify — request ID + sensitive scrub (B1)
app/main.py                                     # modify — register any new routers (B2, B3)
app/api/v1/health.py                            # modify — add /health/detailed endpoint (B2)
app/modules/analytics/                          # new — page_events model, repo, schemas (B3)
app/api/v1/public/events.py                     # new — POST /events/pageview (B3)
app/api/v1/admin/analytics.py                   # new — GET /admin/analytics/pageviews (B3)
app/migrations/versions/0005_page_events.py     # new — page_events table migration (B3)

# Frontend
frontend/app/root.tsx                           # modify — inline analytics script (F1)
frontend/app/routes/admin-status.tsx            # new — /admin/status route (F2)
frontend/app/pages/admin/status/index.tsx       # new — health status page component (F2)
frontend/app/routes/admin-analytics.tsx         # new — /admin/analytics route (F3)
frontend/app/pages/admin/analytics/index.tsx    # new — analytics page component (F3)
frontend/app/routes.ts                          # modify — add admin/status, admin/analytics routes
frontend/app/entities/analytics/               # new — API layer for analytics + status queries

# Infrastructure
nginx/nginx.conf                                # verify/modify — HSTS, CSP, domain (I1, I2)
docker-compose.prod.yml                         # verify/modify — finalize (I3)
scripts/setup-prod.sh                           # verify/modify — env key coverage (I3)
ops/gatus/config.yaml                           # verify — dashboard-only config (I6)
docker-compose.monitoring.yml                   # verify — Gatus wiring (I6)
ops/fail2ban/jail.local                         # new — finalized from template (I7)

# Docs
docs/production-runbook.md                      # modify — update for revised scope (T1)
docs/production-security.md                     # modify — UFW rules, SSH hardening steps (I7)
~~~

### Do NOT touch

- `docs/SPEC.md`
- `docs/CONTEXT.md`
- `docs/PHASE_01.md` through `docs/PHASE_06.md`
- `content/` (authored content)
- `scripts/backup.sh`, `scripts/restore-check.sh` (deferred, do not remove)

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

```sql
page_events(
  id          BIGSERIAL PRIMARY KEY,
  path        VARCHAR(500) NOT NULL,
  referrer    VARCHAR(500),
  user_agent  VARCHAR(300),
  session_id  CHAR(16),           -- client-generated random, no PII
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
)
-- INDEX: (path, created_at) for aggregation queries
-- No IP stored. No user_id stored.
```

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|---------------------|
| `GET` | `/api/v1/health/detailed` | admin | `{db: "ok"\|"error", redis: "ok"\|"error", disk: {used_gb, free_gb, pct}}` |
| `POST` | `/api/v1/public/events/pageview` | none | `{path, referrer?, session_id}` → `{ok: true}`; rate-limited |
| `GET` | `/api/v1/admin/analytics/pageviews` | admin | `{top_pages: [{path, views}], daily: [{date, views}]}` |

### New types / models / shared interfaces

```typescript
// PageEvent (from page_events table)
interface PageEvent {
  id: number
  path: string
  referrer: string | null
  userAgent: string | null
  sessionId: string | null
  createdAt: string
}

// DetailedHealth
interface DetailedHealth {
  db: 'ok' | 'error'
  redis: 'ok' | 'error'
  disk: { usedGb: number; freeGb: number; pct: number }
}

// PageviewStats
interface PageviewStats {
  topPages: Array<{ path: string; views: number }>
  daily: Array<{ date: string; views: number }>
}
```

### New env vars

| Key | Example value | Required |
|-----|---------------|----------|
| `LETSENCRYPT_EMAIL` | `admin@infraege.ru` | yes |

No new env vars beyond `LETSENCRYPT_EMAIL`. Backup and external alert vars are not added (deferred).

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 07` before committing.

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
# Phase 07 smoke checks

# 1. Nginx TLS redirect
curl -s -o /dev/null -w "%{http_code}" http://infraege.ru/
# expected: 301 or 302

# 2. HTTPS health
curl -s https://infraege.ru/api/v1/health
# expected: {"status":"ok","db":"ok"}

# 3. Detailed health (admin token required)
curl -s -H "Authorization: Bearer <admin_token>" https://infraege.ru/api/v1/health/detailed
# expected: {"db":"ok","redis":"ok","disk":{...}}

# 4. Page view event
curl -s -X POST https://infraege.ru/api/v1/public/events/pageview \
  -H "Content-Type: application/json" \
  -d '{"path":"/","session_id":"test0000test0000"}'
# expected: {"ok":true}

# 5. Nginx HSTS header present
curl -sI https://infraege.ru/ | grep -i strict-transport-security
# expected: max-age=31536000
```

---

## Architect Review Notes

Use this section after manual product, UX, API, or workflow verification. This is the human-facing
channel for post-implementation fixes.

Add one unchecked checkbox per issue the agent must fix before the phase can close. Keep each item
independently fixable and describe observed behavior plus expected behavior. If the fix may change
SPEC/API/schema/security behavior, say so explicitly in the note.

The agent resolves these items through `/impl-review-notes 07`. Leave an item unchecked while it
is still open. Check it off only after the fix is implemented and re-verified. If manual
verification found nothing, keep the default checked line below.

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-07): production readiness — nginx/tls, monitoring, security, analytics
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_07_NOTES.md` complete — agent execution memory recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 07`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-07` branch
- [ ] Tag created after merge to develop: `git tag -a v0.07.0 -m "Phase 07: Production Readiness"`
