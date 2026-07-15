# EchoDocs 🚀

An Enterprise-grade Retrieval-Augmented Generation (RAG) Knowledge Engine built on an **Nx Monorepo** architecture. EchoDocs enables users to upload PDF and Markdown documents, automatically ingest and vectorize them using Google's high-dimensional embedding models, and chat with their documents in real-time with grounded citation footnotes.

---

## 🛠️ Stack & Technologies

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS, Lucide Icons, Glassmorphic Premium Design
- **API Server**: NestJS (v11), Express, custom JWT-based authentication
- **Background Worker**: NestJS Node worker powered by BullMQ & Redis
- **Database / ORM**: PostgreSQL with `pgvector` extension & Prisma ORM
- **AI/LLM Integrations**: 
  - Google Gemini API `gemini-embedding-001` (768-dimensional embeddings)
  - Google Gemini API `gemini-3.1-flash-lite` (Streaming SSE content generation)

---

## ⚡ Core Features

- **Asynchronous Processing**: Files are processed in the background. Uploaded documents immediately transition to a `PENDING` queue, allowing users to track progress through `PROCESSING`, `PROCESSED`, or `FAILED` states.
- **Overlapping Content Chunking**: Text extracts are parsed and sliced into ~1000-character segments with overlapping text to prevent semantic context loss at boundaries.
- **Semantic Similarity Search**: Queries are vectorized on the fly and compared to document chunks using PostgreSQL's cosine distance operator (`<=>`).
- **Grounded Citation-Backed Answers**: AI answers are strictly limited to the contexts retrieved. All answers feature interactive numbered citations highlighting matching sections and documents.
- **System FAQs Overrides**: Pre-compiled FAQ handlers match user queries against system instructions, ensuring instant system help answers.

---

## 🔄 RAG Sequence Flow

The following diagram outlines the path of document ingestion and semantic chat queries in EchoDocs:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Interface (Web)
    participant API as NestJS Web API (api)
    participant Redis as Redis (BullMQ Queue)
    participant Worker as Background Worker (worker)
    participant Gemini as Gemini API (Google)
    participant DB as PostgreSQL (pgvector)

    Note over User, API: 1. Document Upload & Ingestion
    User->>API: Upload Document (.pdf / .md)
    API->>DB: Save Document Status: PENDING
    API->>Redis: Enqueue Ingestion Job (Doc ID)
    API-->>User: Return status: PENDING
    
    Redis->>Worker: Pull Ingestion Job
    Worker->>DB: Update Status: PROCESSING
    Worker->>Worker: Parse Text (pdf-parse / fs)
    Worker->>Worker: Chunk Text into 1000-char segments
    loop For each chunk
        Worker->>Gemini: Request Embedding (gemini-embedding-001)
        Gemini-->>Worker: Return 768-dim Vector
    end
    Worker->>DB: Insert Chunks & Vector Embeddings (Transaction)
    Worker->>DB: Update Status: PROCESSED

    Note over User, API: 2. Semantic Chat Query
    User->>API: Submit Question / Chat Prompt
    API->>Gemini: Request Query Embedding
    Gemini-->>API: Return Query Vector
    API->>DB: Vector cosine distance search (<=>)
    DB-->>API: Return Top 5 closest chunks
    API->>API: Filter similarity & combine with System FAQ
    API->>API: Construct prompt with Grounding context
    API->>Gemini: Stream chat response (gemini-3.1-flash-lite)
    Gemini-->>API: Stream answer tokens (SSE)
    API-->>User: Stream SSE: Tokens + Citations
```

---

## 📸 Visual Tour & Features

### 🎨 1. Interactive Landing Page
The landing page introduces the EchoDocs Engine with a premium glassmorphic interface, featuring custom-designed glows and dynamic animations. 
* **Live Demo Playground**: Includes a mock playground where visitors can experience similarity indexing and citation grounding in real-time before signing in.
* **Responsive Layout**: Adapts smoothly to mobile and desktop screens.

![Landing Page](apps/web/public/screenshots/landing.png)

---

### 🔑 2. Secure JWT Authentication
A secure, JWT-based sign-in interface protects private dashboard routes.
* **Token Management**: Auto-refreshes login sessions using HTTP-only cookies.
* **Ready-to-Test Accounts**: Includes seeded administrative credentials for immediate access.

![Sign In Page](apps/web/public/screenshots/signin.png)

---

### 📊 3. Document Management Dashboard
This is the workspace cockpit where users upload and monitor their database assets.
* **Asynchronous Status Tracker**: Shows files moving in real-time through `PENDING` ➔ `PROCESSING` ➔ `PROCESSED` stages.
* **Workspace Statistics**: Displays the count of indexed documents, total generated chunks, and active queue runners.
* **Document Control**: Supports downloading source files or deleting them (which cascadingly removes all associated vector chunks from Postgres).

![Dashboard](apps/web/public/screenshots/dashboard.png)

---

### 🧠 4. Grounded RAG Chat Assistant
The core RAG application where users query their database in natural language.
* **Streaming SSE (Server-Sent Events)**: Answers are generated and streamed word-by-word with zero latency.
* **Source-Grounded Citations**: The AI cites its references inline. Users can expand the "Sources Grounded" section to view matching paragraphs, helping verify answers and prevent hallucinations.

![Chat Active Conversation](apps/web/public/screenshots/chat_active.png)

---

## 📁 Monorepo Folder Structure

EchoDocs is organized as a clean Nx workspace with separate app boundaries and shared libraries:

```text
EchoDocs/
├── apps/
│   ├── web/                     # Next.js Frontend Application
│   │   ├── src/app/             # Pages, private (dashboard/chat) and public routes
│   │   └── src/components/      # UI components (chat, dashboard, landing, layout)
│   ├── api/                     # NestJS Core Web API Server
│   │   ├── src/app/auth         # Custom email/password JWT-based auth
│   │   ├── src/app/docs         # Document upload, listing, and deletion
│   │   └── src/app/chat         # Citation grounded AI answering & Gemini streaming
│   └── worker/                  # NestJS Ingestion Background Worker
│       └── src/app/             # BullMQ consumer that parses and embed files
├── libs/
│   ├── ai/                      # Shared AI logic (embeddings, vector search, chunking)
│   ├── types/                   # Shared TypeScript models and type definitions
│   ├── ui/                      # Shared reusable UI elements
│   └── utils/                   # Shared utilities and configurations
├── docker-compose.yml           # Local dev services (PostgreSQL + pgvector, Redis)
├── package.json                 # Core dependencies
└── tsconfig.base.json           # Global TypeScript settings
```

---

## 🚀 Getting Started

### 1. Prerequisites
Verify you have the following installed:
- **Node.js** (v20+) or **Bun**
- **pnpm** (preferred package manager)
- **Docker & Docker Compose**

### 2. Installation
Clone this repository and install the workspace dependencies:
```bash
git clone https://github.com/rakib-siddiki/EchoDocs.git
cd EchoDocs
pnpm install
```

### 3. Spin up Infrastructure
Run local databases and Redis instances:
```bash
docker-compose up -d
```
This starts:
- **PostgreSQL** (with `pgvector` enabled) on port `5433` (maps to internal 5432)
- **Redis** on port `6379` (used for BullMQ job queue)

### 4. Configuration
Create a `.env` file at the root of the project:
```bash
cp .env.example .env
```
Provide the required keys:
- `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5433/echodocs?schema=public`
- `DIRECT_URL`: `postgresql://postgres:postgres@localhost:5433/echodocs?schema=public`
- `REDIS_URL`: `redis://localhost:6379`
- `GEMINI_API_KEY`: *Your Google Gemini API Key*

### 5. DB Migration & Seeding
Prepare the Postgres database structures and seed default roles:
```bash
# Push Prisma migrations
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma

# Run the database seed
pnpm prisma db seed
```
> [!TIP]
> The seed command initializes a default admin account:
> - **Email**: `admin@echodocs.com`
> - **Password**: `admin123`

### 6. Development Server
Run the frontend web app, the backend API, and the BullMQ worker concurrently:
```bash
pnpm dev
# or using bun
bun dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:5000](http://localhost:5000)

---

## 💻 Nx Workspace Commands

Manage and run tasks across projects in the workspace:

### Run Individual Apps
- **Web App**: `npx nx dev web`
- **API Server**: `npx nx serve api`
- **Worker**: `npx nx serve worker`

### Quality Assurance & Building
- **Build Workspace**: `npx nx run-many -t build`
- **Run All Tests**: `npx nx run-many -t test`
- **Lint Code**: `npx nx run-many -t lint`

### Project Dependency Graph
To visualize the connections and boundaries between apps and libraries:
```bash
npx nx graph
```

---

## 🔒 Security & Resiliency

- **Transactional Vector Upserts**: To maintain idempotency, the `IngestionService` runs chunk deletions and batch pgvector insertions within a single database transaction.
- **Isolated Embedding Generation**: Chunks are embedded individually outside the transaction block to avoid database connection pool locking during remote API network latency.
- **Strict Input Validation**: NestJS uses class-validator DTOs, file size limits (20MB), and file extension checks (`.pdf`, `.md`) to lock down endpoints.
