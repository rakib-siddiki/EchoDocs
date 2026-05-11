# 03 — Shared Types & `libs/ai` Foundation

**Type**: AFK
**Labels**: library, ai, types

## What to build

Implement the shared `libs/types` interfaces and the four core services in `libs/ai`. This library is the heart of the RAG pipeline and must be designed as a deep module: a simple, stable interface that hides all AI and database complexity from the apps that consume it.

**`libs/types`** — define and export:
- `Document`, `Chunk`, `ChatMessage`, `QueryResult`, `Citation`, `UserRole` TypeScript interfaces

**`libs/ai`** — implement and unit-test:
- **`ChunkingService`**: splits a raw text string into fixed-size chunks (~1000 chars) with 200-char overlap. Pure function, no I/O.
- **`EmbeddingService`**: calls Gemini `text-embedding-004` API, returns a `number[]` (768 dims). External API call; must be mockable.
- **`VectorSearchService`**: executes a cosine similarity query (`<=>`) against Supabase `pgvector`, returns top-K `Chunk[]`. Accepts an embedding vector and `k` parameter.
- **`PromptBuilder`**: accepts retrieved chunks + user query, returns a formatted RAG prompt string. Pure function, no I/O.

Each service must be exported from a single barrel file so consumers import from `@echodocs/ai`.

## Acceptance criteria

- [ ] `libs/types` exports all five interfaces; all apps resolve them via path alias `@echodocs/types`
- [ ] `ChunkingService` correctly chunks a 5000-char string into overlapping segments of ~1000 chars
- [ ] `ChunkingService` has passing unit tests covering edge cases (short text, exact boundary, empty string)
- [ ] `EmbeddingService` unit tests pass with a mocked Gemini API response; returns a `number[]` of length 768
- [ ] `VectorSearchService` integration test passes against seed data from issue #02 — returns top-5 results ordered by similarity
- [ ] `PromptBuilder` unit tests verify the prompt contains the retrieved chunk content and the user query
- [ ] All services exported from `@echodocs/ai` barrel with no circular dependencies

## Blocked by

- `02-database-schema-supabase-setup.md`

## Status
Pending
