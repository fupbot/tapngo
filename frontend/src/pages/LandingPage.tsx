import { useNavigate } from "react-router-dom"

import { Logo } from "@/components/Logo"
import { useSession } from "@/state/SessionContext"

export function LandingPage() {
  const navigate = useNavigate()
  const { clearCart } = useSession()

  function startOrder() {
    clearCart()
    navigate("/menu")
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 bg-gradient-to-b from-brand-teal-light/60 to-surface px-6 text-center">
      <Logo className="scale-150" />
      <p className="max-w-md text-lg text-ink-muted">
        Fresh snacks, fast. Build your order and tap to pay.
      </p>
      <button
        type="button"
        onClick={startOrder}
        className="rounded-full bg-brand-orange px-16 py-8 font-display text-3xl font-extrabold text-white shadow-xl active:scale-[0.98]"
      >
        ORDER HERE
      </button>
    </div>
  )
}
