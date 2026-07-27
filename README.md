# MEAN Tutorial

A hands-on walkthrough of building a full-stack CRUD application with **Express 5 / Node.js** (backend) and **Angular 21** (frontend), organized into Git branches that progressively cover the key concepts of the stack — with **MySQL 8** and **Sequelize ORM**, and completed with **JWT authentication** and **RBAC**.

The data model follows this EER schema: `categories` → `products` → `orders` ← `customers`. A separate `users` table with `roles` and `permissions` handles authentication.

This document is the **complete specification** of the project: it is meant to be followed branch by branch.

Repository: https://github.com/EdgarEldy/mean_tutorial

## Table of contents

- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Auth model (EER_AUTH)](#auth-model-eer_auth)
- [Branching strategy](#branching-strategy)
- [Project structure](#project-structure)
- [Standard response format](#standard-response-format)
- [Git commit convention](#git-commit-convention)
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
| Authentication | jsonwebtoken + bcryptjs | ^9.0.2 / ^3.0.2 |
| Environment | dotenv | ^16.5.0 |
| Tests | Jest + Supertest | ^29.7.0 / ^7.1.0 |
| Dev server | nodemon | ^3.1.10 |
| Package manager | yarn | 1.22.22 |

### Frontend

| Component | Choice | Version |
|---|---|---|
| Framework | Angular | ^21.0.0 |
| UI | Angular Material (M3 theming) + CDK | ^21.0.0 |
| HTTP Client | Angular HttpClient | built-in |
| Forms | Angular Reactive Forms | built-in |
| Notifications | ngx-toastr | ^20.0.5 |
| PDF export | jsPDF + jspdf-autotable | ^4.x / ^5.x |
| Unit tests | Karma + Jasmine | Angular default |
| E2E tests | Playwright | ^1.62.0 |
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
orders (id, customer_id FK, product_id FK, quantity, total)
    │ N
    │
    │ 1
customers (id, first_name, last_name, telephone, email, address)
```

### Column details

**categories**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| category_name | VARCHAR(255) | NOT NULL |

**products**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| category_id | BIGINT | FK → categories.id, NOT NULL |
| product_name | VARCHAR(255) | NOT NULL |
| unit_price | DECIMAL(10,2) | NOT NULL |

**customers**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| first_name | VARCHAR(255) | NOT NULL |
| last_name | VARCHAR(255) | NOT NULL |
| telephone | VARCHAR(20) | |
| email | VARCHAR(255) | UNIQUE |
| address | TEXT | |

**orders**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| customer_id | BIGINT | FK → customers.id, NOT NULL |
| product_id | BIGINT | FK → products.id, NOT NULL |
| quantity | INT | NOT NULL |
| total | DECIMAL(10,2) | computed = quantity × unit_price |

---

## Auth model (EER_AUTH)

The authentication and authorization system uses the following tables:

```
users ──< role_user >── roles ──< role_permission >── permissions
  │
  ├──< blacklisted_tokens
  ├──< activation_tokens
  └──< password_reset_tokens
```

**users**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| first_name | VARCHAR(50) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | bcryptjs hash |
| enabled | BOOLEAN | NOT NULL, default false |
| account_locked | BOOLEAN | NOT NULL, default false |

**roles**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| role_name | VARCHAR(50) | NOT NULL, UNIQUE |

**permissions**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| resource | VARCHAR(50) | NOT NULL |
| action | VARCHAR(50) | NOT NULL |

**role_user** (pivot, no timestamps)

| Column | Type | Constraints |
|---|---|---|
| user_id | BIGINT | FK → users.id, CASCADE |
| role_id | BIGINT | FK → roles.id, CASCADE |

**role_permission** (pivot, no timestamps)

| Column | Type | Constraints |
|---|---|---|
| role_id | BIGINT | FK → roles.id, CASCADE |
| permission_id | BIGINT | FK → permissions.id, CASCADE |

**activation_tokens** (timestamps: false)

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| user_id | BIGINT | FK → users.id, CASCADE |
| token | VARCHAR(255) | |
| created_at | DATETIME | NOT NULL |
| expires_at | DATETIME | |
| validated_at | DATETIME | |

**blacklisted_tokens** (timestamps: false)

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| user_id | BIGINT | FK → users.id, SET NULL (nullable) |
| token | VARCHAR(768) | NOT NULL |
| jti | VARCHAR(255) | UNIQUE |
| blacklisted_at | DATETIME | |
| created_at | DATETIME | NOT NULL |
| expires_at | DATETIME | |
| validated_at | DATETIME | |

**password_reset_tokens** (timestamps: false)

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| user_id | BIGINT | FK → users.id, SET NULL (nullable) |
| token | VARCHAR(255) | NOT NULL |
| type | VARCHAR(255) | NOT NULL |
| expiry_date | DATETIME | NOT NULL |

### Authorization rules

| Resource | GET | POST / PUT / DELETE |
|---|---|---|
| `categories`, `products` | Public | Admin role |
| `customers`, `orders` | Authenticated | Admin role |
| `auth/*` | Public | — |

---

## Branching strategy

| Branch | Role |
|---|---|
| `master` | Stable, production-ready. No direct commits — merges only from `develop`. |
| `develop` | Integration branch. All `feature/*` branches merge here. |
| `feature/api/core-architecture` | Technical foundation: `src/` structure, config, deps, shared utils, error middleware. |
| `feature/api/categories` | `Category` module: model, migration, seeder, repository, service, controller, routes, validation, tests. |
| `feature/api/products` | `Product` module with FK to `Category`. |
| `feature/api/customers` | `Customer` module. |
| `feature/api/orders` | `Order` module with business logic (total calculation). |
| `feature/api/auth` | JWT auth: register, activate, login, logout, forgot-password, reset-password, RBAC. |
| `feature/frontend/core-architecture` | Angular 21 base: standalone app, routing, HttpClient, core services. |
| `feature/frontend/categories` | Categories feature: service, list/form components, lazy route. |
| `feature/frontend/products` | Products feature. |
| `feature/frontend/customers` | Customers feature. |
| `feature/frontend/orders` | Orders feature with automatic total display. |
| `feature/frontend/auth` | Login/Register pages, JWT interceptor, route guard. |

Each feature branch ends with a Pull Request to `develop`. Each PR must include atomic commits (one per file) and passing unit + integration tests.

---

## Project structure

### Backend (`backend/src/`)

```
src/
├── server.js                      ← entry point
├── app.js                         ← Express factory, versioned sub-router
├── config/
│   ├── env.js                     ← single source for all process.env reads
│   └── database.js                ← runtime Sequelize instance
├── database/
│   ├── config/config.js           ← sequelize-cli config (reads .env)
│   ├── models/index.js            ← auto-loader (fs.readdirSync)
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
│   └── auth.middleware.js         ← JWT verify + jti blacklist check
└── shared/utils/
    ├── apiResponse.js
    └── catchAsync.js
```

**Request flow:** `Route → auth.middleware (optional) → validation → Controller → Service → Repository → DB`

**Versioned router:** all API endpoints live under `/api/v1/` via a sub-router mounted in `app.js`:

```js
const v1 = express.Router();
v1.use('/auth',       require('./modules/auth/auth.routes'));
v1.use('/categories', require('./modules/categories/category.routes'));
// ...
app.use('/api/v1', v1);
```

### Frontend (`frontend/src/`)

```
src/
├── app/
│   ├── app.component.ts           ← root component (Material sidenav shell)
│   ├── app.config.ts              ← provideRouter, provideHttpClient, provideAnimationsAsync, provideToastr
│   ├── app.routes.ts              ← top-level routes (lazy-loaded features)
│   ├── core/
│   │   ├── models/api-response.model.ts   ← ApiResponse<T> envelope type
│   │   ├── services/api.service.ts        ← generic HTTP service (returns ApiResponse<T>)
│   │   ├── interceptors/jwt.interceptor.ts
│   │   └── guards/auth.guard.ts
│   ├── shared/
│   │   └── components/
│   │       ├── sidebar/           ← MatNavList
│   │       ├── topbar/            ← MatToolbar + MatMenu
│   │       ├── footer/
│   │       └── data-table/        ← generic <T> table: client-side search, pagination, PDF export
│   ├── pages/
│   │   └── home/                  ← placeholder landing page for '/'
│   └── features/
│       ├── categories/
│       │   ├── categories.routes.ts
│       │   ├── services/category.service.ts
│       │   ├── components/category-list/
│       │   ├── components/category-form/
│       │   └── pages/categories-page/
│       ├── products/
│       ├── customers/
│       ├── orders/
│       └── auth/
└── environments/
    ├── environment.ts             ← { apiUrl: 'http://localhost:3001/api/v1' }
    └── environment.prod.ts
```

---

## Standard response format

All API endpoints return a consistent JSON envelope:

```json
{ "success": true,  "message": "Categories retrieved.", "data": [...] }
{ "success": false, "message": "Validation failed.", "errors": [...] }
```

Implemented in `backend/src/shared/utils/apiResponse.js`.

HTTP status codes follow REST conventions: `200` for success, `201` for creation, `404` for not found, `409` for conflict, `422` for validation failures, `401`/`403` for auth errors.

---

## Git commit convention

All commits follow **Conventional Commits**.

### Format

```
<type>(<scope>): <short summary>

<body — what was done and why>
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or file |
| `fix` | Bug fix |
| `refactor` | Code change that is neither a bug fix nor a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Tooling, config, CI, deps |
| `ci` | CI/CD pipeline changes |

### Atomic commit rule

> **One commit per file added or modified.** Never group unrelated files in a single commit.

### Example commit

```
feat(config): add src/config/env.js to centralize environment variables

Reading process.env directly in multiple files leads to scattered defaults
and makes it impossible to see at a glance what variables the application
expects.

env.js is the single source of truth: every process.env read happens here,
with explicit defaults and type coercions (parseInt for numeric values).
All other modules import from this file instead of process.env.
```

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
| `src/app.js` | Express factory with middleware stack and versioned sub-router |
| `src/server.js` | Entry point with DB connection guard |

### Files removed

Old express-generator scaffold: `app.js`, `bin/`, `routes/`, `public/`, `models/`

### Checklist

- [ ] `yarn install` succeeds
- [ ] `yarn dev` starts without error
- [ ] `GET http://localhost:3001` returns a response
- [ ] `yarn test:unit` passes

---

## feature/api/categories

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/categories` | List all categories |
| GET | `/api/v1/categories/:id` | Get one category |
| POST | `/api/v1/categories` | Create a category |
| PUT | `/api/v1/categories/:id` | Update a category |
| DELETE | `/api/v1/categories/:id` | Delete a category |

### Files (one commit each)

`category.js` (model) → migration → seeder → `category.repository.js` → `category.validation.js` → `category.service.js` → `category.controller.js` → `category.routes.js` → unit tests → integration tests

### Checklist

- [ ] All 5 endpoints return the standard response envelope
- [ ] `POST` returns `201`; missing `category_name` returns `422`
- [ ] `GET /:id` returns `404` for unknown id
- [ ] Unit tests pass
- [ ] Integration tests pass (`sequelize.sync({ force: true })` in `beforeAll`)

---

## feature/api/products

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/products` | List all products (includes category) |
| GET | `/api/v1/products/:id` | Get one product (includes category) |
| POST | `/api/v1/products` | Create a product |
| PUT | `/api/v1/products/:id` | Update a product |
| DELETE | `/api/v1/products/:id` | Delete a product |

**Extra:** `GET /api/v1/products` and `GET /api/v1/products/:id` eager-load the associated `Category`.

### Checklist

- [ ] Nested `category` object present on product responses
- [ ] `POST` with non-existent `category_id` returns `404`
- [ ] Unit and integration tests pass

---

## feature/api/customers

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/customers` | List all customers |
| GET | `/api/v1/customers/:id` | Get one customer |
| POST | `/api/v1/customers` | Create a customer |
| PUT | `/api/v1/customers/:id` | Update a customer |
| DELETE | `/api/v1/customers/:id` | Delete a customer |

### Checklist

- [ ] `POST` with invalid email format returns `422`
- [ ] Unit and integration tests pass

---

## feature/api/orders

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/orders` | List all orders (includes customer + product + category) |
| GET | `/api/v1/orders/:id` | Get one order |
| POST | `/api/v1/orders` | Create an order (`total` computed automatically) |
| PUT | `/api/v1/orders/:id` | Update an order (`total` recomputed) |
| DELETE | `/api/v1/orders/:id` | Delete an order |

### Business logic

`total = quantity × product.unit_price` — computed in the service layer on create and update. The client never sends `total`; it is always rejected.

### Checklist

- [ ] `POST` with unknown `product_id` returns `404`
- [ ] `POST` without `quantity` returns `422`
- [ ] Response `total` matches `quantity × unit_price`
- [ ] Nested `customer`, `product`, and `product.category` present on responses
- [ ] Unit and integration tests pass

---

## feature/api/auth

Full RBAC + JWT authentication — register, account activation, login, logout, password reset.

### Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Create account + return activation token |
| GET | `/api/v1/auth/activate/:token` | No | Activate account |
| POST | `/api/v1/auth/login` | No | Returns JWT |
| POST | `/api/v1/auth/logout` | Bearer JWT | Blacklists the current JWT |
| POST | `/api/v1/auth/forgot-password` | No | Returns password reset token |
| POST | `/api/v1/auth/reset-password` | No | Consume token, set new password |

### Files (one commit each)

Migrations (8) → Models (6) → Seeders (2) → Repositories (5) → `auth.middleware.js` → `auth.validation.js` → `auth.service.js` → `auth.controller.js` → `auth.routes.js` → `app.js` (mount)

### Seeders

- `20240101000004-seed-roles.js` — 2 roles: `admin`, `user`
- `20240101000005-seed-permissions.js` — 20 permissions: 5 resources × 4 actions (create, read, update, delete)

### Middleware (`auth.middleware.js`)

```
1. Extract Bearer token from Authorization header → 401 if missing
2. jwt.verify(token, JWT_SECRET) → 401 if invalid or expired
3. blacklistedTokenRepository.findByJti(decoded.jti) → 401 if found
4. userRepository.findById(decoded.id) → 401 if not found
5. Check user.enabled → 403 if false
6. Check user.account_locked → 403 if true
7. Attach req.user, req.token, req.tokenDecoded → next()
```

### Checklist

- [ ] `POST /register` returns `activationToken` in response
- [ ] `GET /activate/:token` sets `enabled = true` on the user
- [ ] `POST /login` on inactive account returns `403`
- [ ] `POST /logout` + subsequent request with same token returns `401`
- [ ] `POST /forgot-password` returns `resetToken`
- [ ] `POST /reset-password` with expired token returns `400`
- [ ] Unit and integration tests pass

---

## feature/frontend/core-architecture

**Goal:** Migrate Angular 16 (NgModule) to Angular 21 (standalone components), reorganize into `core/`, `shared/`, `features/` structure, and fully replace the SB Admin 2 (Bootstrap 4 + jQuery + DataTables + ng-bootstrap) template with Angular Material. No feature UI (categories/products/customers/orders/auth) is rebuilt here — each gets its own branch — this branch is the technical foundation only.

### Key changes from Angular 16

| Angular 16 | Angular 21 |
|---|---|
| `@NgModule` everywhere | Standalone components (no NgModule) |
| `RouterModule.forRoot()` | `provideRouter()` in `app.config.ts` |
| `HttpClientModule` in AppModule | `provideHttpClient()` in `app.config.ts` |
| Class-based guards | Functional guards (`CanActivateFn`) |
| `HttpInterceptor` class | Functional interceptors |
| Builder: `browser` | Builder: `application` (esbuild) |
| SB Admin 2 (Bootstrap 4 + jQuery + DataTables + ng-bootstrap) | Angular Material (M3 theming) + CDK |
| `@Output() EventEmitter` | `output()` |
| RxJS + `async` pipe for simple UI state | `signal()` / `computed()` / `toSignal()` |

### Tasks

- [x] Bump `@angular/*` to `^21.2.18`, add `@angular/material` + `@angular/cdk` (`^21.2.14`), drop `@ng-bootstrap/ng-bootstrap` + `bootstrap` + `@popperjs/core`
- [x] Switch `angular.json` build/serve targets to the `application` (esbuild) builder
- [x] Switch `tsconfig.json` to `moduleResolution: "bundler"` / `module: "preserve"` (required for Angular Material's `package.json` `exports`-based subpath resolution)
- [x] Remove the entire SB Admin 2 asset bundle (`bootstrap*`, `jquery*`, `dataTables*`, `sb-admin-2*`, Font Awesome fonts) from `src/assets/`
- [x] Remove the NgModule bootstrap (`app.module.ts`, `app-routing.module.ts`) and the old `pages/categories`, `pages/products`, `pages/dashboard`, root-level `services/`, `models/`
- [x] Add standalone bootstrap: `main.ts` (`bootstrapApplication`), `app.config.ts` (`provideRouter`, `provideHttpClient` with the JWT interceptor, `provideAnimationsAsync`, `provideToastr`), `app.routes.ts`
- [x] Rebuild `app.component.ts` as a `mat-sidenav-container` shell (responsive `side`/`over` mode via `BreakpointObserver` + `toSignal()`), composing `shared/components/{sidebar,topbar,footer}`
- [x] Add `core/models/api-response.model.ts` (`ApiResponse<T>`) matching `backend/src/shared/utils/apiResponse.js`'s envelope
- [x] Add `core/services/api.service.ts`: generic `HttpClient` wrapper over `environment.apiUrl`, returning the full `ApiResponse<T>` envelope (not unwrapped) so feature services can still surface `message`/`errors`
- [x] Add `core/interceptors/jwt.interceptor.ts` and `core/guards/auth.guard.ts` as functional placeholders (both read/check a `localStorage` token; nothing sets one until `feature/frontend/auth`)
- [x] Add `environments/environment.ts` / `environment.prod.ts` with `apiUrl: 'http://localhost:3001/api/v1'`
- [x] Add a minimal `pages/home/` placeholder landing page for `/` (previous `DashboardComponent`'s stat cards had no real data behind them)
- [x] Add `shared/components/data-table/`: a generic `<T>` Material table with client-side search (`MatTableDataSource` filter predicate), pagination (`MatPaginator`), and PDF export (`jsPDF` + `jspdf-autotable`, dynamically imported) — meant to be reused by every future feature list view instead of each branch rebuilding search/pagination/export from scratch
- [x] Set up Angular Material M3 theming in `styles.scss` (`mat.theme()`, azure primary / magenta tertiary, Roboto typography)
- [x] Set up Playwright (`playwright.config.ts`, `e2e/shell.spec.ts`) for end-to-end tests alongside Karma + Jasmine for unit tests
- [x] Karma + Jasmine unit tests for every new component/service/guard/interceptor
- [x] Code review pass (no CRITICAL findings after fixes)

### Checklist

- [x] `yarn install` succeeds
- [x] `yarn start` serves the Material shell (sidebar/topbar/footer/home) without console errors
- [x] `ng build` succeeds
- [x] `yarn test` passes (30/30)
- [x] `yarn e2e` passes (Playwright, 2/2)

---

## feature/frontend/categories

First complete vertical slice on top of `feature/frontend/core-architecture`: Category CRUD
using Reactive Forms, a MatDialog form, and the shared `DataTableComponent`.

### Endpoints consumed

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/categories` | List all categories |
| POST | `/api/v1/categories` | Create a category |
| PUT | `/api/v1/categories/:id` | Update a category |
| DELETE | `/api/v1/categories/:id` | Delete a category |

### Tasks

- [x] Add `features/categories/models/category.model.ts` (`Category`, `CategoryInput`)
- [x] Add `features/categories/services/category.service.ts`: wraps `ApiService` against `/categories`, unwraps the `ApiResponse<T>` envelope for callers, and owns the `ngx-toastr` success/error feedback for this resource
- [x] Add `shared/components/confirm-dialog/`: a generic yes/no `MatDialog`, introduced here for the delete confirmation and meant to be reused by products/customers/orders
- [x] Add `features/categories/components/category-form/`: `MatDialog` content with a Reactive Form (`category_name`, `required` + `maxLength(255)`, mirroring `category.validation.js`), pre-filled in edit mode
- [x] Add `features/categories/components/category-list/`: thin wrapper configuring the shared `DataTableComponent` (single `category_name` column, edit/delete row actions)
- [x] Add `features/categories/pages/categories-page/`: route-level page owning the list state (`signal<Category[]>`), opening the form dialog for create/edit and the confirm dialog for delete, reloading the list after every successful mutation
- [x] Add `features/categories/categories.routes.ts` (`loadComponent()`) and wire it into `app.routes.ts` under `/categories`
- [x] Add the Categories link to `shared/components/sidebar/`
- [x] Karma + Jasmine unit tests for the service, both dialog components, the list component, and the page component
- [x] Code review pass (no CRITICAL findings after fixing an unhandled-error gap on the create/update/delete subscriptions)

### Checklist

- [x] `ng build --configuration development` succeeds
- [x] `yarn test` passes (75/75)
- [ ] Manual check: create, edit, delete, search, and PDF export against the running backend (not exercised in a browser yet, no MySQL instance was available in the environment this branch was built in)

---

## feature/frontend/products

Second vertical slice, same CRUD pattern as categories plus the codebase's one sanctioned
cross-feature import: the product form needs a category dropdown.

### Endpoints consumed

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/products` | List all products (nested `category` included) |
| POST | `/api/v1/products` | Create a product (response has no nested `category`) |
| PUT | `/api/v1/products/:id` | Update a product (nested `category` included) |
| DELETE | `/api/v1/products/:id` | Delete a product |

### Tasks

- [x] Add `features/products/models/product.model.ts` (`Product`, `ProductInput`); `category` is optional and typed with a locally-declared shape (not imported from the categories feature) since only `product.repository.js`'s `findAll`/`findById` eager-load the association, `create` does not
- [x] Add `features/products/services/product.service.ts`: same shape as `CategoryService`, wraps `/products`
- [x] Add `features/products/components/product-form/`: Reactive Form (`product_name` required + `maxLength(255)`, `unit_price` required + `min(0)`, `category_id` required + `min(1)`) mirroring `product.validation.js`. Loads categories via `CategoryService.getAll()` (the one sanctioned cross-feature import) through a `shareReplay(1)` observable exposed with `toSignal()`, and adds an `AsyncValidatorFn` on `category_id` that re-checks the selected id against that same shared observable instead of a fresh request per keystroke, guarding against a category deleted between page load and submit
- [x] Add `features/products/components/product-list/`: shared `DataTableComponent` wrapper (name/category/unit price columns) with a `computed()` product count; category name read straight off the row (already resolved by the backend), falling back to "Uncategorized" for a freshly created row
- [x] Add `features/products/pages/products-page/`: same page-level pattern as categories (list state via `signal()`, form + confirm dialogs, reload after mutation)
- [x] Add `features/products/products.routes.ts` and wire it into `app.routes.ts` under `/products`; add the Products link to the sidebar
- [x] Karma + Jasmine unit tests for the service, form component (including the async validator and the `form.invalid || form.pending` guard in `submit()`), list component, and page component
- [x] Code review pass (no CRITICAL findings; hardened `submit()` to also check `form.pending` since `form.invalid` alone doesn't cover a still-resolving async validator)

### Checklist

- [x] `ng build --configuration development` succeeds
- [x] `yarn test` passes (125/125)
- [ ] Manual check: create, edit, delete (including the category dropdown and its async validation) against the running backend (not exercised in a browser yet, no MySQL instance was available in the environment this branch was built in)

---

## feature/frontend/customers

Third vertical slice, same CRUD pattern as categories/products but with the opposite
validation shape: every field is optional at the backend, so the frontend form has no
`Validators.required` at all, only format/length checks.

### Endpoints consumed

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/customers` | List all customers |
| POST | `/api/v1/customers` | Create a customer (any/all fields may be omitted) |
| PUT | `/api/v1/customers/:id` | Update a customer |
| DELETE | `/api/v1/customers/:id` | Delete a customer |

### Tasks

- [x] Add `features/customers/models/customer.model.ts` (`Customer` with every field
      `string | null`, `CustomerInput` as `Partial<Omit<Customer, 'id'>>`), mirroring
      `customer.js`'s `allowNull: true` columns and `customer.validation.js`'s `.optional()`
      rules
- [x] Add `features/customers/services/customer.service.ts`: same shape as
      `CategoryService`/`ProductService`, wraps `/customers`
- [x] Add `features/customers/components/customer-form/`: Reactive Form with no
      `Validators.required` anywhere, only `maxLength`/`email`/a permissive telephone pattern,
      matching the backend's fully-optional validation
- [x] Fix (caught in code review before merge): `submit()` now strips blank fields instead of
      sending them as empty strings. `express-validator`'s `.optional()` only skips a field
      when the key is entirely absent from the body, not when it's present as `''`, so an
      unstripped payload would 422 on `isEmail('')` whenever email was left blank, defeating
      the point of this branch
- [x] Add `features/customers/components/customer-list/`: shared `DataTableComponent` wrapper
      (name/email/telephone columns), each falling back to a placeholder instead of rendering
      `null` for an unset field
- [x] Add `features/customers/pages/customers-page/`: same page-level pattern as
      categories/products
- [x] Add `features/customers/customers.routes.ts` and wire it into `app.routes.ts` under
      `/customers`; add the Customers link to the sidebar
- [x] Karma + Jasmine unit tests for the service, form component (including the
      strip-blank-fields fix), list component, and page component
- [x] Code review pass (one CRITICAL finding: the blank-fields bug above, fixed before merge)

### Checklist

- [x] `ng build --configuration development` succeeds
- [x] `yarn test` passes (179/179)
- [ ] Manual check: create a customer with only some fields filled in, edit, delete, against
      the running backend (not exercised in a browser yet, no MySQL instance was available in
      the environment this branch was built in)

---

## feature/frontend/orders

Fourth and most complex vertical slice: the only resource consumed over GraphQL instead of
REST, a form with two cross-feature dropdowns and a live computed total, and a functional
route resolver for a deep-link-to-edit URL.

### GraphQL operations consumed

| Operation | Name | Description |
|---|---|---|
| Query | `orders` | List all orders |
| Query | `order(id)` | Single order, used by the edit-deep-link resolver |
| Mutation | `createOrder(input)` | Create an order |
| Mutation | `updateOrder(id, input)` | Update an order |
| Mutation | `deleteOrder(id)` | Delete an order |

### Tasks

- [x] Add `core/services/graphql.service.ts` + `core/models/graphql-response.model.ts`: a
      thin POST wrapper around `/api/v1/graphql`, the GraphQL counterpart to `ApiService`.
      Treats a non-empty `errors` array as the primary failure signal instead of HTTP status,
      since Apollo Server returns 200 even when a resolver throws
- [x] Add `features/orders/models/order.model.ts`: `Order.id` and nested `customer.id`/
      `product.id` are typed `string` (GraphQL's `ID` scalar always serializes as a string),
      unlike the REST features where ids are `number`
- [x] Add `features/orders/services/order.service.ts`: uses `GraphqlService` instead of
      `ApiService`, otherwise the same unwrap + toast + rethrow shape as the REST feature
      services
- [x] Add `features/orders/components/order-form/`: two cross-feature dropdowns
      (`CustomerService`/`ProductService`, reusing the existing REST services rather than
      re-fetching over GraphQL), coercing the order's string ids to numbers in edit mode
      (`Number(order.customer?.id)`) so `mat-select`'s strict-equality value matching finds
      the pre-filled option. A `computed()` `total` derived from `toSignal()`'d
      `product_id`/`quantity` value changes mirrors the server-side `quantity × unit_price`
      calculation live, before the order is even submitted
- [x] Add `features/orders/components/order-list/`: shared `DataTableComponent` wrapper
      (customer/product/quantity/total columns, each falling back since `customer`/`product`
      are nullable in the GraphQL schema) plus a `computed()` total revenue
- [x] Add `features/orders/pages/orders-page/`: same page-level pattern as the other
      features, plus handling for a resolver-driven deep link (see below)
- [x] Add `features/orders/order.resolver.ts`: a functional `ResolveFn` that preloads an
      order for the `/orders/:id/edit` route before it activates, falling back to `/orders`
      if the id doesn't resolve
- [x] Add `features/orders/orders.routes.ts` (`''` and `':id/edit'`, both `loadComponent()`
      the same page) and wire it into `app.routes.ts`; add the Orders link to the sidebar
- [x] Fix (caught in code review before merge): the page originally read the resolved order
      from a one-time `ngOnInit` snapshot. Since `''` and `:id/edit` both load the same
      component, Angular's default route reuse strategy can keep that instance alive across
      navigations between two different edit deep links without re-running `ngOnInit`,
      silently missing the second one. Switched to reading `route.data` reactively via
      `toSignal()` plus an `effect()`, and navigate back to `/orders` once the deep-linked
      dialog closes so the URL doesn't keep pointing at a route with nothing open
- [x] Karma + Jasmine unit tests for `GraphqlService`, `OrderService`, the form (including a
      dedicated regression test for the string-vs-number id coercion), the list, the page
      (including the deep-link flow), and the resolver
- [x] Code review pass (no CRITICAL findings; two WARNINGs on the resolver/route-reuse
      interaction fixed before merge, see above)

### Checklist

- [x] `ng build --configuration development` succeeds
- [x] `yarn test` passes (241/241)
- [ ] Manual check: create/edit/delete an order (including the live total and the
      `/orders/:id/edit` deep link) against the running backend and its `/api/v1/graphql`
      endpoint (not exercised in a browser yet, no MySQL instance was available in the
      environment this branch was built in)

---

## feature/frontend/auth

**Components:** `LoginComponent`, `RegisterComponent`
**Guard:** `authGuard` (functional) protects all `/features/*` routes
**Interceptor:** `jwtInterceptor` attaches `Authorization: Bearer <token>` header to every outgoing request

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
    ├── feature/api/auth                    ← 6th  (last backend)
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
3. No CRITICAL findings from the `code-reviewer` agent

---

## Code conventions

### Naming

| Layer | Convention | Example |
|---|---|---|
| Files | kebab-case | `category.service.js` |
| Functions | camelCase | `getAllCategories` |
| Variables | camelCase | `categoryId` |
| DB columns | snake_case | `category_name` |
| Routes | kebab-case | `/api/v1/reset-password` |

### Error propagation

All async route handlers are wrapped in `catchAsync()`. Services throw plain `Error` objects with a `statusCode` property. The global `error.middleware.js` catches everything.

### No `total` from client

The `total` field on orders is always computed server-side. Any `total` value sent by the client is silently ignored.

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

**Run database migrations and seeders:**
```bash
cd backend
yarn db:migrate
yarn db:seed
```

**Run tests:**
```bash
yarn test:unit
yarn test:integration
```
