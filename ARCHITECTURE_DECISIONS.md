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

**Browsing flow:** Landing ("Order Here") → category picker (four big buttons: Drinks, Snacks, Hot Food, Desserts) → that category's items → Payment → Confirmation. The category step was added as an explicit navigation layer rather than showing all ~14 items on one scrolling page — a "go back to categories" control is always available from the item list, and the cart (global state, independent of which category is showing) persists as the customer moves between categories, so switching from Drinks to Snacks to add more doesn't lose what's already selected.

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
* **Post-payment cancellation:** `POST /orders/{id}/refund` reverses a `PAID`/`PREPARING` order — flips it to `CANCELLED`, restores the stock it had decremented, records why. Not reachable once `COMPLETED` (already handed over — out of scope for a refund) or from `PENDING` (nothing charged yet; that's what `/cancel` is for). Requires the same order-access-token as every other order endpoint (section 4.3). **The frontend doesn't expose a button for this yet** — it exists so "I paid and changed my mind" isn't a dead end at the API layer, even though surfacing it in the UI (where would the button live? the confirmation screen is only on-screen for 3 seconds) is its own design question left for later.
* **Considered and rejected: emailed receipts.** The confirmation screen only shows an on-screen order number, with no option to email a receipt. The target user is grabbing a snack on the way out the door — typing an email address on a kiosk (no physical keyboard, so an on-screen one would be needed) adds friction to what should be a fast walk-up-and-go interaction, and sending real email would pull in external infrastructure (SMTP credentials, a mail API) that the rest of this project deliberately avoids (SQLite, no external services, `docker compose up` and nothing else). Skipped for both reasons, not an oversight.

### 2.4 Visual Identity & UI/UX Design System
* **Design Metaphor:** Superseded the original teal/orange "Kiosk Fresh" identity with a **"Trailhead"** identity — a café at a Pacific Northwest trailhead where hikers grab a snack before heading into the mountains. Same wordmark, same logo mark (the droplet still reads fine here — rain/mountain streams are very PNW), same buttons and functionality; only the visual language changed.
* **Typography:** **Fraunces** (a soft, warm serif) for the wordmark and headings; **Inter** for body text and UI labels. Replaces the bold rounded sans-serif used everywhere in the original identity — the serif/sans pairing reads calmer and more editorial, less "app icon."
* **"Trailhead" Color Palette:**
  * **Forest** (deep pine green, main brand color): header, category labels, secondary buttons.
  * **Clay** (muted terracotta, accent): reserved for primary CTAs ("Order Here", "Checkout", "Pay") — same role the old "Energetic Orange" played, just an earthier, calmer tone.
  * **Warm cream & stone neutrals:** replaced the previous cool white/slate-gray canvas with warm off-white surfaces and Tailwind's warm-toned `stone` scale for borders, keeping the same high-contrast, minimal-clutter intent.
* **Iconography:** Replaced emoji (menu items, payment methods) with a small set of hand-drawn single-stroke line icons (`components/icons.tsx`) — one per category (cup, acorn, flame, dotted circle) and one per product (can, bottle, tumbler, chip, pretzel-loop, popcorn box, pouch, hot dog, nacho, pizza slice, chocolate-bar grid, cookie, ice cream cup), plus a card, a tap/contactless glyph, and a ticket for payment methods. Color emoji renders as a bright cartoon glyph on every platform regardless of which character is picked, which read as "cute" rather than calm — line icons in the brand palette fixed that at the source rather than by picking different emoji. At the ~32px size these render in a product card, distinguishing icons by **outer silhouette** (a bottle vs. a tall glass vs. a short tumbler) held up far better than differentiating by tiny internal details alone (bubbles, ice cubes) — those got added as a secondary accent once the silhouette carried the read.
* **Restraint:** One subtle nature touch — a thin single-line mountain-ridge motif at the base of the landing screen — rather than scattering decorative elements throughout; the brief was "add elements, but don't make it cluttered."
* **UI/UX Reference:** Layout structure still informed by the [qomander](https://github.com/aBrihoum/qomander) interface model; visual identity is now independent of that reference.

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
* **What the `kiosk1`/`kiosk2`/`kiosk3` accounts are actually for:** they don't correspond to a customer-facing login — self-service kiosks don't authenticate the customer at all. They identify *which physical terminal* placed an order, the way a real POS differentiates registers without asking the shopper to sign in. Wired minimally: each deployed tablet sets `VITE_KIOSK_ID` (frontend `lib/kiosk.ts`, `.env.example`) to one of these usernames, shown as a small label next to the logo and sent as `kiosk_username` on every order it creates — no login flow reads or checks it. Defaults to `kiosk1` if unset, so a fresh clone still works out of the box.
* **Admin Access Pattern:** The customer-facing flow never shows a login prompt — a self-service kiosk shouldn't interrupt the "no cashier" illusion. Admin login is reached via a discreet gesture (long-press a small corner element in the header) that reveals a login overlay, kept out of the normal tap path so a regular customer won't stumble into it.
* **Admin Debug Overlay:** Once authenticated, the admin panel (surfaced on the payment step) permits forcing payment failure conditions (e.g., card decline, gateway timeout, 500 server error) via simple radio-button controls to test frontend error handling and resilience without code modifications.
* **Generic Failure Handling:** Independent of admin-forced failures, the client also handles unprompted real failures — dropped network, API timeout, unexpected 500 — with one consistent error/retry UI, since a customer losing connectivity mid-order is a real edge case the kiosk needs to survive gracefully.
* **Honest limit:** the `X-Role: admin` header that gates `debug_failure_mode` is exactly that — a header, sent by the client with no signature or session behind it. It stops the debug panel from *appearing* to a regular customer; it does not stop a technical user from attaching that header directly to a request. There is nothing sensitive behind it (forcing a decline just exercises error-handling UI), so this is an accepted tradeoff, not an oversight — but it's not a real access control and shouldn't be described as one.

### 4.3 Order Access Control (Anti-IDOR)
* **Problem:** Order IDs are sequential integers. Without anything else, any client could `GET /orders/7`, or `POST /orders/7/pay` / `/cancel`, for *any* order — not just one it created — enumerating other customers' orders or interfering with an order mid-checkout. This is a textbook IDOR (Insecure Direct Object Reference): the object identifier alone was being treated as authorization.
* **Fix:** `create_order` generates a random opaque `access_token` (`secrets.token_urlsafe(16)`) and stores it on the order row; it's returned once in the creation response. Every subsequent call that reads or acts on that order (`GET /orders/{id}`, `POST /orders/{id}/pay`, `POST /orders/{id}/cancel`) requires that token back via an `X-Order-Token` header, compared with `secrets.compare_digest` (constant-time, so response timing can't leak a partial match). A missing or wrong token gets the same `404 Order not found` as a nonexistent ID — deliberately not `403`, so a wrong guess doesn't even confirm the order exists.
* **Frontend:** the token is held only in `PaymentPage`'s component state (never persisted), issued by `createOrder` and threaded through `payOrder`/`cancelOrder`. It never needs to survive a page reload — if the tab is closed mid-checkout, the abandoned order simply stays `PENDING` until someone re-orders (existing behavior, unrelated to this change).
* **Scope note:** this closes the specific IDOR — an order is only actionable by whoever holds its token. It does not add real user accounts or sessions (out of scope per the spec's "just a way to differentiate admin/kiosk" requirement) and does not change the admin-role-spoofing tradeoff noted above, which is a separate, accepted gap.

---

## 5. Deployment & Process Visibility

* **Single-Command Startup:** `docker compose up --build` boots the container stack — two services (`backend`, `frontend`), no separate bootstrap script needed. The backend's own startup (`app/main.py`'s lifespan) handles database initialization and idempotent seed loading, same as running it outside Docker.
* **Unified Routing:** the `frontend` container is NGINX serving the built static React app at `/` and reverse-proxying `/api/*` to the `backend` service by its Docker Compose service name (`nginx.conf`) — the simplest form of the routing described in section 1, no separate reverse-proxy container.
* **Persistent database volume:** the SQLite file lives in a named Docker volume (`backend_data`, mounted at `/app/data` in the backend container, `DATABASE_URL` pointed at it) rather than the container's own filesystem. Without this, `docker compose down` (or any container recreation) would silently wipe stock levels and order history along with the ephemeral container layer — not acceptable even for a demo deployment.
* **Kiosk identity is a build-time value, not a runtime one.** `VITE_KIOSK_ID` (section 4.2) gets inlined into the static JS bundle when Vite builds — Vite only exposes env vars at build time, not when the container later starts. The `frontend/Dockerfile` exposes it as a build ARG (default `kiosk1`, matching `lib/kiosk.ts`'s own fallback) so a real multi-terminal deployment *can* produce a differently-identified image per kiosk (`docker build --build-arg VITE_KIOSK_ID=kiosk2 ...`), but `docker-compose.yml` itself doesn't set it — one demo kiosk needs nothing beyond the default. The honest tradeoff: a genuinely dynamic multi-kiosk fleet from a *single* shared image would need the ID injected at container start instead (e.g. a small NGINX-served config endpoint, or an entrypoint script rewriting it into the built files) — deliberately not built, since it's a real feature for a deployment shape this project doesn't have.
* **Testing Strategy:** Deliberately small and non-exhaustive by design — proving the core business logic is correct, not maximizing coverage. See `DEVELOPMENT_LOG.md` Step 18 for the full rationale and what was found along the way.
  * **Backend:** `pytest` + `TestClient`, one isolated temp-file SQLite database per test (`tmp_path`, not `:memory:` — a real file exercises the same WAL-mode pragmas as production). Covers order creation and its quantity cap, the atomic stock decrement on payment (success and the insufficient-stock/rollback path), the order-access-token check (section 4.3), admin-only failure injection, and the cancel/refund state machine. Test fixtures insert their own minimal product/user data rather than depending on `seed.py`'s exact contents, so the suite doesn't silently break when the menu changes.
  * **Frontend:** `vitest` + `@testing-library/react`. Covers the cart's quantity-cap logic (`SessionContext.addToCart`) and the API client's error-message parsing (`lib/api.ts`) — deliberately excludes idle-timer, single-touch, and confirmation-auto-return UI behavior, which would need component rendering and timer/DOM simulation disproportionate to the stated scope.
  * **A design note the tests surfaced:** `services/order_lifecycle.py` imports `SessionLocal` directly from `app.database` rather than through the `get_db` dependency, so it can't be redirected via dependency injection the way every other DB access in this app can. Harmless in normal operation (there's only one real database), but it means the lifecycle timer isn't testable in isolation without patching it out — which the test suite does, since exercising a `time.sleep`-based background timer isn't worth the cost for what this suite is trying to prove.
