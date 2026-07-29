# ⚡ Automiq — Workflow Automation Platform

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-FF4154?style=for-the-badge&logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**A production-grade workflow automation platform built from scratch, mirroring n8n's architecture.**

[Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Deployment](#-deployment)

</div>

---

## 📸 Screenshots

| Dashboard                                     | Workflow Canvas                                        | Executions                             |
| --------------------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| Gradient stat cards, real-time execution feed | React Flow canvas with 6 node types, node config panel | Timeline view with recursive JSON tree |

---

## ✨ Features

### 🔐 Authentication & Multi-tenancy

- **Project-scoped workspaces** — every user registers with a unique subdomain (e.g. `acme.localhost`), fully isolating their workflows, credentials and executions from other projects
- **JWT authentication** with bcrypt password hashing — stateless, secure, restart-safe
- **3-tier role system** (Admin / Editor / Viewer) enforced on every API endpoint and enforced again in the UI — viewers literally cannot see action buttons
- **Team invitations** with automatic account creation and Resend email delivery

### 🔄 Workflow Engine

- **Visual canvas editor** built with React Flow v12 — drag nodes, draw connections, configure parameters inline
- **6 built-in node types:**

  | Node      | Type      | Description                                                        |
  | --------- | --------- | ------------------------------------------------------------------ |
  | Webhook   | Trigger   | HTTP endpoint that activates a workflow on incoming requests       |
  | Schedule  | Trigger   | Cron-based scheduler using `node-cron`                             |
  | Code      | Transform | Sandboxed JavaScript execution via `worker_threads` + `vm`         |
  | If / Else | Transform | Conditional branching with AND/OR logic and 8 comparison operators |
  | Telegram  | Action    | Sends messages via Telegram Bot API                                |
  | Slack     | Action    | Posts messages to Slack channels                                   |

- **Stack-based execution engine** — `WorkflowExecute` class with `INodeExecutionData[][]` multi-output contract
- **Two execution modes:**
  - `regular` — engine runs inline in the main process (zero config)
  - `queue` — jobs enqueued to Bull/Redis, picked up by a separate worker process (horizontally scalable)
- **`={{ $json.field }}` expression resolver** for dynamic values in node parameters
- **AES-256-CBC credential encryption** — secrets never leave the server decrypted

### 📊 Observability

- Every execution stored in PostgreSQL with full `runData`, `executionOrder`, status and timestamps
- Real-time execution detail view with **collapsible JSON tree** per node
- Execution filtering by workflow, status, and search
- Auto-refresh every 5s on the executions list, every 2s while an execution is `running`

### 🎨 UI / UX

- **Dark / Light mode** with persisted preference — toggle in the sidebar, applies instantly
- **Split-screen auth pages** — branding panel with feature highlights on the left, clean form on the right
- **Gradient stat cards**, animated transitions, micro-interactions throughout
- Fully **responsive** design
- Empty states with illustrations and guided CTAs
- **Role-based UI guards** — buttons/actions hidden or disabled based on the user's project role

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT  (React + Vite)                                  │
│                                                             │
│  Zustand (auth + theme) ──► Axios (Bearer + X-Subdomain)   │
│  TanStack Query (cache)  ──► /api proxy ──► Backend         │
│  React Flow v12          ──► Workflow canvas editor         │
└─────────────────────────────────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│  MAIN PROCESS  (Express + TypeScript)                       │
│                                                             │
│  AuthMiddleware ──► ProjectMiddleware ──► Route handlers    │
│                          │                                  │
│                WorkflowExecutionService                      │
│                   │              │                          │
│          EXECUTIONS_MODE=regular │ EXECUTIONS_MODE=queue    │
│                   │              │                          │
│           WorkflowExecute    ScalingService                 │
│           (inline engine)    └──► Bull/Redis ──► WORKER    │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│  WORKER PROCESS  (queue mode only)                          │
│                                                             │
│  JobProcessor ──► Bull.process() ──► WorkflowExecute        │
│                   └──► job.progress() ──► main process      │
└─────────────────────────────────────────────────────────────┘
```

### Manual Composition Root (no DI framework)

All 7 dependency layers are wired explicitly in `src/lib/Container.ts` — no decorators, no magic, fully type-checked:

```
Layer 0: GlobalConfig
Layer 1: PrismaService (pg Pool + Prisma 7 adapter)
Layer 2: WorkflowRepository, ExecutionRepository, CredentialsRepository,
         UserRepository, ProjectRepository, ProjectMemberRepository
Layer 3: CredentialsService, AuthService, ProjectService,
         AuthMiddleware, ProjectMiddleware, EmailService, CodeSandbox, ScalingService
Layer 4: WebhookNode, ScheduleNode, CodeNode, IfNode, TelegramNode, SlackNode
Layer 5: NodeTypes (registry Map<string, INodeType>)
Layer 6: WorkflowExecutionService, ActiveWorkflowManager, SeedService, JobProcessor
Layer 7: AuthRouter, ProjectsRouter, WorkflowsRouter, WebhookRouter,
         ExecutionsRouter, CredentialsRouter
```

---

## 🛠 Tech Stack

### Backend

| Concern    | Library                         | Why                                         |
| ---------- | ------------------------------- | ------------------------------------------- |
| Language   | TypeScript 6.x                  | Full type safety across the entire codebase |
| HTTP       | Express                         | Lightweight, battle-tested                  |
| Database   | PostgreSQL 16 + `pg`            | Relational, JSONB for workflow data         |
| ORM        | Prisma 7 + `@prisma/adapter-pg` | Type-safe queries, driver adapter mode      |
| Queue      | Bull 4 + Redis                  |
| Scheduling | `node-cron`                     | Cron job lifecycle management               |
| Sandbox    | `worker_threads` + `vm`         | Isolated JS execution                       |
| Auth       | `bcrypt` + `jsonwebtoken`       | Industry-standard                           |
| Encryption | Node.js `crypto` AES-256-CBC    | Credential encryption at rest               |
| Email      | Resend                          | Transactional email for invitations         |
| CORS       | `cors`                          | Configurable origin allowlist               |

### Frontend

| Concern      | Library               | Why                                      |
| ------------ | --------------------- | ---------------------------------------- |
| Framework    | React + Vite          | Fast HMR, modern bundling                |
| Language     | TypeScript (strict)   | End-to-end type safety                   |
| Styling      | Tailwind CSS v4       | Utility-first, dark mode                 |
| Components   | shadcn/ui (New York)  | Radix UI primitives, accessible          |
| State        | Zustand + persist     | Lightweight, no boilerplate              |
| Server state | TanStack Query v5     | Caching, refetch, optimistic updates     |
| Forms        | React Hook Form + Zod | Schema validation, no re-renders         |
| HTTP         | Axios                 | Interceptors for auth + subdomain header |
| Canvas       | @xyflow/react v12     | Production-grade flow diagram            |
| Icons        | Lucide React          | Consistent icon set                      |
| Toasts       | Sonner                | Beautiful notification system            |

---

## 📁 Project Structure

```
.
├── automiq/                    # Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── GlobalConfig.ts           # All env vars in one place
│   │   ├── lib/
│   │   │   ├── Container.ts              # Composition root — wires all deps
│   │   │   ├── types.ts                  # Core interfaces (INodeType, etc.)
│   │   │   ├── auth.types.ts             # Auth types
│   │   │   ├── project.types.ts          # Project/member types
│   │   │   ├── encryption.ts             # AES-256-CBC utils
│   │   │   └── expression.ts            # ={{ }} resolver
│   │   ├── repositories/                 # DB access layer (one class per table)
│   │   ├── services/
│   │   │   ├── AuthService.ts            # register, login, JWT
│   │   │   ├── AuthMiddleware.ts         # Bearer JWT verification
│   │   │   ├── ProjectService.ts         # Project + member management
│   │   │   ├── ProjectMiddleware.ts      # Subdomain → req.project
│   │   │   ├── WorkflowExecute.ts        # Stack-based execution engine
│   │   │   ├── WorkflowExecutionService.ts # Mode dispatcher (inline/queue)
│   │   │   ├── ActiveWorkflowManager.ts  # Webhook registry + cron lifecycle
│   │   │   ├── CredentialsService.ts     # Encrypt/decrypt credentials
│   │   │   ├── EmailService.ts           # Resend invitation emails
│   │   │   └── SeedService.ts            # Demo workflow seeding
│   │   ├── node-types/                   # 6 node implementations
│   │   ├── sandbox/                      # worker_threads code sandbox
│   │   ├── scaling/                      # Bull queue + job processor
│   │   ├── routes/                       # Express routers (one per resource)
│   │   ├── server.ts                     # Main process entrypoint
│   │   └── worker.ts                     # Queue worker entrypoint
│   ├── prisma/
│   │   ├── schema.prisma                 # Full data model
│   │   ├── prisma.config.ts              # Prisma 7 config (URL lives here)
│   │   └── manual-migrate.sql            # SQL fallback migration
│   └── .env
│
└── client/                   # Frontend
    └── src/
        ├── api/                          # Axios instance + per-resource API fns
        ├── components/
        │   ├── ui/                       # shadcn/ui components
        │   └── layout/                   # Sidebar, AppLayout, PageHeader
        ├── features/
        │   ├── auth/                     # LoginPage, RegisterPage
        │   ├── dashboard/                # DashboardPage
        │   ├── workflows/                # List, Detail (React Flow), Modals
        │   ├── executions/               # List, Detail (JSON tree)
        │   ├── credentials/              # List, Create modal
        │   └── project/                  # Settings, member management
        ├── hooks/                        # useRole
        ├── routes/                       # ProtectedRoute, GuestRoute
        ├── store/                        # auth.store, theme.store (Zustand)
        └── types/                        # Shared TypeScript interfaces
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Redis 7+ (only needed for queue mode)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/automiq-workflow.git
cd automiq-workflow
```

### 2. Set up the backend

```bash
cd automiq-workflow
npm install
```

Create `.env`:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/n8nclone"

# Redis (queue mode only)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Execution
EXECUTIONS_MODE=regular   # or "queue" for distributed mode
PORT=5678

# Security
JWT_SECRET=change-this-to-a-long-random-string
ENCRYPTION_KEY=                # auto-generated if blank

# Email (optional — invites still work, email is just skipped)
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=invites@yourdomain.com

# CORS
CORS_ORIGIN=http://localhost:3000
```

Run the database migration:

```bash
# Option A — using Prisma CLI
npm run db:migrate

# Option B — using plain SQL (if Prisma can't download its binary)
psql $DATABASE_URL -f prisma/manual-migrate.sql
```

Generate the Prisma client:

```bash
npm run db:generate
```

Build and start:

```bash
npm run build
npm start

# Queue mode only — run this in a second terminal
npm run start:worker
```

The API is now running at **http://localhost:5678**

### 3. Set up the frontend

```bash
cd client
npm install
```

Create `.env.local`:

```bash
VITE_API_URL=http://localhost:5678
```

Start the dev server:

```bash
npm run dev
```

The app is now running at **http://localhost:3000**

### 4. Create your first workspace

Open **http://localhost:3000/register** and fill in:

- **Workspace name** — e.g. `My Company`
- **Subdomain** — e.g. `mycompany` (used to isolate your project)
- **Email** and **Password**

You'll be logged in automatically as the workspace **admin**.

---

## 🔑 Environment Variables

### Backend (`automiq/.env`)

| Variable            | Default                 | Description                                   |
| ------------------- | ----------------------- | --------------------------------------------- |
| `DATABASE_URL`      | —                       | PostgreSQL connection string                  |
| `REDIS_HOST`        | `127.0.0.1`             | Redis host (queue mode)                       |
| `REDIS_PORT`        | `6379`                  | Redis port (queue mode)                       |
| `EXECUTIONS_MODE`   | `regular`               | `regular` or `queue`                          |
| `PORT`              | `5678`                  | HTTP server port                              |
| `JWT_SECRET`        | `dev-secret`            | **Must be changed in production**             |
| `ENCRYPTION_KEY`    | auto                    | 64-char hex key for credential AES encryption |
| `RESEND_API_KEY`    | —                       | Resend API key for invitation emails          |
| `RESEND_FROM_EMAIL` | —                       | From address for emails                       |
| `CORS_ORIGIN`       | `http://localhost:3000` | Comma-separated list of allowed origins       |

### Frontend (`automiq/.env.local`)

| Variable       | Default                 | Description     |
| -------------- | ----------------------- | --------------- |
| `VITE_API_URL` | `http://localhost:5678` | Backend API URL |

---

## 📡 API Reference

All protected endpoints require:

```
Authorization: Bearer <token>
X-Project-Subdomain: <subdomain>
```

### Auth

| Method | Endpoint         | Auth   | Description           |
| ------ | ---------------- | ------ | --------------------- |
| `POST` | `/auth/register` | Public | Create user + project |
| `POST` | `/auth/login`    | Public | Get JWT token         |
| `GET`  | `/auth/me`       | Any    | Current user info     |

### Projects

| Method   | Endpoint                            | Role    | Description                |
| -------- | ----------------------------------- | ------- | -------------------------- |
| `GET`    | `/projects/current`                 | Viewer+ | Project info               |
| `GET`    | `/projects/current/members`         | Viewer+ | List members               |
| `POST`   | `/projects/current/members`         | Admin   | Invite member + send email |
| `DELETE` | `/projects/current/members/:userId` | Admin   | Remove member              |

### Workflows

| Method   | Endpoint                    | Role    | Description                     |
| -------- | --------------------------- | ------- | ------------------------------- |
| `GET`    | `/workflows`                | Viewer+ | List all workflows              |
| `POST`   | `/workflows`                | Editor+ | Create workflow                 |
| `GET`    | `/workflows/:id`            | Viewer+ | Get workflow                    |
| `DELETE` | `/workflows/:id`            | Admin   | Delete workflow                 |
| `POST`   | `/workflows/:id/activate`   | Editor+ | Register webhooks + start cron  |
| `POST`   | `/workflows/:id/deactivate` | Editor+ | Unregister webhooks + stop cron |
| `POST`   | `/workflows/:id/test`       | Editor+ | Manual test run                 |

### Webhooks (public)

| Method | Endpoint         | Auth | Description                     |
| ------ | ---------------- | ---- | ------------------------------- |
| `ALL`  | `/webhook/:path` | None | Trigger active webhook workflow |

### Executions

| Method | Endpoint          | Role    | Description                                |
| ------ | ----------------- | ------- | ------------------------------------------ |
| `GET`  | `/executions`     | Viewer+ | List executions (filter by `?workflowId=`) |
| `GET`  | `/executions/:id` | Viewer+ | Get execution with full run data           |

### Credentials

| Method   | Endpoint           | Role    | Description                            |
| -------- | ------------------ | ------- | -------------------------------------- |
| `GET`    | `/credentials`     | Viewer+ | List credentials (no secrets returned) |
| `POST`   | `/credentials`     | Editor+ | Create encrypted credential            |
| `DELETE` | `/credentials/:id` | Admin   | Delete credential                      |

---

## 🔒 Security

- **Passwords** hashed with bcrypt (12 rounds)
- **JWTs** signed with a configurable secret, expire after 8 hours
- **Credentials** encrypted at rest with AES-256-CBC — the raw key never leaves the server
- **Timing-safe** login — invalid email takes the same time as a bcrypt compare to prevent user enumeration
- **Project isolation** — every DB query is scoped by `projectId`; a user from project A cannot read project B's data even with a valid token
- **Webhook isolation** — registry key includes subdomain (`METHOD:subdomain:path`), so two projects can share webhook paths without collision
- **Code sandbox** — user JS runs in a `worker_thread` with a `vm` context; it cannot access the main process

---

## 🧩 Adding a New Node Type

The node system is designed for extension. To add a new node:

**1. Create the class** in `src/node-types/MyNode.ts`:

```ts
import { BaseNode } from "./BaseNode.js";
import type {
  IExecuteContext,
  INodeExecutionData,
  INodeTypeDescription,
} from "../lib/types.js";

export class MyNode extends BaseNode {
  readonly description: INodeTypeDescription = {
    name: "myNode",
    displayName: "My Node",
    group: "action",
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const items = context.getInputData();
    const result = items.map((item) => ({
      json: { ...item.json, processed: true },
    }));
    return [result];
  }
}
```

**2. Register it** in `src/lib/Container.ts`:

```ts
import { MyNode } from '../node-types/MyNode.js'

// Layer 4
this.myNode = new MyNode()

// Layer 5
this.nodeTypes = new NodeTypes(
  /* existing nodes */,
  this.myNode,
)
```

**3. Add the frontend config** in `src/features/workflows/nodes/nodeConfig.tsx`:

```ts
myNode: {
  label: 'My Node',
  icon: Star,
  color: 'text-pink-600',
  bg: 'bg-pink-50',
  ...
}
```

That's it. The execution engine picks it up automatically by the `name` string.

---

## 📄 License

MIT — feel free to use this as a reference, learning resource, or starting point for your own projects.

---

<div align="center">

Built with ❤️ to deeply understand how workflow automation works under the hood.

</div>
