# MEAN Tutorial

A hands-on walkthrough of building a full-stack CRUD application with **Express 5 / Node.js** (backend) and **Angular 21** (frontend), organized into Git branches that progressively cover the key concepts of the stack — with **MySQL 8** and **Sequelize ORM**, and completed with **JWT authentication** and **RBAC**.

The data model follows this EER schema: `categories` → `products` → `orders` ← `customers`. A separate `users` table with `roles` and `permissions` handles authentication.

This document is the **complete specification** of the project: it is meant to be followed branch by branch.

Repository: https://github.com/EdgarEldy/mean_tutorial

## Table of contents

- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Branching strategy](#branching-strategy)
- [Project structure](#project-structure)
- [Standard response format](#standard-response-format)
- [feature/api/core-architecture](#featureapicore-architecture)
- [feature/api/categories](#featureapicategories)
- [feature/api/products](#featureapiproducts)
- [feature/api/customers](#featureapicustomers)
- [feature/api/orders](#featureapiorders)
- [feature/api/auth](#featureapiauth)
- [feature/frontend/core-architecture](#featurefrontendcore-architecture)
- [feature/frontend/categories](#featurefrontendcategories)
- [feature/frontend/products](#featurefrontendproducts)
- [feature/frontend/customers](#featurefrontendcustomers)
- [feature/frontend/orders](#featurefrontendorders)
- [feature/frontend/auth](#featurefrontendauth)
- [Order of work](#order-of-work)
- [Code conventions](#code-conventions)
- [How to follow this tutorial](#how-to-follow-this-tutorial)

---

## Tech stack

### Backend

| Component | Choice | Version |
|---|---|---|
| Runtime | Node.js | 20+ (LTS) |
| Framework | Express | ^5.1.0 |
| Database | MySQL | 8.0 |
| ORM | Sequelize | ^6.37.7 |
| Migrations & Seeders | Sequelize CLI | ^6.6.3 |
| Validation | express-validator | ^7.2.1 |
| Authentication | Passport + passport-local + passport-jwt | ^0.7.0 / ^1.0.0 / ^4.0.1 |
| JWT | jsonwebtoken | ^9.0.2 |
| Password hashing | bcryptjs | ^3.0.2 |
| Environment | dotenv | ^16.5.0 |
| Tests | Jest + Supertest | ^29.7.0 / ^7.1.0 |
| Dev server | nodemon | ^3.1.10 |
| Package manager | yarn | 1.22.22 |

### Frontend

| Component | Choice | Version |
|---|---|---|
| Framework | Angular | ^21.0.0 |
| UI Template | SB Admin 2 (Bootstrap 4) | 4.x |
| HTTP Client | Angular HttpClient | built-in |
| Forms | Angular Reactive Forms | built-in |
| Notifications | ngx-toastr | latest |
| Tests | Karma + Jasmine | Angular default |
| Package manager | yarn | 1.22.22 |

---

## Data model

### Business data

```
categories (id, category_name)
    │ 1
    │
    │ N
products (id, category_id FK, product_name, unit_price)
    │ 1
    │
    │ N
orders (id, customer_id FK, product_id FK, qty, total)
    │ N
    │
    │ 1
customers (id, first_name, last_name, tel, email, address)
```

### Business entities — columns

| Table | Column | Type | Notes |
|---|---|---|---|
| categories | id | INT PK AI | |
| | category_name | VARCHAR(100) | NOT NULL |
| products | id | INT PK AI | |
| | category_id | INT FK | → categories |
| | product_name | VARCHAR(150) | NOT NULL |
| | unit_price | DECIMAL(10,2) | NOT NULL |
| customers | id | INT PK AI | |
| | first_name | VARCHAR(100) | NOT NULL |
| | last_name | VARCHAR(100) | NOT NULL |
| | tel | VARCHAR(20) | |
| | email | VARCHAR(150) | UNIQUE |
| | address | TEXT | |
| orders | id | INT PK AI | |
| | customer_id | INT FK | → customers |
| | product_id | INT FK | → products |
| | qty | INT | NOT NULL |
| | total | DECIMAL(10,2) | computed: qty × unit_price |

### Auth data (RBAC + token lifecycle)

```
users ──< role_user >── roles ──< role_permission >── permissions
  │
  ├──< blacklisted_tokens
  ├──< activation_tokens
  └──< password_reset_tokens
```

| Table | Column | Notes |
|---|---|---|
| users | id, first_name, last_name, email, password | bcryptjs hash |
| | enabled, account_locked | boolean flags |
| roles | id, name | ADMIN, USER |
| permissions | id, resource, action | e.g. categories:write |
| blacklisted_tokens | id, jti, expires_at | logout invalidation |
| activation_tokens | id, user_id, token, expires_at | email verification |
| password_reset_tokens | id, user_id, token, expires_at | password reset |

---

## Branching strategy

| Branch | Role |
|---|---|
| `master` | Stable, production-ready. No direct commits — merges only from `develop`. |
| `develop` | Integration branch. All `feature/*` branches merge here. |
| `feature/api/core-architecture` | Technical foundation: `src/` structure, config, deps, shared utils, error middleware. |
| `feature/api/categories` | `Category` module: model, repository, service, controller, routes, validation, tests. |
| `feature/api/products` | `Product` module with FK to `Category`. |
| `feature/api/customers` | `Customer` module. |
| `feature/api/orders` | `Order` module with business logic (total calculation). |
| `feature/api/auth` | JWT auth: register, login, logout, protect middleware, RBAC. |
| `feature/frontend/core-architecture` | Angular 21 base: standalone app, routing, HttpClient, core services. |
| `feature/frontend/categories` | Categories feature: service, list/form components, lazy route. |
| `feature/frontend/products` | Products feature. |
| `feature/frontend/customers` | Customers feature. |
| `feature/frontend/orders` | Orders feature with automatic total calculation. |
| `feature/frontend/auth` | Login/Register pages, JWT interceptor, route guard. |

---

## Project structure

### Backend (`backend/src/`)

```
src/
├── server.js                      ← entry point
├── app.js                         ← Express factory
├── config/
│   ├── env.js                     ← single source for all process.env reads
│   ├── database.js                ← runtime Sequelize instance
│   └── passport.js                ← JWT strategy (feature/api/auth)
├── database/
│   ├── config/config.js           ← sequelize-cli config
│   ├── models/index.js            ← auto-loader
│   ├── models/                    ← one file per entity
│   ├── repositories/              ← ONLY layer that touches the DB
│   ├── migrations/
│   └── seeders/
├── modules/
│   └── <resource>/
│       ├── <resource>.routes.js
│       ├── <resource>.controller.js
│       ├── <resource>.service.js
│       └── <resource>.validation.js
├── middlewares/
│   ├── error.middleware.js
│   └── auth.middleware.js
└── shared/utils/
    ├── apiResponse.js
    └── catchAsync.js
```

**Request flow:** `Route → auth.middleware (optional) → validation → Controller → Service → Repository → DB`

### Frontend (`frontend/src/`)

```
src/
├── app/
│   ├── app.component.ts           ← root component (RouterOutlet only)
│   ├── app.config.ts              ← provideRouter, provideHttpClient
│   └── app.routes.ts              ← top-level routes (lazy-loaded features)
├── core/
│   ├── services/api.service.ts    ← base HTTP service
│   ├── interceptors/jwt.interceptor.ts
│   └── guards/auth.guard.ts
├── shared/
│   ├── components/
│   │   ├── sidebar/
│   │   ├── topbar/
│   │   └── footer/
│   └── shared.module.ts
├── features/
│   ├── categories/
│   │   ├── categories.routes.ts
│   │   ├── services/category.service.ts
│   │   ├── components/category-list/
│   │   ├── components/category-form/
│   │   └── pages/categories-page/
│   ├── products/
│   ├── customers/
│   ├── orders/
│   └── auth/
└── environments/
    ├── environment.ts             ← { apiUrl: 'http://localhost:3001/api' }
    └── environment.prod.ts
```

---

## Standard response format

All API endpoints return a consistent JSON envelope:

```json
{ "success": true,  "message": "Categories retrieved.", "data": [...] }
{ "success": false, "message": "Validation failed.", "errors": {...} }
```

Implemented in `backend/src/shared/utils/apiResponse.js`.

---

## feature/api/core-architecture

**Goal:** Transform the flat express-generator scaffold into the production-ready modular architecture.

### Files created

| File | Purpose |
|---|---|
| `backend/.env.example` | Template for required environment variables |
| `backend/.sequelizerc` | Points sequelize-cli to `src/database/` |
| `backend/package.json` | Updated: Express 5, Sequelize, all deps, yarn scripts |
| `src/config/env.js` | Centralized `process.env` reads with defaults |
| `src/config/database.js` | Runtime Sequelize instance |
| `src/database/config/config.js` | sequelize-cli config (reads `.env`) |
| `src/database/models/index.js` | Auto-loader for Sequelize models |
| `src/shared/utils/apiResponse.js` | Standard response envelope |
| `src/shared/utils/catchAsync.js` | Async error propagation wrapper |
| `src/middlewares/error.middleware.js` | Global error handler |
| `src/middlewares/auth.middleware.js` | JWT protect skeleton |
| `src/app.js` | Express factory with middleware stack |
| `src/server.js` | Entry point with DB connection guard |

### Files removed

Old express-generator scaffold: `app.js`, `bin/`, `routes/`, `public/`, `models/`

### Checklist

- [ ] `yarn install` succeeds
- [ ] `yarn dev` starts without error
- [ ] `GET http://localhost:3001` returns a response (not Express HTML 404)
- [ ] `yarn test:unit` → 0 failures
- [ ] code-reviewer approved

---

## feature/api/categories

**Endpoints:**

| Method | URL | Description |
|---|---|---|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:id` | Get one category |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/:id` | Update a category |
| DELETE | `/api/categories/:id` | Delete a category |

**Files:** model, migration, seeder, repository, validation, service, controller, routes, unit tests, integration tests.

---

## feature/api/products

**Endpoints:** same CRUD pattern as categories.
**Extra:** `GET /api/products` returns products with their associated category (`include: [Category]`).

---

## feature/api/customers

**Endpoints:** same CRUD pattern.

---

## feature/api/orders

**Endpoints:** same CRUD pattern.
**Business logic:** `total = qty × product.unit_price` computed in the service layer on create/update.

---

## feature/api/auth

**Endpoints:**

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account + send activation token |
| GET | `/api/auth/activate/:token` | No | Activate account |
| POST | `/api/auth/login` | No | Returns JWT |
| POST | `/api/auth/logout` | Yes | Blacklists the token |
| GET | `/api/auth/me` | Yes | Current user profile + roles |
| POST | `/api/auth/forgot-password` | No | Send reset token |
| POST | `/api/auth/reset-password/:token` | No | Set new password |

---

## feature/frontend/core-architecture

**Goal:** Migrate Angular 16 (NgModule) to Angular 21 (standalone components), reorganize into `core/`, `shared/`, `features/` structure.

### Key changes from Angular 16

| Angular 16 | Angular 21 |
|---|---|
| `@NgModule` everywhere | Standalone components (no NgModule) |
| `RouterModule.forRoot()` | `provideRouter()` in `app.config.ts` |
| `HttpClientModule` in AppModule | `provideHttpClient()` in `app.config.ts` |
| Class-based guards | Functional guards (`CanActivateFn`) |
| `HttpInterceptor` class | Functional interceptors |
| Builder: `browser` | Builder: `application` (esbuild) |

---

## feature/frontend/categories

**Components:** `CategoryListComponent`, `CategoryFormComponent`, `CategoriesPageComponent`
**Service:** `CategoryService` with `HttpClient`
**Route:** lazy-loaded under `/categories`

---

## feature/frontend/products

**Components:** `ProductListComponent`, `ProductFormComponent`, `ProductsPageComponent`
**Extra:** Category dropdown in form (cross-feature import allowed in form only)

---

## feature/frontend/customers

Same CRUD pattern.

---

## feature/frontend/orders

**Extra:** Product and customer dropdowns in form. Automatic total display.

---

## feature/frontend/auth

**Components:** `LoginComponent`, `RegisterComponent`
**Guard:** `authGuard` (functional) protects all `/features/*` routes
**Interceptor:** `jwtInterceptor` attaches `Authorization: Bearer <token>` header

---

## Order of work

```
master
└── develop
    ├── feature/api/core-architecture       ← 1st
    ├── feature/api/categories              ← 2nd
    ├── feature/api/products                ← 3rd
    ├── feature/api/customers               ← 4th
    ├── feature/api/orders                  ← 5th
    ├── feature/api/auth                    ← 6th (last backend)
    ├── feature/frontend/core-architecture  ← 7th
    ├── feature/frontend/categories         ← 8th
    ├── feature/frontend/products           ← 9th
    ├── feature/frontend/customers          ← 10th
    ├── feature/frontend/orders             ← 11th
    └── feature/frontend/auth               ← 12th (last frontend)
```

**Rule:** Each branch is merged to `develop` only after:
1. All unit tests pass (`yarn test:unit`)
2. All integration tests pass (`yarn test:integration --passWithNoTests`)
3. The `code-reviewer` agent has approved (no CRITICAL findings)

---

## Code conventions

### Commit format

```
<type>(<scope>): <short description>

<pedagogical body — REQUIRED>
Explain WHY this decision was made, the tradeoff, and the educational
context. Aim for 3-5 paragraphs for structural files, 1 paragraph
for simple files.

No "Co-Authored-By: Anthropic" lines.
```

**Types:** `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`

**Atomicity rule:** One commit per file created or modified. Never `git add .` and commit multiple files of different natures together.

### Example commit

```
feat(config): add src/config/env.js to centralize environment variables

Reading process.env directly in multiple files leads to scattered defaults
and makes it impossible to see at a glance what variables the application
expects. Any typo in a variable name silently evaluates to undefined.

env.js is the single source of truth: every process.env read happens here,
with explicit defaults and type coercions (parseInt for numeric values).
All other modules import from this file instead of process.env.

This also makes the application's external contract obvious to contributors:
they only need to look at one file to know what to put in .env.
```

---

## How to follow this tutorial

1. Clone the repository
2. Checkout `feature/api/core-architecture` — read the commits in order with `git log --oneline`
3. For each commit, read the full body with `git show <hash>` to understand the WHY
4. Move to the next feature branch and repeat
5. The frontend branches (`feature/frontend/*`) can be followed independently after completing all backend branches

**Start the backend:**
```bash
cd backend
cp .env.example .env   # fill in your MySQL credentials
yarn install
yarn dev               # http://localhost:3001
```

**Start the frontend:**
```bash
cd frontend
yarn install
yarn start             # http://localhost:4200
```

**Run database migrations:**
```bash
cd backend
yarn db:migrate
yarn db:seed
```
