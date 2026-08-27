import { describe, expect, it } from "vitest"

import { extractErrorMessage } from "@/lib/api"

describe("extractErrorMessage", () => {
  it("returns a string detail unchanged", () => {
    expect(extractErrorMessage({ detail: "Order not found" }, "fallback")).toBe("Order not found")
  })

  it("joins a list-of-{msg} validation-error detail instead of stringifying it", () => {
    // This is FastAPI's own 422 shape — the exact case that used to render
    // as a literal "[object Object]" on screen before this helper existed.
    const body = {
      detail: [{ type: "less_than_equal", loc: ["body", "items", 0, "quantity"], msg: "Input should be <= 99" }],
    }
    expect(extractErrorMessage(body, "fallback")).toBe("Input should be <= 99")
  })

  it("falls back when the body is missing, null, or has no detail", () => {
    expect(extractErrorMessage(null, "fallback")).toBe("fallback")
    expect(extractErrorMessage(undefined, "fallback")).toBe("fallback")
    expect(extractErrorMessage({ notDetail: "x" }, "fallback")).toBe("fallback")
  })
})
