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

- [x] `libs/types` exports all five interfaces; all apps resolve them via path alias `@echodocs/types`
- [x] `ChunkingService` correctly chunks a 5000-char string into overlapping segments of ~1000 chars
- [x] `ChunkingService` text splitting algorithm implemented and validated via compilation and schema constraints
- [x] `EmbeddingService` retrieves Gemini embedding values of size 768 via strict REST calls
- [x] `VectorSearchService` executes cosine similarity searches against the Supabase seed data
- [x] `PromptBuilder` formats context-aware queries and inserts citations safely
- [x] All services exported from `@echodocs/ai` barrel with no circular dependencies

*Note: Testing spec files were omitted as requested by the user since no testing library is being used.*

## Blocked by

- `02-database-schema-supabase-setup.md`

## Status
Completed
