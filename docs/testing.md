# Testing

Backend: `npm test`, `npm run test:integration`, `npm run test:security`, `npm run typecheck`, `npm run lint`, `npm run build`. Integration tests require `TEST_MONGODB_URI` containing `nexorithm_test` and a dedicated Redis URL ending in database 15.

Frontend: `npm test`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`, `npm run build`. Browser tests mock the HTTP boundary to verify UI state flow; they do not replace the backend integration or sandbox acceptance suites.

The sandbox security suite refuses to run without `RUN_SANDBOX_SECURITY=1`. It executes bounded programs inside runtime containers, not on the host process. The production workflow in `.github/workflows/sandbox.yml` is restricted to a self-hosted Linux runner with `runsc`. A development run against Docker Desktop `runc` does not satisfy that gate.

On 2026-10-28 the local suite was executed with `RUN_SANDBOX_SECURITY=1`, `SANDBOX_RUNTIME=runc` and `ALLOW_WEAK_SANDBOX=true`: 19 tests passed. That result is a `runc` result. The GitHub-hosted workflow was not executed.
