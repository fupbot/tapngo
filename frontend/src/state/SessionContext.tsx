import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import type { CartLine, Product, UserRole } from "@/types"

interface AdminSession {
  username: string
  role: UserRole
}

interface SessionValue {
  cart: CartLine[]
  cartCount: number
  cartTotalCents: number
  addToCart: (product: Product) => void
  setQuantity: (productId: number, quantity: number) => void
  removeFromCart: (productId: number) => void
  clearCart: () => void

  admin: AdminSession | null
  setAdmin: (session: AdminSession | null) => void
}

const SessionContext = createContext<SessionValue | null>(null)

// Keep in sync with MAX_QUANTITY_PER_ITEM in backend/app/routers/orders.py.
// Enforced here (inside the state updater, not just a disabled button) so a
// rapid-fire double-tap can't sneak past a stale render before React
// re-disables the button — the whole point of a kiosk's double-tap guard.
export const MAX_QUANTITY_PER_ITEM = 5

export function SessionProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([])
  const [admin, setAdmin] = useState<AdminSession | null>(null)

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const cap = Math.min(MAX_QUANTITY_PER_ITEM, product.stock)
      const existing = prev.find((line) => line.product.id === product.id)
      if (existing) {
        if (existing.quantity >= cap) return prev
        return prev.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      if (cap <= 0) return prev
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.product.id !== productId)
        : prev.map((line) => (line.product.id === productId ? { ...line, quantity } : line)),
    )
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((line) => line.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart])
  const cartTotalCents = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity * line.product.price_cents, 0),
    [cart],
  )

  const value: SessionValue = {
    cart,
    cartCount,
    cartTotalCents,
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart,
    admin,
    setAdmin,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within a SessionProvider")
  return ctx
}
