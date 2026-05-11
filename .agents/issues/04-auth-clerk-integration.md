# 04 — Auth — Clerk Integration (API + Frontend)

**Type**: AFK
**Labels**: auth, security

## What to build

Integrate Clerk across both `apps/api` (NestJS) and `apps/web` (Next.js) to provide OAuth login, session management, and role-based access control.

**Backend (`apps/api`):**
- Install and configure the Clerk NestJS SDK
- Create a `ClerkAuthGuard` that validates the `Authorization: Bearer <token>` JWT on every protected route
- Create a `RolesGuard` that reads the `role` field from Clerk's user public metadata (`admin` | `viewer`) and enforces it per endpoint
- Expose decorators: `@Public()` (skip auth), `@Roles('admin')` (require admin role)
- Unauthenticated requests return `401`; insufficient role returns `403`

**Frontend (`apps/web`):**
- Wrap the app in Clerk's `<ClerkProvider>`
- Implement the login page using Clerk's hosted sign-in component
- Add Next.js middleware that redirects unauthenticated users to `/sign-in`
- After login, redirect users to the dashboard

**Role assignment**: Clerk dashboard (manual for v1) — no in-app role management UI yet (that is covered in a later issue).

## Acceptance criteria

- [ ] `GET /api/v1/docs` with no token returns `401`
- [ ] `GET /api/v1/docs` with a valid Viewer token returns `200`
- [ ] `DELETE /api/v1/docs/:id` with a Viewer token returns `403`
- [ ] `DELETE /api/v1/docs/:id` with an Admin token returns `200` (or `404` if not found)
- [ ] Unauthenticated visit to `/dashboard` in the browser redirects to `/sign-in`
- [ ] After successful OAuth login, user is redirected to `/dashboard`
- [ ] Auth guard unit tests: invalid JWT → 401, missing role → 403, valid admin → passes
- [ ] Clerk environment variables documented in `.env.example`

## Blocked by

- `01-monorepo-infrastructure-scaffold.md`

## Status
Pending
