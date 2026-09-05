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

## 9. Phase 4: Price Lists Endpoints (`/api/v1/price-lists`)

Price Lists define custom pricing models per product per currency, supporting active default list management.

### 9.1 List Price Lists
* **Endpoint**: `GET /api/v1/price-lists`
* **Access**: Protected (`price_list:read`)
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `20`): Page size
  * `search` (optional): Filter by name substring
  * `currency` (optional): Filter by currency code (e.g. `INR`, `USD`)
  * `isDefault` (optional, `true` | `false`): Filter by default status
  * `isActive` (optional, `true` | `false`): Filter by active status
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Price lists retrieved successfully",
  "data": [
    {
      "id": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
      "name": "Standard Commercial Price List",
      "description": "Default direct sales catalog",
      "currency": "INR",
      "isDefault": true,
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

### 9.2 Get Price List by ID
* **Endpoint**: `GET /api/v1/price-lists/:id`
* **Access**: Protected (`price_list:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Price list retrieved successfully",
  "data": {
    "id": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
    "name": "Standard Commercial Price List",
    "description": "Default direct sales catalog",
    "currency": "INR",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 9.3 Create Price List
* **Endpoint**: `POST /api/v1/price-lists`
* **Access**: Protected (`price_list:manage`)
* **Request Body**:
```json
{
  "name": "Enterprise Channel Price List",
  "description": "Special pricing for certified tier partners",
  "currency": "INR",
  "isDefault": false,
  "isActive": true
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Price list created successfully",
  "data": {
    "id": "22e1b5f0-629a-4c22-9909-08a8a4b08b02",
    "name": "Enterprise Channel Price List",
    "description": "Special pricing for certified tier partners",
    "currency": "INR",
    "isDefault": false,
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 9.4 Update Price List
* **Endpoint**: `PATCH /api/v1/price-lists/:id`
* **Access**: Protected (`price_list:manage`)
* **Request Body**:
```json
{
  "isDefault": true
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Price list updated successfully",
  "data": {
    "id": "22e1b5f0-629a-4c22-9909-08a8a4b08b02",
    "name": "Enterprise Channel Price List",
    "description": "Special pricing for certified tier partners",
    "currency": "INR",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:10:00.000Z"
  },
  "timestamp": "2026-09-05T08:10:00.000Z"
}
```

### 9.5 Delete Price List
* **Endpoint**: `DELETE /api/v1/price-lists/:id`
* **Access**: Protected (`price_list:manage`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Price list deleted successfully",
  "timestamp": "2026-09-05T08:10:00.000Z"
}
```

---

### 9.6 List Price List Items
* **Endpoint**: `GET /api/v1/price-lists/:priceListId/items`
* **Access**: Protected (`price_list:read`)
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `50`): Page size
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Price list items retrieved successfully",
  "data": [
    {
      "id": "33e1b5f0-629a-4c22-9909-08a8a4b08b03",
      "priceListId": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
      "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
      "price": "135000.00",
      "createdAt": "2026-09-05T08:00:00.000Z",
      "updatedAt": "2026-09-05T08:00:00.000Z",
      "product": {
        "id": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
        "name": "Enterprise Cloud Platform License",
        "sku": "SKU-CLOUD-ENT-01",
        "basePrice": "150000.00",
        "currency": "INR",
        "isActive": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 9.7 Add Product Price to Price List
* **Endpoint**: `POST /api/v1/price-lists/:priceListId/items`
* **Access**: Protected (`price_list:manage`)
* **Request Body**:
```json
{
  "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
  "price": 135000.00
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Product price added to price list successfully",
  "data": {
    "id": "33e1b5f0-629a-4c22-9909-08a8a4b08b03",
    "priceListId": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
    "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
    "price": "135000.00",
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 9.8 Update Product Price in Price List
* **Endpoint**: `PATCH /api/v1/price-lists/:priceListId/items/:itemId`
* **Access**: Protected (`price_list:manage`)
* **Request Body**:
```json
{
  "price": 128000.00
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product price updated successfully",
  "data": {
    "id": "33e1b5f0-629a-4c22-9909-08a8a4b08b03",
    "priceListId": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
    "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
    "price": "128000.00",
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:15:00.000Z"
  },
  "timestamp": "2026-09-05T08:15:00.000Z"
}
```

### 9.9 Delete Product Price from Price List
* **Endpoint**: `DELETE /api/v1/price-lists/:priceListId/items/:itemId`
* **Access**: Protected (`price_list:manage`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product price removed from price list successfully",
  "timestamp": "2026-09-05T08:15:00.000Z"
}
```

---

## 10. Phase 4: Discount Rules Endpoints (`/api/v1/discount-rules`)

Discount Rules manage ceiling discount percentages (0–100%) per Customer Tier and Product Category.

### 10.1 List Customer Tier Discount Rules
* **Endpoint**: `GET /api/v1/discount-rules/customer-tiers`
* **Access**: Protected (`discount_rule:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer tier discount rules retrieved successfully",
  "data": [
    {
      "id": "44e1b5f0-629a-4c22-9909-08a8a4b08b04",
      "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
      "maxDiscountPercent": "15.00",
      "isActive": true,
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

### 10.2 Create Customer Tier Discount Rule
* **Endpoint**: `POST /api/v1/discount-rules/customer-tiers`
* **Access**: Protected (`discount_rule:manage`)
* **Request Body**:
```json
{
  "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
  "maxDiscountPercent": 15.0
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Customer tier discount rule created successfully",
  "data": {
    "id": "44e1b5f0-629a-4c22-9909-08a8a4b08b04",
    "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "maxDiscountPercent": "15.00",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 10.3 Update Customer Tier Discount Rule
* **Endpoint**: `PATCH /api/v1/discount-rules/customer-tiers/:id`
* **Access**: Protected (`discount_rule:manage`)
* **Request Body**:
```json
{
  "maxDiscountPercent": 18.0
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer tier discount rule updated successfully",
  "data": {
    "id": "44e1b5f0-629a-4c22-9909-08a8a4b08b04",
    "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "maxDiscountPercent": "18.00",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:20:00.000Z"
  },
  "timestamp": "2026-09-05T08:20:00.000Z"
}
```

### 10.4 Delete Customer Tier Discount Rule
* **Endpoint**: `DELETE /api/v1/discount-rules/customer-tiers/:id`
* **Access**: Protected (`discount_rule:manage`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Customer tier discount rule deleted successfully",
  "timestamp": "2026-09-05T08:20:00.000Z"
}
```

---

### 10.5 List Category Discount Rules
* **Endpoint**: `GET /api/v1/discount-rules/categories`
* **Access**: Protected (`discount_rule:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category discount rules retrieved successfully",
  "data": [
    {
      "id": "55e1b5f0-629a-4c22-9909-08a8a4b08b05",
      "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
      "maxDiscountPercent": "10.00",
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

### 10.6 Create Category Discount Rule
* **Endpoint**: `POST /api/v1/discount-rules/categories`
* **Access**: Protected (`discount_rule:manage`)
* **Request Body**:
```json
{
  "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
  "maxDiscountPercent": 10.0
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Category discount rule created successfully",
  "data": {
    "id": "55e1b5f0-629a-4c22-9909-08a8a4b08b05",
    "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
    "maxDiscountPercent": "10.00",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z"
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 10.7 Update Category Discount Rule
* **Endpoint**: `PATCH /api/v1/discount-rules/categories/:id`
* **Access**: Protected (`discount_rule:manage`)
* **Request Body**:
```json
{
  "maxDiscountPercent": 12.5
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category discount rule updated successfully",
  "data": {
    "id": "55e1b5f0-629a-4c22-9909-08a8a4b08b05",
    "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
    "maxDiscountPercent": "12.50",
    "isActive": true,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:25:00.000Z"
  },
  "timestamp": "2026-09-05T08:25:00.000Z"
}
```

### 10.8 Delete Category Discount Rule
* **Endpoint**: `DELETE /api/v1/discount-rules/categories/:id`
* **Access**: Protected (`discount_rule:manage`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category discount rule deleted successfully",
  "timestamp": "2026-09-05T08:25:00.000Z"
}
```

### 10.9 Resolve Effective Discount Limit
* **Endpoint**: `GET /api/v1/discount-rules/resolve`
* **Access**: Protected (`discount_rule:read`)
* **Query Parameters**:
  * `customerTierId` (optional, UUID): Customer tier ID
  * `categoryId` (optional, UUID): Product category ID
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Effective discount limit resolved successfully",
  "data": {
    "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "customerTierName": "Enterprise",
    "tierLimit": 15,
    "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
    "categoryName": "Cloud Subscriptions",
    "categoryLimit": 10,
    "effectiveLimit": 10
  },
  "timestamp": "2026-09-05T08:30:00.000Z"
}
```

---

## 11. Phase 4: Pricing Resolution Endpoint (`/api/v1/pricing/resolve`)

Resolves the effective unit price for a given product and optional price list with automatic base price fallback.

* **Endpoint**: `GET /api/v1/pricing/resolve`
* **Access**: Protected (`price_list:read`)
* **Query Parameters**:
  * `productId` (required, UUID): Target product ID
  * `priceListId` (optional, UUID): Specific price list ID
  * `currency` (optional): Currency code (default: product's currency)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product price resolved successfully",
  "data": {
    "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
    "productName": "Enterprise Cloud Platform License",
    "sku": "SKU-CLOUD-ENT-01",
    "basePrice": "150000.00",
    "effectivePrice": "135000.00",
    "priceListId": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
    "priceListName": "Standard Commercial Price List",
    "priceSource": "PRICE_LIST",
    "currency": "INR"
  },
  "timestamp": "2026-09-05T08:30:00.000Z"
}
```

---

## 12. Phase 5: Quotation Management Endpoints (`/api/v1/quotations`)

The Quotations module manages B2B sales quotes, monotonic sequence-based quote numbering (`QT-000001`), historical product and pricing snapshots, line item financial calculations, status transitions (`DRAFT` → `SENT` / `CANCELLED` / `EXPIRED`), and ownership enforcement.

### 12.1 List Quotations
* **Endpoint**: `GET /api/v1/quotations`
* **Access**: Protected (`quotation:read`)
* **Note**: Sales representatives (`SALES_REP`) automatically see only their own draft quotations alongside non-draft quotations. Admins and Sales Managers see all quotations.
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `20`): Page size
  * `search` (optional): Filter by quotation number or customer company name
  * `customerId` (optional, UUID): Filter by customer ID
  * `status` (optional, `DRAFT` | `SENT` | `CANCELLED` | `EXPIRED`): Filter by quotation status
  * `createdById` (optional, UUID): Filter by sales rep creator
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotations retrieved successfully",
  "data": [
    {
      "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "quotationNumber": "QT-000001",
      "customerId": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
      "priceListId": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
      "createdById": "11e1b5f0-629a-4c22-9909-08a8a4b08b00",
      "status": "DRAFT",
      "subtotalAmount": "270000.00",
      "discountAmount": "27000.00",
      "totalAmount": "243000.00",
      "currency": "INR",
      "validUntil": "2026-10-05T00:00:00.000Z",
      "notes": "Annual enterprise contract draft",
      "termsAndConditions": "Net 30 days payment terms.",
      "sentAt": null,
      "cancelledAt": null,
      "cancellationReason": null,
      "createdAt": "2026-09-05T08:00:00.000Z",
      "updatedAt": "2026-09-05T08:00:00.000Z",
      "customer": {
        "id": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
        "companyName": "Acme Global Industries",
        "email": "alice@acme.com"
      },
      "createdBy": {
        "id": "11e1b5f0-629a-4c22-9909-08a8a4b08b00",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.rep@dealflow360.com"
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

### 12.2 Get Quotation by ID
* **Endpoint**: `GET /api/v1/quotations/:id`
* **Access**: Protected (`quotation:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation retrieved successfully",
  "data": {
    "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "quotationNumber": "QT-000001",
    "customerId": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
    "priceListId": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
    "createdById": "11e1b5f0-629a-4c22-9909-08a8a4b08b00",
    "status": "DRAFT",
    "subtotalAmount": "270000.00",
    "discountAmount": "27000.00",
    "totalAmount": "243000.00",
    "currency": "INR",
    "validUntil": "2026-10-05T00:00:00.000Z",
    "notes": "Annual enterprise contract draft",
    "termsAndConditions": "Net 30 days payment terms.",
    "sentAt": null,
    "cancelledAt": null,
    "cancellationReason": null,
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z",
    "customer": {
      "id": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
      "companyName": "Acme Global Industries",
      "email": "alice@acme.com"
    },
    "createdBy": {
      "id": "11e1b5f0-629a-4c22-9909-08a8a4b08b00",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.rep@dealflow360.com"
    },
    "items": [
      {
        "id": "99e1b5f0-629a-4c22-9909-08a8a4b08b99",
        "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
        "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
        "productNameSnapshot": "Enterprise Cloud Platform License",
        "skuSnapshot": "SKU-CLOUD-ENT-01",
        "quantity": 2,
        "unitPrice": "135000.00",
        "grossAmount": "270000.00",
        "discountPercent": "10.00",
        "discountAmount": "27000.00",
        "netAmount": "243000.00",
        "lineNumber": 1,
        "createdAt": "2026-09-05T08:00:00.000Z",
        "updatedAt": "2026-09-05T08:00:00.000Z"
      }
    ]
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 12.3 Create Quotation
* **Endpoint**: `POST /api/v1/quotations`
* **Access**: Protected (`quotation:create`)
* **Request Body**:
```json
{
  "customerId": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
  "priceListId": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
  "currency": "INR",
  "validUntil": "2026-10-05T00:00:00.000Z",
  "notes": "Annual enterprise contract draft",
  "termsAndConditions": "Net 30 days payment terms.",
  "items": [
    {
      "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
      "quantity": 2,
      "discountPercent": 10.0
    }
  ]
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Quotation created successfully",
  "data": {
    "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "quotationNumber": "QT-000001",
    "customerId": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
    "priceListId": "11e1b5f0-629a-4c22-9909-08a8a4b08b01",
    "createdById": "11e1b5f0-629a-4c22-9909-08a8a4b08b00",
    "status": "DRAFT",
    "subtotalAmount": "270000.00",
    "discountAmount": "27000.00",
    "totalAmount": "243000.00",
    "currency": "INR",
    "validUntil": "2026-10-05T00:00:00.000Z",
    "notes": "Annual enterprise contract draft",
    "termsAndConditions": "Net 30 days payment terms.",
    "createdAt": "2026-09-05T08:00:00.000Z",
    "updatedAt": "2026-09-05T08:00:00.000Z",
    "items": [
      {
        "id": "99e1b5f0-629a-4c22-9909-08a8a4b08b99",
        "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
        "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
        "productNameSnapshot": "Enterprise Cloud Platform License",
        "skuSnapshot": "SKU-CLOUD-ENT-01",
        "quantity": 2,
        "unitPrice": "135000.00",
        "grossAmount": "270000.00",
        "discountPercent": "10.00",
        "discountAmount": "27000.00",
        "netAmount": "243000.00",
        "lineNumber": 1,
        "createdAt": "2026-09-05T08:00:00.000Z",
        "updatedAt": "2026-09-05T08:00:00.000Z"
      }
    ]
  },
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

### 12.4 Update Quotation Header
* **Endpoint**: `PATCH /api/v1/quotations/:id`
* **Access**: Protected (`quotation:update`)
* **Constraint**: Quotation must be in `DRAFT` status.
* **Request Body**:
```json
{
  "notes": "Updated negotiation notes",
  "termsAndConditions": "Net 45 days payment terms."
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation updated successfully",
  "data": {
    "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "notes": "Updated negotiation notes",
    "termsAndConditions": "Net 45 days payment terms.",
    "updatedAt": "2026-09-05T08:10:00.000Z"
  },
  "timestamp": "2026-09-05T08:10:00.000Z"
}
```

### 12.5 Update Quotation Status
* **Endpoint**: `PATCH /api/v1/quotations/:id/status`
* **Access**: Protected (`quotation:update`)
* **Request Body**:
```json
{
  "status": "EXPIRED"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation status updated successfully",
  "data": {
    "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "status": "EXPIRED",
    "updatedAt": "2026-09-05T08:15:00.000Z"
  },
  "timestamp": "2026-09-05T08:15:00.000Z"
}
```

### 12.6 Send Quotation
* **Endpoint**: `POST /api/v1/quotations/:id/send`
* **Access**: Protected (`quotation:send`)
* **Constraint**: Quotation must be in `DRAFT` status and must contain at least 1 line item.
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation sent to customer successfully",
  "data": {
    "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "status": "SENT",
    "sentAt": "2026-09-05T08:20:00.000Z",
    "updatedAt": "2026-09-05T08:20:00.000Z"
  },
  "timestamp": "2026-09-05T08:20:00.000Z"
}
```

### 12.7 Cancel Quotation
* **Endpoint**: `POST /api/v1/quotations/:id/cancel`
* **Access**: Protected (`quotation:update`)
* **Constraint**: Cannot cancel an already `CANCELLED` quotation.
* **Request Body**:
```json
{
  "reason": "Customer opted for different delivery schedule"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation cancelled successfully",
  "data": {
    "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "status": "CANCELLED",
    "cancelledAt": "2026-09-05T08:25:00.000Z",
    "cancellationReason": "Customer opted for different delivery schedule",
    "updatedAt": "2026-09-05T08:25:00.000Z"
  },
  "timestamp": "2026-09-05T08:25:00.000Z"
}
```

### 12.8 Delete Quotation
* **Endpoint**: `DELETE /api/v1/quotations/:id`
* **Access**: Protected (`quotation:delete`)
* **Constraint**: Only `DRAFT` quotations may be deleted.
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation deleted successfully",
  "timestamp": "2026-09-05T08:30:00.000Z"
}
```

---

### 12.9 Add Quotation Line Item
* **Endpoint**: `POST /api/v1/quotations/:id/items`
* **Access**: Protected (`quotation:update`)
* **Constraint**: Quotation must be in `DRAFT` status. Automatically recalculates quotation header subtotal, discount, and total amounts.
* **Request Body**:
```json
{
  "productId": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
  "quantity": 1,
  "discountPercent": 5.0
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Quotation item added successfully",
  "data": {
    "id": "aa11b5f0-629a-4c22-9909-08a8a4b08b01",
    "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "productId": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
    "productNameSnapshot": "Professional Architecture Review",
    "skuSnapshot": "SKU-SRV-ARCH-01",
    "quantity": 1,
    "unitPrice": "95000.00",
    "grossAmount": "95000.00",
    "discountPercent": "5.00",
    "discountAmount": "4750.00",
    "netAmount": "90250.00",
    "lineNumber": 2,
    "createdAt": "2026-09-05T08:35:00.000Z",
    "updatedAt": "2026-09-05T08:35:00.000Z"
  },
  "timestamp": "2026-09-05T08:35:00.000Z"
}
```

### 12.10 Update Quotation Line Item
* **Endpoint**: `PATCH /api/v1/quotations/:id/items/:itemId`
* **Access**: Protected (`quotation:update`)
* **Constraint**: Quotation must be in `DRAFT` status.
* **Request Body**:
```json
{
  "quantity": 3,
  "discountPercent": 8.0
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation item updated successfully",
  "data": {
    "id": "aa11b5f0-629a-4c22-9909-08a8a4b08b01",
    "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "productId": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
    "quantity": 3,
    "unitPrice": "95000.00",
    "grossAmount": "285000.00",
    "discountPercent": "8.00",
    "discountAmount": "22800.00",
    "netAmount": "262200.00",
    "updatedAt": "2026-09-05T08:40:00.000Z"
  },
  "timestamp": "2026-09-05T08:40:00.000Z"
}
```

### 12.11 Delete Quotation Line Item
* **Endpoint**: `DELETE /api/v1/quotations/:id/items/:itemId`
* **Access**: Protected (`quotation:update`)
* **Constraint**: Quotation must be in `DRAFT` status.
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation item deleted successfully",
  "timestamp": "2026-09-05T08:40:00.000Z"
}
```

---

## 13. Phase 6: Discount Governance & Approval Engine Endpoints

Phase 6 implements automated discount evaluation against tier and category discount ceilings, deterministic blended risk scoring, multi-tier approvals (Manager + Finance), quotation submission, and workflow invalidation on commercial line mutations.

### 13.1 Submit Quotation for Approval
* **Endpoint**: `POST /api/v1/quotations/:id/submit`
* **Access**: Protected (`quotation:submit`)
* **Request Body**:
```json
{
  "notes": "End of quarter enterprise contract discount request"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation submitted successfully",
  "data": {
    "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "quotationNumber": "QT-000001",
    "status": "PENDING_MANAGER_APPROVAL",
    "riskScore": 12.0,
    "totalViolations": 1,
    "approvalRequired": true,
    "approvalRoute": "MANAGER",
    "evaluation": {
      "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "quotationNumber": "QT-000001",
      "customerId": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
      "customerName": "Acme Global Industries",
      "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
      "customerTierName": "Gold Tier",
      "subtotalAmount": 100000,
      "totalDiscountAmount": 22000,
      "totalAmount": 78000,
      "totalViolations": 1,
      "riskScore": 12.0,
      "weightedExcessRisk": 12.0,
      "approvalRequired": true,
      "approvalRoute": "MANAGER",
      "requiredApprovalLevels": ["MANAGER"],
      "lineEvaluations": [
        {
          "quotationItemId": "99e1b5f0-629a-4c22-9909-08a8a4b08b99",
          "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
          "productName": "Enterprise Rack Server",
          "sku": "SKU-SRV-01",
          "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
          "categoryName": "Hardware Appliances",
          "appliedDiscount": 22.0,
          "customerTierLimit": 15.0,
          "categoryLimit": 10.0,
          "effectiveAllowedDiscount": 10.0,
          "excessDiscount": 12.0,
          "isViolation": true,
          "riskContribution": 1200000.0,
          "grossAmount": 100000.0,
          "discountAmount": 22000.0,
          "netAmount": 78000.0
        }
      ]
    },
    "approvals": [
      {
        "id": "bb11b5f0-629a-4c22-9909-08a8a4b08b01",
        "approvalLevel": "MANAGER",
        "status": "PENDING",
        "sequence": 1
      }
    ]
  },
  "timestamp": "2026-09-05T08:45:00.000Z"
}
```

### 13.2 Preview Discount Evaluation
* **Endpoint**: `POST /api/v1/quotations/:id/evaluate-discount`
* **Access**: Protected (`quotation:evaluate`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Discount evaluation calculated successfully",
  "data": {
    "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "quotationNumber": "QT-000001",
    "customerId": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
    "customerName": "Acme Global Industries",
    "customerTierId": "77e1b5f0-629a-4c22-9909-08a8a4b08b35",
    "customerTierName": "Gold Tier",
    "subtotalAmount": 100000,
    "totalDiscountAmount": 22000,
    "totalAmount": 78000,
    "totalViolations": 1,
    "riskScore": 12.0,
    "weightedExcessRisk": 12.0,
    "approvalRequired": true,
    "approvalRoute": "MANAGER",
    "requiredApprovalLevels": ["MANAGER"],
    "lineEvaluations": [
      {
        "quotationItemId": "99e1b5f0-629a-4c22-9909-08a8a4b08b99",
        "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
        "productName": "Enterprise Rack Server",
        "sku": "SKU-SRV-01",
        "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
        "categoryName": "Hardware Appliances",
        "appliedDiscount": 22.0,
        "customerTierLimit": 15.0,
        "categoryLimit": 10.0,
        "effectiveAllowedDiscount": 10.0,
        "excessDiscount": 12.0,
        "isViolation": true,
        "riskContribution": 1200000.0,
        "grossAmount": 100000.0,
        "discountAmount": 22000.0,
        "netAmount": 78000.0
      }
    ]
  },
  "timestamp": "2026-09-05T08:45:00.000Z"
}
```

### 13.3 Get Quotation Discount Evaluation Audit
* **Endpoint**: `GET /api/v1/quotations/:id/discount-evaluation`
* **Access**: Protected (`quotation:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation discount evaluation records retrieved successfully",
  "data": [
    {
      "id": "cc11b5f0-629a-4c22-9909-08a8a4b08b02",
      "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "quotationItemId": "99e1b5f0-629a-4c22-9909-08a8a4b08b99",
      "appliedDiscount": "22.00",
      "customerTierLimit": "15.00",
      "categoryLimit": "10.00",
      "effectiveAllowedDiscount": "10.00",
      "excessDiscount": "12.00",
      "isViolation": true,
      "riskContribution": "1200000.00",
      "createdAt": "2026-09-05T08:45:00.000Z"
    }
  ],
  "timestamp": "2026-09-05T08:45:00.000Z"
}
```

### 13.4 Get Quotation Approval History
* **Endpoint**: `GET /api/v1/quotations/:id/approvals`
* **Access**: Protected (`quotation:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation approvals retrieved successfully",
  "data": [
    {
      "id": "bb11b5f0-629a-4c22-9909-08a8a4b08b01",
      "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "approvalLevel": "MANAGER",
      "status": "APPROVED",
      "sequence": 1,
      "requestedAt": "2026-09-05T08:45:00.000Z",
      "decidedAt": "2026-09-05T08:50:00.000Z",
      "decidedById": "22222222-2222-2222-2222-222222222222",
      "comments": "Approved as strategic account discount",
      "createdAt": "2026-09-05T08:45:00.000Z",
      "updatedAt": "2026-09-05T08:50:00.000Z"
    }
  ],
  "timestamp": "2026-09-05T08:50:00.000Z"
}
```

---

### 13.5 List Pending Approvals
* **Endpoint**: `GET /api/v1/approvals/pending`
* **Access**: Protected (`approval:read`)
* **Role Filtering**: Sales Managers automatically see only `MANAGER` level approvals; Finance Officers see `FINANCE` level approvals; Admins see all levels.
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `20`): Page size
  * `status` (optional, default: `PENDING`): Filter by approval status
  * `approvalLevel` (optional, `MANAGER` | `FINANCE`): Filter by level
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Pending approvals retrieved successfully",
  "data": [
    {
      "id": "bb11b5f0-629a-4c22-9909-08a8a4b08b01",
      "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "approvalLevel": "MANAGER",
      "status": "PENDING",
      "sequence": 1,
      "requestedAt": "2026-09-05T08:45:00.000Z",
      "decidedAt": null,
      "decidedById": null,
      "comments": "End of quarter enterprise contract discount request",
      "quotation": {
        "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
        "quotationNumber": "QT-000001",
        "totalAmount": "78000.00",
        "currency": "INR",
        "customerId": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
        "createdById": "11111111-1111-1111-1111-111111111111",
        "customer": {
          "id": "88e1b5f0-629a-4c22-9909-08a8a4b08b55",
          "companyName": "Acme Global Industries",
          "email": "alice@acme.com"
        },
        "createdBy": {
          "id": "11111111-1111-1111-1111-111111111111",
          "name": "Sales Rep Alice",
          "email": "rep.alice@dealflow360.com"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2026-09-05T08:45:00.000Z"
}
```

### 13.6 Approve Approval Step
* **Endpoint**: `POST /api/v1/approvals/:id/approve`
* **Access**: Protected (`approval:approve`)
* **Request Body**:
```json
{
  "comments": "Approved based on strategic revenue impact"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Approval step approved successfully",
  "data": {
    "approval": {
      "id": "bb11b5f0-629a-4c22-9909-08a8a4b08b01",
      "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "approvalLevel": "MANAGER",
      "status": "APPROVED",
      "sequence": 1,
      "requestedAt": "2026-09-05T08:45:00.000Z",
      "decidedAt": "2026-09-05T08:50:00.000Z",
      "decidedById": "22222222-2222-2222-2222-222222222222",
      "comments": "Approved based on strategic revenue impact",
      "updatedAt": "2026-09-05T08:50:00.000Z"
    },
    "quotationStatus": "APPROVED",
    "remainingApprovalsCount": 0
  },
  "timestamp": "2026-09-05T08:50:00.000Z"
}
```

### 13.7 Reject Approval Step
* **Endpoint**: `POST /api/v1/approvals/:id/reject`
* **Access**: Protected (`approval:reject`)
* **Request Body**:
```json
{
  "comments": "Requested discount exceeds acceptable product gross margin"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Approval step rejected successfully",
  "data": {
    "approval": {
      "id": "bb11b5f0-629a-4c22-9909-08a8a4b08b01",
      "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "approvalLevel": "MANAGER",
      "status": "REJECTED",
      "sequence": 1,
      "requestedAt": "2026-09-05T08:45:00.000Z",
      "decidedAt": "2026-09-05T08:50:00.000Z",
      "decidedById": "22222222-2222-2222-2222-222222222222",
      "comments": "Requested discount exceeds acceptable product gross margin",
      "updatedAt": "2026-09-05T08:50:00.000Z"
    },
    "quotationStatus": "REJECTED"
  },
  "timestamp": "2026-09-05T08:50:00.000Z"
}
```

---

## 14. Upsell & Cross-Sell Recommendation Engine API

Provides contextual cross-sell and upsell suggestions during quotation authoring, integrating directly with custom price lists and triggering commercial approval invalidations upon recommendation acceptance.

### 14.1 List Recommendation Rules
* **Endpoint**: `GET /api/v1/recommendation-rules`
* **Access**: Protected (`recommendation_rule:read`)
* **Query Parameters**:
  * `page` (optional, default: `1`): Page number
  * `limit` (optional, default: `20`): Page size
  * `sourceProductId` (optional, UUID): Filter by source product
  * `recommendedProductId` (optional, UUID): Filter by recommended product
  * `recommendationType` (optional, `CROSS_SELL` | `UPSELL`): Filter by rule type
  * `priority` (optional, `LOW` | `MEDIUM` | `HIGH`): Filter by priority
  * `isActive` (optional, `true` | `false`): Filter by active status
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Recommendation rules retrieved successfully",
  "data": [
    {
      "id": "aa11b5f0-629a-4c22-9909-08a8a4b08b01",
      "sourceProductId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
      "recommendedProductId": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
      "recommendationType": "CROSS_SELL",
      "priority": "HIGH",
      "defaultQuantity": 1,
      "description": "Complementary protective case",
      "isActive": true,
      "createdAt": "2026-09-05T09:00:00.000Z",
      "updatedAt": "2026-09-05T09:00:00.000Z",
      "sourceProduct": {
        "id": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
        "name": "Standard Laptop 15",
        "sku": "LAP-STD-01"
      },
      "recommendedProduct": {
        "id": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
        "name": "Premium Laptop Bag",
        "sku": "BAG-01",
        "basePrice": "3000.00",
        "currency": "INR",
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
  "timestamp": "2026-09-05T09:00:00.000Z"
}
```

### 14.2 Create Recommendation Rule
* **Endpoint**: `POST /api/v1/recommendation-rules`
* **Access**: Protected (`recommendation_rule:create`)
* **Request Body**:
```json
{
  "sourceProductId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
  "recommendedProductId": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
  "recommendationType": "CROSS_SELL",
  "priority": "HIGH",
  "defaultQuantity": 1,
  "description": "Complementary protective case",
  "isActive": true
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Recommendation rule created successfully",
  "data": {
    "id": "aa11b5f0-629a-4c22-9909-08a8a4b08b01",
    "sourceProductId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
    "recommendedProductId": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
    "recommendationType": "CROSS_SELL",
    "priority": "HIGH",
    "defaultQuantity": 1,
    "description": "Complementary protective case",
    "isActive": true,
    "createdAt": "2026-09-05T09:00:00.000Z",
    "updatedAt": "2026-09-05T09:00:00.000Z"
  },
  "timestamp": "2026-09-05T09:00:00.000Z"
}
```

### 14.3 Get Recommendation Rule by ID
* **Endpoint**: `GET /api/v1/recommendation-rules/:id`
* **Access**: Protected (`recommendation_rule:read`)

### 14.4 Update Recommendation Rule
* **Endpoint**: `PATCH /api/v1/recommendation-rules/:id`
* **Access**: Protected (`recommendation_rule:update`)

### 14.5 Delete Recommendation Rule
* **Endpoint**: `DELETE /api/v1/recommendation-rules/:id`
* **Access**: Protected (`recommendation_rule:delete`)

### 14.6 Get Quotation Recommendations
* **Endpoint**: `GET /api/v1/quotations/:quotationId/recommendations`
* **Access**: Protected (`recommendation:read`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Quotation recommendations retrieved successfully",
  "data": {
    "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
    "quotationNumber": "QT-000001",
    "priceListId": "44e1b5f0-629a-4c22-9909-08a8a4b08b22",
    "currency": "INR",
    "totalRecommendations": 1,
    "recommendations": [
      {
        "id": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
        "ruleId": "aa11b5f0-629a-4c22-9909-08a8a4b08b01",
        "recommendedProduct": {
          "id": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
          "name": "Premium Laptop Bag",
          "sku": "BAG-01",
          "description": "Ergonomic water-resistant bag",
          "productType": "ONE_TIME",
          "categoryId": "33e1b5f0-629a-4c22-9909-08a8a4b08b11",
          "categoryName": "Accessories",
          "basePrice": "3000.00",
          "currency": "INR"
        },
        "recommendationType": "CROSS_SELL",
        "priority": "HIGH",
        "priorityWeight": 3,
        "recommendedQuantity": 1,
        "description": "Complementary protective case",
        "financialImpact": {
          "unitPrice": 3000.00,
          "currency": "INR",
          "recommendedQuantity": 1,
          "additionalRevenue": 3000.00,
          "priceSource": "PRICE_LIST",
          "priceListId": "44e1b5f0-629a-4c22-9909-08a8a4b08b22",
          "estimatedMarginImpact": null
        },
        "triggeredBy": [
          {
            "productId": "55e1b5f0-629a-4c22-9909-08a8a4b08b33",
            "productName": "Standard Laptop 15",
            "sku": "LAP-STD-01",
            "recommendationType": "CROSS_SELL",
            "ruleId": "aa11b5f0-629a-4c22-9909-08a8a4b08b01"
          }
        ]
      }
    ]
  },
  "timestamp": "2026-09-05T09:00:00.000Z"
}
```

### 14.7 Accept Quotation Recommendation
* **Endpoint**: `POST /api/v1/quotations/:quotationId/recommendations/:recommendationId/accept`
* **Access**: Protected (`recommendation:accept`)
* **Request Body** (optional):
```json
{
  "quantity": 1,
  "discountPercent": "0.00"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Recommendation accepted: added 'Premium Laptop Bag' to quotation",
  "data": {
    "item": {
      "id": "88e1b5f0-629a-4c22-9909-08a8a4b08b88",
      "quotationId": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "productId": "66e1b5f0-629a-4c22-9909-08a8a4b08b44",
      "productNameSnapshot": "Premium Laptop Bag",
      "skuSnapshot": "BAG-01",
      "quantity": 1,
      "unitPrice": "3000.00",
      "discountPercent": "0.00",
      "grossAmount": "3000.00",
      "discountAmount": "0.00",
      "netAmount": "3000.00"
    },
    "quotation": {
      "id": "77e1b5f0-629a-4c22-9909-08a8a4b08b77",
      "quotationNumber": "QT-000001",
      "status": "DRAFT",
      "subtotalAmount": "63000.00",
      "discountAmount": "0.00",
      "totalAmount": "63000.00"
    }
  },
  "timestamp": "2026-09-05T09:00:00.000Z"
}
```

### 14.8 Dismiss Quotation Recommendation
* **Endpoint**: `POST /api/v1/quotations/:quotationId/recommendations/:recommendationId/dismiss`
* **Access**: Protected (`recommendation:dismiss`)
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Recommendation dismissed successfully for this quotation",
  "data": null,
  "timestamp": "2026-09-05T09:00:00.000Z"
}
```

---

## 15. RBAC Roles & Permissions Matrix

### Roles
| Role | Code | Description |
|---|---|---|
| Administrator | `ADMIN` | Full administrative bypass and access across all modules |
| Sales Representative | `SALES_REP` | Create/edit/submit quotations, view catalog, price lists, discount rules, recommendations |
| Sales Manager | `SALES_MANAGER` | Quote approvals, discount governance, manage recommendation rules, price lists |
| Finance & Operations | `FINANCE_OPERATIONS` | Billing, payment processing, finance discount approvals, price lists, discount overrides |
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
| `price_list:read` | View price lists and custom item pricing | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `price_list:manage` | Create, update, and manage price lists & items | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `discount_rule:read` | View customer tier and category discount rules | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `discount_rule:manage` | Configure tier & category discount limits | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `quotation:create` | Create quote drafts | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `quotation:read` | Read quotation details | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS`, `CUSTOMER` |
| `quotation:update` | Update quotation lines and terms | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `quotation:submit` | Submit quotation for discount evaluation & approval | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `quotation:evaluate` | Preview discount evaluation and risk scoring | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `quotation:send` | Send finalized draft quotations to customers | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `quotation:delete` | Delete draft quotations | `ADMIN`, `SALES_MANAGER` |
| `quotation:approve` | Approve quotation workflows | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `approval:read` | View pending approval queue | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `approval:approve` | Approve pending discount approvals | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `approval:reject` | Reject pending discount approvals | `ADMIN`, `SALES_MANAGER`, `FINANCE_OPERATIONS` |
| `recommendation:read` | View quotation upsell / cross-sell suggestions | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `recommendation:accept` | Accept and add recommendations to quotations | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `recommendation:dismiss` | Dismiss recommendations for quotations | `ADMIN`, `SALES_REP`, `SALES_MANAGER` |
| `recommendation:manage` | Configure recommendation rules | `ADMIN`, `SALES_MANAGER` |
| `recommendation_rule:create` | Create recommendation rules | `ADMIN`, `SALES_MANAGER` |
| `recommendation_rule:read` | Read recommendation rules | `ADMIN`, `SALES_MANAGER` |
| `recommendation_rule:update` | Update recommendation rules | `ADMIN`, `SALES_MANAGER` |
| `recommendation_rule:delete` | Delete recommendation rules | `ADMIN`, `SALES_MANAGER` |
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

## 15. Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | `400` | Input payload validation failed against Zod schema |
| `BAD_REQUEST` | `400` | Malformed request structure, invalid state transition, or premature approval step |
| `UNAUTHORIZED` | `401` | Missing or invalid authentication credentials |
| `TOKEN_EXPIRED` | `401` | JWT access token expired |
| `TOKEN_INVALID` | `401` | JWT signature is invalid |
| `FORBIDDEN` | `403` | User lacks the required role or permission (e.g. Sales Rep approving, or Manager approving Finance step) |
| `NOT_FOUND` | `404` | Target resource was not found |
| `CONFLICT` | `409` | State conflict (e.g. duplicate submission or entity with active dependencies) |
| `INTERNAL_ERROR` | `500` | Unhandled server exception |


