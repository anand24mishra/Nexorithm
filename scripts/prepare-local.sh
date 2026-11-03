#!/bin/sh
set -eu
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env: replace example secrets and configure the runtime before starting."
  exit 1
fi
set -a
. ./.env
set +a
mkdir -p monitoring
printf '%s' "$METRICS_TOKEN" > monitoring/metrics-token
chmod 644 monitoring/metrics-token
# Token is readable by Prometheus container and excluded from Git.
docker compose config --quiet
