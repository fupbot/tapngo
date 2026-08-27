# TapNGo — Project Summary

A quick-reference for talking through the project, instead of reading `ARCHITECTURE_DECISIONS.md` / `DEVELOPMENT_LOG.md` on screen. Those two files have the full detail if a question goes deeper than this.

## 30-second pitch

A self-service checkout kiosk for a snack bar — FastAPI + SQLite backend, React/TypeScript frontend, Docker Compose deployment. Built for the "no cashier, person alone in a hurry" scenario: every edge case (idle abandonment, double-tap, sold-out mid-checkout, payment failure, someone else's order ID) is handled deliberately, not accidentally.

## The 6 decisions worth walking through

**1. Stock concurrency — one atomic SQL statement, not a queue.**
Two customers can't both buy the last item: `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty` inside the payment transaction — whichever request's decrement commits first wins, the loser gets a 409 automatically. Originally planned to resolve this by comparing payment timestamps across requests; realized that added real complexity for zero behavior change once I noticed SQLite serializes writers anyway, and dropped it before ever writing that code.

**2. Order-ownership bug (IDOR) — found via self-review, then fixed.**
Order IDs were sequential integers with no ownership check — anyone could `GET`/pay/cancel *any* order by guessing an ID. Fixed with a random opaque token issued at order creation, required on every later request for that order (`X-Order-Token` header, constant-time comparison). A wrong token returns the same 404 as a nonexistent order — doesn't even confirm the ID is real.

**3. The "[object Object]" bug — a real one, found by testing the app, not writing tests around it.**
Rapid-tapping an item with no cap sent a quantity that failed backend validation; FastAPI's validation errors come back as a list of objects, and the frontend's naive `String(error)` handling rendered that as literal `[object Object]` on screen. Fixed the actual parsing bug *and* added the product rule that should've prevented hitting it in the first place (cap each item at `min(5, current stock)`, enforced in the state updater itself so a double-tap can't sneak past a stale render).

**4. Payment failure injection — a pluggable strategy + an honest admin panel.**
Payment methods are a small strategy-pattern abstraction (`PaymentProcessor` ABC, one implementation per rail) so nothing about payment is hardcoded to one path. An admin-only panel (reached by a discreet long-press, never shown to a regular customer) can force a decline, timeout, or 500 on demand — lets you *demonstrate* the failure-handling UI live instead of just describing it.

**5. Visual redesign — and a legibility bug caught by zooming into screenshots, not eyeballing them.**
Iterated the UI from a generic teal/orange kiosk look to a distinct "Trailhead" identity (forest green + clay, custom line icons instead of emoji). While building the icon set, several nearly-identical drink icons (differentiated only by tiny internal details) turned out illegible at actual card size — fixed by giving each drink a genuinely different *silhouette* instead. Found by cropping and zooming into real rendered screenshots, not by assuming it looked fine.

**6. Docker tradeoffs, decided consciously rather than defaulted into.**
The SQLite file lives in a named Docker volume — without it, `docker compose down` would silently wipe stock/order history. The per-kiosk terminal ID (`VITE_KIOSK_ID`) is baked in at frontend *build* time rather than made runtime-configurable — the simplest correct choice for one demo kiosk, with the tradeoff (a real multi-terminal fleet would need runtime injection instead) written down rather than silently accepted.

## Known limitations — worth stating up front, not glossing over

- **The admin-only header (`X-Role: admin`) is spoofable** — it's just a header, no signature behind it. Stops the panel from *appearing* to a regular customer; doesn't stop a technical user from attaching it directly. Nothing sensitive sits behind it (forcing a decline only exercises UI), so this was an accepted tradeoff, not an oversight — but it isn't real access control.
- **No kitchen/staff view.** `PREPARING → COMPLETED` is a timer, not a real workflow — building a second staff-facing app was out of scope.
- **SQLite is single-writer.** Fine at kiosk scale; wouldn't scale to many concurrent terminals without a real database and task queue (the order-lifecycle timer uses `time.sleep` on a shared threadpool, which has a ceiling).
- **Test suite is deliberately small.** ~11 backend / 6 frontend tests covering the business logic that actually matters (concurrency, the IDOR fix, the quantity cap, payment failure paths) — not maximum coverage, by design.
- **No accessibility/screen-reader support beyond touch-target sizing.** Defensible for a kiosk (not typically AT-navigated), but real ADA compliance for physical kiosks is a legitimate gap, not something claimed as handled.

## Quick facts

- **Stack:** FastAPI (Python 3.12) + SQLAlchemy 2.0 + SQLite (WAL mode) · React + TypeScript + Vite + Tailwind v4 · Docker Compose + NGINX
- **Run it:** `docker compose up --build`, then `http://localhost`
- **Tests:** `cd backend && pytest` / `cd frontend && npm run test`
- **Seeded logins:** `admin` / `admin123` (unlocks the debug panel via long-press on the header's corner dot); `kiosk1`/`kiosk2`/`kiosk3` identify terminals, not customer accounts
