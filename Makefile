.PHONY: dev install migrate seed seed-all migrate-seed lint test ops-check ops-shell-check ops-compose-check ops-health-test deploy deploy-logs deploy-ps

# Running services through Docker Compose is the normal development path.
# This direct uvicorn target is kept for emergency debugging.
dev:
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

install:
	uv sync --dev

migrate:
	uv run alembic upgrade head

seed:
	uv run python scripts/seed.py

seed-all:
	uv run python scripts/seed.py --all

migrate-seed: migrate seed

lint:
	uv run ruff check . && uv run ruff format --check .

test:
	uv run pytest

ops-check: ops-shell-check ops-compose-check ops-health-test

ops-shell-check:
	bash -n scripts/backup.sh scripts/restore-check.sh scripts/check-backup-freshness.sh scripts/setup-prod.sh

ops-compose-check:
	docker compose --env-file .env.example --env-file .env.monitoring.example -f docker-compose.monitoring.yml config >/dev/null
	API_BASE_URL=http://localhost:8000 VITE_PUBLIC_SITE_URL=http://localhost:3000 docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.prod.yml config >/dev/null

ops-health-test:
	uv run pytest tests/test_health.py -q

# ── VPS deploy ─────────────────────────────────────────────────────────────
# Usage: make deploy VPS_USER=ubuntu VPS_HOST=1.2.3.4 PROJECT_DIR=/opt/my-project
VPS_USER    ?= deploy
VPS_HOST    ?= $(shell grep ^DOMAIN .env 2>/dev/null | cut -d= -f2)
PROJECT_DIR ?= /opt/$(shell basename $(CURDIR))

deploy:
	ssh $(VPS_USER)@$(VPS_HOST) \
	  "cd $(PROJECT_DIR) && \
	   git pull && \
	   docker compose -f docker-compose.yml -f docker-compose.prod.yml \
	     up -d --build --remove-orphans"

deploy-logs:
	ssh $(VPS_USER)@$(VPS_HOST) \
	  "cd $(PROJECT_DIR) && docker compose logs -f backend frontend nginx"

deploy-ps:
	ssh $(VPS_USER)@$(VPS_HOST) \
	  "cd $(PROJECT_DIR) && docker compose ps"
