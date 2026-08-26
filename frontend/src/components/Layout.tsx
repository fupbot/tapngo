import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

import { AdminLoginModal } from "@/components/AdminLoginModal"
import { IdleWarningModal } from "@/components/IdleWarningModal"
import { Logo } from "@/components/Logo"
import { useIdleReset } from "@/hooks/useIdleReset"
import { useLongPress } from "@/hooks/useLongPress"
import { useSingleTouchGuard } from "@/hooks/useSingleTouchGuard"
import { useSession } from "@/state/SessionContext"

// Idle reset only matters mid-order — not on the landing screen (already
// reset) or the confirmation screen (which has its own short auto-return).
const IDLE_RESET_PATHS = ["/menu", "/payment"]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { clearCart, admin, setAdmin } = useSession()
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  useSingleTouchGuard()

  const idleEnabled = IDLE_RESET_PATHS.includes(location.pathname)
  const { warning, secondsLeft, dismiss } = useIdleReset({
    enabled: idleEnabled,
    onExpire: () => {
      clearCart()
      navigate("/")
    },
  })

  const adminGesture = useLongPress(() => setShowAdminLogin(true))

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 bg-surface px-6 py-4">
        <Logo />
        <div className="flex items-center gap-3">
          {admin && (
            <button
              type="button"
              onClick={() => setAdmin(null)}
              className="rounded-full bg-brand-teal-light px-3 py-1 text-sm font-semibold text-brand-teal-dark"
            >
              {admin.username} · sign out
            </button>
          )}
          {/* Discreet admin-access gesture: long-press, no visible affordance. */}
          <div
            {...adminGesture}
            className="h-6 w-6 rounded-full"
            aria-hidden="true"
            data-testid="admin-gesture-target"
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      {warning && <IdleWarningModal secondsLeft={secondsLeft} onStillHere={dismiss} />}
      {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} />}
    </div>
  )
}
