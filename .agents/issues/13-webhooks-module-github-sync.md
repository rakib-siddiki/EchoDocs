# 13 — WebhooksModule — GitHub Sync

**Type**: AFK
**Labels**: api, webhooks, sync

## What to build

Implement the `WebhooksModule` in `apps/api` that listens for GitHub push events and automatically re-ingests any changed Markdown documentation files.

**Endpoint:**
- `POST /api/v1/webhooks/github`
- This endpoint is **public** (no Clerk JWT required) but must validate the `X-Hub-Signature-256` HMAC header against the shared webhook secret to authenticate GitHub's request.
- Requests with an invalid or missing signature return `401` immediately.

**Processing logic:**
1. Parse the push event payload to extract the list of added/modified files.
2. Filter to only `.md` files.
3. For each changed Markdown file, fetch its raw content from GitHub (using the repository's raw content URL from the payload).
4. Find the existing `Document` record by `sourceUrl`, or create a new one.
5. Dispatch an ingestion job to BullMQ (same queue as manual uploads). The worker's idempotency logic (from issue #07) handles replacing old chunks.
6. Respond `200 OK` immediately — do not wait for ingestion to complete.

**Sync history:**
- Add a `lastSyncedAt` timestamp field to the `Document` model (migration required).
- The worker updates `lastSyncedAt` after successful ingestion of a webhook-triggered document.
- `GET /api/v1/docs` response includes `lastSyncedAt` for each document.

**Idempotency note:** GitHub may re-deliver the same webhook event. The system must handle duplicate deliveries gracefully (no duplicate documents or chunks).

## Acceptance criteria

- [ ] `POST /api/v1/webhooks/github` with a valid HMAC signature and a push payload returns `200`
- [ ] Request with an invalid HMAC returns `401`
- [ ] For each `.md` file in the push event, a BullMQ ingestion job is enqueued with the file's raw GitHub URL as `sourceUrl`
- [ ] Non-`.md` files in the push payload are ignored
- [ ] Re-delivering the same webhook event does not create duplicate `Document` rows or `Chunk` rows
- [ ] `Document.lastSyncedAt` is updated after a webhook-triggered ingestion completes successfully
- [ ] `GET /api/v1/docs` includes `lastSyncedAt` in the response
- [ ] Unit test: valid HMAC → assert job enqueued; invalid HMAC → assert 401; non-md files → assert no jobs enqueued
- [ ] `GITHUB_WEBHOOK_SECRET` documented in `.env.example`

## Blocked by

- `07-ingestion-processor-bullmq-worker.md`

## Status
Pending
