# DealFlow360 API Documentation & Specifications

## Overview

The DealFlow360 API is a RESTful service built with Express and TypeScript. All API endpoints follow strict naming conventions, JSON serialization standards, centralized error responses, and Role-Based Access Control (RBAC).

---

## 1. Base URL & Versioning

All API endpoints are versioned under the `/api/v1` namespace:

```text
http://localhost:5000/api/v1
```

### Health Check Endpoints
- **URL**: `GET /health` or `GET /api/v1/health`
- **Auth**: Public
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "DealFlow360 API is running",
  "data": {
    "status": "healthy",
    "service": "DealFlow360 API",
    "version": "1.0.0"
  },
  "timestamp": "2026-09-05T06:30:00.000Z"
}
```

---

## 2. Standard Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "timestamp": "2026-09-05T06:30:00.000Z"
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": {
        "_errors": ["Invalid email address"]
      }
    }
  },
  "timestamp": "2026-09-05T06:30:00.000Z"
}
```

---

## 3. Authentication & Authorization Headers

For protected endpoints, include the access token in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

---

## 4. Phase 2: Authentication Endpoints (`/api/v1/auth`)

### 4.1 Register User

Creates a new user account and assigns the default public role (`CUSTOMER`).

* **Endpoint**: `POST /api/v1/auth/register`
* **Access**: Public
* **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@enterprise.com",
  "password": "SecurePassword123!"
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "email": "jane@enterprise.com",
      "name": "Jane Doe",
      "roles": ["CUSTOMER"],
      "permissions": ["quotation:read", "billing:read"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "7a3b4f..."
  },
  "timestamp": "2026-09-05T06:30:00.000Z"
}
```
* **Error Responses**:
  * `400 Bad Request` (`VALIDATION_ERROR`): Name, email, or password fails validation rules.
  * `409 Conflict` (`CONFLICT`): A user with this email already exists.

---

### 4.2 Login

Authenticates a user and generates a new access token (15m) and refresh token (7d).

* **Endpoint**: `POST /api/v1/auth/login`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "jane@enterprise.com",
  "password": "SecurePassword123!"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "email": "jane@enterprise.com",
      "name": "Jane Doe",
      "roles": ["CUSTOMER"],
      "permissions": ["quotation:read", "billing:read"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "7a3b4f..."
  },
  "timestamp": "2026-09-05T06:30:00.000Z"
}
```
* **Error Responses**:
  * `400 Bad Request` (`VALIDATION_ERROR`): Missing email or password.
  * `401 Unauthorized` (`UNAUTHORIZED`): Invalid email or password, or inactive account.

---

### 4.3 Refresh Tokens (Token Rotation)

Rotates the refresh token (revokes the old token, saves new hashed token) and issues a new access token.

* **Endpoint**: `POST /api/v1/auth/refresh`
* **Access**: Public
* **Request Body**:
```json
{
  "refreshToken": "7a3b4f..."
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "user": {
      "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "email": "jane@enterprise.com",
      "name": "Jane Doe",
      "roles": ["CUSTOMER"],
      "permissions": ["quotation:read", "billing:read"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "8b9c1d..."
  },
  "timestamp": "2026-09-05T06:30:00.000Z"
}
```
* **Error Responses**:
  * `401 Unauthorized` (`UNAUTHORIZED`): Refresh token is invalid, expired, or already revoked.

---

### 4.4 Logout

Invalidates the active refresh token in the database.

* **Endpoint**: `POST /api/v1/auth/logout`
* **Access**: Public
* **Request Body**:
```json
{
  "refreshToken": "7a3b4f..."
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2026-09-05T06:30:00.000Z"
}
```

---

### 4.5 Get Current User (`/me`)

Retrieves the authenticated user's profile, roles, and granular permissions.

* **Endpoint**: `GET /api/v1/auth/me`
* **Access**: Protected (`requireAuth`)
* **Headers**: `Authorization: Bearer <access_token>`
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Current user profile retrieved",
  "data": {
    "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "email": "jane@enterprise.com",
    "name": "Jane Doe",
    "roles": ["CUSTOMER"],
    "permissions": ["quotation:read", "billing:read"]
  },
  "timestamp": "2026-09-05T06:30:00.000Z"
}
```
* **Error Responses**:
  * `401 Unauthorized` (`UNAUTHORIZED`): Token missing, expired (`TOKEN_EXPIRED`), or invalid (`TOKEN_INVALID`).

---

## 5. Phase 3: Customer Tiers Endpoints (`/api/v1/customer-tiers`)

Customer Tiers categorize customers for pricing, discount rules, and service agreements (e.g., Enterprise, Mid-Market, SMB).

### 5.1 List Customer Tiers
* **Endpoint**: `GET /api/v1/customer-tiers`
* **Access**: Protected (`customer_tier:read`)
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `20`): Page size
  * `search` (optional): Filter by name substring
  * `isActive` (optional, `true` | `false`): Filter by active status
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer tiers retrieved successfully",
  "data": [
    {
      "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
      "name": "Enterprise",
      "description": "High-volume tier with customized discount thresholds",
      "isActive": true,
      "createdAt": "2026-09-05T08:00:00.000Z",
      "updatedAt": "2026-09-05T08:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 5.2 Get Customer Tier by ID
* **Endpoint**: `GET /api/v1/customer-tiers/:id`
* **Access**: Protected (`customer_tier:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer tier retrieved successfully",
  "data": {
    "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "name": "Enterprise",
    "description": "High-volume tier with customized discount thresholds",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 5.3 Create Customer Tier
* **Endpoint**: `POST /api/v1/customer-tiers`
* **Access**: Protected (`customer_tier:manage`)
* **Request Body**:
```json
{
  "name": "Mid-Market",
  "description": "Medium-tier accounts",
  "isActive": true
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Customer tier created successfully",
  "data": {
    "id": "22e1b5f0-629a-4c22-9909-08a8a4b08b99",
    "name": "Mid-Market",
    "description": "Medium-tier accounts",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 5.4 Update Customer Tier
* **Endpoint**: `PATCH /api/v1/customer-tiers/:id`
* **Access**: Protected (`customer_tier:manage`)
* **Request Body**:
```json
{
  "description": "Updated tier description",
  "isActive": false
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer tier updated successfully",
  "data": {
    "id": "22e1b5f0-629a-4c22-9909-08a8a4b08b99",
    "name": "Mid-Market",
    "description": "Updated tier description",
    "isActive": false,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:05:00.000Z"
  },
  "timestamp": "2026-09-05T08:05:00.000Z"
}
```

### 5.5 Delete Customer Tier
* **Endpoint**: `DELETE /api/v1/customer-tiers/:id`
* **Access**: Protected (`customer_tier:manage`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer tier deleted successfully",
  "timestamp": "2026-09-05T08:05:00.000Z"
}
```

---

## 6. Phase 3: Product Categories Endpoints (`/api/v1/categories`)

Categories organize the product catalog into domain hierarchies (e.g. Hardware, Cloud Subscriptions, Professional Services).

### 6.1 List Categories
* **Endpoint**: `GET /api/v1/categories`
* **Access**: Protected (`category:read`)
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `20`): Page size
  * `search` (optional): Filter by category name
  * `isActive` (optional, `true` | `false`): Filter by active status
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
      "name": "Cloud Subscriptions",
      "description": "SaaS recurring licenses and bundles",
      "isActive": true,
      "createdAt": "2026-09-05T08:00:00.000Z",
      "updatedAt": "2026-09-05T08:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 6.2 Get Category by ID
* **Endpoint**: `GET /api/v1/categories/:id`
* **Access**: Protected (`category:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
    "name": "Cloud Subscriptions",
    "description": "SaaS recurring licenses and bundles",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 6.3 Create Category
* **Endpoint**: `POST /api/v1/categories`
* **Access**: Protected (`category:manage`)
* **Request Body**:
```json
{
  "name": "Hardware Appliances",
  "description": "On-premise servers and edge gateways",
  "isActive": true
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "44e1b5f0-629a-4c22-9909-08a8a4b08b22",
    "name": "Hardware Appliances",
    "description": "On-premise servers and edge gateways",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 6.4 Update Category
* **Endpoint**: `PATCH /api/v1/categories/:id`
* **Access**: Protected (`category:manage`)
* **Request Body**:
```json
{
  "description": "Updated hardware description",
  "isActive": true
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "44e1b5f0-629a-4c22-9909-08a8a4b08b22",
    "name": "Hardware Appliances",
    "description": "Updated hardware description",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:05:00.000Z"
  },
  "timestamp": "2026-09-05T08:05:00.000Z"
}
```

### 6.5 Delete Category
* **Endpoint**: `DELETE /api/v1/categories/:id`
* **Access**: Protected (`category:manage`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "timestamp": "2026-09-05T08:05:00.000Z"
}
```

---

## 7. Phase 3: Products Endpoints (`/api/v1/products`)

Products are sellable SKUs supporting `ONE_TIME`, `RECURRING`, and `SERVICE` billing models with exact monetary representation.

### 7.1 List Products
* **Endpoint**: `GET /api/v1/products`
* **Access**: Protected (`product:read`)
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `20`): Page size
  * `search` (optional): Filter by name or SKU
  * `categoryId` (optional, UUID): Filter by category
  * `productType` (optional, `ONE_TIME` | `RECURRING` | `SERVICE`): Filter by product type
  * `isActive` (optional, `true` | `false`): Filter by active status
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
      "name": "Enterprise Cloud Platform License",
      "sku": "SKU-CLOUD-ENT-01",
      "description": "Annual enterprise cloud platform seat",
      "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
      "productType": "RECURRING",
      "basePrice": "150000.00",
      "currency": "INR",
      "isActive": true,
      "createdAt": "2026-09-05T08:00:00.000Z",
      "updatedAt": "2026-09-05T08:00:00.000Z",
      "category": {
        "id": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
        "name": "Cloud Subscriptions",
        "description": "SaaS recurring licenses and bundles",
        "isActive": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 7.2 Get Product by ID
* **Endpoint**: `GET /api/v1/products/:id`
* **Access**: Protected (`product:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
    "name": "Enterprise Cloud Platform License",
    "sku": "SKU-CLOUD-ENT-01",
    "description": "Annual enterprise cloud platform seat",
    "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
    "productType": "RECURRING",
    "basePrice": "150000.00",
    "currency": "INR",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z",
    "category": {
      "id": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
      "name": "Cloud Subscriptions",
      "description": "SaaS recurring licenses and bundles",
      "isActive": true
    }
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 7.3 Create Product
* **Endpoint**: `POST /api/v1/products`
* **Access**: Protected (`product:manage`)
* **Request Body**:
```json
{
  "name": "Professional Architecture Review",
  "sku": "SKU-SRV-ARCH-01",
  "description": "Consulting package for solution architecture",
  "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
  "productType": "SERVICE",
  "basePrice": 85000.00,
  "currency": "INR",
  "isActive": true
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
    "name": "Professional Architecture Review",
    "sku": "SKU-SRV-ARCH-01",
    "description": "Consulting package for solution architecture",
    "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
    "productType": "SERVICE",
    "basePrice": "85000.00",
    "currency": "INR",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 7.4 Update Product
* **Endpoint**: `PATCH /api/v1/products/:id`
* **Access**: Protected (`product:manage`)
* **Request Body**:
```json
{
  "basePrice": 95000.00,
  "isActive": true
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
    "name": "Professional Architecture Review",
    "sku": "SKU-SRV-ARCH-01",
    "description": "Consulting package for solution architecture",
    "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
    "productType": "SERVICE",
    "basePrice": "95000.00",
    "currency": "INR",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:10:00.000Z"
  },
  "timestamp": "2026-09-05T08:10:00.000Z"
}
```

### 7.5 Delete Product
* **Endpoint**: `DELETE /api/v1/products/:id`
* **Access**: Protected (`product:manage`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "timestamp": "2026-09-05T08:10:00.000Z"
}
```

---

## 8. Phase 3: Customers Endpoints (`/api/v1/customers`)

Customers represent corporate client accounts associated with designated Customer Tiers for automated pricing calculations.

### 8.1 List Customers
* **Endpoint**: `GET /api/v1/customers`
* **Access**: Protected (`customer:read`)
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `20`): Page size
  * `search` (optional): Filter by company name, contact name, or email
  * `customerTierId` (optional, UUID): Filter by customer tier
  * `status` (optional, `ACTIVE` | `INACTIVE`): Filter by status
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "id": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
      "companyName": "Acme Global Industries",
      "contactName": "Alice Johnson",
      "email": "alice@acme.com",
      "phone": "+91-9876543210",
      "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
      "status": "ACTIVE",
      "createdAt": "2026-09-05T08:00:00.000Z",
      "updatedAt": "2026-09-05T08:00:00.000Z",
      "customerTier": {
        "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
        "name": "Enterprise",
        "description": "High-volume tier with customized discount thresholds",
        "isActive": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 8.2 Get Customer by ID
* **Endpoint**: `GET /api/v1/customers/:id`
* **Access**: Protected (`customer:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer retrieved successfully",
  "data": {
    "id": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
    "companyName": "Acme Global Industries",
    "contactName": "Alice Johnson",
    "email": "alice@acme.com",
    "phone": "+91-9876543210",
    "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "status": "ACTIVE",
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z",
    "customerTier": {
      "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
      "name": "Enterprise",
      "description": "High-volume tier with customized discount thresholds",
      "isActive": true
    }
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 8.3 Create Customer
* **Endpoint**: `POST /api/v1/customers`
* **Access**: Protected (`customer:manage`)
* **Request Body**:
```json
{
  "companyName": "TechStart Labs",
  "contactName": "Bob Smith",
  "email": "bob@techstart.io",
  "phone": "+91-9123456780",
  "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
  "status": "ACTIVE"
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "99e1b5f0-629a-4c22-9909-08a8a4b08b66",
    "companyName": "TechStart Labs",
    "contactName": "Bob Smith",
    "email": "bob@techstart.io",
    "phone": "+91-9123456780",
    "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "status": "ACTIVE",
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 8.4 Update Customer
* **Endpoint**: `PATCH /api/v1/customers/:id`
* **Access**: Protected (`customer:manage`)
* **Request Body**:
```json
{
  "contactName": "Robert Smith Jr.",
  "phone": "+91-9123456789"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer updated successfully",
  "data": {
    "id": "99e1b5f0-629a-4c22-9909-08a8a4b08b66",
    "companyName": "TechStart Labs",
    "contactName": "Robert Smith Jr.",
    "email": "bob@techstart.io",
    "phone": "+91-9123456789",
    "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "status": "ACTIVE",
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:15:00.000Z"
  },
  "timestamp": "2026-09-05T08:15:00.000Z"
}
```

### 8.5 Update Customer Status
* **Endpoint**: `PATCH /api/v1/customers/:id/status`
* **Access**: Protected (`customer:manage`)
* **Request Body**:
```json
{
  "status": "INACTIVE"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer status updated successfully",
  "data": {
    "id": "99e1b5f0-629a-4c22-9909-08a8a4b08b66",
    "companyName": "TechStart Labs",
    "contactName": "Robert Smith Jr.",
    "email": "bob@techstart.io",
    "phone": "+91-9123456789",
    "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "status": "INACTIVE",
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:15:00.000Z"
  },
  "timestamp": "2026-09-05T08:15:00.000Z"
}
```

### 8.6 Delete Customer
* **Endpoint**: `DELETE /api/v1/customers/:id`
* **Access**: Protected (`customer:manage`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer deleted successfully",
  "timestamp": "2026-09-05T08:15:00.000Z"
}
```

---

## 9. RBAC Roles & Permissions Matrix

### Roles
| Role | Code | Description |
|---|---|---|
| Administrator | `ADMIN` | Full administrative bypass and access across all modules |
| Sales Representative | `SALES_REP` | Create/edit quotations, view customers, customer tiers, categories, products, inventory |
| Sales Manager | `SALES_MANAGER` | Quote approvals, discount governance, manage customers, categories, products, pricing rules |
| Finance & Operations | `FINANCE_OPERATIONS` | Billing, payment processing, pricing rules, discount overrides, view catalog and customers |
| Customer | `CUSTOMER` | Customer portal viewing of quotes and invoices |

### Core Permissions
| Permission | Resource / Action | Assigned Default Roles |
|---|---|---|
| `user:read` | View user profiles | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `user:manage` | Manage user accounts and roles | `ADMIN` |
| `customer_tier:read` | View customer tier classifications | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `customer_tier:manage` | Create, update, and manage customer tiers | `ADMIN` |
| `category:read` | View product categories catalog | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `category:manage` | Create, update, and delete product categories | `ADMIN`, `SALES_MANAGER` |
| `product:read` | View product catalog and SKU details | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `product:manage` | Create, update, and manage products | `ADMIN`, `SALES_MANAGER` |
| `customer:read` | View customer directory and profiles | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `customer:manage` | Create, update, and manage customer accounts | `ADMIN`, `SALES_MANAGER` |
| `quotation:create` | Create quote drafts | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `quotation:read` | Read quotation details | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS`, `CUSTOMER` |
| `quotation:update` | Update quotation lines and terms | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `quotation:approve` | Approve quotation workflows | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `pricing:manage` | Configure price lists and rules | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `discount:approve` | Approve discount thresholds | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `discount:override` | Override executive discount ceilings | `ADMIN`, `FINANCE_OPERATIONS` |
| `billing:read` | View invoices and schedules | `ADMIN`, `FINANCE_OPERATIONS`, `CUSTOMER` |
| `billing:manage` | Manage invoicing and credit notes | `ADMIN`, `FINANCE_OPERATIONS` |
| `payment:process` | Process client payments | `ADMIN`, `FINANCE_OPERATIONS` |
| `inventory:read` | Check stock availability | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `fulfillment:manage` | Manage order fulfillment | `ADMIN`, `FINANCE_OPERATIONS` |
| `reports:view` | View CPQ revenue reports & telemetry | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `audit:view` | Audit trail and compliance logs | `ADMIN`, `FINANCE_OPERATIONS` |

---

## 10. Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | `400` | Input payload validation failed against Zod schema |
| `BAD_REQUEST` | `400` | Malformed request structure or invalid state transition |
| `UNAUTHORIZED` | `401` | Missing or invalid authentication credentials |
| `TOKEN_EXPIRED` | `401` | JWT access token expired |
| `TOKEN_INVALID` | `401` | JWT signature is invalid |
| `FORBIDDEN` | `403` | User lacks the required role or permission |
| `NOT_FOUND` | `404` | Target resource was not found |
| `CONFLICT` | `409` | State conflict (e.g. duplicate name/SKU, or deletion of entity with active dependencies) |
| `INTERNAL_ERROR` | `500` | Unhandled server exception |

