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
* **Pluggable Payment Gateway & Admin Controls:** Pluggable `PaymentService` architecture supporting Credit Card (Tap/Chip), Apple Pay / Google Pay, and Store Card. Includes an admin debug control panel to inject card declines and server error conditions for error handling verification.
* **Minimalist "Kiosk Fresh" UI/UX:** Clean design language inspired by ['tap' (faucet) / 'go' (motion)](https://github.com/aBrihoum/qomander) featuring rounded bold typography, "Cool Water" Teal, and high-contrast "Energetic Orange" primary CTAs.

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

---

## 🧪 Testing

### Backend Unit & Integration Tests
```bash
pytest
```

### Frontend Component Tests
```bash
npm run test
```
