# ⚡ TapNGo — Self-Service Counter Kiosk

A modern, touch-first checkout web application and API engineered for quick-service snack bars and high-throughput self-service environments.

---

## 📐 Architecture & Key Design Decisions

**TapNGo** is built using a decoupled single-page application (SPA) architecture coupled with an asynchronous Python backend, containerized for reliable one-command deployment.

### 1. Technology Stack
* **Backend:** Python 3.12, **FastAPI**, **SQLAlchemy 2.0** ORM, and **Pydantic v2**.
* **Frontend:** **React**, **TypeScript**, **Vite**, and Tailwind CSS tailored for touch screen ergonomics ($>48\text{px}$ touch targets, single-touch enforcement).
* **Database:** **SQLite** with Write-Ahead Logging (WAL) mode for lightweight, zero-infra ACID transactional persistence.
* **Orchestration:** **Docker Compose** & **NGINX** reverse proxy routing static single-page web assets and proxying `/api/*` requests.

### 2. Kiosk Ergonomics & Edge-Case Resilience
* **Idle Cart Reset:** Automatic 15-second inactivity timer launches a 15-second visual prompt (*"Are you there?"*). Unanswered countdowns automatically clear session data and reset to the landing screen.
* **Order Confirmation Cycle:** Completed transactions display an Order # confirmation screen for **3 seconds** before returning to the initial *"ORDER HERE"* state for the next customer.
* **Double-Tap & Concurrency Safety:** Single-touch gesture limits and immediate button state locks prevent accidental bulk additions or duplicate API submissions. Backend timestamp order resolves simultaneous last-item purchases cleanly.
* **Pluggable Payment Gateway & Admin Controls:** Pluggable `PaymentProcessor` architecture supporting Credit Card (Tap/Chip), Apple Pay / Google Pay, and Store Card. Includes an admin debug control panel to inject card declines and server error conditions for error handling verification.
* **Minimalist "Trailhead" UI/UX:** A calm, café-at-a-trailhead visual identity — forest green and clay/terracotta on warm cream, Fraunces + Inter typography, and hand-drawn line icons in place of emoji. Layout patterns still informed by [qomander](https://github.com/aBrihoum/qomander).

---

## 📚 Architectural Meta-Documentation

For a complete deep dive into design rationale, trade-offs, and step-by-step development history:

* [🏛️ Architecture Decision Records (ARCHITECTURE_DECISIONS.md)](./ARCHITECTURE_DECISIONS.md) — Detailed rationale for framework selection, state management, inventory concurrency, and failure simulation design.
* [📝 Development Log (DEVELOPMENT_LOG.md)](./DEVELOPMENT_LOG.md) — Chronological step-by-step breakdown of how the project was designed, built, and tested.

---

## 🚀 Quick Start & Deployment

### Run with Docker Compose (Recommended)
Boot the application, database migrations, and pre-seeded menu catalog in one command:

```bash
docker compose up --build
```

Access the kiosk interface at `http://localhost` (API endpoints accessible at `http://localhost/api/v1/`).

### Run locally without Docker

**Backend** (Terminal 1):
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
The first run auto-creates and seeds the SQLite database. API docs at `http://localhost:8000/docs`.

**Frontend** (Terminal 2):
```bash
cd frontend
npm install   # first time only
npm run dev
```
Open the printed URL (`http://localhost:5173`). The Vite dev server proxies `/api/*` to the backend, so both must be running.

### Seeded Users

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | admin — unlocks the payment-page debug panel (force decline/timeout/server error) via a long-press on the small dot in the header's top-right corner |
| `kiosk1` | `kiosk123` | kiosk |
| `kiosk2` | `kiosk123` | kiosk |
| `kiosk3` | `kiosk123` | kiosk |

Regular ordering doesn't require signing in — these credentials only matter for reaching the admin debug panel.

---

## 🧪 Testing

A small, deliberately non-exhaustive suite covering the core business logic — not maximum coverage.

### Backend Unit Tests
```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt   # first time only — adds pytest + httpx
pytest
```
Covers order creation and its quantity cap, the atomic stock decrement on payment (including the insufficient-stock/rollback path), the order-access-token check, admin-only failure injection, cancel/refund state rules, and login. Each test runs against an isolated temp-file SQLite DB (see `tests/conftest.py`) — never the real dev database.

### Frontend Unit Tests
```bash
cd frontend
npm install   # first time only
npm run test
```
Covers the cart's per-item quantity cap (`SessionContext`) and the API client's error-message parsing (`lib/api.ts`) — including a regression test for a real bug hit during development, where a FastAPI validation error rendered as literal `[object Object]` on screen.
