# TapNGo — Architecture Decision Records (ADR)

This document details the primary architectural and design decisions for **TapNGo**, a touch-first self-service counter kiosk application built for quick-service snack bars and high-throughput environments.

Requirements below were shaped through a structured requirements-elicitation pass covering kiosk UX edge cases, backend/concurrency design, payment abstraction, deployment, and process visibility — before any implementation started.

---

## 1. System Overview & Technology Stack

* **Backend Framework:** **FastAPI** (Python 3.12) with **Pydantic v2** and **AsyncIO**
  * *Rationale:* High performance, asynchronous request handling, automatic OpenAPI/Swagger specification generation, strong type validation via Pydantic v2.
* **Database & Persistence:** **SQLite** with **SQLAlchemy 2.0** ORM
  * *Rationale:* Lightweight, zero-external-infrastructure SQL database ideal for embedded kiosk applications while maintaining transaction isolation, strict schema design, and seamless local or containerized operation.
  * *Concurrency Settings:* Configured with **Write-Ahead Logging (WAL)** mode, explicit busy timeouts, and atomic transactions.
* **Frontend Application:** **React + TypeScript** with **Vite**
  * *Rationale:* Touch-optimized single-page web app (SPA) with fast rendering, type safety, component modularity, and smooth touch event handling.
* **Deployment & Containerization:** **Docker** & **Docker Compose** with **NGINX** reverse proxy
  * *Rationale:* Standardized one-command local environment (`docker compose up --build`) serving built React assets via NGINX, reverse-proxying `/api/*` to Uvicorn/FastAPI.

---

## 2. Kiosk UX & Edge-Case Resilience

### 2.1 Idle & Abandoned Session Recovery
* **Requirement:** In a self-service counter environment, customers may leave halfway through constructing an order or entering payment details.
* **Decision:**
  * **15-Second Inactivity Trigger:** If no touch interactions occur for 15 seconds, a modal prompt appears asking *"Are you there?"* with a visual 15-second countdown timer.
  * **Auto-Reset:** If the countdown reaches zero without user interaction, the session completely resets, clearing the cart and returning the kiosk to the primary landing ("ORDER HERE") screen.
  * **Confirmation Hold:** Post-payment order confirmation screens hold for **3 seconds** before automatically cycling back to the landing screen for the next customer.

### 2.2 Touch Ergonomics & Double-Tap Prevention
* **Touch Target Size:** Interactive UI elements maintain minimum target sizes of **>48px** to accommodate diverse touch finger sizes on mounted tablets.
* **Single Touch Enforcement:** The UI locks multi-touch gestures to prevent accidental parallel taps or gesture conflicts.
* **Client & API Double-Submit Safeguard:** UI buttons enter disabled/loading states instantly upon tap. Backend APIs enforce dynamic inventory validations prior to order placement to prevent race conditions or accidental over-ordering.

### 2.3 Order Confirmation & Processing Flow
* Upon payment completion, the kiosk generates a unique numerical **Order Number** (e.g., Order #42).
* Order state transitions follow a strict state machine:
  `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `COMPLETED` (or `CANCELLED`).
* **No staff/kitchen-facing app exists in scope**, so nothing external ever drives `PREPARING` → `COMPLETED`. This transition is auto-simulated: a short server-side timer advances a `PAID` order to `PREPARING` and then `COMPLETED` a few seconds later, purely to make the lifecycle observable end-to-end without building a second UI.

### 2.4 Visual Identity & UI/UX Design System
* **Design Metaphor & Motion:** Minimalistic aesthetic playing on the metaphor of 'tap' (faucet/water clarity) and 'go' (fluid motion), engineered for fast, smooth touch screen interactions.
* **Typography & Wordmark:** Rounded, bold sans-serif lettering for the **TapNGo** brand identity.
* **"Kiosk Fresh" Color Palette:**
  * **"Cool Water" Teal (Main):** Anchors the brand identity in clarity, freshness, and operational efficiency.
  * **"Energetic Orange" (Action/Accent):** High-contrast accent reserved strictly for primary action CTAs (e.g., "Start Order", "Add to Cart", "Checkout", "Pay").
  * **Bright White & Clean Gray:** Neutral base canvas ensuring high visual contrast, minimal clutter, and accessibility compliance ($>48\text{px}$ touch targets).
* **Branding Applications:**
  * **App Header:** Simple teal logo icon alongside the TapNGo wordmark located at top-left of the tablet interface.
  * **Button Styling:** Prominent orange primary CTA buttons contrasting sharply against clean white interface surfaces.
* **UI/UX Reference:** Design patterns and layout structure informed by the [qomander](https://github.com/aBrihoum/qomander) interface model.

---

## 3. Inventory & Concurrency Management

* **Dynamic Stock Tracking:** Stock counts begin with fixed initial values and decrement dynamically upon successful payment transactions.
* **Dynamic Availability Validation:** Products reaching zero quantity are marked unavailable in real-time across kiosk instances.
* **Race Condition Resolution:**
  * SQLite serializes writers regardless (only one writer commits at a time even in WAL mode), so there is no real parallel-write hazard to referee — the risk is a naive read-then-write producing a stale check, not two commits landing "simultaneously."
  * Stock decrement is a single atomic statement — `UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >= 1` inside the payment transaction — so whichever request's decrement actually commits first wins, by construction.
  * A decrement affecting zero rows means the item sold out under this order; that request receives an HTTP 409 conflict (`"Sorry, item unavailable"`) and the customer is prompted to adjust their order. (Earlier drafts described this as resolved by comparing payment timestamps across requests — dropped as unnecessary complexity that added risk without changing the customer-facing outcome.)

---

## 4. Payment Abstraction & Failure Injection

### 4.1 Payment Strategy Interface
* To decouple payment hardware or third-party processor details, the backend exposes a pluggable `PaymentService` strategy interface (`IPaymentProcessor`).
* Supports realistic simulated payment rails without live processing:
  * Credit Card (Tap / Chip Insert)
  * Apple Pay & Google Pay
  * Store Loyalty Card
* All transactions persist full audit details in the database regardless of rail type.

### 4.2 Role-Based Admin Panel & Failure Simulation
* **Authentication:** Lightweight role-based differentiation (`admin` vs standard kiosk instances `kiosk1`, `kiosk2`, `kiosk3`).
* **Admin Access Pattern:** The customer-facing flow never shows a login prompt — a self-service kiosk shouldn't interrupt the "no cashier" illusion. Admin login is reached via a discreet gesture (long-press a small corner element in the header) that reveals a login overlay, kept out of the normal tap path so a regular customer won't stumble into it.
* **Admin Debug Overlay:** Once authenticated, the admin panel (surfaced on the payment step) permits forcing payment failure conditions (e.g., card decline, gateway timeout, 500 server error) via simple radio-button controls to test frontend error handling and resilience without code modifications.
* **Generic Failure Handling:** Independent of admin-forced failures, the client also handles unprompted real failures — dropped network, API timeout, unexpected 500 — with one consistent error/retry UI, since a customer losing connectivity mid-order is a real edge case the kiosk needs to survive gracefully.

---

## 5. Deployment & Process Visibility

* **Single-Command Startup:** `docker compose up --build` or `./scripts/start.sh` boots the container stack with automated database initialization and seed data loading.
* **Unified Routing:** NGINX handles static React single-page app serving and routes API traffic seamlessly under `/api/*`.
* **Testing Strategy:**
  * **Backend:** `pytest` suite for core business logic, order workflows, and API endpoint integration.
  * **Frontend:** `vitest` with React Testing Library for critical UI flow and state transitions.
