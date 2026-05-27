# Production Backups and Restore Checks

This project keeps the first production safety layer intentionally small:

- Docker log rotation prevents container logs from filling the VPS disk.
- `scripts/backup.sh` creates application data backups and stores them in restic.
- `scripts/restore-check.sh` verifies that the latest PostgreSQL dump can be restored into a temporary database.
- `scripts/check-backup-freshness.sh` verifies that a successful backup marker is still fresh.

The default storage target is a local restic repository on the VPS. Off-site S3-compatible storage can be enabled later without changing the scripts.

## What Each Part Does

### Docker log rotation

`docker-compose.yml` configures the `json-file` logging driver with:

```yaml
max-size: "10m"
max-file: "5"
```

Each long-running service keeps at most five 10 MB log files. This preserves `docker compose logs` behavior while preventing unbounded disk growth.

### PostgreSQL dump

`scripts/backup.sh` runs `pg_dump -Fc` inside the `db` service. The custom dump format is compact, supports `pg_restore`, and is the safest default for restore drills.

The script reads app values from `.env`:

- `POSTGRES_USER`
- `POSTGRES_DB`

It reads backup values from `.env.backup`:

- `RESTIC_REPOSITORY`
- `RESTIC_PASSWORD_FILE`

### Redis backup

Redis is treated as cache/session state by default, so it is not backed up unless explicitly enabled:

```env
BACKUP_REDIS=true
```

When enabled, the script triggers `BGSAVE` and copies `dump.rdb` from the `redis` service. Enable this only if a project stores important queue/session data in Redis.

### Docker volume backup

Future projects may add upload/media volumes. Add their Docker volume names as a comma-separated list:

```env
BACKUP_VOLUMES=myapp_uploads,myapp_private_media
```

Each listed volume is archived as `tar.gz` and included in the same restic snapshot.

### Restic repository

Restic stores encrypted, deduplicated snapshots. The scripts always use:

```env
RESTIC_REPOSITORY=/var/backups/my-project/restic
RESTIC_PASSWORD_FILE=/etc/my-project/restic-password
```

Keep `RESTIC_PASSWORD_FILE` outside git and set permissions to `600`. Losing this password means losing access to the backups.

### Retention

After each successful backup, the script runs `restic forget --prune` with:

```env
RESTIC_KEEP_DAILY=7
RESTIC_KEEP_WEEKLY=4
RESTIC_KEEP_MONTHLY=6
```

Tune these values per project based on data size, risk, and available storage.

### Backup freshness marker

After `restic backup` and retention both complete successfully, `scripts/backup.sh` writes:

```text
var/backup-status/last-success.json
```

The marker contains the success timestamp, PostgreSQL database name, hostname, restic repository, and the configured freshness window. It is runtime state and is ignored by git.

Freshness settings live in `.env.backup`:

```env
BACKUP_STATUS_DIR=var/backup-status
BACKUP_MAX_AGE_HOURS=36
BACKUP_HEARTBEAT_URL=
```

`BACKUP_MAX_AGE_HOURS=36` fits a daily backup schedule with room for timer delay. If the project runs backups every 12 hours, reduce it. If backups run weekly, increase it intentionally.

If `BACKUP_HEARTBEAT_URL` is set, the backup script calls it only after the backup, retention, and marker write have succeeded. A failed heartbeat request makes the script fail, so systemd logs show the problem.

## First-Time VPS Setup

Run these commands on the VPS after `scripts/setup-prod.sh` has generated `.env` and `.env.backup`.

```bash
cd /opt/my-project

sudo apt-get update
sudo apt-get install -y restic

sudo mkdir -p /etc/my-project /var/backups/my-project
sudo chown -R deploy:deploy /var/backups/my-project
sudo install -m 600 -o deploy -g deploy /dev/null /etc/my-project/restic-password
openssl rand -base64 48 | sudo tee /etc/my-project/restic-password >/dev/null
sudo chown deploy:deploy /etc/my-project/restic-password
sudo chmod 600 /etc/my-project/restic-password

export RESTIC_REPOSITORY="$(sed -n 's/^RESTIC_REPOSITORY=//p' .env.backup | tail -n 1)"
export RESTIC_PASSWORD_FILE="$(sed -n 's/^RESTIC_PASSWORD_FILE=//p' .env.backup | tail -n 1)"
restic --repo "$RESTIC_REPOSITORY" --password-file "$RESTIC_PASSWORD_FILE" init
```

Replace `my-project` with the project slug used for `scripts/setup-prod.sh`.

## Manual Backup

```bash
cd /opt/my-project
./scripts/backup.sh
export RESTIC_REPOSITORY="$(sed -n 's/^RESTIC_REPOSITORY=//p' .env.backup | tail -n 1)"
export RESTIC_PASSWORD_FILE="$(sed -n 's/^RESTIC_PASSWORD_FILE=//p' .env.backup | tail -n 1)"
restic --repo "$RESTIC_REPOSITORY" --password-file "$RESTIC_PASSWORD_FILE" snapshots
```

If the script fails, no retention is applied. Fix the error and rerun the backup.

## Restore Check

Run a restore check after the first backup and then at least monthly:

```bash
cd /opt/my-project
./scripts/restore-check.sh
```

The restore check never restores over production data. It restores the latest restic snapshot into a temporary directory, creates a temporary database, runs `pg_restore`, and drops the temporary database.

## Backup Freshness Check

Run this after the first successful backup:

```bash
cd /opt/my-project
./scripts/check-backup-freshness.sh
```

A fresh marker returns exit code `0` and compact JSON:

```json
{"status":"ok","reason":"backup marker is fresh","age_hours":0,"max_age_hours":36}
```

Missing, invalid, future-dated, or stale markers return non-zero and `status:"degraded"`. Use this for manual checks and incident triage; use Gatus for continuous alerting.

To expose freshness to local monitoring, add this to `.env` and recreate the backend:

```env
BACKUP_HEALTH_ENABLED=true
```

The backend reads the marker from `/run/app-backup/last-success.json`, which production compose mounts from `./var/backup-status`. It does not need restic credentials.

## Real Restore Runbook

Use this section when data must actually be recovered. Prefer restoring into a temporary database first unless the production database is completely lost or intentionally being rolled back.

### 1. Load restic settings

Run these commands from the project directory:

```bash
cd /opt/my-project
export RESTIC_REPOSITORY="$(sed -n 's/^RESTIC_REPOSITORY=//p' .env.backup | tail -n 1)"
export RESTIC_PASSWORD_FILE="$(sed -n 's/^RESTIC_PASSWORD_FILE=//p' .env.backup | tail -n 1)"
export POSTGRES_USER="$(sed -n 's/^POSTGRES_USER=//p' .env | tail -n 1)"
export POSTGRES_DB="$(sed -n 's/^POSTGRES_DB=//p' .env | tail -n 1)"
```

If the repository is S3-compatible, export the matching AWS credentials before running restic commands.

### 2. Choose a snapshot

List available snapshots:

```bash
restic --repo "$RESTIC_REPOSITORY" \
  --password-file "$RESTIC_PASSWORD_FILE" \
  snapshots
```

Use `latest` only when the newest backup is definitely the right restore point. Otherwise copy the specific snapshot ID and use it instead of `latest` in the commands below.

### 3. Extract backup files from restic

```bash
mkdir -p /tmp/my-project-restore
restic --repo "$RESTIC_REPOSITORY" \
  --password-file "$RESTIC_PASSWORD_FILE" \
  restore latest \
  --target /tmp/my-project-restore \
  --tag app-backup
find /tmp/my-project-restore -name "postgres_${POSTGRES_DB}_*.dump"
```

Set the dump path:

```bash
export RESTORE_DUMP="$(find /tmp/my-project-restore -name "postgres_${POSTGRES_DB}_*.dump" | sort | tail -n 1)"
test -n "$RESTORE_DUMP"
```

### 4. Full production database restore

Use this only when replacing the whole production database is intended. This rolls the database back to the selected backup state, so writes made after that backup can be lost.

Stop application writers first:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend frontend
```

Restore into the existing database:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  pg_restore \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --clean \
    --if-exists \
  < "$RESTORE_DUMP"
```

Start the app and verify health:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml start backend frontend
curl -fsS "https://$(sed -n 's/^DOMAIN=//p' .env | tail -n 1)/api/v1/health"
```

### 5. Restore into a temporary database

Use this for investigation, partial recovery, migration testing, or any case where production still has useful data.

```bash
export RESTORE_DB="restore_manual_$(date -u +%Y%m%d%H%M%S)"

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  createdb -U "$POSTGRES_USER" "$RESTORE_DB"

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$RESTORE_DB" \
  < "$RESTORE_DUMP"
```

Inspect or export data from the temporary database. Drop it when finished:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  dropdb -U "$POSTGRES_USER" --if-exists "$RESTORE_DB"
```

### 6. Partial data recovery

For partial loss, do not apply the full dump directly to production. Restore into a temporary database first, inspect the needed rows, and then write a project-specific SQL patch.

Typical workflow:

1. Restore the backup into `RESTORE_DB`.
2. Identify the missing rows and their related rows.
3. Export or write SQL for only that data.
4. Review foreign keys and uniqueness constraints.
5. Run the patch inside a transaction on production.
6. Verify application behavior and counts.

Example transaction shape:

```sql
BEGIN;

-- Insert or update only the recovered rows here.
-- Use explicit IDs only after checking sequences and unique constraints.

-- Verification queries go here.

COMMIT;
-- Use ROLLBACK instead of COMMIT if verification fails.
```

`pg_restore` can also restore selected dump items because the backup uses custom format. To inspect the dump contents:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  pg_restore -l \
  < "$RESTORE_DUMP" \
  > /tmp/my-project-restore/db.list
```

Edit the list file to keep only the needed objects, then copy it into the database container and restore into a temporary database:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml cp \
  /tmp/my-project-restore/db.list \
  db:/tmp/db.list

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  createdb -U "$POSTGRES_USER" "${RESTORE_DB}_selected"

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "${RESTORE_DB}_selected" -L /tmp/db.list \
  < "$RESTORE_DUMP"
```

This is useful for table-level recovery, but row-level recovery is usually safer through a temporary database and hand-reviewed SQL.

## Before Dangerous Database Changes

Use this checklist before destructive migrations, bulk updates, manual SQL fixes, imports, or cleanup jobs.

1. Create a fresh backup:

   ```bash
   ./scripts/backup.sh
   ```

2. Verify that the backup restores:

   ```bash
   ./scripts/restore-check.sh
   ```

3. Record the snapshot ID:

   ```bash
   export RESTIC_REPOSITORY="$(sed -n 's/^RESTIC_REPOSITORY=//p' .env.backup | tail -n 1)"
   export RESTIC_PASSWORD_FILE="$(sed -n 's/^RESTIC_PASSWORD_FILE=//p' .env.backup | tail -n 1)"
   restic --repo "$RESTIC_REPOSITORY" \
     --password-file "$RESTIC_PASSWORD_FILE" \
     snapshots
   ```

4. Test the dangerous action against a temporary restored database when possible.

5. Stop application writers for high-risk operations:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend frontend
   ```

6. Prefer transaction-wrapped SQL:

   ```sql
   BEGIN;
   -- dangerous statement
   -- verification SELECTs
   COMMIT;
   ```

7. Restart services and verify health:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml start backend frontend
   curl -fsS "https://$(sed -n 's/^DOMAIN=//p' .env | tail -n 1)/api/v1/health"
   ```

For schema changes, prefer staged migrations: first stop using a column/table in application code, deploy that, wait and verify, then remove the old database object in a separate migration.

## systemd Timer

Create `/etc/systemd/system/my-project-backup.service`:

```ini
[Unit]
Description=My Project restic backup
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=deploy
WorkingDirectory=/opt/my-project
ExecStart=/opt/my-project/scripts/backup.sh
```

Create `/etc/systemd/system/my-project-backup.timer`:

```ini
[Unit]
Description=Run My Project backup daily

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and test:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now my-project-backup.timer
sudo systemctl start my-project-backup.service
sudo systemctl status my-project-backup.service
systemctl list-timers '*backup*'
```

After the first timer run, verify the marker:

```bash
cd /opt/my-project
./scripts/check-backup-freshness.sh
```

## S3-Compatible Off-Site Storage

Local backups protect against application mistakes, but not against VPS loss. To move the same scripts to S3-compatible storage, change only environment and credentials.

Example:

```env
RESTIC_REPOSITORY=s3:https://storage.yandexcloud.net/my-backup-bucket/my-project/restic
AWS_ACCESS_KEY_ID=replace_me
AWS_SECRET_ACCESS_KEY=replace_me
AWS_DEFAULT_REGION=ru-central1
```

Initialize and verify:

```bash
export RESTIC_REPOSITORY="$(sed -n 's/^RESTIC_REPOSITORY=//p' .env.backup | tail -n 1)"
export RESTIC_PASSWORD_FILE="$(sed -n 's/^RESTIC_PASSWORD_FILE=//p' .env.backup | tail -n 1)"
export AWS_ACCESS_KEY_ID="$(sed -n 's/^AWS_ACCESS_KEY_ID=//p' .env.backup | tail -n 1)"
export AWS_SECRET_ACCESS_KEY="$(sed -n 's/^AWS_SECRET_ACCESS_KEY=//p' .env.backup | tail -n 1)"
export AWS_DEFAULT_REGION="$(sed -n 's/^AWS_DEFAULT_REGION=//p' .env.backup | tail -n 1)"
restic --repo "$RESTIC_REPOSITORY" --password-file "$RESTIC_PASSWORD_FILE" init
./scripts/backup.sh
restic --repo "$RESTIC_REPOSITORY" --password-file "$RESTIC_PASSWORD_FILE" snapshots
./scripts/restore-check.sh
```

Prefer storing AWS credentials in `.env.backup` or a root-owned environment file loaded by the systemd service instead of committing them to `.env`.

## Adapting This Template for a Real Project

- Keep `POSTGRES_USER` and `POSTGRES_DB` generated by `scripts/setup-prod.sh`, unless the project intentionally changes database ownership.
- Set `BACKUP_REDIS=true` only when Redis contains data that cannot be recreated from PostgreSQL.
- Add upload/media Docker volumes to `BACKUP_VOLUMES` as soon as the application stores user files.
- Increase retention when the project has paying users or long support windows.
- Move `RESTIC_REPOSITORY` to S3-compatible storage before relying on the app commercially.
- Schedule restore drills monthly and after every backup script change.

## Acceptance Checklist

- `bash -n scripts/backup.sh` passes.
- `bash -n scripts/restore-check.sh` passes.
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` renders successfully.
- `./scripts/backup.sh` creates a restic snapshot.
- `./scripts/restore-check.sh` restores the latest PostgreSQL dump into a temporary database.
- `docker inspect` shows `LogConfig` with `max-size=10m` and `max-file=5` after containers are recreated.
