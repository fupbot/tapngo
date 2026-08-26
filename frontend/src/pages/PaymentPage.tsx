import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ApiError, createOrder, payOrder } from "@/lib/api"
import { useSession } from "@/state/SessionContext"
import type { DebugFailureMode, PaymentMethod } from "@/types"

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

const METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: "credit_card", label: "Credit Card", emoji: "💳" },
  { value: "apple_pay", label: "Apple Pay", emoji: "🍏" },
  { value: "google_pay", label: "Google Pay", emoji: "🟢" },
  { value: "store_card", label: "Store Card", emoji: "🎫" },
]

const DEBUG_MODES: { value: DebugFailureMode | ""; label: string }[] = [
  { value: "", label: "Normal (succeed)" },
  { value: "decline", label: "Force decline" },
  { value: "timeout", label: "Force gateway timeout" },
  { value: "server_error", label: "Force server error" },
]

export function PaymentPage() {
  const navigate = useNavigate()
  const { cart, cartTotalCents, clearCart, admin } = useSession()

  const [orderId, setOrderId] = useState<number | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethod>("credit_card")
  const [debugMode, setDebugMode] = useState<DebugFailureMode | "">("")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [orderDead, setOrderDead] = useState(false)

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/menu")
      return
    }
    createOrder(cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })))
      .then((order) => setOrderId(order.id))
      .catch((err) => setInitError(err instanceof ApiError ? err.message : "Could not start checkout."))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePay() {
    if (!orderId) return
    setPaying(true)
    setPayError(null)
    try {
      const result = await payOrder(orderId, method, {
        debugFailureMode: debugMode || null,
        asRole: admin?.role ?? null,
      })
      if (result.payment_status === "declined") {
        setPayError(result.message)
        return
      }
      clearCart()
      navigate("/confirmation", { state: { order: result.order } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setOrderDead(true)
      }
      setPayError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setPaying(false)
    }
  }

  if (initError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold text-danger">{initError}</p>
        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="rounded-xl bg-brand-teal px-6 py-3 font-semibold text-white"
        >
          Back to menu
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Review &amp; Pay</h1>

      <section className="rounded-2xl border border-slate-100 bg-surface p-4 shadow-sm">
        {cart.map((line) => (
          <div key={line.product.id} className="flex items-center justify-between py-1 text-ink">
            <span>
              {line.product.emoji} {line.product.name} × {line.quantity}
            </span>
            <span>{formatPrice(line.product.price_cents * line.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 font-display text-lg font-bold text-ink">
          <span>Total</span>
          <span>{formatPrice(cartTotalCents)}</span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Payment method</h2>
        <div className="grid grid-cols-2 gap-3">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition ${
                method === m.value ? "border-brand-orange bg-orange-50" : "border-slate-100 bg-surface"
              }`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="font-semibold text-ink">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {admin?.role === "admin" && (
        <section className="rounded-2xl border-2 border-dashed border-brand-teal p-4">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-teal-dark">
            Admin: simulate payment outcome
          </p>
          <div className="flex flex-col gap-2">
            {DEBUG_MODES.map((mode) => (
              <label key={mode.value || "none"} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="debug-mode"
                  checked={debugMode === mode.value}
                  onChange={() => setDebugMode(mode.value)}
                />
                {mode.label}
              </label>
            ))}
          </div>
        </section>
      )}

      {payError && (
        <div className="rounded-xl bg-red-50 p-4 text-danger">
          <p className="font-semibold">{payError}</p>
          {orderDead && (
            <button
              type="button"
              onClick={() => navigate("/menu")}
              className="mt-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white"
            >
              Back to menu
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!orderId || paying || orderDead}
        onClick={handlePay}
        className="mt-auto rounded-2xl bg-brand-orange px-6 py-5 font-display text-xl font-bold text-white shadow-lg disabled:opacity-50"
      >
        {paying ? "Processing…" : `Pay ${formatPrice(cartTotalCents)}`}
      </button>
    </div>
  )
}
