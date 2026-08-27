"""Pluggable mock payment processors.

No payment here is real — the spec only requires the shape of a payment step.
Each PaymentMethod maps to a processor so the strategy is easy to swap or
extend, per ARCHITECTURE_DECISIONS.md section 4.1.

Admin-only `debug_failure_mode` lets the UI's failure-injection panel force a
decline, a gateway timeout, or a server error, to exercise the client's error
handling without touching code.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.models import PaymentMethod, PaymentStatus


class PaymentTimeoutError(Exception):
    """Simulated gateway timeout — maps to HTTP 504 at the router layer."""


class PaymentGatewayError(Exception):
    """Simulated unexpected gateway/server failure — maps to HTTP 500."""


@dataclass
class PaymentResult:
    status: PaymentStatus
    message: str


class PaymentProcessor(ABC):
    display_name: str

    @abstractmethod
    def charge(self, amount_cents: int, debug_failure_mode: str | None) -> PaymentResult: ...

    def _apply_debug_failure_mode(self, debug_failure_mode: str | None) -> PaymentResult | None:
        if debug_failure_mode == "decline":
            return PaymentResult(
                status=PaymentStatus.DECLINED,
                message=f"{self.display_name} was declined.",
            )
        if debug_failure_mode == "timeout":
            raise PaymentTimeoutError(f"{self.display_name} gateway timed out.")
        if debug_failure_mode == "server_error":
            raise PaymentGatewayError(f"{self.display_name} gateway returned an error.")
        return None


class CreditCardProcessor(PaymentProcessor):
    display_name = "Credit card"

    def charge(self, amount_cents: int, debug_failure_mode: str | None) -> PaymentResult:
        forced = self._apply_debug_failure_mode(debug_failure_mode)
        if forced is not None:
            return forced
        return PaymentResult(status=PaymentStatus.SUCCESS, message="Credit card charged.")


class MobileWalletProcessor(PaymentProcessor):
    """Shared strategy for Apple Pay and Google Pay — same mock rail, different label."""

    def __init__(self, display_name: str) -> None:
        self.display_name = display_name

    def charge(self, amount_cents: int, debug_failure_mode: str | None) -> PaymentResult:
        forced = self._apply_debug_failure_mode(debug_failure_mode)
        if forced is not None:
            return forced
        return PaymentResult(status=PaymentStatus.SUCCESS, message=f"{self.display_name} charged.")


class StoreCardProcessor(PaymentProcessor):
    display_name = "Store card"

    def charge(self, amount_cents: int, debug_failure_mode: str | None) -> PaymentResult:
        forced = self._apply_debug_failure_mode(debug_failure_mode)
        if forced is not None:
            return forced
        return PaymentResult(status=PaymentStatus.SUCCESS, message="Store card charged.")


_PROCESSORS: dict[PaymentMethod, PaymentProcessor] = {
    PaymentMethod.CREDIT_CARD: CreditCardProcessor(),
    PaymentMethod.APPLE_PAY: MobileWalletProcessor("Apple Pay"),
    PaymentMethod.GOOGLE_PAY: MobileWalletProcessor("Google Pay"),
    PaymentMethod.STORE_CARD: StoreCardProcessor(),
}


def get_payment_processor(method: PaymentMethod) -> PaymentProcessor:
    return _PROCESSORS[method]
