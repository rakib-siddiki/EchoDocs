# 07 — IngestionProcessor — BullMQ Worker

**Type**: AFK
**Labels**: worker, queue

## What to build

Implement the `IngestionProcessor` in `apps/worker` that consumes jobs from the BullMQ `ingestion` queue and calls `IngestionService.run()` (from issue #06) to process each document.

The worker must handle:
- **Consuming** jobs: listen to the `ingestion` queue, receive `{ documentId, filePath, fileType }` payloads.
- **Retry logic**: configure BullMQ for max 3 retries with exponential backoff. On failure, re-throw the error so BullMQ marks the job as failed and triggers a retry.
- **Final failure**: after 3 failed attempts, the job is moved to the dead-letter queue. The `Document.status` should already be `FAILED` from `IngestionService`.
- **Idempotency**: if the same `documentId` is processed twice (e.g., re-queued after a partial failure), existing chunks for that document must be deleted before re-inserting. This prevents duplicate embeddings.
- **Concurrency**: the worker processes up to 3 jobs concurrently.

The worker app starts standalone (not embedded in `apps/api`) and connects to the same Redis and Postgres instances via environment variables.

## Acceptance criteria

- [ ] Worker starts, connects to Redis, and begins consuming the `ingestion` queue
- [ ] End-to-end smoke test: upload a file via `POST /api/v1/docs/upload` → worker picks up the job → `Document.status` becomes `PROCESSED` within 30 seconds
- [ ] If `IngestionService.run()` throws, the job is retried up to 3 times (verify via BullMQ job state)
- [ ] After 3 failures, `Document.status` is `FAILED`
- [ ] Re-queuing a `documentId` that already has chunks deletes the old chunks before inserting new ones
- [ ] Worker processes up to 3 concurrent jobs without errors
- [ ] Unit test for `IngestionProcessor`: mock `IngestionService`, assert it is called with correct args; assert re-throw on error
- [ ] Worker concurrency and retry settings are configurable via environment variables

## Blocked by

- `05-docs-module-file-upload-api.md`
- `06-ingestion-pipeline-text-extraction-embedding.md`

## Status
Pending
