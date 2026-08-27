/**
 * Identifies which physical kiosk terminal this browser tab is running on
 * — set per-deployment via VITE_KIOSK_ID, not a login. The seeded
 * `kiosk1`/`kiosk2`/`kiosk3` accounts (backend/app/seed.py) exist for this:
 * a multi-terminal deployment sets a different ID per tablet so orders can
 * be traced back to the terminal that placed them, the same way a real POS
 * differentiates registers without asking the customer to sign in.
 *
 * No login flow reads or checks this — a self-service kiosk has no
 * customer-facing auth step at all.
 */
export const KIOSK_ID: string = (import.meta.env.VITE_KIOSK_ID as string | undefined) || "kiosk1"
