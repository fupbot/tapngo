from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import Product, User, UserRole


@pytest.fixture()
def db_engine(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def session_factory(db_engine):
    return sessionmaker(bind=db_engine, autoflush=False, autocommit=False)


@pytest.fixture()
def db(session_factory) -> Generator[Session, None, None]:
    """A session for test setup/assertions — independent of whatever session
    a request handles under the hood, so tests must re-query/refresh after
    hitting the client rather than trusting possibly-stale Python objects."""
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(session_factory, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    # A successful /pay schedules the PAID -> PREPARING -> COMPLETED lifecycle
    # timer as a BackgroundTask. Starlette runs background tasks as part of
    # the *same* request/response cycle (not a detached thread), so without
    # this the TestClient call would synchronously block for the timer's
    # real ~8s sleep — and, worse, order_lifecycle.py imports SessionLocal
    # directly from app.database rather than going through get_db, so it
    # would bypass the override above and touch the real dev tapngo.db file.
    # Not something a "simple, core functionality" suite needs to exercise.
    monkeypatch.setattr("app.routers.orders.schedule_order_lifecycle", lambda *args, **kwargs: None)

    # Not `with TestClient(app) as client:` — that would run the app's
    # lifespan, which calls seed.init_db() against the *real* dev database
    # (app.database's module-level engine, bound to settings.database_url),
    # not this test's temp file. Instantiating directly skips lifespan
    # entirely; only the overridden get_db dependency ever touches a DB here.
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def make_product(db: Session):
    def _make(**overrides) -> Product:
        defaults = dict(name="Test Item", category="Snacks", price_cents=100, stock=10, active=True)
        defaults.update(overrides)
        product = Product(**defaults)
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    return _make


@pytest.fixture()
def make_user(db: Session):
    def _make(**overrides) -> User:
        defaults = dict(username="testuser", password="testpass", role=UserRole.KIOSK)
        defaults.update(overrides)
        user = User(**defaults)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return _make
