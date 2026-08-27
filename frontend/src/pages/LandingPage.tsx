import { useNavigate } from "react-router-dom"

import { MountainLineIcon } from "@/components/icons"
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
    <div className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden bg-surface px-6 text-center">
      <Logo className="scale-150" />
      <p className="max-w-md text-lg text-ink-muted">
        Fresh snacks for the trail. Build your order and tap to pay.
      </p>
      <button
        type="button"
        onClick={startOrder}
        className="rounded-2xl bg-brand-clay px-16 py-7 font-display text-2xl font-semibold text-white shadow-sm active:scale-[0.98]"
      >
        Order Here
      </button>

      <MountainLineIcon
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full text-brand-forest-light sm:h-28"
        preserveAspectRatio="none"
      />
    </div>
  )
}
