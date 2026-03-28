# BudgetCo Backend — Complete Architecture Guide

> **Stack:** Node.js · Express · Prisma · MySQL · Redis · PostgreSQL · Elasticsearch · Kafka · RabbitMQ · Socket.io · GraphQL · Prometheus · Winston

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [Entry Point — `src/index.js`](#3-entry-point--srcindexjs)
4. [Database Layer — Prisma + MySQL](#4-database-layer--prisma--mysql)
5. [Configuration Files](#5-configuration-files)
6. [Middleware](#6-middleware)
7. [Routing — `src/routes.js`](#7-routing--srcroutesjs)
8. [Modules (Feature by Feature)](#8-modules-feature-by-feature)
   - [Auth](#81-auth-module)
   - [User](#82-user-module)
   - [Budget](#83-budget-module)
   - [Expense](#84-expense-module)
   - [Customer](#85-customer-module)
   - [Order](#86-order-module)
   - [Task](#87-task-module)
   - [Transaction](#88-transaction-module)
   - [Transaction Analytics](#89-transaction-analytics-module)
   - [Search](#810-search-module)
   - [Notifications](#811-notifications-module)
   - [Audit](#812-audit-module)
9. [Services (Infrastructure)](#9-services-infrastructure)
10. [Utilities](#10-utilities)
11. [Validation Layer](#11-validation-layer)
12. [GraphQL API](#12-graphql-api)
13. [Authentication Flow](#13-authentication-flow)
14. [Request Lifecycle](#14-request-lifecycle)
15. [Caching Strategy](#15-caching-strategy)
16. [Event-Driven Architecture](#16-event-driven-architecture)
17. [Environment Variables](#17-environment-variables)

---

## 1. Project Overview

BudgetCo is a **multi-tenant financial management API**. Each user owns their own isolated data — budgets, expenses, customers, orders, tasks, and transactions. The API is designed with layered architecture where every feature follows the same predictable pattern:

```
Route → Middleware → Controller → Service → Database (Prisma/MySQL)
                                          → Cache (Redis)
                                          → Events (Kafka/RabbitMQ)
                                          → Audit (PostgreSQL)
```

---

## 2. Directory Structure

```
expense-tracker/
│
├── src/
│   ├── index.js                  # App entry point, server boot
│   ├── routes.js                 # Central router — mounts all modules
│   │
│   ├── config/
│   │   ├── prisma.js             # Prisma client singleton
│   │   ├── redis.js              # Redis client + cache helpers
│   │   └── swagger.js            # Swagger/OpenAPI config
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT protect + role guard
│   │   ├── audit.middleware.js   # Writes audit trail to PostgreSQL
│   │   ├── error.middleware.js   # Global error handler + 404
│   │   └── validate.middleware.js# Zod schema validation
│   │
│   ├── modules/                  # Feature modules (self-contained)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── budget/
│   │   ├── expense/
│   │   ├── customer/
│   │   ├── order/
│   │   ├── task/
│   │   ├── transaction/
│   │   ├── transactionAnalytics/
│   │   ├── search/
│   │   ├── notifications/
│   │   └── audit/
│   │
│   ├── services/                 # Infrastructure services
│   │   ├── elasticService.js     # Elasticsearch integration
│   │   ├── kafkaService.js       # Kafka producer + consumer
│   │   ├── postgresService.js    # PostgreSQL audit log
│   │   ├── rabbitMQService.js    # RabbitMQ messaging
│   │   └── socketService.js      # Socket.io real-time events
│   │
│   └── utils/
│       ├── jwt.js                # Token generation + verification
│       ├── logger.js             # Winston logger + HTTP request logger
│       ├── metrics.js            # Prometheus metrics middleware
│       ├── pagination.js         # Pagination helper + response shaper
│       └── response.js           # Standardised JSON response helpers
│
├── graphql/
│   ├── schema.js                 # GraphQL type definitions + resolvers
│   └── context.js                # GraphQL request context (auth)
│
├── prisma/
│   ├── schema.prisma             # Database schema (models + enums)
│   └── seed.js                   # Database seed script
│
├── .env                          # Environment variables
└── package.json
```

---

## 3. Entry Point — `src/index.js`

This file boots the entire application. It wires every layer together and starts the HTTP server.

### What happens on startup (in order):

```
1. Express app created
2. Security middleware attached (Helmet, CORS, Cookie Parser)
3. Rate limiter applied to /api/* routes
4. Swagger docs mounted at /docs
5. Prometheus metrics endpoint at /metrics
6. Health check at /health
7. GraphQL endpoint at /api/graphql
8. GraphiQL playground at /api/graphiql
9. All REST routes mounted via src/routes.js at /api
10. 404 + global error handler attached

Boot sequence (async):
  → initSocket(server)     — Socket.io
  → initPostgres()         — PostgreSQL audit table
  → initElastic()          — Elasticsearch (gracefully disabled if down)
  → initRabbitMQ()         — RabbitMQ (warns if unavailable)
  → initKafkaProducer()    — Kafka producer
  → initKafkaConsumer()    — Kafka consumer
  → server.listen(PORT)    — Server starts
```

### Key configuration at startup:

| Setting | Value |
|---|---|
| Default port | `process.env.PORT \|\| 3000` |
| CORS origin | `process.env.FRONTEND_URL \|\| http://localhost:3001` |
| Rate limit (dev) | Skipped entirely |
| Rate limit (prod) | 100 requests per 15 minutes |

---

## 4. Database Layer — Prisma + MySQL

Prisma is the ORM. It generates a type-safe client from `prisma/schema.prisma` and talks to MySQL.

### Models at a Glance

| Model | Table | Key Fields |
|---|---|---|
| `User` | `users` | id, username, email, password, role |
| `Budget` | `budgets` | id, name, limit, spent, category, ownerId |
| `Expense` | `expenses` | id, description, amount, category, budgetId, ownerId |
| `Customer` | `customers` | id, name, email, phone, address, ownerId |
| `Order` | `orders` | id, amount, status, customerId, ownerId |
| `OrderItem` | `order_items` | id, name, quantity, price, orderId |
| `Task` | `tasks` | id, description, status, priority, dueDate, ownerId |
| `Transaction` | `transactions` | id, type, amount, description, referenceId, ownerId |
| `RefreshToken` | `refresh_tokens` | id, token, userId, expiresAt |

### Multi-Tenancy Pattern

Every resource model has an `ownerId` field that references `users.id`. All queries filter by `ownerId: req.user.id`, so users can only ever see and modify their own data.

```js
// Example — every service query looks like this:
prisma.budget.findMany({ where: { ownerId } })
```

### Enums

```
Role:             USER | ADMIN
BudgetCategory:   PERSONAL | BUSINESS | TRAVEL | FOOD | HEALTH | OTHER
OrderStatus:      PENDING | PROCESSING | COMPLETED | CANCELLED
TaskStatus:       PENDING | IN_PROGRESS | COMPLETED | FAILED
TaskPriority:     LOW | MEDIUM | HIGH
TransactionType:  CREDIT | DEBIT
```

### Prisma Client Singleton — `src/config/prisma.js`

A single Prisma client instance is created and exported. Every module imports from this file instead of creating its own connection — avoids connection pool exhaustion.

```js
import prisma from '../../config/prisma.js'
```

---

## 5. Configuration Files

### `src/config/redis.js`

Wraps `ioredis` with helper functions used across all services:

| Function | Purpose |
|---|---|
| `getCache(key)` | Get JSON value from Redis, auto-parses |
| `setCache(key, value, ttl)` | Store JSON in Redis with TTL (seconds) |
| `deleteCache(key)` | Remove a single key |
| `deleteCachePattern(pattern)` | Remove all keys matching a glob pattern (e.g. `customers:9:*`) |

Redis is used exclusively for read caching. Every service that fetches lists checks Redis first, and every write invalidates the matching cache keys.

### `src/config/swagger.js`

Configures `swagger-jsdoc` to auto-generate OpenAPI docs from JSDoc comments in route files. Docs are served at `/docs`.

---

## 6. Middleware

Middleware runs on every matched request before reaching the controller. Applied in this order:

```
Helmet → CORS → Cookie Parser → Rate Limiter → Request Logger
→ Prometheus → Route Handler
   └── protect (auth check)
   └── validate (Zod schema)
   └── audit (write to PostgreSQL)
```

### `auth.middleware.js`

**`protect`** — Guards any route that requires login.

How it works:
1. Extracts JWT from `Authorization: Bearer <token>` header
2. Verifies the token using the JWT secret
3. Looks up the user in Redis cache (`user:<id>`) first
4. Falls back to MySQL if cache misses, then caches result for 5 minutes
5. Attaches `req.user` for downstream use
6. Returns `401` if token is missing, invalid, or expired

**`restrictTo(...roles)`** — Role guard, used after `protect`.
```js
router.delete('/:id', protect, restrictTo('ADMIN'), deleteUser)
```

### `validate.middleware.js`

Takes a Zod schema and validates `req.body` against it before the controller runs.

```js
router.post('/', validate(createBudgetSchema), createBudget)
```

If validation fails → returns `400` with Zod's error messages. If it passes → `req.body` is replaced with the parsed (sanitised) data.

### `audit.middleware.js`

Writes an audit record to PostgreSQL after every mutating request (`POST`, `PUT`, `PATCH`, `DELETE`). Captures:

- `userId` — who made the request
- `action` — HTTP method
- `resource` — URL path
- `details` — request body (sanitised)
- `ipAddress` — client IP
- `timestamp` — when it happened

This creates a tamper-resistant trail separate from MySQL.

### `error.middleware.js`

Two handlers attached at the very end of the middleware chain:

- **`notFound`** — Catches any unmatched route, returns `404`
- **`errorHandler`** — Catches all errors thrown/passed via `next(err)`. Returns structured JSON. In development, includes the stack trace.

---

## 7. Routing — `src/routes.js`

The central router that mounts all feature modules under `/api`:

```
/api/auth          → auth module
/api/users         → user module
/api/budgets       → budget module
/api/expenses      → expense module
/api/customers     → customer module
/api/orders        → order module
/api/tasks         → task module
/api/transactions  → transaction module
/api/search        → search module
/api/notifications → notifications module
/api/audit         → audit module
```

All routes share the `/api` prefix defined in `index.js` where this router is mounted.

---

## 8. Modules (Feature by Feature)

Each module lives in `src/modules/<name>/` and always contains three files:

```
<name>.routes.js      — Express router: defines HTTP methods and applies middleware
<name>.controller.js  — Handles req/res: calls service, formats response
<name>.service.js     — Business logic: talks to Prisma, Redis, external services
```

---

### 8.1 Auth Module

**Base path:** `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Create account, returns access + refresh token |
| POST | `/login` | ❌ | Login, returns access token + sets refresh cookie |
| POST | `/logout` | ✅ | Invalidate refresh token, clear cookie |
| GET | `/me` | ✅ | Return current user profile |
| POST | `/refresh` | ❌ | Issue new access token using refresh token |

**How tokens work:**

- **Access token** — Short-lived (15 min), sent in response body, stored by client in a cookie
- **Refresh token** — Long-lived (7 days), stored in DB (`refresh_tokens` table), sent as `httpOnly` cookie

**Registration flow:**
1. Check if email/username already exists → `409` if so
2. Hash password with bcrypt (12 rounds)
3. Create user in MySQL
4. Generate access + refresh tokens
5. Store refresh token in DB
6. Return access token to client

**Login flow:**
1. Find user by email → `401` if not found
2. Compare password hash → `401` if mismatch
3. Generate new token pair
4. Store refresh token in DB
5. Set `refreshToken` as httpOnly cookie, return `accessToken` in body

**Token refresh flow:**
1. Read refresh token from cookie or body
2. Verify it's a valid JWT of type `refresh`
3. Check it exists in DB and hasn't expired
4. **Rotate** — delete the old token, issue a new pair
5. Return new access token

---

### 8.2 User Module

**Base path:** `/api/users`
**All routes require:** `protect`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | ADMIN | List all users |
| GET | `/:id` | ADMIN | Get single user |
| PUT | `/:id` | ADMIN | Update user |
| DELETE | `/:id` | ADMIN | Delete user |

Only admins can access this module. Regular users manage their own profile via `/api/auth/me`.

---

### 8.3 Budget Module

**Base path:** `/api/budgets`
**All routes require:** `protect`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all budgets (paginated, cached) |
| GET | `/:id` | Get single budget with expenses |
| POST | `/` | Create budget |
| PUT | `/:id` | Update budget |
| DELETE | `/:id` | Delete budget |

**Validation schema (`createBudgetSchema`):**

```
name:        string, 1–100 chars, required
limit:       number, positive, required
category:    PERSONAL | BUSINESS | TRAVEL | FOOD | HEALTH | OTHER
description: string, optional
```

**Service behaviour:**

- `getAll` — Paginates results, supports `search`, `sort`, `order` query params. Cache key: `budgets:{ownerId}:{page}:{limit}:{search}:{category}:{sort}:{order}`. TTL: 120 seconds.
- `getById` — Returns budget with its nested expenses. No cache.
- `create` — Inserts budget, invalidates all `budgets:{ownerId}:*` cache keys.
- `update` — Uses `updateMany` with `{ id, ownerId }` to prevent modifying other users' budgets.
- `delete` — Same safety pattern. Cascades to delete associated expenses (Prisma schema `onDelete: Cascade`).

---

### 8.4 Expense Module

**Base path:** `/api/expenses`
**All routes require:** `protect`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all expenses (paginated, cached) |
| GET | `/budget/:budgetId` | List expenses for a specific budget |
| GET | `/:id` | Get single expense |
| POST | `/` | Create expense + update budget's `spent` total |
| PUT | `/:id` | Update expense |
| DELETE | `/:id` | Delete expense |

**Validation schema (`createExpenseSchema`):**

```
description: string, 1–255 chars, required
amount:      number, positive, required
category:    string, optional
date:        ISO datetime string, optional
budgetId:    integer, required
```

**Key service behaviour:**

- **Create** — After inserting the expense, it increments `budget.spent` by the expense amount using `prisma.budget.update`. This keeps the budget's spend counter always accurate.
- **Delete** — Decrements `budget.spent` by the deleted expense's amount.
- **Elasticsearch** — On create, the expense is indexed in Elasticsearch for full-text search (if ES is available). The `search` module queries this index.

---

### 8.5 Customer Module

**Base path:** `/api/customers`
**All routes require:** `protect`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List customers (paginated, cached) |
| GET | `/:id` | Get single customer |
| POST | `/` | Create customer |
| PUT | `/:id` | Update customer |
| DELETE | `/:id` | Delete customer (cascades to orders) |

**Validation schema:**

```
name:    string, 1–100 chars, required
email:   valid email, required (unique in DB)
phone:   string, max 20 chars, optional
address: string, max 300 chars, optional
```

**Caching:** Cache key pattern: `customers:{ownerId}:{page}:{limit}:{search}:{sort}:{order}`. TTL: 120s. All writes use `deleteCachePattern('customers:{ownerId}:*')` to invalidate.

**Response shape from `getAll`** (paginated):
```json
{
  "success": true,
  "data": {
    "data": [ ...customers ],
    "pagination": { "total", "page", "limit", "totalPages", "hasNext", "hasPrev" }
  }
}
```

---

### 8.6 Order Module

**Base path:** `/api/orders`
**All routes require:** `protect`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all orders (with customer + items) |
| GET | `/:id` | Get single order |
| POST | `/` | Create order (optionally with line items) |
| PUT | `/:id` | Update order status/amount |
| DELETE | `/:id` | Delete order |

**Validation schema:**

```
customerId: integer, required
amount:     number, positive, required
status:     PENDING | PROCESSING | COMPLETED | CANCELLED, default PENDING
items:      array of { name, quantity, price }, optional
```

**Key differences from other modules:**

- Orders are **not paginated** — `getAll` returns a plain array (no `paginatedResponse` wrapper)
- Response shape: `{ success: true, data: { count: N, orders: [...] } }`
- Orders include nested `customer` (name, email) and `items` via Prisma `include`
- `OrderItem` records are created atomically with the order using Prisma's nested `create`

---

### 8.7 Task Module

**Base path:** `/api/tasks`
**All routes require:** `protect`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List tasks (paginated, filterable by status/priority) |
| GET | `/:id` | Get single task |
| POST | `/` | Create task |
| PUT | `/:id` | Update task (status, priority, etc.) |
| DELETE | `/:id` | Delete task |

**Validation schema:**

```
description: string, 1–500 chars, required
priority:    LOW | MEDIUM | HIGH, default MEDIUM
status:      PENDING | IN_PROGRESS | COMPLETED | FAILED, default PENDING
dueDate:     ISO-8601 DateTime string (e.g. "2026-03-27T00:00:00.000Z"), optional
```

> ⚠️ **Important:** The `dueDate` field must be a full ISO-8601 DateTime string. The HTML date input returns `"YYYY-MM-DD"` — this must be converted to `new Date(val).toISOString()` before sending.

**Query filters:**
- `?status=IN_PROGRESS` — filter by status
- `?priority=HIGH` — filter by priority
- `?page=1&limit=20` — pagination

**Caching:** Cache key: `tasks:{ownerId}:{page}:{limit}:{status}:{priority}`. TTL: 60s.

---

### 8.8 Transaction Module

**Base path:** `/api/transactions`
**All routes require:** `protect`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List transactions (paginated) |
| GET | `/:id` | Get single transaction |
| POST | `/` | Record a transaction |
| PUT | `/:id` | Update transaction |
| DELETE | `/:id` | Delete transaction |

**Validation schema:**

```
type:        CREDIT | DEBIT, required
amount:      number, positive, required
description: string, optional
referenceId: string, optional (e.g. order ID, invoice number)
```

Transactions are general-purpose financial records. They can reference other entities via `referenceId` (free-form string).

---

### 8.9 Transaction Analytics Module

**Base path:** (internal — mounted within transaction routes or accessed directly)

Provides aggregated financial analytics on top of the transaction data:

- Total credits vs debits
- Net balance
- Grouped summaries by period

This is a read-only module — no mutations. Used for dashboard summary cards.

---

### 8.10 Search Module

**Base path:** `/api/search`
**All routes require:** `protect`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/expenses` | Full-text search expenses via Elasticsearch |

**How it works:**

When an expense is created, it's indexed in Elasticsearch with fields: `description`, `amount`, `category`, `ownerId`, `budgetId`.

The search endpoint:
1. Receives `?q=<query>` from the client
2. Queries Elasticsearch using a `multi_match` query across `description` and `category`
3. Filters results to only the current user's expenses (`ownerId` filter)
4. Returns matching expenses

If Elasticsearch is unavailable (as in development), this endpoint is disabled gracefully — the service logs a warning on boot and the endpoint returns an error without crashing the server.

---

### 8.11 Notifications Module

**Base path:** `/api/notifications`
**All routes require:** `protect`

Handles in-app notifications. Works in tandem with Socket.io for real-time delivery.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List user's notifications |
| PUT | `/:id/read` | Mark notification as read |
| DELETE | `/:id` | Delete notification |

**Real-time delivery:**

When events occur (e.g. budget threshold exceeded), the Socket.io service emits events to the connected client. Notifications are also persisted so they appear when the user next opens the app.

---

### 8.12 Audit Module

**Base path:** `/api/audit`
**Requires:** `protect` + `restrictTo('ADMIN')`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all audit logs (admin only) |
| GET | `/:id` | Get single audit record |

Audit records are stored in **PostgreSQL** (separate from MySQL), providing an immutable, independently-queryable log of all mutating API actions.

Each record contains: `userId`, `action`, `resource`, `details`, `ipAddress`, `timestamp`.

---

## 9. Services (Infrastructure)

These are long-running infrastructure connections initialised at boot. They are used by modules but are not modules themselves.

### `socketService.js`

Initialises Socket.io on the HTTP server. Manages:
- Client connections/disconnections
- Authenticated WebSocket sessions (validates JWT on connection)
- Room-based messaging (each user joins their own room `user:{id}`)
- Helper function `emitToUser(userId, event, data)` used by other services to push real-time events

### `elasticService.js`

Wraps the `@elastic/elasticsearch` client. Provides:
- `initElastic()` — Connects on boot, creates `expenses` index if it doesn't exist
- `indexExpense(expense)` — Called by expense service on create
- `searchExpenses(query, ownerId)` — Called by search module
- Gracefully disables itself if Elasticsearch is unreachable

### `kafkaService.js`

Connects to a Kafka broker. Provides:
- `initKafkaProducer()` — Creates topics (`budget.events`, `user.events`) and connects
- `initKafkaConsumer()` — Subscribes to topics, logs consumed messages
- `publishEvent(topic, key, value)` — Called by services to emit domain events

Events published (examples):
- `user.events` → user registered, logged in
- `budget.events` → budget created, expense added

### `rabbitMQService.js`

Connects to RabbitMQ via `amqplib`. Provides:
- `initRabbitMQ()` — Creates channel and declares queues
- `publishToQueue(queue, message)` — Send message to queue
- `consumeQueue(queue, handler)` — Register consumer

### `postgresService.js`

Separate from Prisma/MySQL — connects to PostgreSQL for audit logging:
- `initPostgres()` — Creates connection pool, ensures `audit_logs` table exists
- `writeAudit(record)` — Inserts audit record. Called by `audit.middleware.js`

---

## 10. Utilities

### `jwt.js`

| Function | Description |
|---|---|
| `generateAccessToken(userId)` | Signs a JWT with `type: 'access'`, expires in `JWT_ACCESS_EXPIRES` (15m) |
| `generateRefreshToken(userId)` | Signs a JWT with `type: 'refresh'`, expires in `JWT_REFRESH_EXPIRES` (7d) |
| `verifyToken(token)` | Verifies and decodes a token, throws `JsonWebTokenError` or `TokenExpiredError` |

### `logger.js`

Built on **Winston**. Outputs structured JSON logs in production, colourised text in development.

- `logger.info(msg)` / `logger.warn(msg)` / `logger.error(msg)` — General logging
- `requestLogger` — Express middleware that logs every request: method, URL, status code, duration, user ID

Log format per request:
```
01:10:45 [info] [96386138] [user:9] [15ms] GET /api/budgets 200
                 ^req-id    ^userId  ^time
```

### `metrics.js`

Prometheus metrics via `prom-client`:
- `metricsMiddleware` — Counts HTTP requests by method/route/status, tracks response time histograms
- `metricsHandler` — Exposes metrics at `GET /metrics` in Prometheus text format

### `pagination.js`

| Function | Description |
|---|---|
| `getPagination(query)` | Extracts `page`, `limit`, `skip` from query params. Defaults: page=1, limit=20, max=100 |
| `paginatedResponse(data, total, page, limit)` | Returns `{ data: [...], pagination: { total, page, limit, totalPages, hasNext, hasPrev } }` |

All paginated modules wrap their response in `paginatedResponse` before passing to `successResponse`.

### `response.js`

Standardises all API responses:

```js
// Success — always this shape:
{ "success": true, "message": "...", "data": { ... } }

// Error — always this shape:
{ "success": false, "message": "..." }
// In development, also includes: { "error": "stack trace message" }
```

```js
successResponse(res, data, message, statusCode)  // default 200
errorResponse(res, message, statusCode, error)    // default 500
```

---

## 11. Validation Layer

All input validation uses **Zod**. Schemas live in `src/validations/`.

| File | Schemas |
|---|---|
| `budget.validation.js` | `createBudgetSchema`, `updateBudgetSchema` |
| `expense.validation.js` | `createExpenseSchema`, `updateExpenseSchema` |
| `customer.validation.js` | `createCustomerSchema`, `updateCustomerSchema` |
| `order.validation.js` | `createOrderSchema`, `updateOrderSchema` |
| `task.validation.js` | `createTaskSchema`, `updateTaskSchema` |
| `transaction.validation.js` | `createTransactionSchema` |
| `auth.validation.js` | `registerSchema`, `loginSchema` |

The `validate(schema)` middleware:
1. Calls `schema.safeParse(req.body)`
2. On failure → `400` with Zod's formatted error messages
3. On success → replaces `req.body` with `schema.parse(req.body)` (coerced, stripped of extra fields)

Update schemas are created with `.partial()` — all fields become optional, allowing partial updates.

---

## 12. GraphQL API

**Endpoint:** `POST /api/graphql`
**Playground:** `GET /api/graphiql`

### Types

```graphql
type Budget {
  id, name, limit, spent, category, description, createdAt
  expenses: [Expense]
}

type Expense {
  id, description, amount, category, date
  budget: Budget
}
```

### Queries

```graphql
budgets(limit: Int): [Budget]
budget(id: Int!): Budget
expenses(limit: Int): [Expense]
expense(id: Int!): Expense
```

### Mutations

```graphql
createBudget(name, limit, category): Budget
updateBudget(id, name, limit, category): Budget
deleteBudget(id): Boolean

addExpense(budgetId, description, amount): Expense
deleteExpense(id): Boolean
```

### Authentication

The GraphQL context (`graphql/context.js`) extracts the JWT from the `Authorization` header and attaches the user to context — same flow as REST middleware. All resolvers receive `context.user`.

---

## 13. Authentication Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/register       │
  │  { username, email, password } │
  │ ─────────────────────────────► │ Hash password, create User
  │                               │ Generate accessToken (15m) + refreshToken (7d)
  │                               │ Store refreshToken in DB
  │ ◄───────────────────────────── │
  │  { accessToken }               │
  │  Cookie: refreshToken (httpOnly)│
  │                               │
  │  [All subsequent requests]     │
  │  Authorization: Bearer <access>│
  │ ─────────────────────────────► │ protect middleware:
  │                               │   1. Verify accessToken
  │                               │   2. Load user from Redis / MySQL
  │                               │   3. Attach req.user
  │                               │
  │  [Token expires after 15min]   │
  │  POST /api/auth/refresh        │
  │  Cookie: refreshToken          │
  │ ─────────────────────────────► │ Verify refreshToken in DB
  │                               │ Rotate: delete old, create new pair
  │ ◄───────────────────────────── │
  │  { accessToken }               │
  │  Cookie: new refreshToken      │
```

---

## 14. Request Lifecycle

A complete trace of a request from client to database:

```
POST /api/customers
Authorization: Bearer <token>
Body: { name: "Jane", email: "jane@co.com" }

1.  Helmet        — Sets security headers
2.  CORS          — Validates Origin header
3.  Cookie Parser — Parses cookies
4.  Rate Limiter  — Checks request count (skipped in dev)
5.  requestLogger — Logs incoming request
6.  metricsMiddleware — Increments Prometheus counter
7.  routes.js     — Matches /api → customerRoutes
8.  protect       — Verifies JWT, loads user from Redis/MySQL, sets req.user
9.  validate(createCustomerSchema) — Parses body with Zod, returns 400 if invalid
10. createCustomer controller — calls CustomerService.create(req.body, req.user.id)
11. CustomerService.create:
      a. prisma.customer.create({ data: { ...body, ownerId } })
      b. deleteCachePattern('customers:9:*')  — invalidate Redis
12. successResponse(res, { customer }, 'Customer created.', 201)
13. audit.middleware — writes audit record to PostgreSQL
14. requestLogger — logs [201ms] POST /api/customers 201
```

---

## 15. Caching Strategy

Redis is used as a **read-through cache** for list endpoints. Write-through is not used — writes go directly to MySQL, then invalidate relevant cache keys.

| Module | Cache Key Pattern | TTL |
|---|---|---|
| Budgets | `budgets:{ownerId}:{page}:{limit}:{search}:{cat}:{sort}:{order}` | 120s |
| Expenses | `expenses:{ownerId}:{page}:{limit}:{budgetId}:{search}:{cat}` | 120s |
| Customers | `customers:{ownerId}:{page}:{limit}:{search}:{sort}:{order}` | 120s |
| Tasks | `tasks:{ownerId}:{page}:{limit}:{status}:{priority}` | 60s |
| Auth user | `user:{id}` | 300s |

**Invalidation:** On any create/update/delete, the service calls `deleteCachePattern('module:{ownerId}:*')` which removes all cache entries for that user in that module.

---

## 16. Event-Driven Architecture

The backend emits events through two messaging systems:

### Kafka (`budget.events`, `user.events`)

Used for high-throughput event streaming. Events are published after significant state changes:

```
User registers → user.events  → { type: 'USER_REGISTERED', userId, email }
Budget created → budget.events → { type: 'BUDGET_CREATED', budgetId, ownerId }
Expense added  → budget.events → { type: 'EXPENSE_ADDED', budgetId, amount }
```

### RabbitMQ

Used for reliable task queuing — e.g. sending emails, processing notifications, background jobs. Messages are published to named queues and consumed by worker handlers.

### Socket.io

Used for real-time push to the connected browser client. When a server-side event occurs (e.g. budget limit exceeded), `emitToUser(userId, 'notification', data)` pushes it instantly to the client without polling.

---

## 17. Environment Variables

```bash
# Server
PORT=8080
NODE_ENV=development

# MySQL (Prisma)
DATABASE_URL="mysql://user:password@localhost:3306/budget_manager"

# JWT
JWT_SECRET=<strong-secret>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_URL=redis://localhost:6379

# PostgreSQL (Audit)
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=budget_audit
PG_USER=<user>
PG_PASSWORD=<password>

# Elasticsearch
ELASTIC_URL=http://localhost:9200

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Kafka
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=budget-api
KAFKA_GROUP_ID=budget-group

# gRPC
GRPC_PORT=50051

# CORS
FRONTEND_URL=http://localhost:3002

# Logging
LOG_LEVEL=debug
```

---

*Generated from source — reflects the codebase as of March 2026.*
