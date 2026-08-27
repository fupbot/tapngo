from app.models import Order, OrderStatus, Product


def _create_order(client, items):
    resp = client.post("/api/v1/orders", json={"items": items})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _pay(client, order_id, token, method="credit_card", debug_failure_mode=None, role=None):
    headers = {"X-Order-Token": token}
    if role:
        headers["X-Role"] = role
    return client.post(
        f"/api/v1/orders/{order_id}/pay",
        headers=headers,
        json={"method": method, "debug_failure_mode": debug_failure_mode},
    )


def test_create_order_success_returns_pending_with_correct_total(client, make_product):
    product = make_product(price_cents=250, stock=10)

    order = _create_order(client, [{"product_id": product.id, "quantity": 2}])

    assert order["status"] == "PENDING"
    assert order["total_cents"] == 500
    assert order["access_token"]


def test_create_order_rejects_quantity_over_allowed_cap(client, make_product):
    plenty = make_product(stock=10)
    resp = client.post("/api/v1/orders", json={"items": [{"product_id": plenty.id, "quantity": 6}]})
    assert resp.status_code == 400
    assert "up to 5" in resp.json()["detail"]

    sold_out = make_product(stock=0)
    resp = client.post("/api/v1/orders", json={"items": [{"product_id": sold_out.id, "quantity": 1}]})
    assert resp.status_code == 400
    assert "sold out" in resp.json()["detail"]


def test_order_access_requires_correct_token(client, make_product):
    product = make_product()
    order = _create_order(client, [{"product_id": product.id, "quantity": 1}])

    wrong_token = client.get(f"/api/v1/orders/{order['id']}", headers={"X-Order-Token": "wrong"})
    assert wrong_token.status_code == 404

    missing_token = client.get(f"/api/v1/orders/{order['id']}")
    assert missing_token.status_code == 422


def test_pay_success_decrements_stock_and_marks_paid(client, make_product, db):
    product = make_product(price_cents=200, stock=10)
    order = _create_order(client, [{"product_id": product.id, "quantity": 3}])

    resp = _pay(client, order["id"], order["access_token"])

    assert resp.status_code == 200
    body = resp.json()
    assert body["payment_status"] == "success"
    assert body["order"]["status"] == "PAID"
    assert body["order"]["paid_at"] is not None

    db.expire_all()
    refreshed = db.get(Product, product.id)
    assert refreshed.stock == 7


def test_pay_insufficient_stock_returns_409_and_cancels_order(client, make_product, db):
    product = make_product(stock=1)
    order_a = _create_order(client, [{"product_id": product.id, "quantity": 1}])
    order_b = _create_order(client, [{"product_id": product.id, "quantity": 1}])

    first = _pay(client, order_a["id"], order_a["access_token"])
    assert first.status_code == 200

    second = _pay(client, order_b["id"], order_b["access_token"])
    assert second.status_code == 409
    assert "unavailable" in second.json()["detail"]

    db.expire_all()
    refreshed = db.get(Order, order_b["id"])
    assert refreshed.status == OrderStatus.CANCELLED
    assert refreshed.cancelled_reason


def test_pay_debug_failure_mode_requires_admin_role(client, make_product):
    product = make_product()
    order = _create_order(client, [{"product_id": product.id, "quantity": 1}])

    no_role = _pay(client, order["id"], order["access_token"], debug_failure_mode="decline")
    assert no_role.status_code == 403

    kiosk_role = _pay(client, order["id"], order["access_token"], debug_failure_mode="decline", role="kiosk")
    assert kiosk_role.status_code == 403


def test_pay_debug_decline_as_admin_returns_402_and_order_stays_pending(client, make_product):
    product = make_product()
    order = _create_order(client, [{"product_id": product.id, "quantity": 1}])

    resp = _pay(client, order["id"], order["access_token"], debug_failure_mode="decline", role="admin")

    assert resp.status_code == 402
    body = resp.json()
    assert body["payment_status"] == "declined"
    assert body["order"]["status"] == "PENDING"


def test_cancel_order_only_allowed_from_pending(client, make_product):
    product = make_product()
    order = _create_order(client, [{"product_id": product.id, "quantity": 1}])
    headers = {"X-Order-Token": order["access_token"]}

    first = client.post(f"/api/v1/orders/{order['id']}/cancel", headers=headers)
    assert first.status_code == 200
    assert first.json()["status"] == "CANCELLED"

    second = client.post(f"/api/v1/orders/{order['id']}/cancel", headers=headers)
    assert second.status_code == 409


def test_refund_restocks_and_cancels_paid_order(client, make_product, db):
    product = make_product(stock=10)
    order = _create_order(client, [{"product_id": product.id, "quantity": 4}])
    _pay(client, order["id"], order["access_token"])

    resp = client.post(f"/api/v1/orders/{order['id']}/refund", headers={"X-Order-Token": order["access_token"]})

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "CANCELLED"
    assert body["cancelled_reason"] == "Refunded"

    db.expire_all()
    refreshed = db.get(Product, product.id)
    assert refreshed.stock == 10
