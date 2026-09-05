# DealFlow360

DealFlow360 is an enterprise-grade Configure, Price, Quote (CPQ), Deal Governance, and Revenue Operations platform designed to support high-velocity enterprise sales, complex discounting approvals, subscription lifecycle, inventory fulfillment, and multi-tier revenue analytics.

---

## 🏗️ Repository Architecture

This repository is structured as an npm workspaces monorepo separating the frontend React client and the backend Node.js / Express server while enabling independent development cycles across feature teams.

```text
DealFlow360/
├── client/                 # React 19 + TypeScript + Vite frontend SPA
│   ├── public/
│   ├── src/
│   │   ├── app/            # App layout, providers, global routing
│   │   ├── components/     # Reusable design system & UI components
│   │   ├── features/       # 20 Domain-driven feature modules
│   │   ├── api/            # API client & HTTP transport layer
│   │   ├── styles/         # Global styling and design tokens
│   │   └── types/          # Global shared TypeScript definitions
│   └── package.json
│
├── server/                 # Node.js + Express + TypeScript + Drizzle ORM
│   ├── src/
│   │   ├── common/         # Cross-cutting middleware, errors, and utils
│   │   ├── config/         # Environment & database configuration
│   │   ├── database/       # Drizzle schema, relations, migrations, seeds
│   │   ├── modules/        # 20 Domain-driven feature modules
│   │   ├── app.ts          # Express application initialization
│   │   └── server.ts       # Server runtime entrypoint
│   ├── tests/              # Unit, integration, and e2e test suites
│   └── package.json
│
├── API_DOCUMENTATION.md    # API conventions, route structure, and standards
├── ARCHITECTURE.md         # Monorepo architecture & domain breakdown
├── DATABASE_SETUP.md       # PostgreSQL & Drizzle ORM setup guide
├── CONTRIBUTING.md          # Git branching, commit conventions & PR guidelines
├── .env.example            # Environment variables reference
└── package.json            # Root workspace configuration & scripts
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: >= 15.0

### 1. Installation
Install all dependencies across root, client, and server:
```bash
npm install
```

### 2. Environment Setup
Copy the environment template files:
```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

### 3. Running in Development
Start both client and server concurrently:
```bash
npm run dev
```

Or run services individually:
```bash
# Start Vite frontend (default: http://localhost:3000)
npm run dev:client

# Start Express backend (default: http://localhost:5000)
npm run dev:server
```

---

## 🛠️ Root Orchestration Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs client and server concurrently in development mode |
| `npm run dev:client` | Starts Vite dev server with Hot Module Replacement (HMR) |
| `npm run dev:server` | Starts Express server with TypeScript live reload |
| `npm run build` | Builds production bundles for both client and server |
| `npm run typecheck` | Runs TypeScript compiler checks across all workspaces |
| `npm run lint` | Runs ESLint analysis across client and server |
| `npm run test` | Executes test suites |

---

## 📚 Documentation Links
- [Architecture & Domain Structure](file:///e:/Codes/DealFlow360/ARCHITECTURE.md)
- [Database & Drizzle ORM Setup](file:///e:/Codes/DealFlow360/DATABASE_SETUP.md)
- [API Conventions & Documentation](file:///e:/Codes/DealFlow360/API_DOCUMENTATION.md)
- [Contributing & Team Guidelines](file:///e:/Codes/DealFlow360/CONTRIBUTING.md)
