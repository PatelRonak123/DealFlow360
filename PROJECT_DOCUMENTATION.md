# DealFlow360 — Comprehensive Project Documentation

---

## 1. Executive Summary & Platform Overview

**DealFlow360** is an enterprise-grade, end-to-end B2B Sales Operations and CPQ (Configure, Price, Quote) platform designed to streamline the entire commercial lifecycle for enterprise sales organizations.

### Core Business Problems Solved
- **CPQ & Pricing Accuracy**: Eliminates manual pricing errors through real-time calculation engines factoring in volume tiers, customer loyalty tiers, product price books, and currency conversions.
- **Discount Governance**: Prevents margin erosion with automated multi-tier approval workflows (Sales Representative $\to$ Sales Manager $\to$ Finance Operations $\to$ Executive).
- **Customer Self-Service Portal**: Provides external buyers with a modern, transparent workspace to review quotations, submit discount counter-offers with commercial justifications, track order fulfillment, download invoices, and settle payments.
- **Unified Operations & Billing**: Bridges sales execution directly with inventory management, warehouse fulfillment dispatch, automated invoicing, payment reconciliation, and subscription recurring billing.
- **Deal Health & AI Recommendations**: Features real-time stall detection, discount anomaly tracking, and automated upsell/cross-sell suggestions.

---

## 2. Monorepo Architecture & Technology Stack

The project is structured as a high-performance monorepo separating client and server workspaces with shared type conventions.

```mermaid
graph TD
    subgraph Monorepo ["DealFlow360 Enterprise Monorepo"]
        subgraph Client ["Client (React 19 + TypeScript + Vite)"]
            AppRoutes["AppRoutes & Layout Shells"]
            SidebarTopBar["Sidebar & Topbar Navigation"]
            Features["22 Feature Modules (CPQ, Approvals, Customer Portal, etc.)"]
            ReactQuery["TanStack React Query Cache"]
            AxiosClient["Axios HTTP Interceptor Layer"]
        end

        subgraph Server ["Server (Node.js + Express + TypeScript)"]
            Middleware["Auth, RBAC, RateLimit, Logging Middleware"]
            Controllers["REST Controllers (26 Domain Modules)"]
            Services["Domain Business Logic Services"]
            Repos["Data Access Repositories"]
            Drizzle["Drizzle ORM Engine"]
        end

        subgraph Storage ["Persistence & External Services"]
            PostgreSQL[(PostgreSQL Relational DB)]
            PaymentGateway["Payment Processing Engine"]
        end
    end

    AppRoutes --> Features
    Features --> ReactQuery
    ReactQuery --> AxiosClient
    AxiosClient -- "REST JSON (Bearer JWT)" --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Repos
    Repos --> Drizzle
    Drizzle --> PostgreSQL
    Services -.-> PaymentGateway
```

### Technology Stack Summary

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6.4 |
| **Styling & Icons** | Vanilla CSS Tokens, TailwindCSS utility classes, Lucide React icons |
| **Client State & Caching**| TanStack Query (React Query) v5, React Context API |
| **Routing** | React Router DOM v7 |
| **Backend Runtime** | Node.js (v20+ LTS), Express.js 4.x, TypeScript |
| **Database & ORM** | PostgreSQL, Drizzle ORM, Drizzle Kit Migrations |
| **Authentication & Security** | JWT (Access & Refresh Tokens), BCrypt password hashing, Helmet, CORS, RBAC |
| **Build & Tooling** | `tsc`, Vite Build, Drizzle Kit, Prettier, ESLint |

---

## 3. User Roles & RBAC (Role-Based Access Control) Matrix

DealFlow360 enforces a 5-tier canonical role model. Every user is assigned roles and permissions that govern navigation visibility, layout controls, and backend API authorization.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            5 CANONICAL ROLES                                │
├───────────────┬─────────────────┬─────────────────┬──────────────┬──────────┤
│ Administrator │  Sales Manager  │    Sales Rep    │ Finance/Ops  │ Customer │
│   (`ADMIN`)   │(`SALES_MANAGER`)│  (`SALES_REP`)  │ (`FINANCE`)  │(`CUSTOMER`)│
└───────────────┴─────────────────┴─────────────────┴──────────────┴──────────┘
```

### Detailed RBAC Permissions Matrix

| Functional Module | Administrator | Sales Manager | Sales Representative | Finance / Ops | Customer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin Control Center** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **User & RBAC Management** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Master Rule Config** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Sales Rep Dashboard** | ✅ View | ✅ View | ✅ Full | ❌ | ❌ |
| **Sales Manager Dashboard**| ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Finance Dashboard** | ✅ Full | ❌ | ❌ | ✅ Full | ❌ |
| **Deal Pipeline & Kanban** | ✅ Full | ✅ Full | ✅ Assigned | ❌ | ❌ |
| **CPQ Quote Builder** | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ |
| **Discount Approvals** | ✅ Override | ✅ Level 1 ($\le 20\%$) | ❌ (Submit only) | ✅ Level 2 ($> 20\%$) | ❌ |
| **Fulfillment Dispatch** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Invoicing & Billing** | ✅ Full | ❌ | ❌ | ✅ Full | ❌ |
| **Customer Portal Overview**| ✅ View | ❌ | ❌ | ❌ | ✅ Full |
| **Customer Quote Review** | ✅ View | ❌ | ❌ | ❌ | ✅ Full |
| **Customer Counter-Offer**| ✅ View | ❌ | ❌ | ❌ | ✅ Full |
| **Order Confirmation** | ✅ Full | ❌ | ❌ | ❌ | ✅ Full |
| **Invoice Settlement** | ✅ Full | ❌ | ❌ | ✅ Verify | ✅ Full |

---

## 4. Complete End-to-End Business Flow & Lifecycle

The following diagram illustrates the complete deal lifecycle from initial CPQ quote formulation through fulfillment, invoicing, and customer payment.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               COMPLETE DEALFLOW360 LIFECYCLE                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

 [1. CPQ Quote Builder]
      │ Sales Rep selects Account, adds Products, sets Quantities & Line Discounts
      ▼
 [2. Pricing & Governance Engine]
      │ Evaluates Customer Tier, Volume Breaks, and Policy Thresholds
      ├───────────────────────────────┬────────────────────────────────┐
      │ Discount <= 10%               │ Discount 11% - 20%             │ Discount > 20%
      ▼                               ▼                                ▼
 [Auto-Approved]             [Sales Manager Approval]        [Finance Operations Approval]
      │                               │                                │
      └───────────────────────────────┼────────────────────────────────┘
                                      ▼
                        [3. Quotation Approved & Published]
                                      │
                                      ▼
                    [4. Customer Portal Review & Negotiation]
                                      │ Customer receives quote notification
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
                 [Counter-Offer]              [Confirm Quote]
                 • Proposed Discount %              │
                 • Commercial Justification         │
                        │                           │
                        ▼                           │
             [Re-Approval Workflow]                 │
                        │                           │
                        └─────────────┬─────────────┘
                                      ▼
                      [5. Automated Order Creation]
                                      │ Status: 'CONFIRMED' -> Generates ORD-xxxx
                                      ▼
                      [6. 5-Stage Fulfillment Pipeline]
                                      │ Placed -> Processing -> Packed -> Shipped -> Delivered
                                      ▼
                      [7. Invoicing Engine & Billing]
                                      │ Generates INV-xxxx with Tax Breakdown & Line Items
                                      ▼
                      [8. Payment Processing & Settlement]
                                      │ Customer pays via Net Banking / Card / UPI / Wire
                                      ▼
                      [9. Subscriptions & Contract Renewal]
                                      │ Auto-renews recurring licenses and cloud contracts
```

### Detailed Flow Descriptions

#### Flow 1: CPQ Quotation & Pricing Engine
1. The Sales Rep navigates to `/quotations/new` and selects an existing customer account.
2. The system queries the `customers` and `customer_tiers` module to retrieve active pricing tier discount policies.
3. As line items are added from the `products` catalog, the CPQ engine dynamically calculates:
   $$\text{Gross Amount} = \text{Unit Price} \times \text{Quantity}$$
   $$\text{Discount Amount} = \text{Gross Amount} \times \left(\frac{\text{Discount \%}}{100}\right)$$
   $$\text{Net Amount} = \text{Gross Amount} - \text{Discount Amount}$$
4. Price list rules and quantity tier thresholds are evaluated in real time.

#### Flow 2: Discount Governance & Multi-Tier Approvals
1. If the total applied discount exceeds the sales representative's discretionary limit ($>10\%$), the quote enters `PENDING_APPROVAL` status.
2. If the discount is between $11\%$ and $20\%$, a notification and task are routed to the **Sales Manager**.
3. If the discount exceeds $20\%$, a secondary mandatory approval stage is routed to **Finance Operations**.
4. Approvers can approve with conditions, request revisions, or reject with explanatory comments.

#### Flow 3: Customer Portal Negotiation
1. The external customer logs into `/customer/quotations/:id`.
2. The customer reviews line items, gross/net subtotals, tax specifications, and delivery terms.
3. If unsatisfied, the customer clicks **Counter Discount** (`/customer/quotations/:id/negotiate`), enters their proposed discount percentage, and provides commercial justifications (e.g., multi-year commitment, competitive counter-bids).
4. The system updates the quotation's negotiation timeline and triggers a re-approval workflow on the enterprise side.

#### Flow 4: Quotation Confirmation to Sales Order
1. Upon mutual agreement, the customer clicks **Confirm Quotation**.
2. The server executes a database transaction:
   - Sets Quotation status to `CONFIRMED` / `ORDERED`.
   - Generates a Sales Order entity with a unique tracking code (e.g. `ORD-8821`).
   - Allocates inventory from the designated warehouse.
   - Emits a real-time notification to the sales team and warehouse fulfillment center.

#### Flow 5: 5-Stage Fulfillment & Logistics
1. The order enters the fulfillment lifecycle tracked at `/customer/orders/:id`:
   - Stage 1: `ORDER_PLACED` — Order verified and locked.
   - Stage 2: `PROCESSING` — Warehouse picking manifest generated.
   - Stage 3: `PACKED` — Quality check passed and packaged.
   - Stage 4: `SHIPPED` — Assigned carrier tracking number (e.g., BlueDart / FedEx).
   - Stage 5: `DELIVERED` — Confirmed delivery with digital proof.

#### Flow 6: Automated Invoicing & Payment Processing
1. When the order reaches `PACKED` or `SHIPPED`, the billing module generates a tax-compliant commercial invoice (`INV-xxxx`).
2. The customer reviews invoice line items at `/customer/invoices/:id` and clicks **Pay Now**.
3. The customer selects a payment method (`UPI`, `CREDIT_CARD`, `NET_BANKING`, `BANK_TRANSFER`).
4. Upon successful transaction callback, the system records payment transaction logs, marks the invoice `PAID`, updates order payment status, and issues a payment receipt.

---

## 5. Backend Architecture & Domain Modules (`server/`)

The backend is built with a clean **Controller-Service-Repository** pattern over Express.js and TypeScript, using **Drizzle ORM** for type-safe database queries.

```text
server/src/
├── config/                  # Environment, DB, and App runtime configuration
│   ├── env.ts               # Zod-validated environment schema
│   ├── database.ts          # Database pool connection
│   └── app.ts               # Express application settings
│
├── common/                  # Cross-cutting infrastructure
│   ├── errors/              # Custom AppError, NotFoundError, UnauthorizedError, ValidationError
│   ├── middleware/          # Auth, RBAC, Error Handler, Request Logger, Rate Limiter
│   ├── utils/               # Hash utilities, Response envelopes, Date formatters
│   └── types/               # Common response types (ApiResponse<T>, PaginatedResult<T>)
│
├── database/                # Persistence Layer
│   ├── schema/              # Drizzle table schemas
│   ├── relations/           # Drizzle table relationships
│   ├── db.ts                # Drizzle client instance
│   ├── migrate.ts           # Schema migration script
│   └── seed.ts              # Database seed script
│
└── modules/                 # 26 Domain Modules
    ├── approvals/           # Multi-tier quotation discount approval workflows
    ├── audit-logs/          # Security & compliance audit trail
    ├── auth/                # JWT authentication, session tokens, refresh tokens
    ├── billing/             # Invoice generation, credit notes, tax computation
    ├── categories/          # Product category hierarchy
    ├── customer-portal/     # Customer self-service dashboard, quotes, orders, invoices, payments
    ├── customer-tiers/      # Enterprise tier discounts and credit terms
    ├── customers/           # B2B customer accounts and contact directory
    ├── deal-health/         # Deal stall detection, win probability, anomaly scoring
    ├── discount-governance/ # Master discount thresholds and approval rules
    ├── discount-rules/      # Rule engine evaluation for line-item CPQ pricing
    ├── fulfillment/         # Warehouse dispatch, packing, carrier tracking
    ├── inventory/           # Stock levels, reservations, safety stock alerts
    ├── notifications/       # In-app and system alert dispatch
    ├── payments/            # Payment gateway simulation, receipts, transaction ledger
    ├── price-lists/         # Currency-specific master price books
    ├── pricing/             # Dynamic CPQ price calculation engine
    ├── products/            # Product catalog, SKUs, specifications
    ├── quotations/          # Quote builder, revisions, PDF rendering, negotiation
    ├── rbac/                # Roles, permissions, access-control policies
    ├── recommendations/     # AI upsell and cross-sell recommender
    ├── reports/             # Revenue forecasting, quota pacing, executive BI
    ├── subscriptions/       # Recurring contracts, mid-term amendments, renewal alerts
    ├── upsell-cross-sell/   # Cross-sell rules and margin optimization
    ├── users/               # Internal employee directory & profile management
    └── warehouses/          # Logistics distribution centers and stock hubs
```

### Key Backend Domain Modules Summary

1. **`auth`**: Handles login, registration, JWT access/refresh token rotation, password hashing with bcrypt, and session hydration.
2. **`customer-portal`**: Dedicated isolated endpoints (`/api/v1/customer-portal/*`) for customer dashboard metrics, quotation review, counter-offer negotiations, order confirmation, invoice downloads, simulated payments, and subscription management.
3. **`quotations`**: Manages the complete quote lifecycle (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `NEGOTIATING`, `CONFIRMED`, `REJECTED`, `EXPIRED`), revision history, and line-item pricing.
4. **`discount-governance`**: Evaluates quote discounts against user authorization limits and routes approval requests to the appropriate tier.
5. **`fulfillment`**: Coordinates warehouse allocation, shipping label generation, courier assignment, and timeline tracking.
6. **`billing` & `payments`**: Manages commercial tax invoices, balance settlements, split payments, and financial ledger logs.

---

## 6. Frontend Architecture & Feature Modules (`client/`)

The frontend is structured using a **Feature-First Architecture** inside a modern React 19 + TypeScript + Vite single-page application.

```text
client/src/
├── app/
│   ├── layouts/             # Base Layout Shells (AuthLayout, AppLayout)
│   ├── providers/           # QueryClientProvider, AuthProvider
│   └── routes/              # Central routing definition (AppRoutes.tsx, ProtectedRoute.tsx)
│
├── components/
│   ├── common/              # Shared UI: RoleBadge, RoleGuard, StatusBadge, ErrorBoundary
│   ├── layout/              # Sidebar.tsx, Topbar.tsx
│   └── ui/                  # Button, Modal, Card, Input, Table primitives
│
├── features/                # 22 Self-Contained Domain Feature Modules
│   ├── approvals/           # Manager approvals queue, decision modal
│   ├── auth/                # Login, Signup, AuthHero, AuthContext
│   ├── billing/             # Enterprise invoice list, invoice detail view
│   ├── customer-portal/     # Dedicated customer pages, hooks, modals, timelines
│   │   ├── api/             # customerPortalApi.ts (Axios callers)
│   │   ├── components/      # ConfirmQuotationModal, PayInvoiceModal, Timelines
│   │   ├── hooks/           # useCustomerDashboard, useCustomerQuotations, etc.
│   │   ├── pages/           # Dashboard, Quotations, Orders, Invoices, Payments, etc.
│   │   └── types/           # Customer portal TypeScript models
│   ├── customers/           # B2B customer directory & account creation
│   ├── dashboard/           # Sales Rep, Manager, Finance, Admin role dashboards
│   ├── deal-health/         # Deal stall analytics, pipeline risk radar
│   ├── deals/               # Pipeline kanban board, deal stage transitions
│   ├── discount-governance/ # Rule configuration table, approval thresholds
│   ├── fulfillment/         # Logistics dispatch console, shipment tracking
│   ├── inventory/           # Stock management, low stock alerts
│   ├── notifications/       # User notification center dropdown & page
│   ├── payments/            # Payment transaction history, settlement ledger
│   ├── pricing/             # Price list manager, volume tiers
│   ├── products/            # Product catalog, product detail modal
│   ├── quotations/          # CPQ Quote Builder, quotation detail, revisions
│   ├── reports/             # Revenue forecast, rep performance charts
│   ├── subscriptions/       # Subscription plans, renewal tracker
│   ├── upsell-cross-sell/   # Product recommendation widget
│   ├── users/               # Employee administration, RBAC assignment
│   └── warehouses/          # Warehouse hubs & regional distribution centers
│
├── config/                  # Navigation configs, role labels, constants
├── lib/                     # Access control helpers (normalizeRole, hasRole, hasAnyRole)
└── api/                     # Base Axios client with JWT auto-refresh interceptors
```

### Unified Layout & Design System

- **`DashboardLayout`**: Provides the unified layout for all authenticated roles (Sales Rep, Sales Manager, Finance, Admin, and Customer), featuring:
  - **Left Sidebar (`Sidebar.tsx`)**: Displays contextual navigation links filtered by the authenticated user's role.
  - **Header Topbar (`Topbar.tsx`)**: Global search bar, real-time alert notifications dropdown, dynamic user role badge, authenticated user/customer display name, and sign-out button.
  - **Main Content Area**: Responsive container with background styling (`bg-[#f5f7ff]`) and smooth scroll handling.
- **Micro-Animations & Visual Design**:
  - Consistent color palette tailored to enterprise B2B SaaS (Indigo/Blue `#3568ed`, Slate `#17213a`, Emerald `#38a878`, Amber `#f29a4a`, Crimson `#f06b6b`).
  - Interactive hover transitions, status pill indicators, and modal slide-ins.

---

## 7. REST API Endpoint Reference

All endpoints are prefixed with `/api/v1`. Authentication requires a Bearer JWT in the `Authorization` header.

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user & return JWT tokens | Public |
| `POST` | `/auth/register` | Register a new user | Public |
| `POST` | `/auth/refresh-token` | Rotate refresh token for new access token | Public |
| `POST` | `/auth/logout` | Revoke active refresh token | Authenticated |
| `GET` | `/auth/me` | Get current authenticated user context | Authenticated |

### 2. Customer Portal (`/api/v1/customer-portal`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/customer-portal/dashboard` | Retrieve KPI metrics and recent activity | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/quotations` | List customer quotations with filters | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/quotations/:id` | Get detailed quote with line items & approval history | `CUSTOMER`, `ADMIN` |
| `POST` | `/customer-portal/quotations/:id/negotiate` | Submit discount counter-offer & commercial rationale | `CUSTOMER`, `ADMIN` |
| `POST` | `/customer-portal/quotations/:id/confirm` | Accept quotation & auto-generate Sales Order (`ORD-xxxx`) | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/orders` | List customer sales orders | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/orders/:id` | Get order detail with 5-stage fulfillment tracker | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/invoices` | List invoices and balance statuses | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/invoices/:id` | Get invoice breakdown with taxes & line items | `CUSTOMER`, `ADMIN` |
| `POST` | `/customer-portal/invoices/:id/pay` | Settle invoice with simulated payment gateway | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/payments` | List customer payment receipts & transaction logs | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/subscriptions` | List recurring subscriptions & renewal dates | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/notifications` | List customer notifications & deal alerts | `CUSTOMER`, `ADMIN` |
| `PATCH`| `/customer-portal/notifications/:id/read` | Mark a notification as read | `CUSTOMER`, `ADMIN` |
| `GET` | `/customer-portal/profile` | Get customer profile, addresses & tax details | `CUSTOMER`, `ADMIN` |
| `PATCH`| `/customer-portal/profile` | Update customer billing/shipping contact details | `CUSTOMER`, `ADMIN` |

### 3. Quotations & CPQ (`/api/v1/quotations`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/quotations` | List quotations with search & status filters | `SALES_REP`, `SALES_MANAGER`, `ADMIN` |
| `POST` | `/quotations` | Create a new CPQ quotation with line items | `SALES_REP`, `SALES_MANAGER`, `ADMIN` |
| `GET` | `/quotations/:id` | Get quotation details | `SALES_REP`, `SALES_MANAGER`, `FINANCE`, `ADMIN` |
| `PUT` | `/quotations/:id` | Update quotation lines & applied discounts | `SALES_REP`, `SALES_MANAGER`, `ADMIN` |
| `POST` | `/quotations/:id/submit` | Submit quotation into discount approval chain | `SALES_REP`, `SALES_MANAGER`, `ADMIN` |

### 4. Approvals Queue (`/api/v1/approvals`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/approvals/pending` | List pending quotations requiring approval | `SALES_MANAGER`, `FINANCE`, `ADMIN` |
| `POST` | `/approvals/:id/approve` | Approve quotation discount request | `SALES_MANAGER`, `FINANCE`, `ADMIN` |
| `POST` | `/approvals/:id/reject` | Reject discount request with comments | `SALES_MANAGER`, `FINANCE`, `ADMIN` |

---

## 8. Database Schema Blueprint (PostgreSQL & Drizzle ORM)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               RELATIONAL SCHEMA MAP                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘

 users ───────< user_roles >─────── roles ───────< role_permissions >─────── permissions
   │
   ├───────< quotations ───────< quotation_items
   │             │
   │             ├───────< quotation_approvals
   │             ├───────< negotiation_history
   │             │
   │             └─────── orders ───────< order_items
   │                        │
   │                        ├───────< fulfillment_stages
   │                        └─────── invoices ───────< payments
   │
   └───────< customers ───────< subscriptions
                 │
                 └─────── customer_tiers
```

### Core Database Tables

1. **`users`**: User identity records (`id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`).
2. **`roles` & `permissions`**: Canonical RBAC tables with many-to-many join mappings.
3. **`customers`**: B2B customer accounts (`company_name`, `contact_name`, `email`, `phone`, `tier_id`, `billing_address`, `shipping_address`, `tax_id`).
4. **`products`**: Product catalog (`name`, `sku`, `base_price`, `currency`, `category_id`, `is_active`).
5. **`quotations`**: Master quote entity (`quotation_number`, `customer_id`, `user_id`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `expiry_date`).
6. **`quotation_items`**: Line items with quantity, unit price, applied discount %, and net total.
7. **`quotation_approvals`**: Multi-tier approval logs (`quotation_id`, `level`, `approver_id`, `status`, `comments`, `decided_at`).
8. **`orders`**: Confirmed sales orders (`order_number`, `quotation_id`, `customer_id`, `fulfillment_status`, `payment_status`, `total_amount`).
9. **`invoices`**: Commercial invoices (`invoice_number`, `order_id`, `customer_id`, `amount`, `due_date`, `status`).
10. **`payments`**: Payment transaction receipts (`invoice_id`, `amount`, `payment_method`, `transaction_ref`, `status`).

---

## 9. Developer Setup & Local Execution Guide

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v15.x` or higher (optional if running mock persistent store)

### Step 1: Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/PatelRonak123/DealFlow360.git
cd DealFlow360

# Install root dependencies
npm install

# Install client and server dependencies
npm --prefix client install
npm --prefix server install
```

### Step 2: Configure Environment Variables
Create `.env` files in both `server/` and `client/` directories:

**Server `.env` (`server/.env`)**:
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dealflow360
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

**Client `.env` (`client/.env`)**:
```ini
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Step 3: Database Migration & Seeding (Optional)
```bash
npm --prefix server run db:migrate
npm --prefix server run db:seed
```

### Step 4: Run Development Servers
```bash
# Start backend server (starts on http://localhost:5000)
npm --prefix server run dev

# Start frontend Vite client (starts on http://localhost:3000)
npm --prefix client run dev
```

### Step 5: Typecheck & Production Build Verification
```bash
# Typecheck client & server
npm --prefix client run typecheck
npm --prefix server run typecheck

# Build client for production
npm --prefix client run build
```

---

## 10. Summary & Quality Standards

- **Type Safety**: 100% TypeScript coverage across all frontend feature packages and backend modules. Zero `any` leaks.
- **Architectural Separation**: Strict isolation between external customer interactions and internal enterprise operations.
- **Unified User Experience**: Cohesive dashboard layout, responsive sidebar navigation, dynamic role recognition, and clear loading/error states.
