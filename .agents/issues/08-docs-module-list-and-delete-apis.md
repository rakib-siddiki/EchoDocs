# 08 — DocsModule — List & Delete APIs

**Type**: AFK
**Labels**: api, documents

## What to build

Extend the `DocsModule` in `apps/api` with the remaining document management endpoints: listing all documents with their current status, and deleting a document (which cascades to its chunks).

**Endpoints:**
- `GET /api/v1/docs` — returns a paginated list of documents. Each item includes: `id`, `name`, `status`, `sourceUrl`, `createdAt`, `updatedAt`, and `chunkCount` (derived). Supports `?page` and `?limit` query params. Accessible to both `admin` and `viewer` roles.
- `DELETE /api/v1/docs/:id` — admin only. Deletes the `Document` and all associated `Chunk` rows (via cascade). Returns `204 No Content`. Returns `404` if the document does not exist.

The list endpoint should reflect real-time status — if a document is still `PENDING` or `PROCESSING`, that must be visible to the frontend poller.

## Acceptance criteria

- [ ] `GET /api/v1/docs` returns `200` with a paginated array of documents for both Admin and Viewer tokens
- [ ] Each document in the list includes `id`, `name`, `status`, `createdAt`, and `chunkCount`
- [ ] `GET /api/v1/docs?page=1&limit=5` returns at most 5 results
- [ ] `DELETE /api/v1/docs/:id` with an Admin token returns `204` and removes the document + all chunks from the DB
- [ ] `DELETE /api/v1/docs/:id` with a Viewer token returns `403`
- [ ] `DELETE /api/v1/docs/non-existent-id` returns `404`
- [ ] Integration tests cover all status codes above
- [ ] Unauthenticated requests to both endpoints return `401`

## Blocked by

- `05-docs-module-file-upload-api.md`

## Status
Pending
