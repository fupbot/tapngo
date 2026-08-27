"""Auto-simulated PAID -> PREPARING -> COMPLETED lifecycle.

No kitchen/staff app exists in this project's scope, so nothing external
would ever drive an order past PAID. A short fire-and-forget timer advances
it instead, purely so the full state machine is observable end-to-end.
See ARCHITECTURE_DECISIONS.md section 2.3 and DEVELOPMENT_LOG.md Step 9.

Runs via FastAPI's BackgroundTasks (executed after the response is sent, on
a worker thread) rather than asyncio.create_task — the order endpoints are
plain sync def functions dispatched to a threadpool, so there is no running
event loop in that thread to attach an asyncio task to.
"""

import logging
import time

from fastapi import BackgroundTasks

from app.config import settings
from app.database import SessionLocal
from app.models import Order, OrderStatus

logger = logging.getLogger(__name__)


def schedule_order_lifecycle(background_tasks: BackgroundTasks, order_id: int) -> None:
    background_tasks.add_task(_advance_order_lifecycle, order_id)


def _advance_order_lifecycle(order_id: int) -> None:
    try:
        time.sleep(settings.order_preparing_after_seconds)
        _transition(order_id, OrderStatus.PAID, OrderStatus.PREPARING)

        remaining = settings.order_completed_after_seconds - settings.order_preparing_after_seconds
        time.sleep(max(remaining, 0))
        _transition(order_id, OrderStatus.PREPARING, OrderStatus.COMPLETED)
    except Exception:
        logger.exception("Order lifecycle simulation failed for order %s", order_id)


def _transition(order_id: int, expected: OrderStatus, new_status: OrderStatus) -> None:
    with SessionLocal() as db:
        order = db.get(Order, order_id)
        if order is not None and order.status == expected:
            order.status = new_status
            db.commit()
