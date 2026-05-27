# Production Monitoring with Gatus

This layer answers one question: is the app reachable, and will someone be notified when it is not?

It intentionally does not add metrics storage, tracing, log aggregation, analytics, or host dashboards. Those can come later after backup and uptime alerting are proven.

## What Is Included

- `docker-compose.monitoring.yml` runs Gatus as a separate service.
- `ops/gatus/config.yaml` runs dashboard-only checks with no alerts.
- `ops/gatus/config.telegram.yaml` sends Telegram alerts and recovery notifications.
- `ops/gatus/config.custom.yaml` sends alerts to a custom webhook relay.
- `ops/gatus/config.backup*.yaml` variants add the backup freshness check.
- Gatus UI binds to `127.0.0.1:8080` by default, so it is accessed through SSH tunnel unless intentionally exposed.

## Health Endpoints

The backend exposes four health endpoints:

- `/api/v1/health/live`: FastAPI process is alive, no dependency checks.
- `/api/v1/health`: public health check, includes PostgreSQL connectivity.
- `/api/v1/health/detailed`: local monitoring check with explicit dependency status.
- `/api/v1/health/backup`: optional internal backup freshness check, disabled unless `BACKUP_HEALTH_ENABLED=true`.

Gatus uses both internal Docker URLs and public HTTPS URLs. This makes it easier to tell the difference between an app/container problem and an edge/DNS/TLS problem.

## First-Time Setup

Make sure the main app is already running:

```bash
cd /opt/my-project
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker network ls
```

Confirm `APP_DOCKER_NETWORK` in `.env.monitoring` matches the app network. If the project is deployed from `/opt/my-project`, it is usually:

```env
APP_DOCKER_NETWORK=my-project_default
```

Start dashboard-only monitoring:

```bash
docker compose \
  --env-file .env \
  --env-file .env.monitoring \
  -f docker-compose.monitoring.yml \
  up -d

docker compose \
  --env-file .env \
  --env-file .env.monitoring \
  -f docker-compose.monitoring.yml \
  logs -f gatus
```

Open the UI from your workstation:

```bash
ssh -L 8080:127.0.0.1:8080 deploy@your-vps
```

Then open `http://127.0.0.1:8080`.

## Telegram Alerts

Telegram may be unavailable from some Russian networks. Treat Telegram as an optional alert channel, not the only operational signal.

`.env.monitoring` selects the active Gatus mode through `GATUS_CONFIG_PATH`:

- `/config/config.yaml`: dashboard-only checks.
- `/config/config.telegram.yaml`: Telegram alerts.
- `/config/config.custom.yaml`: custom webhook relay.
- `/config/config.backup.yaml`: dashboard-only checks plus backup freshness.
- `/config/config.backup.telegram.yaml`: Telegram alerts plus backup freshness.
- `/config/config.backup.custom.yaml`: custom webhook alerts plus backup freshness.

## Backup Freshness Monitoring

Backup freshness is intentionally opt-in because a new project has no marker until the first backup succeeds.

Enable the backend endpoint in `.env`:

```env
BACKUP_HEALTH_ENABLED=true
```

Run one successful backup and confirm freshness:

```bash
./scripts/backup.sh
./scripts/check-backup-freshness.sh
```

Then select a Gatus config with backup checks. This is the recommended production mode after the first successful backup:

```env
GATUS_CONFIG_PATH=/config/config.backup.yaml
```

For alerts, use `/config/config.backup.telegram.yaml` or `/config/config.backup.custom.yaml`.

Recreate the app backend and Gatus:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend
docker compose \
  --env-file .env \
  --env-file .env.monitoring \
  -f docker-compose.monitoring.yml \
  up -d --force-recreate gatus
```

This check proves that the last successful backup is recent. It does not prove that the whole VPS is reachable from the internet. Keep an external uptime monitor for `https://yourdomain.com/` and `/api/v1/health`.

## Secure Gatus Access

The default access model is an SSH tunnel:

```bash
ssh -L 8080:127.0.0.1:8080 deploy@your-vps
```

If the status dashboard must be reachable through a browser without SSH, use `ops/nginx/gatus-basic-auth.conf` as an opt-in host-level Nginx template. Before enabling it:

- replace `status.example.com` and certificate paths;
- create `/etc/nginx/.htpasswd_monitoring` with `htpasswd`;
- keep `GATUS_BIND_ADDRESS=127.0.0.1`;
- run `sudo nginx -t && sudo systemctl reload nginx`.

Do not expose Gatus directly with `GATUS_BIND_ADDRESS=0.0.0.0` unless another trusted edge layer enforces authentication and rate limits.

## External Monitoring

Local Gatus cannot alert if the whole VPS or network is down. Add at least two external checks in UptimeRobot, HetrixTools, or another provider that can reach the public internet:

| Check | Target | Expected result |
|---|---|---|
| Website | `https://yourdomain.com/` | HTTP 200 within 5 minutes |
| API health | `https://yourdomain.com/api/v1/health` | HTTP 200 and body `status=ok` |

Use Telegram/email alerts from the external provider. Keep the local Gatus alerts as the detailed signal and the external provider as the independent signal.

To enable direct Telegram alerts, edit `.env.monitoring`:

```env
GATUS_CONFIG_PATH=/config/config.telegram.yaml
TELEGRAM_BOT_TOKEN=replace_me
TELEGRAM_CHAT_ID=replace_me
TELEGRAM_TOPIC_ID=
```

Apply the change:

```bash
docker compose \
  --env-file .env \
  --env-file .env.monitoring \
  -f docker-compose.monitoring.yml \
  up -d --force-recreate gatus
```

Test by stopping the backend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend
```

After `GATUS_FAILURE_THRESHOLD` failed checks, an alert should arrive. Start the backend again and wait for the resolved notification:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml start backend
```

## Telegram Through VPN or Proxy

If `api.telegram.org` is unreachable from the VPS, keep the Gatus checks local and route only alert traffic through a proxy/VPN path.

If Amnezia or another VPN setup exposes an HTTP or SOCKS proxy on the VPS, set these values in `.env.monitoring`:

```env
GATUS_CONFIG_PATH=/config/config.telegram.yaml
GATUS_HTTPS_PROXY=http://127.0.0.1:PORT
GATUS_HTTP_PROXY=http://127.0.0.1:PORT
GATUS_NO_PROXY=backend,frontend,db,redis,localhost,127.0.0.1
```

For SOCKS proxies, use the proxy URL supported by your proxy client, for example:

```env
GATUS_HTTPS_PROXY=socks5://127.0.0.1:PORT
GATUS_HTTP_PROXY=socks5://127.0.0.1:PORT
```

Recreate Gatus after env changes:

```bash
docker compose \
  --env-file .env \
  --env-file .env.monitoring \
  -f docker-compose.monitoring.yml \
  up -d --force-recreate gatus
```

Check connectivity from inside the container:

```bash
docker compose \
  --env-file .env \
  --env-file .env.monitoring \
  -f docker-compose.monitoring.yml \
  exec gatus wget -S -O- https://api.telegram.org
```

Keep `GATUS_NO_PROXY` set. Without it, internal checks for `backend` and `frontend` may be sent through the proxy and fail.

## Custom Webhook Relay

For a more controlled setup, use `config.custom.yaml` and send alerts to a local relay service. The relay can decide how to deliver messages: Telegram through VPN, email, ntfy, Gotify, or another channel.

```env
GATUS_CONFIG_PATH=/config/config.custom.yaml
CUSTOM_ALERT_URL=http://alert-relay:8080/alerts
CUSTOM_ALERT_AUTHORIZATION=Bearer replace_me
```

The relay should be attached to the same Docker network as Gatus. This project does not include the relay implementation yet; the config is a stable integration point for adding it later.

## Operational Configs

Gatus YAML files live under `ops/gatus/`. The `ops/` directory is included in the Python source distribution so generated template archives keep the operational configs alongside app code, scripts, and docs.

## When To Use Each Mode

- Use `config.yaml` while validating checks and UI.
- Use `config.backup.yaml` as the dashboard-only production default after the first successful backup.
- Use `config.telegram.yaml` if the VPS can reach Telegram directly or through a proxy.
- Use `config.custom.yaml` if Telegram needs VPN-specific handling or you want multiple alert channels.

## Acceptance Checklist

- `docker compose --env-file .env --env-file .env.monitoring -f docker-compose.monitoring.yml config` renders successfully.
- Gatus UI opens through SSH tunnel.
- Internal checks for `frontend`, `backend-live`, and `backend-detailed` pass.
- Public checks for `/` and `/api/v1/health` pass.
- Stopping `backend` creates a failing check.
- Starting `backend` resolves the check.
- If Telegram is enabled, both failure and resolved notifications arrive.
