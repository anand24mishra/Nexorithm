# Nexorithm

A production-grade algorithmic problem solving platform (LeetCode clone) built with modern web technologies.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Problem  │  │  Monaco  │  │   Console / Test Cases    │  │
│  │  Panel   │  │  Editor  │  │   (Verdict + Results)     │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
│  Context + useReducer | React Router DOM | DOMPurify        │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (fetch)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express + TypeScript)              │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ Controllers│→ │    Services    │→ │  Repositories    │  │
│  │ (HTTP)     │  │ (Business)     │  │ (Data Access)    │  │
│  └────────────┘  └────────────────┘  └──────────────────┘  │
│                                                              │
│  JudgeService ──→ ExecutorFactory ──→ child_process.execSync│
│  ProblemService ──→ Tier 1/2/3 Fallback Chain               │
│  AuthService ──→ bcrypt + JWT                                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               MongoDB (Mongoose ODM)                         │
│  Users │ Problems │ Submissions                              │
│  (or In-Memory Mock Repositories for dev)                    │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Monaco Editor |
| Styling | Vanilla CSS (Custom Properties / Design System) |
| State | React Context + useReducer |
| Routing | react-router-dom |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| Execution | child_process (sandboxed, with timeout) |
| External API | Vercel LeetCode API (Tier 1) + LeetCode GraphQL (Tier 2) |

## Design Patterns Used

| Pattern | Implementation | Files |
|---|---|---|
| **Factory** | `ExecutorFactory` creates language-specific executors from a `Map<Language, IExecutor>` | `src/services/executorFactory.ts` |
| **Strategy** | `IExecutor` interface with `JavascriptExecutor` and `PythonExecutor` implementations | `src/interfaces/IExecutor.ts`, `src/services/executorFactory.ts` |
| **Template Method** | `BaseExecutor.execute()` defines the algorithm skeleton (write → run → cleanup), subclasses provide `getCommand()` and `getFileExtension()` | `src/services/executorFactory.ts` |
| **Repository** | `IProblemRepository` / `ISubmissionRepository` interfaces with mock and MongoDB implementations, swappable via DI | `src/interfaces/`, `src/repositories/` |
| **Dependency Injection** | All services receive dependencies via constructor. `index.ts` wires the graph. Swap implementations via `USE_DB` env var | `src/index.ts` |
| **Service Layer** | `ProblemService`, `SubmissionService`, `AuthService`, `JudgeService` encapsulate business logic | `src/services/` |
| **Adapter** | `LeetCodeApiClient` adapts external API responses to internal `NexorithmProblem` type | `src/api/external/LeetCodeApiClient.ts` |
| **Reducer** | Frontend uses `useReducer` with typed actions for predictable state management | `Frontend/src/context/WorkspaceContext.tsx` |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Python 3 (for Python code execution)
- MongoDB (optional, for persistent storage)

### Backend

```bash
cd Backend
npm install
cp .env.example .env   # Update MONGODB_URI if using MongoDB
npm run dev             # Starts on http://localhost:8000
```

### Frontend

```bash
cd Frontend
npm install
npm run dev             # Starts on http://localhost:5173
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Backend server port |
| `MONGODB_URI` | `mongodb://localhost:27017/nexorithm` | MongoDB connection string |
| `JWT_SECRET` | `nexorithm-dev-secret...` | JWT signing secret |
| `USE_DB` | `false` | `true` = MongoDB, `false` = in-memory mock |
| `NODE_ENV` | `development` | Environment mode |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/problems` | List problems (paginated) |
| `GET` | `/api/problems/:slug` | Get problem by slug |
| `GET` | `/api/problems/daily` | Daily challenge |
| `POST` | `/api/submissions` | Submit code for execution |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |

## Project Structure

```
Nexorithm/
├── Backend/
│   └── src/
│       ├── api/external/         # LeetCode API client (Tier 1/2)
│       ├── config/               # App config + database connection
│       ├── controllers/          # HTTP request handlers
│       ├── data/                 # Seed problems (20 problems)
│       ├── errors/               # Custom error hierarchy
│       ├── interfaces/           # TypeScript interfaces (SOLID)
│       ├── middleware/           # Error handler, auth middleware
│       ├── models/               # Mongoose schemas
│       ├── repositories/         # Mock + MongoDB implementations
│       ├── routes/               # Express route definitions
│       ├── services/             # Business logic layer
│       ├── types/                # Shared enums, interfaces, DTOs
│       └── index.ts              # Entry point with DI wiring
├── Frontend/
│   └── src/
│       ├── api/                  # Backend API clients
│       ├── components/           # React components
│       │   ├── Workspace/        # 3-panel editor workspace
│       │   ├── ProblemList/      # Problem dashboard
│       │   ├── Layout/           # Header
│       │   └── common/           # VerdictBadge, Modal
│       ├── context/              # WorkspaceContext (useReducer)
│       ├── hooks/                # Custom hooks
│       ├── pages/                # Page components
│       ├── styles/               # Editor theme
│       └── types/                # Frontend TypeScript types
├── diagrams/                     # ER diagram
└── README.md
```

## Team

Built by the Nexorithm team: Anand, Anant, Rajat, Krishna, Omved.
