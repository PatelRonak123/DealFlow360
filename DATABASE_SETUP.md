# Database Architecture & Setup (Drizzle ORM + PostgreSQL)

## Overview

DealFlow360 utilizes **PostgreSQL** as its primary relational datastore, with **Drizzle ORM** providing type-safe schema definitions, relational queries, and migration management.

---

## Directory Structure

```text
server/src/database/
├── schema/              # Table schemas grouped by domain
│   └── index.ts         # Schema barrel export
├── relations/           # One-to-one, one-to-many, and many-to-many relations
│   └── index.ts         # Relations barrel export
├── db.ts                # PostgreSQL connection pool & Drizzle ORM client initialization
├── migrate.ts           # Migration executor script
└── seed.ts              # Database seeder runner
```

---

## Configuration

Drizzle CLI configuration is defined in [`server/drizzle.config.ts`](file:///e:/Codes/DealFlow360/server/drizzle.config.ts):

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dealflow360',
  },
  verbose: true,
  strict: true,
});
```

---

## Database Workflow

### 1. Prerequisites
Ensure PostgreSQL is running locally or in a container:
```bash
# Example with Docker
docker run --name dealflow360-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dealflow360 -p 5432:5432 -d postgres:16-alpine
```

### 2. Environment Variables
In `server/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dealflow360
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dealflow360
DB_SSL=false
```

### 3. Generating Migrations (When Schemas are Created)
```bash
npm --prefix server run db:generate
```

### 4. Running Migrations
```bash
npm --prefix server run db:migrate
```

### 5. Launching Drizzle Studio (Database GUI)
```bash
npm --prefix server run db:studio
```

---

## Best Practices for Schema Development

1. **Keep Schemas Modular**: Put domain-specific tables in their respective schema files or domain folders, and export them via `server/src/database/schema/index.ts`.
2. **Audit Columns**: Include standard timestamps (`created_at`, `updated_at`) and audit user references (`created_by`, `updated_by`) for enterprise traceability.
3. **Foreign Key Integrity**: Always define cascading delete/update strategies explicitly.
4. **Relations**: Define bidirectional relations in `server/src/database/relations/` to enable Drizzle relational query builder syntax (`db.query.quotations.findMany(...)`).
