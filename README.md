# Finance Dashboard API

Production-style REST backend for a finance dashboard: **Node.js**, **Express**, **TypeScript**, **MongoDB** (Mongoose), **JWT** auth, **RBAC**, **Zod** validation, aggregation-based analytics, pagination, filtering, search, and soft deletes.

## Overview

- **Users** register as `viewer` by default; **admin** manages roles and account status.
- **Financial records** belong to a user (`userId`). **Admins** create/update/delete records (soft delete). **Viewers** and **analysts** can list and read records scoped to their own data; **admins** see all records and may filter by `userId`.
- **Dashboard** summary, recent activity, and monthly trends use **MongoDB aggregation** (and `find` for recent). Only **analyst** and **admin** may access dashboard routes.

## Folder structure

```
src/
  config/
    database.ts
  models/
    user.model.ts
    financialRecord.model.ts
  controllers/
    auth.controller.ts
    user.controller.ts
    financial.controller.ts
    dashboard.controller.ts
  services/
    auth.service.ts
    user.service.ts
    financial.service.ts
    dashboard.service.ts
  middleware/
    auth.middleware.ts
    role.middleware.ts
    validate.middleware.ts
    error.middleware.ts
  routes/
    auth.routes.ts
    user.routes.ts
    financial.routes.ts
    dashboard.routes.ts
  validation/
    schemas.ts          # Zod schemas (used by validate.middleware)
  types/
    express.d.ts        # Express Request.user typing
  utils/
    response.ts
    logger.ts
    appError.ts
  app.ts
  server.ts
README.md
```

## Features

| Area | Details |
|------|--------|
| Auth | Register, login, JWT bearer auth |
| RBAC | `viewer` (read records), `analyst` (+ dashboard analytics), `admin` (+ record CRUD, user management) |
| Records | CRUD with soft delete (`deletedAt`), filters, pagination, search |
| Dashboard | Aggregations: totals, net balance, category breakdown, monthly trends, recent activity |
| Validation | Zod + `validateMiddleware` on body, query, and params |
| Errors | Central handler: validation, Mongoose, JWT, duplicates, operational `AppError` |

## Tech stack

- Node.js 20+ (LTS recommended)
- TypeScript
- Express.js
- MongoDB + Mongoose
- JWT + bcryptjs
- dotenv
- express-async-handler
- Zod
- Swagger UI (`/api-docs`) via swagger-jsdoc + swagger-ui-express
- helmet, cors

## How to run

1. **MongoDB** running locally or a connection string to Atlas.
2. Copy environment file and edit values:

```bash
cp .env.example .env
```

3. Install and start dev server:

```bash
npm install
npm run dev
```

4. Production build:

```bash
npm run build
npm start
```

- API base: `http://localhost:4000` (or your `PORT`)
- Health: `GET /health`
- Swagger UI: `GET /api-docs`

## Environment variables

| Variable | Example | Description |
|----------|---------|-------------|
| `PORT` | `4000` | HTTP port |
| `NODE_ENV` | `development` | Affects error detail in 500 responses |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/finance_dashboard` | MongoDB connection string |
| `JWT_SECRET` | long random string | Symmetric key for JWT |
| `JWT_EXPIRES_IN` | `7d` | JWT lifetime (see [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) / `ms` formats) |

## API endpoints

All protected routes expect header: `Authorization: Bearer <token>`.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/auth/register` | No | — | Register (role `viewer`) |
| POST | `/auth/login` | No | — | Login, returns JWT |
| GET | `/users` | Yes | admin | List users (paginated) |
| PATCH | `/users/:id/status` | Yes | admin | Set `active` / `inactive` |
| PATCH | `/users/:id/role` | Yes | admin | Set `viewer` / `analyst` / `admin` |
| POST | `/records` | Yes | admin | Create record (body includes `userId`) |
| GET | `/records` | Yes | all | List records (own data; admin sees all, optional `userId` query) |
| GET | `/records/:id` | Yes | all | Get one record (own or admin) |
| PATCH | `/records/:id` | Yes | admin | Update record |
| DELETE | `/records/:id` | Yes | admin | Soft-delete record |
| GET | `/dashboard/summary` | Yes | analyst, admin | Aggregated totals & category breakdown |
| GET | `/dashboard/recent` | Yes | analyst, admin | Recent records by `date` |
| GET | `/dashboard/monthly-trends` | Yes | analyst, admin | Per-month income/expense/net |

### Query parameters

**`GET /users`**

- `page` (default `1`), `limit` (default `20`, max `100`)

**`GET /records`**

- `type`: `income` | `expense`
- `category`: exact match (case-insensitive)
- `startDate`, `endDate`: ISO dates; matched against `date` (`$gte` / `$lte` as provided)
- `search`: case-insensitive substring in `notes` **or** `category`
- `page`, `limit` (same defaults as users)
- `userId`: **admin only** — filter to a specific owner

**`GET /dashboard/recent`**

- `limit` (default `10`, max `50`)

## Example request/response JSON

### Register

**Request** `POST /auth/register`

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secret123"
}
```

**Response** `201`

```json
{
  "success": true,
  "message": "Registered",
  "data": {
    "user": {
      "id": "…",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "role": "viewer",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
  }
}
```

### Login

**Request** `POST /auth/login`

```json
{
  "email": "ada@example.com",
  "password": "secret123"
}
```

**Response** `200` — same shape as register `data` (`user` + `token`).

### Create financial record (admin)

**Request** `POST /records`

```json
{
  "amount": 49.5,
  "type": "expense",
  "category": "food",
  "date": "2026-04-01T12:00:00.000Z",
  "notes": "Lunch",
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response** `201`

```json
{
  "success": true,
  "message": "Record created",
  "data": {
    "id": "…",
    "amount": 49.5,
    "type": "expense",
    "category": "food",
    "date": "2026-04-01T12:00:00.000Z",
    "notes": "Lunch",
    "userId": "507f1f77bcf86cd799439011",
    "deletedAt": null,
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

### List records (paginated)

**Response** `200`

```json
{
  "success": true,
  "data": {
    "items": [ … ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

### Dashboard summary

**Response** `200`

```json
{
  "success": true,
  "data": {
    "totalIncome": 5000,
    "totalExpenses": 1200,
    "netBalance": 3800,
    "categoryTotals": [
      {
        "category": "food",
        "totalAmount": 800,
        "byType": { "expense": 800 }
      }
    ]
  }
}
```

### Error (validation)

**Response** `400`

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": { "fieldErrors": { … }, "formErrors": [] }
  }
}
```

### Error (forbidden)

**Response** `403`

```json
{
  "success": false,
  "error": {
    "message": "Forbidden — insufficient role",
    "code": "APP_ERROR"
  }
}
```

## Assumptions

1. **First admin**: Registration always creates `viewer`. Promote a user to `admin` via MongoDB shell/Compass or a one-off script (not included) by updating `role`, or call `PATCH /users/:id/role` once you have an admin JWT.
2. **Date ranges**: `startDate` / `endDate` are compared to stored `date` at midnight UTC when given as date-only strings; adjust client or extend the service if you need end-of-day semantics.
3. **Soft delete**: Deleted records are hidden from list/get/dashboard aggregations; `DELETE` does not remove documents.
4. **Admin record ownership**: Creating a record requires `userId` in the body so admins attach data to the correct user.
5. **Swagger**: JSDoc is loaded from `src/routes` (dev) or `dist/routes` (production build); extend route files with `@openapi` blocks to enrich `/api-docs`.

## License

MIT
