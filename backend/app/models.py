import enum
from datetime import datetime

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    KIOSK = "kiosk"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    PREPARING = "PREPARING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, enum.Enum):
    CREDIT_CARD = "credit_card"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    STORE_CARD = "store_card"


class PaymentStatus(str, enum.Enum):
    SUCCESS = "success"
    DECLINED = "declined"
    ERROR = "error"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    # Intentionally plaintext: spec calls for the simplest possible name/password
    # differentiation between admin and kiosk users, no JWT, no hashing.
    password: Mapped[str]
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole))


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    description: Mapped[str] = mapped_column(default="")
    category: Mapped[str] = mapped_column(default="")
    emoji: Mapped[str] = mapped_column(default="")
    price_cents: Mapped[int]
    stock: Mapped[int]
    active: Mapped[bool] = mapped_column(default=True)

    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus), default=OrderStatus.PENDING
    )
    kiosk_username: Mapped[str | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(default=None)
    cancelled_reason: Mapped[str | None] = mapped_column(default=None)

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    payment: Mapped["PaymentTransaction | None"] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )

    @property
    def order_number(self) -> str:
        return f"{self.id:04d}"

    @property
    def total_cents(self) -> int:
        return sum(item.unit_price_cents * item.quantity for item in self.items)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    # Snapshot name/price at order time so later catalog edits don't rewrite history.
    product_name: Mapped[str]
    unit_price_cents: Mapped[int]
    quantity: Mapped[int]

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product] = relationship(back_populates="order_items")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), unique=True)
    method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod))
    status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus))
    failure_reason: Mapped[str | None] = mapped_column(default=None)
    # Debug-only: which admin-forced failure mode produced this, if any.
    simulated_failure_mode: Mapped[str | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    order: Mapped[Order] = relationship(back_populates="payment")
