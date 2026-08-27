import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

import { AdminLoginModal } from "@/components/AdminLoginModal"
import { IdleWarningModal } from "@/components/IdleWarningModal"
import { Logo } from "@/components/Logo"
import { useIdleReset } from "@/hooks/useIdleReset"
import { useLongPress } from "@/hooks/useLongPress"
import { useSingleTouchGuard } from "@/hooks/useSingleTouchGuard"
import { KIOSK_ID } from "@/lib/kiosk"
import { useSession } from "@/state/SessionContext"

// Idle reset only matters mid-order — not on the landing screen (already
// reset) or the confirmation screen (which has its own short auto-return).
function idleResetApplies(pathname: string): boolean {
  return pathname.startsWith("/menu") || pathname === "/payment"
}

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { clearCart, admin, setAdmin } = useSession()
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  useSingleTouchGuard()

  const idleEnabled = idleResetApplies(location.pathname)
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
      <header className="flex items-center justify-between border-b border-stone-200 bg-surface px-6 py-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xs text-ink-muted">{KIOSK_ID}</span>
        </div>
        <div className="flex items-center gap-3">
          {admin && (
            <button
              type="button"
              onClick={() => setAdmin(null)}
              className="rounded-full bg-brand-forest-light px-3 py-1 text-sm font-semibold text-brand-forest-dark"
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
