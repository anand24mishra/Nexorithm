# Migration guide

Back up MongoDB, deploy the API with workers stopped, and run `cd Backend && npm run build && MONGODB_URI=... npm run migrate`. The idempotent migration marks legacy verdict-bearing submissions completed without changing source/verdict and creates indexes. It also installs deterministic execution contracts for supported problems and reports unsupported problems.

Deploy API/frontend, start workers, then verify queued through terminal behavior. The POST response changes from synchronous HTTP 200 with a verdict to HTTP 202 with `{submissionId,status}`. Clients must poll GET `/api/submissions/:id`. List responses are now `{submissions,total,page,totalPages}`. Submission routes require authentication and MongoDB/Redis; anonymous/in-memory judging has been removed.

Source/result retention is manual: `node dist/scripts/retention.js` reports records older than 90 days; add `--apply` to replace source and remove detailed results. Schedule it only after product/legal review.
