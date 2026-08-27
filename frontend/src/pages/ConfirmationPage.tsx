import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { CheckBadgeIcon } from "@/components/icons"
import type { Order } from "@/types"

const RETURN_TO_LANDING_MS = 3000

export function ConfirmationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const order = (location.state as { order?: Order } | null)?.order

  useEffect(() => {
    if (!order) {
      navigate("/", { replace: true })
      return
    }
    const timer = window.setTimeout(() => navigate("/", { replace: true }), RETURN_TO_LANDING_MS)
    return () => window.clearTimeout(timer)
  }, [order, navigate])

  if (!order) return null

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-brand-forest-light/50 p-6 text-center">
      <CheckBadgeIcon className="h-14 w-14 text-brand-forest" />
      <p className="font-display text-xl font-semibold text-ink-muted">Order confirmed</p>
      <p className="font-display text-5xl font-semibold text-brand-forest-dark">#{order.order_number}</p>
      <p className="text-ink-muted">Thanks! We'll have it ready shortly.</p>
    </div>
  )
}
