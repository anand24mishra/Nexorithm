# Deployment

Use dedicated Linux compute for judge workers and their runtime daemon. Install and configure gVisor, pull or mirror verified runtime images, place the worker on a network that cannot reach MongoDB/Redis from sandboxes, and expose only the frontend/API through TLS ingress. Use `docker-compose.yml` for the service topology and `docker-compose.production.yml` to require a separate mTLS runtime-daemon endpoint rather than a host socket.

Store secrets in the platform secret manager. Run `npm run migrate` before enabling workers. Verify live/ready endpoints, protected metrics, Grafana panels, accepted/wrong/runtime/timeout Python and JavaScript cases, network/file/process/memory/output restrictions, cleanup and recovery before public traffic.

`docker compose -f docker-compose.yml -f docker-compose.production.yml config` was rendered locally with dummy runtime-host values. It selects `runsc`, disables the weak sandbox, sets `NODE_ENV=production` and uses the mTLS endpoint rather than the host socket. That file was not deployed, and no Linux `runsc` runner was available. Public execution stays disabled.

The quality workflow tests changes. A successful main-branch Quality run publishes SHA-tagged images to GHCR. Deployment remains manual; no workflow changes production services. The legacy S3 frontend deployment is now `workflow_dispatch` with a protected production environment.

Rollback by stopping workers, deploying the prior SHA-tagged API/worker/frontend images, and retaining MongoDB/Redis volumes. The schema extension is backward-readable; do not delete new lifecycle fields during rollback.
