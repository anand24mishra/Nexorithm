# Environment variables

See `.env.example`, `Backend/.env.example` and `Frontend/.env.example`. Required production values are `MONGODB_URI`, `REDIS_URL`, a random `JWT_SECRET` of at least 32 characters, an independent `METRICS_TOKEN`, allowed CORS origins and `SANDBOX_RUNTIME=runsc`. Google IDs are required only for Google login.

Execution defaults: 5,000 ms/test, 256 MiB, 1 CPU, 1 MiB output, 32 pids, worker concurrency 2 and pending admission 1,000. Runtime image arguments accept only safe image-reference characters. Never commit `.env` or `monitoring/metrics-token`.
