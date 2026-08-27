"""Idempotent DB bootstrap: creates tables and seeds users + menu if empty.

Safe to call on every app startup (see main.py's lifespan) — it only inserts
when a table is empty, so restarting the container never duplicates data or
resets stock counts a customer already ate into.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import Product, User, UserRole

USERS = [
    {"username": "admin", "password": "admin123", "role": UserRole.ADMIN},
    {"username": "kiosk1", "password": "kiosk123", "role": UserRole.KIOSK},
    {"username": "kiosk2", "password": "kiosk123", "role": UserRole.KIOSK},
    {"username": "kiosk3", "password": "kiosk123", "role": UserRole.KIOSK},
]

PRODUCTS = [
    # Drinks
    {"name": "Cola", "category": "Drinks", "price_cents": 250, "stock": 40},
    {"name": "Sparkling Water", "category": "Drinks", "price_cents": 200, "stock": 30},
    {"name": "Iced Tea", "category": "Drinks", "price_cents": 275, "stock": 25},
    {"name": "Orange Juice", "category": "Drinks", "price_cents": 300, "stock": 20},
    # Snacks
    {"name": "Potato Chips", "category": "Snacks", "price_cents": 275, "stock": 50},
    {"name": "Pretzel", "category": "Snacks", "price_cents": 250, "stock": 40},
    {"name": "Popcorn", "category": "Snacks", "price_cents": 300, "stock": 35},
    {"name": "Trail Mix", "category": "Snacks", "price_cents": 325, "stock": 25},
    # Hot Food
    {"name": "Hot Dog", "category": "Hot Food", "price_cents": 450, "stock": 20},
    {"name": "Nachos", "category": "Hot Food", "price_cents": 500, "stock": 0},
    {"name": "Pizza Slice", "category": "Hot Food", "price_cents": 475, "stock": 18},
    # Desserts
    {"name": "Chocolate Bar", "category": "Desserts", "price_cents": 275, "stock": 30},
    {"name": "Cookie", "category": "Desserts", "price_cents": 225, "stock": 40},
    {"name": "Ice Cream Cup", "category": "Desserts", "price_cents": 350, "stock": 15},
]


def seed(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)) is None:
        db.add_all(User(**u) for u in USERS)

    if db.scalar(select(Product.id).limit(1)) is None:
        db.add_all(Product(**p) for p in PRODUCTS)

    db.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)


if __name__ == "__main__":
    init_db()
    print("Database initialized and seeded.")
