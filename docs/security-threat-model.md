# Security threat model

Assets are user accounts and source, hidden tests, application secrets, MongoDB/Redis data, judge availability and the worker host. Attackers include unauthenticated clients, authenticated hostile submitters and compromised submitted code.

Trust boundaries exist at HTTP validation, JWT verification, Redis payload validation, worker database access and the runtime controller. Mitigations include strict schemas and body limits, per-user submission admission, HS256-only JWT verification with required claims/expiry, owner-filtered reads, identifier-only jobs, lease fencing, output redaction, structured redacted logs, fail-closed sandbox policy and separated API/runtime credentials.

Denial of service remains the dominant residual risk. Global pending admission, per-user request limiting, worker concurrency, suite/test limits and container resources bound it, but large coordinated account fleets can still saturate capacity. Account creation needs an external abuse-control strategy before a public launch. Browser bearer tokens use session storage for compatibility; secure same-site HttpOnly cookies would further reduce script-accessible token exposure and require a coordinated CSRF design.

Problem authors and database administrators are trusted to configure correct tests and execution contracts. Runtime image supply-chain compromise, Docker daemon compromise and Linux/gVisor vulnerabilities remain operational risks; use image digests/signing, dedicated hosts, minimal access and patch management.
