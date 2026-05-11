# 02 — Database Schema & Supabase Setup

**Type**: AFK
**Labels**: database, infrastructure

## What to build

Configure Supabase (hosted Postgres) and apply the initial Prisma schema. Enable the `pgvector` extension on the database. Define and migrate the `Document` and `Chunk` models, including the `DocumentStatus` enum and the `vector(768)` embedding column.

The schema from the PRD (encoded below as it is the decision artifact):

```prisma
model Document {
  id        String         @id @default(uuid())
  name      String
  sourceUrl String?
  status    DocumentStatus
  chunks    Chunk[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
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
  chunkIndex Int
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}
```

A seed script should insert one sample `Document` (status `PROCESSED`) with two sample `Chunk` rows so developers can query the DB immediately without running the full ingestion pipeline.

## Acceptance criteria

- [ ] `pgvector` extension is enabled in Supabase
- [ ] Prisma migration applies cleanly against a fresh Supabase database
- [ ] `Document` table exists with all columns including `status` enum
- [ ] `Chunk` table exists with `embedding vector(768)` column and cascade-delete on `documentId`
- [ ] Seed script inserts sample data and runs without errors
- [ ] `apps/api` can connect to Supabase using the env vars from `.env.example`
- [ ] A raw SQL cosine similarity query (`ORDER BY embedding <=> $1`) returns results against seed data

## Blocked by

- `01-monorepo-infrastructure-scaffold.md`

## Status
Pending
