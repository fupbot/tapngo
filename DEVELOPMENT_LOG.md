# TapNGo — Development Log

This document provides a chronologically structured log of the steps, trade-offs, and decisions taken during the design and development of the **TapNGo** self-service kiosk system.

---

## High-Level Step-by-Step Log

* **Step 1: Requirements Gathering & Domain Exploration**
  * Analyzed quick-service snack bar kiosk requirements: standalone touch-screen operation, unattended edge cases, high throughput, and lack of cashier support.
  * Identified key domain risks: abandoned carts, double-tap race conditions, inventory exhaustion concurrency, and unexpected network/payment failures.

* **Step 2: Architectural Specification & Stack Selection**
  * Selected Python 3.12 with **FastAPI** for backend high performance, asynchronous request handling, and clean OpenAPI auto-generation.
  * Selected **SQLite with SQLAlchemy 2.0** with WAL (Write-Ahead Logging) mode and busy timeout handling for robust transactional persistence without extra infrastructure overhead.
  * Chosen **React + TypeScript + Vite** for lightweight, touch-optimized frontend UI state management and target sizing.
  * Defined **Docker Compose** containerization with **NGINX** reverse proxy for unified client/API routing.

* **Step 3: Database Schema & Core Models Definition**
  * Designed SQL schema for `products`, `orders`, `order_items`, and `payment_transactions`.
  * Configured order status lifecycle transitions: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `COMPLETED` / `CANCELLED`.
  * Implemented database dynamic seeding script (`seed.py`) to initialize default product catalog items with starting stock levels.

* **Step 4: Backend API & Service Layer Implementation**
  * Implemented RESTful API endpoints for catalog browsing (`/api/v1/products`), order creation (`/api/v1/orders`), and payment execution (`/api/v1/payments`).
  * Integrated atomic transaction handling and dynamic inventory decrement checks during checkout.
  * Added concurrency protection using payment timestamp ordering to resolve simultaneous stock claims cleanly.

* **Step 5: Payment Service Abstraction & Admin Failure Controls**
  * Created pluggable `PaymentService` strategy abstraction supporting Credit Card (tap/chip), Mobile Pay (Apple/Google Pay), and Store Card.
  * Implemented lightweight authentication separating regular kiosk clients (`kiosk1`, `kiosk2`, `kiosk3`) from `admin` users.
  * Built an admin failure injection mechanism enabling forced payment declines, timeouts, or backend error simulation for UI resilience verification.

* **Step 6: Touch-First Kiosk UI & Ergonomics**
  * Developed React frontend with high-contrast UI components, touch targets ($>48\text{px}$), and single-touch interaction constraints.
  * Implemented automatic **15-second idle detection** triggering a 15-second modal countdown prompt ("Are you there?") before resetting to the home screen.
  * Added a **3-second order confirmation banner** display before returning to the initial "ORDER HERE" state for subsequent customers.

* **Step 7: Containerization & Reverse Proxy Setup**
  * Created multi-stage `Dockerfile` for backend Uvicorn application and frontend Vite React build.
  * Configured NGINX reverse proxy to serve frontend SPA routes while routing `/api/*` to FastAPI application seamlessly.
  * Authored `docker-compose.yml` for single-command environment bootstrapping (`docker compose up --build`).

* **Step 8: Testing & Verification**
  * Added backend `pytest` suite testing order creation logic, inventory deduction edge cases, dynamic stock checks, and payment status updates.
  * Added frontend `vitest` unit tests verifying cart management, timer behavior, single-tap constraints, and order confirmation UI cycles.

* **Step 9: Pre-Implementation Review Pass**
  * Before writing code, reviewed the initial spec against the goal of a lean, few-days build rather than maximal scope. Concrete changes made as a result:
    * **Concurrency:** Replaced the "resolve by comparing payment timestamps across requests" framing with a single atomic `UPDATE ... WHERE stock >= 1` decrement. SQLite serializes writers regardless, so a timestamp-comparison mechanism added complexity without changing the customer-facing outcome — whichever request's atomic decrement commits first wins; the other gets a 409.
    * **Order lifecycle:** Nothing in scope ever drives `PREPARING` → `COMPLETED` (no kitchen/staff app). Rather than leave that dangling, it's auto-simulated by a short server-side timer after `PAID`.
    * **Admin access:** Specified how an admin actually reaches the debug/failure-injection panel without the customer flow ever showing a login prompt — a discreet long-press gesture on a small header element, kept out of the normal tap path.
    * **Failure handling scope:** Extended beyond admin-forced failures to cover real unprompted failures (dropped network, timeout, unexpected 500) with one consistent client-side error/retry pattern.
    * **Cut branded physical collateral** (cup/wrapper mockups) — graphic design effort that doesn't demonstrate engineering judgment; kept the color palette and wordmark only.
    * **Folded the requirements-elicitation Q&A into this log and the ADR** rather than keeping the raw transcript as a separate file, so the repo reads as project documentation rather than an interview artifact.

* **Step 10: Backend Implementation**
  * Created a Python 3.12 venv at `backend/venv` and pinned dependencies (`fastapi`, `uvicorn`, `sqlalchemy>=2.0`, `pydantic`, `pydantic-settings`) to `requirements.txt`.
  * Built the SQLAlchemy 2.0 models (`User`, `Product`, `Order`, `OrderItem`, `PaymentTransaction`) and wired SQLite WAL mode + busy timeout via a `PRAGMA`-setting `connect` event listener.
  * Implemented `POST /api/v1/orders` (creates a `PENDING` order from a cart), `GET /api/v1/orders/{id}` (status polling), and `POST /api/v1/orders/{id}/pay` — the core endpoint, which:
    * runs the pluggable `PaymentProcessor` strategy (credit card / Apple Pay / Google Pay / store card, all mock),
    * on success, atomically decrements stock per item (`UPDATE ... WHERE stock >= quantity`) inside the order's transaction, rolling the whole order back to `CANCELLED` with a 409 if any item sold out, per the simplified concurrency approach from Step 9,
    * on an admin-forced `debug_failure_mode`, returns a 402 (decline), 504 (timeout), or 500 (server error) so the frontend has real failure responses to build against.
  * Added `GET /api/v1/products` and `POST /api/v1/auth/login` (plaintext password check against the `users` table, no hashing/JWT — intentional, per spec).
  * Gated `debug_failure_mode` server-side on an `X-Role: admin` header the client re-sends after login — trivial by design, documented in `app/deps.py` as not real security.
  * Wrote an idempotent `seed.py` (runs on every app startup) seeding 4 users (`admin`, `kiosk1-3`) and a 14-item snack bar menu across 4 categories, with one item (`Nachos`) deliberately seeded at 0 stock to exercise the sold-out UI state immediately.
  * Order lifecycle (`PAID` → `PREPARING` → `COMPLETED`) runs via FastAPI `BackgroundTasks` on a worker thread (not `asyncio.create_task`, which has no running loop to attach to from a sync endpoint dispatched to FastAPI's threadpool).
  * Smoke-tested every path manually with `uvicorn` + `curl`: catalog fetch, order creation, successful payment + stock decrement, lifecycle auto-advance, sold-out 409, non-admin 403 on forced failure, admin-forced decline/timeout/server-error (402/504/500).

* **Step 11: Frontend Shell**
  * Scaffolded Vite + React + TypeScript, added Tailwind v4 (via `@tailwindcss/vite`) and React Router. Set up a `@/` path alias and a dev-server proxy (`/api` -> `localhost:8000`) mirroring the NGINX routing the Docker Compose setup will use.
  * Defined the "Kiosk Fresh" design tokens (teal/orange/white palette, Poppins display font) as Tailwind `@theme` variables in `index.css`; disabled pinch-zoom/double-tap-zoom at the document level.
  * Built the navigation shell: `Layout` (header, admin gesture target, idle-warning modal) wrapping routed pages — Landing, Menu, Payment, Confirmation — via React Router.
  * Implemented the three cross-cutting kiosk behaviors as dedicated hooks: `useIdleReset` (15s idle -> 15s "Are you there?" countdown -> clear cart + return to landing), `useSingleTouchGuard` (rejects multi-touch at the document level), `useLongPress` (the discreet admin-access gesture, no visible affordance).
  * Wired a typed API client (`lib/api.ts`) against the real backend — login, product fetch, order creation, and payment, including the 402-decline special case (a legitimate business outcome carrying a full response body, not a wire-level error).
  * Built out the actual pages against the live API: Menu (grouped by category, sold-out items disabled, running cart footer), Payment (order summary, 4 payment method tiles, admin-only failure-simulation radio panel, error/retry handling for declines/409/504/500), Confirmation (order number, 3s auto-return).
  * **Verification:** `tsc -b`, `vite build`, and `oxlint` all pass clean. Headless-browser verification wasn't available out of the box (missing shared libs, no root) — worked around it by downloading the required `.deb`s with `apt-get download` (no install) and pointing `LD_LIBRARY_PATH` at the extracted `.so` files, rather than skipping visual verification. Drove the app end-to-end with Playwright against the real backend: landing -> menu -> cart -> payment -> confirmation -> auto-return; admin long-press -> login -> forced decline; and a real 15s+15s idle-reset cycle. Zero console errors; screenshots confirmed the palette, layout, sold-out state, and all three edge-case flows render as designed.
