# Submission lifecycle

```mermaid
sequenceDiagram
  participant U as Browser
  participant A as API
  participant M as MongoDB
  participant Q as BullMQ
  participant W as Worker
  participant S as Sandbox
  U->>A: POST /api/submissions
  A->>M: insert queued record
  A->>Q: enqueue submission id
  A-->>U: 202 {submissionId,status}
  loop bounded polling
    U->>A: GET /api/submissions/:id
  end
  W->>M: queued -> running + lease
  W->>M: load authoritative problem
  W->>S: execute each test
  S-->>W: bounded execution result
  W->>M: running lease -> completed/failed
  U->>A: GET status
  A-->>U: terminal verdict
```

Allowed transitions are centralized: queued may run, fail or cancel; running may requeue after recoverable infrastructure failure, complete, fail or cancel; terminal records cannot transition. Completion matches both `running` and the current lease token, so duplicate or late workers cannot overwrite a result.

Infrastructure failures are retried at most three times with BullMQ exponential backoff. User verdicts are terminal and are not retried. An expired lease is requeued until its bounded attempt count is exhausted. A reconciliation loop repairs Mongo/Redis enqueue gaps and stale BullMQ terminal jobs.

The browser polls every 1.5 seconds, backs off after fetch errors, stops on terminal status, aborts on unmount/problem change and offers recovery using the saved submission id.
