# 05 — DocsModule — File Upload API

**Type**: AFK
**Labels**: api, documents

## What to build

Implement the `DocsModule` in `apps/api` that handles document uploads. When an admin POSTs a file, the API stores the document metadata in the database (status `PENDING`), enqueues an ingestion job to BullMQ, and immediately returns the new document ID with status `PENDING`.

This slice covers the upload entry point only — the ingestion processing itself is handled in issues #06 and #07.

**Endpoints:**
- `POST /api/v1/docs/upload` — accepts `multipart/form-data` with a PDF or Markdown file. Validates file type (`.pdf`, `.md`). Creates a `Document` row. Dispatches an `ingestion` BullMQ job with `{ documentId, filePath }`. Returns `{ documentId, status: "PENDING" }`.
- Protected by `@Roles('admin')`.

File size limit: 20 MB. Files are temporarily written to disk (or memory buffer) before being handed to the queue — the actual file bytes are passed to the worker via the job payload or a shared temp path.

## Acceptance criteria

- [x] `POST /api/v1/docs/upload` with a valid `.pdf` file returns `201` with `{ documentId, status: "PENDING" }`
- [x] A `Document` row is created in the database with `status = PENDING`
- [x] A BullMQ job is enqueued in the `ingestion` queue with `documentId` in the payload
- [x] Uploading a `.txt` file returns `400 Bad Request` with a meaningful error message
- [x] Uploading a file over 20 MB returns `413 Payload Too Large`
- [x] Request without an Admin JWT returns `401` / `403`
- [x] Integration test: upload a valid file → assert DB row exists with `PENDING` status → assert queue job was enqueued (using a Bull test helper or mock)
- [x] API versioning: endpoint is available at `/api/v1/docs/upload`

## Blocked by

- `02-database-schema-supabase-setup.md`
- `03-shared-types-and-libs-ai-foundation.md`

## Status
Completed
