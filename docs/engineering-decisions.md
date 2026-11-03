# Engineering decisions

BullMQ was selected because the existing Node/TypeScript stack can use Redis-backed durable delivery, retries, stalls and concurrency without adding another language. MongoDB remains the source of truth and durable outbox because Mongo/Redis cannot share a transaction.

One container per test keeps language adapters small and cleanup explicit. gVisor is required in production because ordinary containers share the host kernel. The worker remains trusted and therefore belongs on dedicated compute with narrowly scoped runtime access.

Lease-token compare-and-set updates provide idempotence for at-least-once delivery. BullMQ retries only propagate infrastructure errors; a durable attempt count and reconciliation handle failures outside a single job instance. Worker concurrency and global admission are configuration, while per-user submission rate limiting stays at the API.

Polling was chosen for the current product scale and architecture. It requires no stateful public channel, stops deterministically and degrades with a recoverable saved id. WebSockets remain unsupported.

Unsupported: arbitrary languages, interactive programs, linked-list/tree serialization adapters, user-defined function discovery and public execution without a verified gVisor environment. OpenTelemetry export was not added; correlation is implemented with structured identifiers because no collector/export destination exists.
