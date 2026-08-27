"""Trivial role passthrough — no JWT, no sessions, no hashing, by design.

Login (see routers/auth.py) just checks username/password against the users
table and hands the role back to the client. The client re-sends that role
on the one request that needs it (forcing a payment failure), via a plain
header. This is intentionally not real security: there is nothing sensitive
to protect in a mock kiosk, and the spec explicitly asked for the simplest
possible admin/kiosk differentiation.
"""

from fastapi import Header

from app.models import UserRole


def get_current_role(x_role: str | None = Header(default=None)) -> UserRole | None:
    if x_role is None:
        return None
    try:
        return UserRole(x_role)
    except ValueError:
        return None
