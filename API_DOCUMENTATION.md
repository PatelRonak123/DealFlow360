# DealFlow360 API Documentation & Conventions

## Overview

The DealFlow360 API is a RESTful service built with Express and TypeScript. All API endpoints follow strict naming, serialization, pagination, and error response standards.

---

## 1. Base URL & Versioning

All API routes are versioned and mounted under the `/api/v1` namespace:

```text
http://localhost:5000/api/v1/<module-resource>
```

### Health Check Endpoint
- **URL**: `GET /health`
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-09-05T04:25:28.000Z",
  "service": "dealflow360-api",
  "version": "1.0.0"
}
```

---

## 2. Standard Response Envelope

All API endpoints must conform to consistent JSON envelopes:

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "quote_1001",
    "status": "DRAFT"
  },
  "message": "Resource retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid quotation parameters",
    "details": [
      {
        "field": "customerId",
        "message": "customerId is required"
      }
    ]
  },
  "timestamp": "2026-09-05T04:25:28.000Z"
}
```

---

## 3. Standard HTTP Status Codes

| Code | Status | Usage |
|---|---|---|
| `200` | OK | Successful GET, PUT, PATCH request |
| `201` | Created | Successful POST request creating a resource |
| `204` | No Content | Successful DELETE request |
| `400` | Bad Request | Validation errors or malformed payload |
| `401` | Unauthorized | Missing or expired authentication token |
| `403` | Forbidden | Authenticated user lacks required permissions |
| `404` | Not Found | Target resource does not exist |
| `409` | Conflict | State conflict (e.g. duplicate SKU, concurrent edit) |
| `422` | Unprocessable Entity | Business rule violation (e.g. discount exceeds limit) |
| `500` | Internal Server Error | Unhandled server or database exception |

---

## 4. Module Route Namespaces

When implementing routes, register them within their respective module routers and attach them in [`server/src/app.ts`](file:///e:/Codes/DealFlow360/server/src/app.ts):

| Domain | Route Prefix | Primary Responsibilities |
|---|---|---|
| Auth | `/api/v1/auth` | Login, logout, refresh, MFA |
| Users | `/api/v1/users` | User CRUD, roles, permissions |
| Customers | `/api/v1/customers` | Accounts, contacts, hierarchies |
| Products | `/api/v1/products` | Catalog, SKUs, attributes, bundles |
| Pricing | `/api/v1/pricing` | Price books, tier rules, rate cards |
| Discount Governance | `/api/v1/discount-governance` | Margin rules, discount caps |
| Quotations | `/api/v1/quotations` | Quotes, revisions, line items |
| Approvals | `/api/v1/approvals` | Approval requests, actions, escalations |
| Upsell & Cross-sell | `/api/v1/upsell-cross-sell` | Add-on recommendations |
| Inventory | `/api/v1/inventory` | Stock tracking, reservations |
| Warehouses | `/api/v1/warehouses` | Warehouse facilities, bins, transfers |
| Fulfillment | `/api/v1/fulfillment` | Orders, shipments, carrier tracking |
| Subscriptions | `/api/v1/subscriptions` | Contracts, renewal terms, amendments |
| Billing | `/api/v1/billing` | Invoicing schedules, credit notes |
| Payments | `/api/v1/payments` | Transactions, payment gateways |
| Customer Portal | `/api/v1/customer-portal` | External customer quote review & accept |
| Deal Health | `/api/v1/deal-health` | Margin health scores, deal telemetry |
| Notifications | `/api/v1/notifications` | In-app alerts, push, webhooks |
| Audit Logs | `/api/v1/audit-logs` | Immutable audit change records |
| Reports | `/api/v1/reports` | Pipeline analytics, CPQ metrics |
