# 12 — Chat Streaming — SSE Response

**Type**: AFK
**Labels**: api, frontend, chat, streaming

## What to build

Upgrade the chat system to stream AI responses token-by-token using Server-Sent Events (SSE). This replaces the single-shot `POST /api/v1/chat/query` wait with a progressive streaming experience.

**Backend (`apps/api` — ChatModule):**
- Add a new streaming endpoint: `POST /api/v1/chat/query/stream`
- Steps 1–3 (embed query, retrieve chunks, build prompt) remain identical to issue #10.
- Step 4: call Gemini in streaming mode, forwarding each token chunk to the SSE response as it arrives.
- SSE event format:
  - `data: { type: "token", content: "..." }` — for each token
  - `data: { type: "citations", citations: [...] }` — sent once after all tokens
  - `data: { type: "done" }` — signals end of stream
- On error mid-stream: send `data: { type: "error", message: "..." }` and close the connection.
- Keep the non-streaming endpoint (`POST /api/v1/chat/query`) working unchanged for backward compatibility.

**Frontend (`apps/web` — Chat UI):**
- Switch the chat query to use the streaming endpoint.
- As tokens arrive, append them to the AI message bubble in real-time (character-by-character effect).
- Citations appear below the message only after the `citations` event is received.
- The typing indicator is replaced by the live token stream.
- On stream error, display an inline error message in the chat thread.

## Acceptance criteria

- [ ] `POST /api/v1/chat/query/stream` returns `Content-Type: text/event-stream`
- [ ] Tokens arrive progressively — response does not wait for full completion before the first token is sent
- [ ] `citations` event is received after all tokens and contains the same citations as the non-streaming endpoint
- [ ] `done` event closes the stream cleanly
- [ ] Chat UI renders tokens progressively as they arrive; no flash/flicker on append
- [ ] If the stream errors mid-way, an inline error message appears in the chat thread
- [ ] Non-streaming endpoint (`POST /api/v1/chat/query`) remains functional and unmodified
- [ ] Integration test: call the streaming endpoint, collect all SSE events, assert token + citation + done events are all received

## Blocked by

- `11-chat-ui-basic-query-citations-multiturn.md`

## Status
Pending
