#!/usr/bin/env bash
set -euo pipefail

docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot renew --quiet
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
