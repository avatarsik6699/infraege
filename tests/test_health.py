from datetime import UTC, datetime, timedelta

from httpx import AsyncClient

from app.core.config import settings
from app.modules.users.models import UserRole


async def test_health_returns_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["db"] == "connected"


async def test_health_live_returns_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_detailed_returns_dependency_status(client) -> None:
    token = await client.create_user_token("health-admin@example.com", role=UserRole.admin)
    response = await client.get(
        "/api/v1/health/detailed", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["db"] == "ok"
    assert "redis" in body
    assert "disk" in body
    disk = body["disk"]
    assert "used_gb" in disk
    assert "free_gb" in disk
    assert "pct" in disk


async def test_health_backup_is_disabled_by_default(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/backup")
    assert response.status_code == 404


async def test_health_backup_returns_fresh_marker(
    client: AsyncClient, tmp_path, monkeypatch
) -> None:
    marker = tmp_path / "last-success.json"
    marker.write_text(
        '{"status":"ok","timestamp":"'
        f"{datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ')}"
        '","postgres_db":"template_app","hostname":"test","restic_repository":"repo"}',
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "BACKUP_HEALTH_ENABLED", True)
    monkeypatch.setattr(settings, "BACKUP_HEALTH_STATUS_FILE", str(marker))
    monkeypatch.setattr(settings, "BACKUP_MAX_AGE_HOURS", 36)

    response = await client.get("/api/v1/health/backup")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["age_hours"] <= 1
    assert body["max_age_hours"] == 36


async def test_health_backup_returns_degraded_for_stale_marker(
    client: AsyncClient, tmp_path, monkeypatch
) -> None:
    marker = tmp_path / "last-success.json"
    stale_timestamp = datetime.now(UTC) - timedelta(hours=48)
    marker.write_text(
        '{"status":"ok","timestamp":"'
        f"{stale_timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')}"
        '","postgres_db":"template_app","hostname":"test","restic_repository":"repo"}',
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "BACKUP_HEALTH_ENABLED", True)
    monkeypatch.setattr(settings, "BACKUP_HEALTH_STATUS_FILE", str(marker))
    monkeypatch.setattr(settings, "BACKUP_MAX_AGE_HOURS", 36)

    response = await client.get("/api/v1/health/backup")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "degraded"
    assert body["reason"] == "backup marker is stale"


async def test_health_sets_request_id_header(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert "x-request-id" in response.headers


async def test_health_respects_provided_request_id(client: AsyncClient) -> None:
    custom_id = "test-correlation-id-123"
    response = await client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
    assert response.headers["x-request-id"] == custom_id
