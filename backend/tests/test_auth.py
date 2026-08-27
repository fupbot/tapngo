from app.models import UserRole


def test_login_success_returns_username_and_role(client, make_user):
    make_user(username="admin1", password="secret123", role=UserRole.ADMIN)

    resp = client.post("/api/v1/auth/login", json={"username": "admin1", "password": "secret123"})

    assert resp.status_code == 200
    assert resp.json() == {"username": "admin1", "role": "admin"}


def test_login_invalid_credentials_returns_401(client, make_user):
    make_user(username="kiosk9", password="secret123", role=UserRole.KIOSK)

    wrong_password = client.post("/api/v1/auth/login", json={"username": "kiosk9", "password": "nope"})
    assert wrong_password.status_code == 401

    unknown_user = client.post("/api/v1/auth/login", json={"username": "ghost", "password": "anything"})
    assert unknown_user.status_code == 401
