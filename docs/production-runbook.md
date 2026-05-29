# Production Runbook

Runbook for `infraege.ru`. Phase 07 scope: Nginx/TLS, Docker Compose, Gatus monitoring, fail2ban, and analytics.

---

## Deployment

```bash
cd /opt/infraege

# Pull latest code
git fetch origin && git checkout main && git pull

# (First deploy only) Generate production config
./scripts/setup-prod.sh infraege infraege.ru admin@infraege.ru

# Apply database migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend \
  uv run alembic upgrade head

# Build and start
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify
curl -fsS https://infraege.ru/api/v1/health
```

---

## Rollback

1. Identify the last working image tag or commit SHA.
2. Check out that commit: `git checkout <sha>`
3. If the migration needs reverting: `uv run alembic downgrade -1`
4. Rebuild and restart: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
5. Verify `/api/v1/health` and `/api/v1/health/live`.

---

## Site Is Down

1. Check the independent monitor: UptimeRobot/HetrixTools for `https://infraege.ru/` and `/api/v1/health`.
2. Check containers:

   ```bash
   cd /opt/infraege
   docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 nginx backend frontend
   ```

3. Check public and internal health:

   ```bash
   curl -fsS https://infraege.ru/api/v1/health
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend \
     python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/v1/health').read())"
   ```

4. If only public traffic fails, inspect Nginx, certificates, DNS, and firewall. If internal health fails, inspect backend, DB, Redis, and recent deploys.

---

## Monitoring via SSH Tunnel (Gatus)

Gatus binds to `127.0.0.1:8080` by default. Access the dashboard via an SSH tunnel:

```bash
ssh -L 8080:127.0.0.1:8080 deploy@infraege.ru
```

Then open `http://localhost:8080` in a browser.

To start the Gatus monitoring stack:

```bash
cd /opt/infraege
docker compose -f docker-compose.monitoring.yml \
  --env-file .env --env-file .env.monitoring \
  up -d
```

To stop it:

```bash
docker compose -f docker-compose.monitoring.yml \
  --env-file .env --env-file .env.monitoring \
  down
```

---

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
   sudo du -sh /opt/infraege/var/nginx-logs /var/lib/docker/containers 2>/dev/null
   ```

3. Prune unused Docker resources if safe: `docker system prune -f`

---

## Security Incident Response

1. **Suspected intrusion** — check fail2ban status and SSH auth logs:

   ```bash
   sudo fail2ban-client status
   sudo fail2ban-client status sshd
   sudo journalctl -u ssh --since "1 hour ago" | grep -i "failed\|invalid"
   ```

2. **Block a specific IP** manually:

   ```bash
   sudo fail2ban-client set sshd banip <ip>
   sudo ufw deny from <ip>
   ```

3. **Suspicious API traffic** — check Nginx logs:

   ```bash
   sudo tail -f /opt/infraege/var/nginx-logs/access.log | grep -v " 200 "
   ```

4. **Rotate secrets** if credentials are suspected compromised: update `SECRET_KEY`, `FEEDBACK_IP_PEPPER`, `POSTGRES_PASSWORD` in `.env`, then restart all services and invalidate active sessions by cycling `SECRET_KEY`.

---

## TLS Certificate Renewal

Certbot renews automatically via the cron entry set during setup. To force a manual renewal:

```bash
docker run --rm -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot renew --standalone

docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

---

## First VPS Acceptance Checklist

- `make ops-check` passes locally.
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` starts on the VPS.
- `/api/v1/health/live` and `/api/v1/health` return healthy responses.
- `https://infraege.ru/` returns HTTP 200.
- HSTS header present: `curl -sI https://infraege.ru/ | grep -i strict-transport-security`.
- Gatus dashboard accessible via SSH tunnel.
- fail2ban enabled: `sudo fail2ban-client status`.
- UFW enabled: `sudo ufw status verbose`.
- Admin IP whitelisted in `/etc/fail2ban/jail.local`.
