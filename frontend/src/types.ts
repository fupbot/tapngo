export type UserRole = "admin" | "kiosk"

export interface Product {
  id: number
  name: string
  description: string
  category: string
  emoji: string
  price_cents: number
  stock: number
  active: boolean
  in_stock: boolean
}

export type PaymentMethod = "credit_card" | "apple_pay" | "google_pay" | "store_card"

export type DebugFailureMode = "decline" | "timeout" | "server_error"

export type OrderStatus = "PENDING" | "PAID" | "PREPARING" | "COMPLETED" | "CANCELLED"

export interface OrderItem {
  product_id: number
  product_name: string
  unit_price_cents: number
  quantity: number
}

export interface Order {
  id: number
  order_number: string
  status: OrderStatus
  items: OrderItem[]
  total_cents: number
  created_at: string
  paid_at: string | null
  cancelled_reason: string | null
}

export interface PayResponse {
  order: Order
  payment_status: "success" | "declined" | "error"
  message: string
}

export interface CartLine {
  product: Product
  quantity: number
}
