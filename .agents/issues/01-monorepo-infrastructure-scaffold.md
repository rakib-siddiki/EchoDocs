# 01 — Monorepo & Infrastructure Scaffold

**Type**: AFK
**Labels**: setup, infrastructure

## What to build

Bootstrap the Nx monorepo with the three top-level apps (`web`, `api`, `worker`) and the shared libraries (`libs/ai`, `libs/types`, `libs/utils`, `libs/ui`). Set up all root-level configuration: TypeScript base config, ESLint, Prettier, environment variable contracts (`.env.example`), and Docker Compose for local development (Postgres + Redis).

The goal is a runnable skeleton: `apps/web` serves a blank Next.js page, `apps/api` responds to `GET /health`, and `apps/worker` starts without errors. No business logic yet — just the wiring.

Also configure Nx project targets so that `nx run-many --target=build` compiles all apps without errors.

## Acceptance criteria

- [ ] Nx monorepo initialised with `apps/web`, `apps/api`, `apps/worker` projects
- [ ] `libs/ai`, `libs/types`, `libs/utils`, `libs/ui` library placeholders exist with barrel exports
- [ ] `tsconfig.base.json` path aliases resolve across all apps and libs
- [ ] ESLint + Prettier configured and passing on all files
- [ ] `.env.example` documents every required environment variable (DB URL, Redis URL, Clerk keys, Gemini API key, GitHub webhook secret)
- [ ] `docker-compose.yml` spins up Postgres and Redis locally
- [ ] `apps/api` responds `200` to `GET /api/health`
- [ ] `apps/web` renders a blank page at `/` without build errors
- [ ] `apps/worker` starts and logs "Worker ready" without errors
- [ ] `nx run-many --target=lint` passes with zero errors

## Blocked by

None — can start immediately.

## Status
Pending
