import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { ApiError, fetchProducts } from "@/lib/api"
import { categoryForSlug } from "@/lib/categories"
import { PRODUCT_ICONS } from "@/lib/productIcons"
import { MAX_QUANTITY_PER_ITEM, useSession } from "@/state/SessionContext"
import type { Product } from "@/types"

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function MenuPage() {
  const navigate = useNavigate()
  const { category: categorySlug } = useParams<{ category: string }>()
  const category = categoryForSlug(categorySlug)
  const { cart, cartCount, cartTotalCents, addToCart, setQuantity } = useSession()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!category) {
      navigate("/menu", { replace: true })
      return
    }
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the menu."))
  }, [category, navigate])

  const quantityInCart = (productId: number) => cart.find((line) => line.product.id === productId)?.quantity ?? 0

  if (!category) return null

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold text-danger">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-brand-forest px-6 py-3 font-semibold text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  const items = products?.filter((p) => p.category === category.label) ?? null
  const CategoryIcon = category.icon

  return (
    <div className="flex flex-1 flex-col pb-28">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="mb-4 flex items-center gap-1 font-semibold text-ink-muted"
        >
          <span aria-hidden="true">←</span> Categories
        </button>

        <div className="mb-5 flex items-center gap-2 text-brand-forest-dark">
          <CategoryIcon className="h-6 w-6" />
          <h1 className="font-display text-xl font-semibold uppercase tracking-wide">{category.label}</h1>
        </div>

        {!items && <p className="text-ink-muted">Loading menu…</p>}

        {items && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => {
              const inCart = quantityInCart(product.id)
              const cap = Math.min(MAX_QUANTITY_PER_ITEM, product.stock)
              const atLimit = product.in_stock && inCart >= cap
              const ItemIcon = PRODUCT_ICONS[product.name] ?? category.icon
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={!product.in_stock || atLimit}
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-surface p-4 text-center transition active:scale-[0.97] disabled:opacity-40"
                >
                  <ItemIcon className="h-8 w-8 text-brand-forest-dark" />
                  <span className="mt-1 font-medium text-ink">{product.name}</span>
                  <span className="text-sm text-ink-muted">{formatPrice(product.price_cents)}</span>
                  {!product.in_stock && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-danger">Sold out</span>
                  )}
                  {atLimit && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-danger">Limit reached</span>
                  )}
                  {inCart > 0 && (
                    <span className="rounded-full bg-brand-clay px-2 py-0.5 text-xs font-semibold text-white">
                      {inCart} in cart
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-surface p-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-muted">{cartCount} item{cartCount === 1 ? "" : "s"}</p>
            <p className="font-display text-xl font-semibold text-ink">{formatPrice(cartTotalCents)}</p>
          </div>
          <button
            type="button"
            disabled={cartCount === 0}
            onClick={() => navigate("/payment")}
            className="rounded-xl bg-brand-clay px-8 py-4 text-lg font-semibold text-white shadow-sm disabled:opacity-40"
          >
            Checkout
          </button>
        </div>
        {cart.length > 0 && (
          <div className="mx-auto mt-2 flex max-w-3xl flex-wrap gap-2">
            {cart.map((line) => (
              <span
                key={line.product.id}
                className="flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-sm text-ink"
              >
                {line.product.name} × {line.quantity}
                <button
                  type="button"
                  onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                  className="ml-1 h-6 w-6 min-h-0 min-w-0 rounded-full bg-stone-200 text-xs font-bold"
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
