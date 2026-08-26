import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ApiError, fetchProducts } from "@/lib/api"
import { useSession } from "@/state/SessionContext"
import type { Product } from "@/types"

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function MenuPage() {
  const navigate = useNavigate()
  const { cart, cartCount, cartTotalCents, addToCart, setQuantity } = useSession()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the menu."))
  }, [])

  const categories = useMemo(() => {
    if (!products) return []
    const byCategory = new Map<string, Product[]>()
    for (const product of products) {
      const list = byCategory.get(product.category) ?? []
      list.push(product)
      byCategory.set(product.category, list)
    }
    return [...byCategory.entries()]
  }, [products])

  const quantityInCart = (productId: number) => cart.find((line) => line.product.id === productId)?.quantity ?? 0

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold text-danger">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-brand-teal px-6 py-3 font-semibold text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col pb-28">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!products && <p className="text-ink-muted">Loading menu…</p>}

        {categories.map(([category, items]) => (
          <section key={category} className="mb-8">
            <h2 className="mb-3 font-display text-xl font-bold text-ink">{category}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((product) => {
                const inCart = quantityInCart(product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={!product.in_stock}
                    onClick={() => addToCart(product)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-surface p-4 text-center shadow-sm transition active:scale-[0.97] disabled:opacity-40"
                  >
                    <span className="text-4xl">{product.emoji}</span>
                    <span className="font-semibold text-ink">{product.name}</span>
                    <span className="text-brand-teal-dark">{formatPrice(product.price_cents)}</span>
                    {!product.in_stock && <span className="text-xs font-semibold text-danger">Sold out</span>}
                    {inCart > 0 && (
                      <span className="rounded-full bg-brand-orange px-2 py-0.5 text-xs font-bold text-white">
                        {inCart} in cart
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-100 bg-surface p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-muted">{cartCount} item{cartCount === 1 ? "" : "s"}</p>
            <p className="font-display text-xl font-bold text-ink">{formatPrice(cartTotalCents)}</p>
          </div>
          <button
            type="button"
            disabled={cartCount === 0}
            onClick={() => navigate("/payment")}
            className="rounded-2xl bg-brand-orange px-8 py-4 text-lg font-bold text-white shadow-lg disabled:opacity-40"
          >
            Checkout
          </button>
        </div>
        {cart.length > 0 && (
          <div className="mx-auto mt-2 flex max-w-3xl flex-wrap gap-2">
            {cart.map((line) => (
              <span
                key={line.product.id}
                className="flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-sm"
              >
                {line.product.emoji} {line.product.name} × {line.quantity}
                <button
                  type="button"
                  onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                  className="ml-1 h-6 w-6 min-h-0 min-w-0 rounded-full bg-slate-200 text-xs font-bold"
                >
                  −
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
