import type { DebugFailureMode, Order, PaymentMethod, PayResponse, Product, UserRole } from "@/types"

const BASE = "/api/v1"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * FastAPI's own validation errors (422s Pydantic rejects before a route even
 * runs) shape `detail` as a *list* of `{msg, loc, type}` objects, not a
 * string — every other error path in this app raises HTTPException with a
 * plain string detail. Handle both so a raw validation error never reaches
 * the customer as "[object Object]".
 */
export function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object" || !("detail" in body)) return fallback
  const detail = (body as { detail: unknown }).detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((entry) =>
      entry && typeof entry === "object" && "msg" in entry ? String(entry.msg) : String(entry),
    )
    return messages.join(" ") || fallback
  }
  return fallback
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    })
  } catch {
    throw new ApiError(0, "Network error — check the connection and try again.")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, extractErrorMessage(body, res.statusText))
  }

  return (await res.json()) as T
}

export function login(username: string, password: string) {
  return request<{ username: string; role: UserRole }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

export function fetchProducts() {
  return request<Product[]>("/products")
}

export function createOrder(items: { product_id: number; quantity: number }[], kioskUsername?: string) {
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({ items, kiosk_username: kioskUsername ?? null }),
  })
}

export function fetchOrder(orderId: number, orderToken: string) {
  return request<Order>(`/orders/${orderId}`, { headers: { "X-Order-Token": orderToken } })
}

export function cancelOrder(orderId: number, orderToken: string) {
  return request<Order>(`/orders/${orderId}/cancel`, {
    method: "POST",
    headers: { "X-Order-Token": orderToken },
  })
}

/**
 * A 402 response is a legitimate business outcome (card declined), carrying
 * a full PayResponse body — not a wire-level error — so it's handled
 * separately from the generic `request` helper's error path.
 */
export async function payOrder(
  orderId: number,
  orderToken: string,
  method: PaymentMethod,
  opts: { debugFailureMode?: DebugFailureMode | null; asRole?: UserRole | null } = {},
): Promise<PayResponse> {
  let res: Response
  try {
    res = await fetch(`${BASE}/orders/${orderId}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Order-Token": orderToken,
        ...(opts.asRole ? { "X-Role": opts.asRole } : {}),
      },
      body: JSON.stringify({ method, debug_failure_mode: opts.debugFailureMode ?? null }),
    })
  } catch {
    throw new ApiError(0, "Network error — check the connection and try again.")
  }

  if (res.status === 402) {
    return (await res.json()) as PayResponse
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, extractErrorMessage(body, res.statusText))
  }

  return (await res.json()) as PayResponse
}
