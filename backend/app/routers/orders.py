import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Response
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_role
from app.models import Order, OrderItem, OrderStatus, PaymentStatus, PaymentTransaction, Product, UserRole
from app.schemas import OrderCreateRequest, OrderOut, PayRequest, PayResponse
from app.services.order_lifecycle import schedule_order_lifecycle
from app.services.payment import PaymentGatewayError, PaymentTimeoutError, get_payment_processor

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])

# Per-item cap on a single order — independent of the Pydantic sanity
# ceiling in schemas.py. Mirrored on the frontend (SessionContext.tsx) so a
# customer never gets this far in the common case; enforced here too since
# the frontend cap is a UX nicety, not a trust boundary.
MAX_QUANTITY_PER_ITEM = 5


def _load_order(db: Session, order_id: int, token: str) -> Order:
    order = db.get(Order, order_id, options=[selectinload(Order.items)])
    # Same 404 whether the order doesn't exist or the token is wrong — a
    # mismatched token shouldn't even confirm that order ID is real.
    if order is None or not secrets.compare_digest(order.access_token, token):
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreateRequest, db: Session = Depends(get_db)) -> Order:
    product_ids = [item.product_id for item in payload.items]
    products = {p.id: p for p in db.scalars(select(Product).where(Product.id.in_(product_ids)))}

    order = Order(kiosk_username=payload.kiosk_username)
    for item in payload.items:
        product = products.get(item.product_id)
        if product is None or not product.active:
            raise HTTPException(status_code=400, detail=f"Unknown product id {item.product_id}")

        allowed = min(MAX_QUANTITY_PER_ITEM, product.stock)
        if allowed <= 0:
            raise HTTPException(status_code=400, detail=f"{product.name} is sold out.")
        if item.quantity > allowed:
            raise HTTPException(
                status_code=400,
                detail=f"You can add up to {allowed} of {product.name} right now.",
            )

        order.items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price_cents=product.price_cents,
                quantity=item.quantity,
            )
        )

    db.add(order)
    db.commit()
    db.refresh(order, attribute_names=["items"])
    return order


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, x_order_token: str = Header(...), db: Session = Depends(get_db)) -> Order:
    return _load_order(db, order_id, x_order_token)


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: int, x_order_token: str = Header(...), db: Session = Depends(get_db)) -> Order:
    """Customer backed out of the payment screen without paying."""
    order = _load_order(db, order_id, x_order_token)
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=409, detail=f"Order is already {order.status.value}")
    order.status = OrderStatus.CANCELLED
    order.cancelled_reason = "Cancelled by customer"
    db.commit()
    db.refresh(order, attribute_names=["items"])
    return order


@router.post("/{order_id}/refund", response_model=OrderOut)
def refund_order(order_id: int, x_order_token: str = Header(...), db: Session = Depends(get_db)) -> Order:
    """Customer changed their mind after paying — reverse it and restock.

    Only reachable for PAID/PREPARING orders: PENDING has nothing to refund
    (use /cancel), and once COMPLETED the order's already been handed over.
    No UI calls this yet — it exists so "I paid and want out" isn't a dead
    end at the API layer, even though this version's frontend doesn't
    surface a way to trigger it.
    """
    order = _load_order(db, order_id, x_order_token)
    if order.status not in (OrderStatus.PAID, OrderStatus.PREPARING):
        raise HTTPException(
            status_code=409, detail=f"Order is {order.status.value} and can no longer be refunded"
        )

    for item in order.items:
        db.execute(update(Product).where(Product.id == item.product_id).values(stock=Product.stock + item.quantity))

    order.status = OrderStatus.CANCELLED
    order.cancelled_reason = "Refunded"
    db.commit()
    db.refresh(order, attribute_names=["items"])
    return order


@router.post("/{order_id}/pay", response_model=PayResponse)
def pay_order(
    order_id: int,
    payload: PayRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    x_order_token: str = Header(...),
    db: Session = Depends(get_db),
    role: UserRole | None = Depends(get_current_role),
) -> PayResponse:
    order = _load_order(db, order_id, x_order_token)
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=409, detail=f"Order is already {order.status.value}")

    if payload.debug_failure_mode is not None and role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can force a payment failure mode")

    processor = get_payment_processor(payload.method)
    try:
        result = processor.charge(order.total_cents, payload.debug_failure_mode)
    except PaymentTimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except PaymentGatewayError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if result.status == PaymentStatus.DECLINED:
        db.add(
            PaymentTransaction(
                order_id=order.id,
                method=payload.method,
                status=result.status,
                failure_reason=result.message,
                simulated_failure_mode=payload.debug_failure_mode,
            )
        )
        db.commit()
        db.refresh(order, attribute_names=["items"])
        response.status_code = 402
        return PayResponse(order=order, payment_status=result.status, message=result.message)

    # Success path: atomic per-item stock decrement, all-or-nothing.
    # SQLite serializes writers regardless, so whichever request's decrement
    # actually commits first wins — see ARCHITECTURE_DECISIONS.md section 3.
    unavailable: list[str] = []
    for item in order.items:
        outcome = db.execute(
            update(Product)
            .where(Product.id == item.product_id, Product.stock >= item.quantity)
            .values(stock=Product.stock - item.quantity)
        )
        if outcome.rowcount == 0:
            unavailable.append(item.product_name)

    if unavailable:
        db.rollback()
        order.status = OrderStatus.CANCELLED
        order.cancelled_reason = f"Sorry, item unavailable: {', '.join(unavailable)}"
        db.commit()
        raise HTTPException(status_code=409, detail=order.cancelled_reason)

    order.status = OrderStatus.PAID
    order.paid_at = func.now()
    db.add(
        PaymentTransaction(
            order_id=order.id,
            method=payload.method,
            status=result.status,
            failure_reason=None,
            simulated_failure_mode=None,
        )
    )
    db.commit()
    db.refresh(order, attribute_names=["items"])
    schedule_order_lifecycle(background_tasks, order.id)
    return PayResponse(order=order, payment_status=result.status, message=result.message)
