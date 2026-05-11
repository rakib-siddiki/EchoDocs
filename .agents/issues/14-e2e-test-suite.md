# 14 — E2E Test Suite

**Type**: AFK
**Labels**: testing, e2e

## What to build

Implement an end-to-end test suite using **Playwright** that validates the complete critical user journey from login to a grounded AI answer. These tests run against a locally running instance of all three apps (`web`, `api`, `worker`) backed by a test Supabase database and a local Redis instance.

**Critical path covered:**

1. **Auth flow**: unauthenticated user visits `/dashboard` → redirected to `/sign-in` → logs in with a test admin account → lands on `/dashboard`.
2. **Upload flow**: admin drags a known test PDF onto the upload zone → document appears in list with `PENDING` status → status transitions to `PROCESSED` within 30 seconds.
3. **Query flow**: admin navigates to `/chat` → types a question that is answerable from the uploaded test document → receives a non-empty answer → at least one citation references the uploaded document by name.
4. **Delete flow**: admin deletes the uploaded document → it disappears from the document list.
5. **Viewer access flow**: a viewer account logs in → `/chat` is accessible → `/dashboard` delete button is not visible.

**Test data strategy:**
- A small, deterministic test PDF (e.g., a 2-page doc with known content) is committed to the repo under a test fixtures directory.
- A test admin and viewer account are pre-configured in Clerk (dev environment).
- The test database is seeded and torn down per test run.

## Acceptance criteria

- [ ] Playwright config points to local `apps/web` dev server and `apps/api` + `apps/worker` processes
- [ ] Auth redirect test: unauthenticated `/dashboard` → `/sign-in` (passes)
- [ ] Upload test: test PDF reaches `PROCESSED` status within 30-second timeout
- [ ] Query test: answer is non-empty and citation names the test document
- [ ] Delete test: document disappears from list after deletion
- [ ] Viewer role test: delete button not present in dashboard; `/chat` accessible
- [ ] Tests can be run with a single command: `nx e2e web-e2e`
- [ ] CI-ready: tests pass in a headless environment with no manual steps

## Blocked by

- `11-chat-ui-basic-query-citations-multiturn.md`

## Status
Pending
