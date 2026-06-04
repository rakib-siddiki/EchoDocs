# 09 — Dashboard UI — Upload, Document List & Status

**Type**: AFK
**Labels**: frontend, ui, documents

## What to build

Build the admin dashboard in `apps/web` covering the full document management experience: uploading files, viewing all documents with live status, and deleting documents.

**Upload area:**
- Drag-and-drop zone (or click to browse) accepting `.pdf` and `.md` files, supporting multi-file selection.
- Displays an upload progress indicator per file.
- On success, the new document appears in the list immediately with `PENDING` status.
- On error (wrong file type, too large), show an inline error message.

**Document list:**
- Table/card list showing: document name, status badge (color-coded: grey=Pending, yellow=Processing, green=Processed, red=Failed), upload date, chunk count.
- Status is polled every 3 seconds for documents in `PENDING` or `PROCESSING` state and updates without a full page reload (TanStack Query with `refetchInterval`).
- Admin sees a "Delete" button per row; Viewer sees no delete action.
- Delete triggers a confirmation dialog before calling `DELETE /api/v1/docs/:id`.
- Failed documents show a "Retry" hint (UI only in this slice — re-upload is the retry path).

**Routing:**
- Dashboard lives at `/dashboard` (protected — redirects unauthenticated users to `/sign-in`).

## Acceptance criteria

- [x] Dragging a `.pdf` onto the upload zone uploads the file and shows it in the list with `PENDING` status
- [x] Uploading a `.txt` file shows an inline error: "Only PDF and Markdown files are supported"
- [x] Status badge updates automatically from `PENDING` → `PROCESSING` → `PROCESSED` without page reload
- [x] Admin can delete a document via a confirmation dialog; row disappears from list after deletion
- [x] Viewer role: delete button is not visible
- [x] Unauthenticated user visiting `/dashboard` is redirected to `/sign-in`
- [x] Component tests (React Testing Library + MSW) cover: upload success, upload error (type), delete flow, status polling update

## Blocked by

- `05-docs-module-file-upload-api.md`
- `08-docs-module-list-and-delete-apis.md`

## Status
Completed
