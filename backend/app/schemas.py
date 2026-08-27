from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, computed_field, field_validator

from app.models import OrderStatus, PaymentMethod, PaymentStatus, UserRole

DebugFailureMode = Literal["decline", "timeout", "server_error"]


# --- Auth ---


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    username: str
    role: UserRole


# --- Products ---


class ProductOut(BaseModel):
    id: int
    name: str
    description: str
    category: str
    price_cents: int
    stock: int
    active: bool

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def in_stock(self) -> bool:
        return self.stock > 0


# --- Orders ---


class OrderItemIn(BaseModel):
    product_id: int
    # Generous sanity ceiling only — rejects obviously-garbage payloads before
    # they reach business logic. The real per-item limit (5, or current stock
    # if lower) is enforced in routers/orders.py with a friendly message,
    # since FastAPI's default validation-error shape (a list of error
    # objects) isn't something the client should have to parse to show a
    # readable error.
    quantity: int = Field(gt=0, le=99)


class OrderCreateRequest(BaseModel):
    items: list[OrderItemIn]
    kiosk_username: str | None = None

    @field_validator("items")
    @classmethod
    def non_empty(cls, items: list[OrderItemIn]) -> list[OrderItemIn]:
        if not items:
            raise ValueError("Order must contain at least one item")
        return items


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    unit_price_cents: int
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    items: list[OrderItemOut]
    total_cents: int
    created_at: datetime
    paid_at: datetime | None
    cancelled_reason: str | None
    # Only the client that created the order ever sees this (returned once
    # at creation, then required back as X-Order-Token on later requests).
    access_token: str

    model_config = {"from_attributes": True}


class PayRequest(BaseModel):
    method: PaymentMethod
    # Only honored when the caller is authenticated as admin (see deps.require_admin).
    debug_failure_mode: DebugFailureMode | None = None


class PayResponse(BaseModel):
    order: OrderOut
    payment_status: PaymentStatus
    message: str
