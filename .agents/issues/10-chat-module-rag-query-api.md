# 10 — ChatModule — RAG Query API (Non-Streaming)

**Type**: AFK
**Labels**: api, chat, ai

## What to build

Implement the `ChatModule` in `apps/api` that powers the core question-answering capability. When a user submits a query, the endpoint:

1. Converts the query into a vector embedding (via `EmbeddingService`).
2. Retrieves the top-5 most similar `Chunk` rows from Supabase using cosine similarity (`<=>` operator) via `VectorSearchService`.
3. Builds a RAG prompt using `PromptBuilder`, combining the retrieved chunks and the user's question.
4. Sends the prompt to Gemini 1.5 Flash and waits for the full response.
5. Returns the answer and a citations list derived from the retrieved chunks.

If no relevant chunks are found (similarity below a threshold), return a clear "I couldn't find an answer in the uploaded documents" response — do not fabricate an answer.

**Endpoint:**
- `POST /api/v1/chat/query`
- Request: `{ query: string, sessionId?: string }`
- Response: `{ answer: string, citations: { documentId: string, documentName: string, chunkIndex: number, excerpt: string }[] }`
- Accessible to both Admin and Viewer roles.

Session context (`sessionId`) is accepted but not used to maintain conversation history in v1 — it is reserved for future multi-turn support.

## Acceptance criteria

- [ ] `POST /api/v1/chat/query` with a question relevant to an ingested document returns a non-empty `answer` string
- [ ] Response includes at least one `citation` with a valid `documentId` and `excerpt`
- [ ] When no relevant chunks exist, the response `answer` contains a "not found in documents" message and `citations` is an empty array
- [ ] Unauthenticated requests return `401`
- [ ] Integration test: seed the DB with a known chunk; query with a question semantically related to it; assert the answer is non-empty and citation references the seeded document
- [ ] Unit test: mock `EmbeddingService`, `VectorSearchService`, and Gemini client; assert all three are called in order with correct args
- [ ] `sessionId` is accepted in the request body without error (ignored in v1)
- [ ] Endpoint available at `/api/v1/chat/query`

## Blocked by

- `06-ingestion-pipeline-text-extraction-embedding.md`
- `07-ingestion-processor-bullmq-worker.md`

## Status
Pending
