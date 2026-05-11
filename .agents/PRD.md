# EchoDocs – AI-Powered RAG Knowledge Engine
> **Product Requirements Document**
> Last Updated: 2026-05-11

---

## Problem Statement

Technical teams accumulate large volumes of documentation — PDFs, Markdown files, internal wikis — that quickly become outdated, hard to search, and siloed across tools. Developers and knowledge workers waste significant time manually scanning through docs to find answers that are already written down somewhere.

The core problems are:

- **Information silos**: Documentation lives in static files that aren't connected to each other or to a search interface.
- **Stale responses**: Generic AI tools (e.g., ChatGPT) don't have access to a team's private documents and hallucinate answers.
- **No grounded context**: Existing search tools return raw file matches, not synthesized, accurate answers drawn from the actual content.
- **Manual sync burden**: Docs hosted on external platforms (e.g., GitHub) require manual re-upload whenever they change.

---

## Solution

**EchoDocs** is a Retrieval-Augmented Generation (RAG) platform that transforms static documentation into an interactive, AI-powered knowledge interface.

Users upload PDFs or Markdown files (or connect a GitHub repository). EchoDocs ingests, chunks, and embeds them into a vector database. When a user asks a question, the system performs semantic search over the stored embeddings and synthesizes an accurate, grounded answer using an LLM — including citations back to the source documents.

### Key Value Propositions

- Responses are **grounded** in your actual documents — no hallucinations.
- Supports **automatic sync** via GitHub webhooks, eliminating manual re-uploads.
- Built on a **zero-cost-at-scale** stack (Gemini free tier, Supabase free tier, Upstash Redis).
- Role-based access lets teams **separate admin and viewer capabilities** cleanly.

---

## Tech Stack

| Layer        | Technology                     | Rationale                                              |
| ------------ | ------------------------------ | ------------------------------------------------------ |
| Frontend     | Next.js 14+ (App Router)       | High-performance React framework with SSR & routing    |
| Styling      | Tailwind CSS + Shadcn/UI       | Fast, scalable, accessible UI development              |
| Backend      | NestJS                         | Modular, TypeScript-first architecture                 |
| Database     | Supabase (Postgres + pgvector) | Native vector search support, managed Postgres         |
| AI Model     | Gemini 1.5 Flash               | Large context window, fast inference, free tier        |
| Queue System | BullMQ + Upstash Redis         | Reliable background job processing for ingestion       |
| Auth         | Clerk                          | Drop-in auth with RBAC support                         |
| Monorepo     | Nx                             | Shared libs, consistent tooling across apps            |

---

## User Stories

### Document Management

1. As an **admin**, I want to upload a PDF or Markdown file, so that the document becomes queryable by the team.
2. As an **admin**, I want to see the processing status of each uploaded document (Pending / Processing / Processed / Failed), so that I know when it's ready to query.
3. As an **admin**, I want to delete a document from the system, so that outdated documentation no longer pollutes query results.
4. As an **admin**, I want to view a list of all uploaded documents with metadata (name, upload date, status), so that I can manage the knowledge base efficiently.
5. As an **admin**, I want to upload multiple documents at once, so that I can onboard a knowledge base quickly.
6. As an **admin**, I want to be notified if a document fails to process, so that I can re-upload or investigate the issue.

### Chat & Query Interface

7. As a **viewer**, I want to ask a question in natural language and receive a synthesized answer, so that I don't have to manually read through documents.
8. As a **viewer**, I want to see citations (source document name + chunk reference) alongside each AI response, so that I can verify the answer and read more context.
9. As a **viewer**, I want to ask follow-up questions in the same session, so that I can have a multi-turn conversation with the knowledge base.
10. As a **viewer**, I want responses to clearly indicate when the answer cannot be found in the uploaded documents, so that I know when to look elsewhere.
11. As a **viewer**, I want the chat interface to stream responses token-by-token, so that I get faster perceived response times.
12. As a **viewer**, I want to copy an AI response to my clipboard, so that I can share or reuse it easily.

### GitHub Sync

13. As an **admin**, I want to connect a GitHub repository so that its Markdown documentation is automatically ingested into EchoDocs.
14. As an **admin**, I want document embeddings to be automatically refreshed when a push event is detected on the connected GitHub repo, so that the knowledge base stays up-to-date without manual effort.
15. As an **admin**, I want to see a sync history log showing when the last GitHub webhook triggered an update, so that I can audit data freshness.

### Authentication & Access Control

16. As an **admin**, I want to log in with my work account (OAuth), so that access is secure and doesn't require a separate password.
17. As an **admin**, I want to invite team members and assign them the Viewer role, so that they can query the knowledge base but not modify it.
18. As a **viewer**, I want to log in and access the chat interface, so that I can query documents the admin has uploaded.
19. As a **system**, I want unauthenticated users to be redirected to the login page, so that private documentation is not exposed publicly.

### Developer / Operational

20. As a **developer**, I want background ingestion to run in a queue worker, so that large file uploads do not block the API response.
21. As a **developer**, I want failed ingestion jobs to be retried automatically, so that transient errors don't permanently break document processing.
22. As a **developer**, I want all API endpoints to be versioned (`/api/v1/...`), so that future breaking changes can be introduced without disrupting existing clients.

---

## Implementation Decisions

### Modules to Build

The system is decomposed into the following deep modules, organized as an Nx monorepo:

#### `apps/web` — Next.js Frontend
- **Upload Module**: Drag-and-drop file uploader, displays per-document processing status via polling or WebSocket.
- **Chat Module**: Multi-turn chat UI using TanStack Query for data fetching and optimistic updates. Streams responses from the backend.
- **Dashboard Module**: Document list view with status badges, delete actions (admin only), and sync history.
- **Auth Module**: Clerk-powered login, role-gated route guards, redirect middleware.

#### `apps/api` — NestJS Backend
- **DocsModule**: Handles file upload (multipart), stores document metadata, dispatches ingestion job to the queue.
- **ChatModule**: Accepts user query, converts to embedding, runs cosine similarity search, sends top-K chunks + query to Gemini, returns answer + citations.
- **IngestionModule**: Orchestrates text extraction, chunking, embedding, and vector storage. Invoked by the queue worker.
- **AuthModule**: Validates Clerk JWT tokens, enforces RBAC guards on protected endpoints.
- **WebhooksModule**: Validates GitHub webhook signatures, triggers re-ingestion of changed files.

#### `apps/worker` — BullMQ Worker
- **IngestionProcessor**: Consumes jobs from the ingestion queue. Calls `IngestionModule` logic. Handles retries on failure.

#### `libs/ai` — Shared AI/RAG Logic
- **EmbeddingService**: Wraps Gemini embedding API. Generates 768-dimensional vectors.
- **ChunkingService**: Splits document text into ~1000-character overlapping chunks.
- **VectorSearchService**: Executes cosine similarity queries against Supabase `pgvector`.
- **PromptBuilder**: Constructs the RAG prompt from retrieved chunks and user query.

#### `libs/types` — Shared TypeScript Types
- `Document`, `Chunk`, `ChatMessage`, `QueryResult`, `UserRole` interfaces shared across apps.

### Database Schema

```ts
model Document {
  id        String   @id @default(uuid())
  name      String
  sourceUrl String?                          // null for manual uploads
  status    DocumentStatus                   // PENDING | PROCESSING | PROCESSED | FAILED
  chunks    Chunk[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum DocumentStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
}

model Chunk {
  id         String   @id @default(uuid())
  content    String
  embedding  Unsupported("vector(768)")
  chunkIndex Int                              // position within document
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}
```

### API Contracts

#### Document APIs
- `POST /api/v1/docs/upload` — multipart/form-data; returns `{ documentId, status: "PENDING" }`
- `GET /api/v1/docs` — returns paginated list of documents with status
- `DELETE /api/v1/docs/:id` — admin only; cascades to chunks

#### Chat API
- `POST /api/v1/chat/query` — `{ query: string, sessionId?: string }` → `{ answer: string, citations: Citation[] }`
- Streaming variant: `POST /api/v1/chat/query/stream` — Server-Sent Events (SSE)

#### Webhook API
- `POST /api/v1/webhooks/github` — validates `X-Hub-Signature-256`, dispatches re-ingestion

### Key Architectural Decisions

- **Chunking strategy**: Fixed-size chunks (~1000 chars) with 200-char overlap to preserve semantic context across boundaries.
- **Embedding model**: Gemini `text-embedding-004` (768 dimensions) — consistent with the `vector(768)` schema.
- **Vector search**: Raw SQL via Supabase's `pgvector` extension using `<=>` cosine distance operator. Top-K = 5 chunks per query.
- **Queue**: BullMQ backed by Upstash Redis. Ingestion jobs have max 3 retries with exponential backoff.
- **Auth**: Clerk handles OAuth and session tokens. NestJS guards validate JWT on every protected route. Roles (`admin`, `viewer`) stored in Clerk metadata.
- **No file path or code snippet coupling in this PRD**: Implementation details live in code; schema shapes are included here as decision-encoding artifacts.

---

## Testing Decisions

### What Makes a Good Test

Tests should assert **external behavior** — what the module outputs given certain inputs — not internal implementation details like which internal method was called. Tests should be deterministic, isolated, and fast.

### Modules to Test

| Module | Test Type | What to Assert |
|---|---|---|
| `ChunkingService` | Unit | Given a document string, produces correctly-sized, correctly-overlapping chunks |
| `EmbeddingService` | Unit (mocked API) | Calls embedding API with correct payload; maps response to float array |
| `VectorSearchService` | Integration | Given an embedding, returns top-K chunks ordered by cosine similarity |
| `DocsModule` (upload endpoint) | Integration | File upload creates a `Document` with `PENDING` status and dispatches a queue job |
| `ChatModule` (query endpoint) | Integration | Query returns an answer string and at least one citation with a valid `documentId` |
| `IngestionProcessor` | Unit | Given a valid document job, calls extraction → chunking → embedding → storage in order; on failure, throws to trigger retry |
| `WebhooksModule` | Unit | Rejects requests with invalid HMAC signature; accepts valid ones and enqueues re-ingestion |
| Auth guards | Unit | Requests without valid JWT are rejected with 401; requests with viewer role cannot hit admin-only endpoints |

### Prior Art / Test Patterns

- Use **Jest** with `@nestjs/testing` `TestingModule` for all backend unit/integration tests.
- Mock external services (Gemini API, Supabase) with `jest.mock()` or manual stubs in test setup.
- Frontend: **React Testing Library** for component behavior tests. Use **MSW** (Mock Service Worker) to mock API responses.
- E2E: **Playwright** covering the critical path: login → upload doc → wait for PROCESSED status → query → verify answer contains citation.

---

## Out of Scope

- **Multi-tenancy / team workspaces**: The initial version supports a single shared knowledge base. Organization-level isolation is a future consideration.
- **Document versioning**: No version history of document content is maintained. Re-uploading replaces existing chunks.
- **Non-text file types**: Only PDF and Markdown are supported. Word documents, spreadsheets, images, and audio are out of scope.
- **Custom AI model selection**: The AI model (Gemini 1.5 Flash) is fixed for v1. A model picker is not in scope.
- **Real-time collaboration**: No concurrent chat sessions or shared session history between users.
- **Analytics dashboard**: Query frequency, popular topics, and response quality metrics are not tracked in v1.
- **Self-hosted deployment**: The platform targets Supabase + Upstash managed infrastructure. On-premise deployment is out of scope.

---

## Further Notes

- The monorepo is managed with **Nx**. Shared logic (AI, types, utils, UI components) lives in `libs/` to avoid duplication between `apps/api` and `apps/worker`.
- The `libs/ai` package is the most critical shared library — it encapsulates all RAG logic and should be designed as a deep module with a clean, stable interface so it can be swapped or extended (e.g., different LLM providers) without touching the API or worker apps.
- **GitHub webhook reliability**: GitHub may deliver webhook events out of order or retry on timeout. The ingestion queue must be idempotent — re-processing the same document URL should replace (not duplicate) existing chunks.
- **Cost management**: Gemini's free tier has rate limits. For high-volume deployments, a request queue or rate limiter should be introduced at the `EmbeddingService` boundary.
- The `status` field on `Document` should be updated atomically by the worker — never by the API — to avoid race conditions between the upload response and the ingestion pipeline.
