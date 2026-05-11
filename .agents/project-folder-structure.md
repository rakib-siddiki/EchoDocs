echodocs/
│
├── apps/
│   ├── web/                      # Next.js frontend
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (dashboard)/
│   │       │   ├── upload/
│   │       │   ├── chat/
│   │       │   └── layout.tsx
│   │       ├── components/
│   │       ├── hooks/
│   │       └── lib/
│   │
│   ├── api/                      # NestJS backend
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── modules/
│   │       │   ├── docs/
│   │       │   ├── chat/
│   │       │   ├── ingestion/
│   │       │   ├── auth/
│   │       │   └── webhooks/
│   │       └── common/
│   │           ├── guards/
│   │           ├── interceptors/
│   │           └── decorators/
│   │
│   ├── worker/                   # BullMQ background worker
│   │   └── src/
│   │       ├── processors/
│   │       │   └── ingestion.processor.ts
│   │       ├── queues/
│   │       └── main.ts
│
├── libs/
│   ├── ui/                 # Shared UI components (shadcn)
│   ├── config/             # Shared configs
│   ├── types/              # Shared types
│   ├── utils/              # Shared helpers
│   └── ai/                 # AI / RAG logic (important)
│
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── ingestion.md
│   ├── rag-flow.md
│   └── roadmap.md
│
├── infra/
│   ├── docker/
│   └── scripts/
│
├── nx.json
├── package.json
├── tsconfig.base.json
├── .env.example
└── README.md