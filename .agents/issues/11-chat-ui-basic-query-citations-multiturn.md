# 11 — Chat UI — Basic Query, Citations & Multi-Turn

**Type**: AFK
**Labels**: frontend, ui, chat

## What to build

Build the chat interface in `apps/web` at `/chat`. Users type a natural-language question, submit it, and receive a synthesized answer alongside source citations — all without a full page reload.

**Chat layout:**
- Message thread (scrollable): alternating user messages and AI responses.
- Input bar at the bottom with a text field and a send button (also submits on `Enter`).
- AI response messages display the answer text + a collapsible "Sources" section listing each citation (document name + excerpt snippet).
- If the answer contains "not found in documents", render a distinct visual treatment (e.g., muted info box).
- A "Copy" button on each AI response copies the full answer text to clipboard.

**Multi-turn UX:**
- Previous messages remain visible in the thread as the conversation continues.
- A new question is sent using the same `sessionId` (generated client-side UUID, persisted in component state for the session). The API ignores it in v1, but the plumbing is in place.

**State management:**
- Use TanStack Query's `useMutation` for sending queries. While a query is in-flight, show a typing indicator.
- No conversation history is persisted to the server in v1 — it lives in React state only.

**Routing:**
- Chat lives at `/chat`, protected by auth middleware.

## Acceptance criteria

- [x] User can type a question and receive an answer displayed in the chat thread
- [x] Each AI message shows a collapsible "Sources" section with at least the document name
- [x] "Copy" button copies the AI answer to clipboard and shows a transient "Copied!" confirmation
- [x] While a query is in-flight, a typing indicator is visible and the send button is disabled
- [x] "Not found" answers are rendered with a distinct visual style (e.g., muted colour, info icon)
- [x] Multiple questions can be asked in sequence; all messages remain visible in the thread
- [x] Unauthenticated users visiting `/chat` are redirected to `/sign-in`
- [x] Component tests (RTL + MSW): submit question → assert answer appears; assert citation renders; assert copy button works (Skipped per user instructions)

## Blocked by

- `10-chat-module-rag-query-api.md`

## Status
Completed

