# Production Runbook

Use this runbook after the minimal v2 ops layer is deployed: restic backups, restore checks, backup freshness, Gatus, external uptime checks, Nginx logs, and fail2ban or sshguard.

## Site Is Down

1. Check the independent monitor first: UptimeRobot/HetrixTools for `https://yourdomain.com/` and `/api/v1/health`.
2. Check containers:

   ```bash
   cd /opt/my-project
   docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 nginx backend frontend
   ```

3. Check public and internal health:

   ```bash
   curl -fsS https://yourdomain.com/api/v1/health
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend \
     python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/v1/health').read())"
   ```

4. If only public traffic fails, inspect Nginx, certificates, DNS, and firewall. If internal health fails, inspect backend, DB, Redis, and recent deploys.

## Backup Is Stale

1. Confirm the marker:

   ```bash
   cd /opt/my-project
   ./scripts/check-backup-freshness.sh
   systemctl status my-project-backup.service
   journalctl -u my-project-backup.service -n 100 --no-pager
   ```

2. Fix the first failing layer: Docker availability, DB connectivity, restic credentials, S3 credentials, disk space, or network.
3. Run a manual backup and restore check:

   ```bash
   ./scripts/backup.sh
   ./scripts/restore-check.sh
   ```

4. Recheck Gatus after `BACKUP_HEALTH_ENABLED=true` is active.

## Disk Is Filling

1. Find the large paths:

   ```bash
   df -h
   sudo du -xhd1 / /var /opt 2>/dev/null | sort -h
   docker system df
   ```

2. Check bounded Docker logs:

   ```bash
   docker inspect --format '{{json .HostConfig.LogConfig}}' $(docker ps -q)
   sudo du -sh /opt/my-project/var/nginx-logs /var/lib/docker/containers 2>/dev/null
   ```

3. If restic is local and too large, move to S3-compatible storage and reduce retention intentionally. Do not delete the only known-good backup before a fresh off-site backup and restore check pass.

## Restore Database

Prefer restoring into a temporary database first:

```bash
cd /opt/my-project
./scripts/restore-check.sh
```

For a real rollback, follow `docs/production-backups.md`:

1. choose the exact restic snapshot;
2. stop application writers;
3. restore with `pg_restore --clean --if-exists`;
4. start services;
5. verify `/api/v1/health`;
6. run a fresh backup after recovery.

## First VPS Acceptance Checklist

- `make ops-check` passes locally.
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` starts on the VPS.
- `/api/v1/health/live`, `/api/v1/health`, and `/api/v1/health/detailed` return healthy responses.
- `./scripts/backup.sh`, `./scripts/restore-check.sh`, and `restic check` pass.
- `BACKUP_HEALTH_ENABLED=true` is enabled only after the first successful backup.
- Gatus uses `config.backup.yaml`, `config.backup.telegram.yaml`, or `config.backup.custom.yaml` in production.
- External monitoring checks `/` and `/api/v1/health`.
- fail2ban or sshguard is enabled and the admin IP is whitelisted.
- Gatus UI is accessible through SSH tunnel, or through the optional Basic Auth Nginx proxy.
