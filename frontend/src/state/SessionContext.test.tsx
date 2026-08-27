import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MAX_QUANTITY_PER_ITEM, SessionProvider, useSession } from "@/state/SessionContext"
import type { Product } from "@/types"

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Cola",
    description: "",
    category: "Drinks",
    price_cents: 250,
    stock: 10,
    active: true,
    in_stock: true,
    ...overrides,
  }
}

function setup() {
  return renderHook(() => useSession(), { wrapper: SessionProvider })
}

describe("SessionContext addToCart quantity cap", () => {
  it("stops incrementing once quantity reaches min(MAX_QUANTITY_PER_ITEM, stock)", () => {
    const { result } = setup()
    const product = makeProduct({ stock: 10 })

    act(() => {
      for (let i = 0; i < 6; i++) result.current.addToCart(product)
    })

    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].quantity).toBe(MAX_QUANTITY_PER_ITEM)
  })

  it("caps at current stock when stock is lower than MAX_QUANTITY_PER_ITEM", () => {
    const { result } = setup()
    const product = makeProduct({ id: 2, stock: 2 })

    act(() => {
      for (let i = 0; i < 5; i++) result.current.addToCart(product)
    })

    expect(result.current.cart[0].quantity).toBe(2)
  })

  it("never adds a zero-stock product to the cart", () => {
    const { result } = setup()
    const product = makeProduct({ id: 3, stock: 0, in_stock: false })

    act(() => {
      result.current.addToCart(product)
    })

    expect(result.current.cart).toHaveLength(0)
  })
})
