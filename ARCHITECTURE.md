# DealFlow360 System Architecture

## 1. Architectural Principles

DealFlow360 is built around **Domain-Driven Modular Design**, **Loose Coupling**, and **Strong Type Safety**. The platform facilitates parallel team velocity by isolating business domains into self-contained feature packages across both frontend and backend layers.

```
┌────────────────────────────────────────────────────────┐
│                   DealFlow360 Monorepo                 │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
┌───────────▼───────────┐        ┌───────────▼───────────┐
│     Client (Vite)     │        │    Server (Express)   │
│  React + TypeScript   │        │   Node + Drizzle ORM  │
├───────────────────────┤        ├───────────────────────┤
│ • App Shell / Routing │        │ • App Entry & Config  │
│ • Reusable UI/Common  │        │ • Common Middleware   │
│ • 20 Feature Modules  │  REST  │ • 20 Domain Modules   │
│ • State & API Client  │◄──────►│ • Drizzle Schema / DB │
└───────────────────────┘        └───────────────────────┘
```

---

## 2. Frontend Architecture (`client/`)

The client follows a **Feature-First Architecture** inside a modern React + TypeScript + Vite single-page application.

### Directory Breakdown

```text
client/src/
├── app/
│   ├── layouts/         # Layout shells (MainLayout, AuthLayout, Sidebar)
│   ├── providers/       # Global context providers (Theme, TanStack Query, Auth)
│   ├── routes/          # Central router definition and route composition
│   └── index.tsx        # Application container
│
├── components/
│   ├── common/          # Shared components (Spinners, ErrorBoundaries, Badges)
│   ├── ui/              # Primitive design system widgets (Buttons, Modals, Inputs)
│   └── layout/          # Page headers, navigation bars, footers
│
├── features/            # Feature modules (self-contained domain units)
│   └── [feature]/
│       ├── pages/       # Feature page entry views
│       ├── modules/     # Sub-feature components or widgets
│       ├── components/  # Feature-specific presentation components
│       ├── hooks/       # Custom React hooks (TanStack Query useQuery / useMutation)
│       ├── api/         # Feature API query/mutation functions (Axios callers)
│       ├── schemas/     # Feature validation schemas (e.g. Zod)
│       ├── types/       # Feature-specific TypeScript types
│       ├── routes.tsx   # Feature route definitions
│       └── index.ts     # Public API surface of the feature
│
├── lib/                 # Third-party wrappers and configurations
├── utils/               # Generic utility helpers (formatters, dates, math)
├── constants/           # Global client constants
├── types/               # Global TypeScript declarations
├── styles/              # Global CSS & theme tokens
├── store/               # State management stores
├── api/                 # Base HTTP client with Axios / Fetch interceptors
└── main.tsx             # DOM mount entrypoint
```

---

## 3. Backend Architecture (`server/`)

The backend follows a **Layered Domain Module Architecture** using Express, TypeScript, and Drizzle ORM.

### Directory Breakdown

```text
server/src/
├── config/              # Centralized environment, database, and app configs
│   ├── env.ts           # Type-safe environment validation
│   ├── database.ts      # Database connection parameters
│   └── app.ts           # Express server parameters
│
├── common/              # Shared infrastructure & cross-cutting concerns
│   ├── errors/          # Custom HTTP & App error classes
│   ├── middleware/      # Global middleware (error handler, request logging)
│   ├── constants/       # Global constants & enums
│   ├── types/           # Global type declarations
│   ├── utils/           # Shared utility functions
│   └── helpers/         # Domain helpers
│
├── database/            # Data access & persistence layer (Drizzle ORM)
│   ├── schema/          # Drizzle table schemas
│   ├── relations/       # Drizzle relational mappings
│   ├── db.ts            # Drizzle client instance & connection pool
│   ├── migrate.ts       # Database migration runner
│   └── seed.ts          # Database seed executor
│
├── modules/             # Business domain modules
│   └── [feature]/
│       ├── controllers/ # HTTP route handlers
│       ├── services/    # Business logic layer
│       ├── repositories/# Direct data access layer (Drizzle queries)
│       ├── routes/      # Express Router definitions
│       ├── validators/  # Request validation schemas (Zod / Joi)
│       ├── dto/         # Data Transfer Object contracts
│       ├── mappers/     # Entity-to-DTO conversion mappers
│       ├── types/       # Module TypeScript interfaces
│       ├── middleware/  # Module-specific middleware (permissions, guards)
│       ├── utils/       # Module-specific helpers
│       └── index.ts     # Public module export interface
│
├── app.ts               # Express application initialization & middleware stack
└── server.ts            # HTTP server startup & graceful shutdown
```

---

## 4. Domain Feature Modules (20 Core Domains)

Both frontend and backend structure mirror the 20 primary enterprise revenue operations domains:

1. **`auth`**: Authentication, session tokens, MFA, and SSO integration.
2. **`users`**: User identity, role assignments, and profile management.
3. **`customers`**: Accounts, contacts, hierarchy, and customer master data.
4. **`products`**: Product catalog, SKUs, product families, bundles, and attributes.
5. **`pricing`**: Price books, tier pricing, volume curves, and rate cards.
6. **`discount-governance`**: Discount thresholds, margin guardrails, and compliance rules.
7. **`quotations`**: Quote creation, revision history, line items, and PDF generation.
8. **`approvals`**: Multi-level approval chains, escalation matrices, and delegated signing.
9. **`upsell-cross-sell`**: Recommendation engines, contract expansion, and cross-sell rules.
10. **`inventory`**: Real-time stock levels, reservations, and inventory allocations.
11. **`warehouses`**: Multi-warehouse locations, bin tracking, and transfer orders.
12. **`fulfillment`**: Order picking, packaging, carrier shipment tracking, and delivery.
13. **`subscriptions`**: Recurring contracts, auto-renewals, co-terming, and mid-term amendments.
14. **`billing`**: Invoicing schedules, usage rating, and credit notes.
15. **`payments`**: Payment gateway integrations, settlement tracking, and payment intents.
16. **`customer-portal`**: Self-service quote review, signature, and payment interface.
17. **`deal-health`**: Deal margin analytics, win-rate scoring, and cycle-time velocity.
18. **`notifications`**: Real-time push, email, webhook, and in-app alerts.
19. **`audit-logs`**: Immutable security audit trails, change logs, and regulatory compliance.
20. **`reports`**: Revenue forecasting, pipeline analytics, and executive CPQ metrics.

---

## 5. Module Ownership & Encapsulation

Each module acts as a bounded context:
- **Public Surface (`index.ts`)**: Modules only expose their public contracts (routes, public services, types).
- **Encapsulation**: Internal controllers, repositories, validators, and mappers should not be directly imported by other modules.
- **Cross-module interactions**: Inter-module communication should happen through exported public service interfaces or event-driven mechanisms.
