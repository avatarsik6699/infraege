#!/usr/bin/env bash
set -euo pipefail

PROJECT_SLUG="${1:-template-app}"
DB_NAME="${PROJECT_SLUG//-/_}"

sed -i "s/template_app/${DB_NAME}/g" .env.example
cp .env.example .env

echo "Initialized .env for ${PROJECT_SLUG}" 
