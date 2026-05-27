# Production Ops Roadmap

This document tracks the minimal production operations layer for this template. It is the working reference for future development of backups, monitoring, security, and incident response.

The chosen direction is **Minimal v2**:

- keep the stack lightweight and self-hosted;
- use `restic` for backups;
- use Gatus for local uptime and backup freshness monitoring;
- use an external uptime provider for VPS-independent alerts;
- avoid Netdata, Dozzle, Umami, Uptime Kuma, Loki, Prometheus, and analytics until there is a concrete need.

## Current Status

### Done In Repository

- Docker log rotation is configured through the shared `json-file` logging options in `docker-compose.yml`.
- Production Nginx keeps CSP in `Content-Security-Policy-Report-Only`.
- Production Nginx has rate limits for:
  - general `/api/` traffic;
  - `/api/v1/public/auth/login`;
  - `/api/v1/public/auth/register`.
- Production Nginx writes fail2ban-readable logs into `var/nginx-logs/` while keeping stdout/stderr logs for `docker compose logs`.
- Backend health endpoints exist:
  - `/api/v1/health/live`;
  - `/api/v1/health`;
  - `/api/v1/health/detailed`;
  - `/api/v1/health/backup`.
- Backup scripts exist:
  - `scripts/backup.sh`;
  - `scripts/restore-check.sh`;
  - `scripts/check-backup-freshness.sh`.
- Backup freshness marker support exists through `var/backup-status/last-success.json`.
- Gatus monitoring exists through `docker-compose.monitoring.yml` and `ops/gatus/*.yaml`.
- Alert variants exist for Telegram and custom webhook delivery.
- S3-compatible restic environment examples are documented.
- systemd templates exist in `ops/systemd/` for:
  - daily backup;
  - monthly restore check;
  - monthly `restic check`.
- Host security templates exist for:
  - fail2ban;
  - sshguard;
  - optional Gatus Basic Auth Nginx proxy.
- Operational docs exist:
  - `docs/production-backups.md`;
  - `docs/production-monitoring.md`;
  - `docs/production-security.md`;
  - `docs/production-runbook.md`.
- `make ops-check` runs the no-secret checks for shell syntax, compose render, and backend health tests.

### Verified Locally

- `make ops-check` passes.
- Production Nginx config passes `nginx -t` with placeholder domain replaced and temporary certificates.
- Optional Gatus Basic Auth Nginx config passes `nginx -t`.
- `git diff --check` passes.

## Not Done Yet

These items require a real VPS, real domain, real secrets, or a deliberate production choice.

- Run `scripts/setup-prod.sh <project-slug> <domain>` on the real deployment target.
- Replace all placeholder paths and names in `ops/systemd/*`.
- Configure `RESTIC_PASSWORD_FILE`.
- Move `RESTIC_REPOSITORY` from local storage to S3-compatible off-site storage before commercial use.
- Run the first real `./scripts/backup.sh`.
- Run the first real `./scripts/restore-check.sh`.
- Run the first real `restic check`.
- Enable `BACKUP_HEALTH_ENABLED=true` only after the first successful backup.
- Select a production Gatus config:
  - `/config/config.backup.yaml` for dashboard-only checks;
  - `/config/config.backup.telegram.yaml` for Telegram alerts;
  - `/config/config.backup.custom.yaml` for custom alert relay.
- Configure an external uptime provider for:
  - `https://yourdomain.com/`;
  - `https://yourdomain.com/api/v1/health`.
- Enable one host blocker:
  - fail2ban, or
  - sshguard.
- Confirm admin IP whitelist before enabling host blocking.
- Install and enable systemd timers on the VPS.
- Record first production drill results: backup snapshot ID, restore result, `restic check` result, and alert delivery result.

## Next Implementation Steps

### Step 1: Stabilize The Current Repository State

- Review the current diff for scope.
- Commit the production ops changes together.
- Keep this roadmap updated whenever the ops contract changes.

Acceptance:

- `make ops-check` passes.
- Nginx syntax checks pass.
- New docs are linked from README.

### Step 2: First VPS Deployment Drill

- Generate production env files with `scripts/setup-prod.sh`.
- Configure restic password and off-site S3-compatible repository.
- Start the app with production compose.
- Start Gatus in dashboard-only mode.
- Run backup, restore check, and `restic check`.
- Enable backup freshness health after the first successful backup.

Acceptance:

- `/api/v1/health` returns `status: ok`.
- `/api/v1/health/backup` returns `status: ok`.
- Gatus internal, public, and backup freshness checks are green.
- A restore check succeeds against a temporary database.

### Step 3: Alerting And External Monitoring

- Pick Telegram direct, Telegram through proxy, or custom webhook relay.
- Switch Gatus to the matching backup-aware alert config.
- Test failure and recovery by stopping and starting `backend`.
- Configure UptimeRobot, HetrixTools, or another external provider.

Acceptance:

- Local Gatus sends failure and resolved notifications.
- External monitoring alerts when the public site or public API health check is unavailable.
- Alert channels are documented in `docs/production-runbook.md`.

### Step 4: Host Security

- Apply SSH hardening and UFW.
- Enable either fail2ban or sshguard.
- If fail2ban is used, adapt log paths to the real project directory.
- Confirm Nginx rate limits produce HTTP 429 for abusive auth/API traffic.

Acceptance:

- Root SSH login is disabled.
- Password SSH login is disabled.
- UFW only allows SSH, HTTP, and HTTPS.
- The selected blocker is active and the admin IP is whitelisted.
- Nginx logs are visible both through `docker compose logs nginx` and `var/nginx-logs/`.

### Step 5: Monthly Operations Loop

- Enable systemd timers for backup, restore check, and `restic check`.
- Once per month, confirm backup freshness, restore check, and repository integrity.
- Before destructive migrations or manual SQL changes, run backup and restore check first.

Acceptance:

- `systemctl list-timers '*backup*' '*restore*' '*restic*'` shows active timers.
- Monthly drill results are recorded.
- Gatus backup freshness remains green after scheduled runs.

## Deferred Work

These are intentionally out of scope for Minimal v2.

- Umami analytics.
- Netdata host dashboards.
- Dozzle browser log viewer.
- Uptime Kuma.
- GoAccess reports.
- Loki or centralized log storage.
- Prometheus/Grafana metrics.
- OpenTelemetry tracing.
- Offline-first PWA changes.
- CSP blocking mode.

Add these only after the current layer fails to answer a real operational question.

## Maintenance Rule

When any production ops behavior changes, update this roadmap and the specific detailed doc:

- backup changes: `docs/production-backups.md`;
- monitoring changes: `docs/production-monitoring.md`;
- security changes: `docs/production-security.md`;
- incident procedure changes: `docs/production-runbook.md`.
