<div align="center">

# ⚡ AgentOS

### The Autonomous AI Agent Operating System & Distributed Orchestration Plane

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Edge Gateway](https://img.shields.io/badge/Edge%20Gateway-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Database](https://img.shields.io/badge/Database-Supabase%20pgvector-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Queue Broker](https://img.shields.io/badge/Queue-Upstash%20Redis-00E599?logo=redis&logoColor=white)](https://upstash.com/)
[![Core Kernel](https://img.shields.io/badge/Core%20Kernel-FastAPI%20%2F%20Docker-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2F%20Tailwind-61DAFB?logo=react&logoColor=black)](https://react.dev/)

<p align="center">
  <strong>AgentOS</strong> is a distributed, production-engineered platform for configuring, deploying, monitoring, and executing fleets of autonomous AI agents. Built with a Linear/Vercel-inspired dark interface, an ultra-fast edge routing plane, an asynchronous Redis queue broker, and an isolated microVM execution kernel.
</p>

</div>

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Core Workstations & Interfaces](#-core-workstations--interfaces)
  - [1. The Command Center (Telemetry & Fleet)](#1-the-command-center-telemetry--fleet)
  - [2. The Agent Forge (Prompt Studio & Config)](#2-the-agent-forge-prompt-studio--config)
  - [3. The Task Orchestrator (Queue & Kanban)](#3-the-task-orchestrator-queue--kanban)
  - [4. Cognitive Memory (pgvector Visualizer)](#4-cognitive-memory-pgvector-visualizer)
- [Distributed Infrastructure Stack](#-distributed-infrastructure-stack)
- [Data Contract & Schema Alignment](#-data-contract--schema-alignment)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Supabase Database & pgvector Setup](#1-supabase-database--pgvector-setup)
  - [2. Frontend Development Server](#2-frontend-development-server)
  - [3. Cloudflare Worker Edge Gateway](#3-cloudflare-worker-edge-gateway)
  - [4. Core Kernel Worker (Docker / Python)](#4-core-kernel-worker-docker--python)
- [Environment Variables Specification](#-environment-variables-specification)
- [Always Free Tier Topology](#-always-free-tier-topology)
- [Security, RLS & Sandboxing](#-security-rls--sandboxing)
- [CI/CD Pipeline](#-cicd-pipeline)
- [License](#-license)

---

## 🏛 System Architecture

AgentOS is architected as an event-driven, decoupled system divided into three tiers:
1. **Edge Presentation & Ingestion Layer** (React 19 Frontend + Cloudflare Worker)
2. **Asynchronous Message Broker** (Upstash Redis Free Tier)
3. **Persistent Core Kernel & Vector Store** (FastAPI MicroVM Sandbox + Supabase pgvector)

```
                                  AGENTOS ARCHITECTURE TOPOLOGY
                                  
  +-------------------------------------------------------------------------+
  |                   FRONTEND CLIENT (React 19 / Vite)                     |
  |     Command Center  •  Agent Forge  •  Task Orchestrator  •  Memory    |
  +-----------------------------------+-------------------------------------+
                  |                   ^                         ^
       HTTP POST  |                   | WebSocket               | WebSocket
       (REST API) |                   | (Tasks, Agents)         | (Telemetry)
                  v                   |                         |
  +-------------------------------+   |                         |
  | CLOUDFLARE WORKER (Edge Hono) |   |                         |
  |  • Upstash REST Rate Limiter  |   |                         |
  |  • Non-blocking Ingest (202)  |   |                         |
  |  • Edge pgvector RPC Proxy    |   |                         |
  +---------------+---------------+   |                         |
                  |                   |                         |
        LPUSH     |                   |                         |
                  v                   |                         |
  +-------------------------------+   |                         |
  |  UPSTASH REDIS MESSAGE BROKER |   |                         |
  |    Queue: agentos:tasks:queue |   |                         |
  +---------------+---------------+   |                         |
                  |                   |                         |
        BRPOP     |                   |                         |
                  v                   |                         |
  +-------------------------------+   |                         |
  |   CORE KERNEL (Python / OCI)  |   |                         |
  |  • MicroVM cgroups v2 Sandbox |   |                         |
  |  • Multi-Model Inference      |   |                         |
  |  • Incremental State Updates  |   |                         |
  +---------------+---------------+   |                         |
                  |                   |                         |
       PostgreSQL | Writes & Updates  | Realtime Broadcasts     |
                  v                   |                         |
  +-----------------------------------+-------------------------+-----------+
  |              SUPABASE POSTGRESQL + PGVECTOR + REALTIME                  |
  |  • public.tasks (Realtime Replication)                                  |
  |  • public.agents (Realtime Replication)                                 |
  |  • public.agent_memory (pgvector HNSW Cosine Index)                     |
  |  • public.system_health_metrics                                         |
  +-------------------------------------------------------------------------+
```

---

## 🖥 Core Workstations & Interfaces

### 1. The Command Center (Telemetry & Fleet)
- **Kernel Diagnostics Bento**: Live telemetry tracking CPU quotas, memory reservations (`4.20 / 16.00 GB`), API gateway latency with p95 (`42ms`) and p99 (`78ms`) percentiles.
- **Fleet State Matrix**: Real-time agent monitoring indicating current operational mode:
  - `reasoning` (thinking/planning phase)
  - `executing` (invoking external tools)
  - `waiting` (awaiting network responses)
  - `idle` (standby)
- **Throughput Analytics**: Interactive SVG timeseries visualizer depicting processed tasks and latency over `1h`, `6h`, `24h`, and `7d` windows.

### 2. The Agent Forge (Prompt Studio & Config)
- **Split-Pane Architecture**: Left pane houses agent configuration parameters; right pane hosts an interactive execution simulation sandbox.
- **Model Orchestration**: Full hyperparameter controls for **Gemini 1.5 Pro** (2M context window), **Gemini 1.5 Flash**, **Claude 3.5 Sonnet**, and **GPT-4o**.
- **Tool Permission Matrix**: Granular security toggles for `Sandboxed Bash Execution`, `pgvector Semantic Search`, `Supabase Queue Orchestration`, and `Persistent Scratchpad Memory`.

### 3. The Task Orchestrator (Queue & Kanban)
- **Dual-Mode Queue**: Instant toggle between high-density **Data Table** and interactive **Kanban Board** (`Pending`, `Processing`, `Completed`, `Failed`).
- **Real-Time Log Streaming**: Deep-dive slide-over drawer displaying raw prompt inputs, duration timers, token usage, computed USD costs, and timestamped internal execution traces.
- **Asynchronous Ingestion**: Dispatches tasks immediately, returning `202 Accepted` to eliminate frontend thread blocking.

### 4. Cognitive Memory (pgvector Visualizer)
- **2D Topology Graph**: Interactive PCA/t-SNE projected semantic cluster map with cluster hulls and cosine similarity vectors.
- **Vector Inspector**: Complete inspection drawer displaying raw chunk content, 1536-dimensional float32 vector previews, and animated cosine distance gauges (`<=>` operator).
- **Cluster Filtering**: Dynamic filtering across semantic groupings (`routing`, `security`, `database`, `kernel`).

---

## 🛠 Distributed Infrastructure Stack

| Layer | Technology | Role | Free Tier Strategy |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Motion, Lucide | Obsidian Dark UI, Realtime WebSockets | Cloudflare Pages / Vercel Hobby (Unlimited bandwidth) |
| **Edge Gateway** | Cloudflare Workers, Hono Framework | Edge API routing, auth, rate limiting | 100,000 requests/day, 0ms cold starts |
| **Queue Broker** | Upstash Redis | Asynchronous FIFO job queue | 10,000 commands/day, HTTP REST pipeline |
| **Vector Database** | Supabase (PostgreSQL 15 + `pgvector`) | Durable storage, HNSW indexing, Realtime | 500MB RAM ceiling, 2 free projects, unlimited WebSocket connections |
| **Core Kernel** | Python 3.11, FastAPI, Docker | Long-running microVM agent loops | Koyeb Free Tier (512MB RAM) or Oracle Cloud Always Free (4 ARM cores, 24GB RAM) |

---

## 📊 Data Contract & Schema Alignment

The backend database schema matches the frontend TypeScript contracts 1:1:

```typescript
// Frontend Interface (src/types/index.ts) <---> Supabase Database (backend/supabase/schema.sql)
Agent {
  id: string;                  // public.agents.id (text, PK)
  name: string;                // public.agents.name (text)
  status: AgentStatus;         // public.agents.status (agent_status enum)
  model: string;               // public.agents.model (text)
  systemPrompt: string;        // public.agents.system_prompt (text)
  tools: ToolPermission[];     // public.agents.tools (jsonb)
  tokensProcessed: number;     // public.agents.tokens_processed (bigint)
  activeTaskId?: string;       // public.agents.active_task_id (text, FK)
}

Task {
  id: string;                  // public.tasks.id (text, PK)
  agentId: string;             // public.tasks.agent_id (text, FK)
  status: TaskStatus;          // public.tasks.status (task_status enum)
  priority: TaskPriority;      // public.tasks.priority (task_priority enum)
  durationSeconds: number;     // public.tasks.duration_seconds (numeric)
  tokensUsed: number;          // public.tasks.tokens_used (integer)
  costUsd: number;             // public.tasks.cost_usd (numeric(8,6))
  logs: TaskLogEntry[];        // public.tasks.logs (jsonb array)
}

MemoryVector {
  id: string;                  // public.agent_memory.id (text, PK)
  embedding: number[];         // public.agent_memory.embedding (vector(1536))
  similarity: number;          // Computed via (1 - (embedding <=> query_embedding))
  coordinate: { x, y };        // public.agent_memory.coord_x, coord_y (numeric)
}
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── core-kernel/                 # Persistent Agent Execution Engine
│   │   ├── agent_engine.py          # AI execution loop, tool sandboxing, state updates
│   │   ├── worker.py                # Upstash Redis polling loop (BRPOP)
│   │   ├── main.py                  # FastAPI health and telemetry API
│   │   ├── requirements.txt         # Python dependencies
│   │   └── Dockerfile               # Multi-stage container definition (OCI)
│   ├── edge-gateway/                # Cloudflare Workers Edge Gateway
│   │   ├── src/
│   │   │   └── index.ts             # Hono REST endpoints, Upstash rate limiting
│   │   ├── package.json             # Worker dependencies
│   │   └── wrangler.toml            # Cloudflare deployment manifest
│   └── supabase/
│       └── schema.sql               # PostgreSQL tables, pgvector HNSW index, RLS & Realtime
├── src/                             # React 19 Frontend Application
│   ├── components/
│   │   ├── dashboard/               # Command Center workstation
│   │   ├── forge/                   # Agent Forge prompt studio & sandbox
│   │   ├── orchestrator/            # Task Orchestrator table & Kanban
│   │   ├── memory/                  # Cognitive Memory pgvector graph
│   │   └── layout/                  # Glassmorphic Sidebar & Header
│   ├── lib/
│   │   ├── supabaseClient.ts        # Supabase Realtime WebSocket listener
│   │   └── utils.ts                 # Class merger utility
│   ├── store/
│   │   └── useAgentStore.ts         # Global Zustand state orchestrator
│   ├── types/
│   │   └── index.ts                 # Canonical TypeScript contracts
│   ├── App.tsx                      # Root view switcher with Motion transitions
│   └── main.tsx                     # React DOM entry point
├── .github/
│   └── workflows/
│       └── deploy.yml               # Automated CI/CD for Workers & Docker Hub
├── metadata.json                    # Application metadata manifest
├── package.json                     # Root frontend dependencies
└── tsconfig.json                    # Strict TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **Python**: v3.11 or higher (or Docker Desktop)
- **Supabase Account**: Free tier project
- **Upstash Account**: Free tier Serverless Redis instance
- **Cloudflare Account**: Workers Free tier

---

### 1. Supabase Database & pgvector Setup
1. Create a new project in the [Supabase Dashboard](https://database.new).
2. Navigate to the **SQL Editor** tab.
3. Paste the contents of `backend/supabase/schema.sql` and run the script.
4. Verify that:
   - Tables `agents`, `tasks`, `agent_memory`, and `system_health_metrics` are created.
   - `pgvector` extension and HNSW cosine index `idx_agent_memory_hnsw_cosine` are active.
   - Realtime publication `supabase_realtime` includes `tasks` and `agents`.

---

### 2. Frontend Development Server
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Set your Supabase public credentials in `.env`:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:3000`.

---

### 3. Cloudflare Worker Edge Gateway
1. Navigate to the gateway directory:
   ```bash
   cd backend/edge-gateway
   npm install
   ```
2. Authenticate Wrangler with your Cloudflare account:
   ```bash
   npx wrangler login
   ```
3. Set your production secrets in Cloudflare:
   ```bash
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put UPSTASH_REDIS_REST_URL
   npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
   npx wrangler secret put GEMINI_API_KEY
   ```
4. Start local Edge development:
   ```bash
   npm run dev
   ```
5. Deploy to global edge nodes:
   ```bash
   npm run deploy
   ```

---

### 4. Core Kernel Worker (Docker / Python)
1. Navigate to the Core Kernel directory:
   ```bash
   cd backend/core-kernel
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Set the required backend environment variables:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   export UPSTASH_REDIS_URL="rediss://default:token@instance.upstash.io:6379"
   export GEMINI_API_KEY="your-gemini-key"
   ```
4. Start the Kernel server and Redis queue worker:
   ```bash
   python main.py
   ```

#### Or Run via Docker:
```bash
docker build -t agentos-core-kernel .
docker run -p 8080:8080 \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  -e UPSTASH_REDIS_URL="rediss://default:token@instance.upstash.io:6379" \
  -e GEMINI_API_KEY="your-gemini-key" \
  agentos-core-kernel
```

---

## 🔑 Environment Variables Specification

| Variable Name | Component | Description | Example / Format |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Frontend | Public Supabase project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anonymous public client key | `eyJhbGciOi...` |
| `SUPABASE_URL` | Edge & Kernel | Supabase API connection URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY`| Edge & Kernel | Supabase Service Role Key (bypasses RLS) | `eyJhbGciOi...` |
| `UPSTASH_REDIS_REST_URL` | Edge Gateway | Upstash REST endpoint (HTTP protocol) | `https://xxxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN`| Edge Gateway | Upstash REST authentication token | `AX7...` |
| `UPSTASH_REDIS_URL` | Core Kernel | Direct TCP Redis connection string | `rediss://default:token@xxxx:6379` |
| `GEMINI_API_KEY` | Edge & Kernel | Google Gemini API key for embeddings & LLMs| `AIzaSy...` |

---

## ⚡ Always Free Tier Topology

AgentOS is deliberately engineered to remain 100% operational under **perpetual free tiers**:

1. **Cloudflare Workers (Edge Gateway)**
   - **Free Limit**: 100,000 requests / day across 300+ edge locations.
   - **Memory**: 128MB per execution.
   - **CPU Time**: 10ms (plenty for async 202 ingestion and Redis pipeline dispatch).

2. **Upstash Redis (Message Broker)**
   - **Free Limit**: 10,000 commands / day.
   - **Persistence**: Daily persistence with zero maintenance.

3. **Supabase (Storage & Realtime)**
   - **Free Limit**: 2 free databases, 500MB RAM, 5GB storage.
   - **pgvector Index Optimization**: HNSW index configured with `m = 16` and `ef_construction = 64` to maintain index footprints under 15MB.
   - **Realtime**: Unlimited concurrent WebSocket broadcasts.

4. **Koyeb or Oracle Cloud Always Free (Core Kernel)**
   - **Koyeb Free Tier**: 512MB RAM nano-instance running the Dockerized Python worker.
   - **Oracle Cloud Free Tier**: Up to 4 ARM Ampere cores and 24GB RAM running microVM containers.

---

## 🛡 Security, RLS & Sandboxing

- **Row Level Security (RLS)**: Enforced across all tables in `backend/supabase/schema.sql`. Anonymous frontend clients have read-only visibility into active tasks and agents; mutations are restricted to authenticated accounts or the backend `service_role`.
- **Edge Rate Limiter**: Upstash Redis token-bucket middleware guards `/api/v1/*` against abuse with a sliding 1-minute window (120 requests/minute per client IP).
- **MicroVM Isolation**: The Core Kernel executes within an unprivileged Linux container user (`agentos`) under `cgroups v2` resource quotas to prevent process escape.

---

## 🔄 CI/CD Pipeline

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) handles continuous integration and continuous deployment on pushes to `main`:
1. **Quality Gate**: Runs TypeScript linting and build validation.
2. **Edge Deployment**: Uses `cloudflare/wrangler-action@v3` to bundle and push the Hono Edge Gateway directly to Cloudflare Workers with zero downtime.
3. **Container Publication**: Builds multi-arch OCI images for `linux/amd64` and `linux/arm64`, and pushes them to GitHub Container Registry (`ghcr.io`).

---

## 📄 License

This project is licensed under the **MIT License**. You are free to use, modify, distribute, and integrate AgentOS into commercial and personal autonomous AI systems.
