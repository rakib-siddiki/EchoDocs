# 06 — Ingestion Pipeline — Text Extraction & Embedding

**Type**: AFK
**Labels**: ingestion, ai

## What to build

Implement the ingestion pipeline logic inside `libs/ai` (or `apps/api`'s `IngestionModule`) that transforms a raw uploaded file into stored vector embeddings. This is the core write-path of EchoDocs.

The pipeline steps, in order:

1. **Text Extraction**: Given a file path and type, extract raw text. Use `pdf-parse` for PDFs; read the file directly for Markdown.
2. **Chunking**: Pass the raw text through `ChunkingService` (from issue #03) to produce ~1000-char overlapping chunks.
3. **Embedding**: For each chunk, call `EmbeddingService` (from issue #03) to generate a `vector(768)`.
4. **Storage**: Insert all `Chunk` rows into the database in a batch, linked to the `documentId`.
5. **Status update**: Update the `Document` status to `PROCESSED`. On any unrecoverable error, set status to `FAILED`.

This logic is exposed as a single `IngestionService.run(documentId, filePath, fileType)` method, which the BullMQ worker (issue #07) will call.

Important: `Document.status` must only be written by this service — never by the upload API.

## Acceptance criteria

- [x] `IngestionService.run()` given a sample PDF produces at least one `Chunk` row in the database
- [x] `IngestionService.run()` given a sample Markdown file produces at least one `Chunk` row
- [x] Each `Chunk` has a non-null `embedding` field with 768 dimensions
- [x] `Document.status` transitions: `PENDING → PROCESSING` at start, `PROCESSING → PROCESSED` on success
- [x] `Document.status` is set to `FAILED` if text extraction or embedding throws
- [x] `chunkIndex` is correctly assigned in order (0, 1, 2, …) per document
- [x] Unit tests for `IngestionService` mock the Gemini API and Supabase DB; assert status transitions and chunk counts
- [x] No partial chunk writes on failure (all-or-nothing batch insert or cleanup on error)

## Blocked by

- `03-shared-types-and-libs-ai-foundation.md`

## Status
Completed
