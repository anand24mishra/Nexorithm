# Local development

Requirements: Node 24, MongoDB, Redis and Docker. Secure sandbox execution additionally requires Linux with Docker configured with gVisor `runsc` and pre-pulled Python/Node runtime images.

1. Copy `.env.example` to `.env`, replace every example secret, set the Docker group/socket values, and put the same metrics token in `monitoring/metrics-token` (`scripts/prepare-local.sh` does this after `.env` is configured).
2. Install gVisor and confirm `docker info` lists `runsc`.
3. Run `docker pull python:3.12.10-slim-bookworm` and `docker pull node:22.15.0-bookworm-slim`.
4. Run `docker compose up --build`.
5. Run `docker compose exec backend-api npm run migrate` once when upgrading an existing database.

The frontend bind is `127.0.0.1:${FRONTEND_BIND:-8080}` and Grafana is `127.0.0.1:${GRAFANA_BIND:-3000}`. MongoDB, Redis, the API and the worker are internal services. On the 2026-10-28 Mac verification, ports 8080 and 3000 were already used, so the local `.env` set `FRONTEND_BIND=8088`, `GRAFANA_BIND=3001` and `CORS_ORIGINS=http://localhost:8088`.

Docker Desktop for macOS does not provide `runsc`. A temporary local stack can set `SANDBOX_RUNTIME=runc` and `ALLOW_WEAK_SANDBOX=true`. The verified Desktop VM socket is `root:root` mode 660, so that `.env` also set `DOCKER_GID=0`. The worker refuses the weak runtime when `NODE_ENV=production`. This mode is unsuitable for hostile or public submissions.
