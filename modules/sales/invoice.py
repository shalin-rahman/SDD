"""Invoice business rules — balance consistency and status transitions (P28)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

INVOICE_STATUSES: tuple[str, ...] = ("draft", "sent", "partial", "paid", "void")

_ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    "draft": frozenset({"sent", "void"}),
    "sent": frozenset({"partial", "paid", "void"}),
    "partial": frozenset({"paid", "void"}),
    "paid": frozenset(),
    "void": frozenset(),
}


class InvoiceValidationError(ValueError):
    """Raised when INVOICE payload violates AR invoice rules."""


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except Exception as exc:
        msg = f"invalid amount: {value}"
        raise InvoiceValidationError(msg) from exc


def _validate_amount_consistency(merged: dict[str, Any]) -> None:
    amount = _decimal(merged.get("amount"))
    if amount <= 0:
        msg = "invoice amount must be positive"
        raise InvoiceValidationError(msg)

    amount_paid = _decimal(merged.get("amount_paid"))
    if amount_paid < 0:
        msg = "amount_paid cannot be negative"
        raise InvoiceValidationError(msg)

    balance_raw = merged.get("balance_due")
    balance_due = amount - amount_paid if balance_raw is None else _decimal(balance_raw)
    if balance_due < 0:
        msg = "balance_due cannot be negative"
        raise InvoiceValidationError(msg)

    if amount_paid + balance_due != amount:
        msg = "amount, amount_paid, and balance_due are inconsistent"
        raise InvoiceValidationError(msg)

    status = str(merged.get("status") or "draft")
    if status == "void":
        if amount_paid > 0:
            msg = "void invoices cannot have payments applied"
            raise InvoiceValidationError(msg)
        return

    if status == "sent" and amount_paid != 0:
        msg = "sent invoices must have zero amount_paid"
        raise InvoiceValidationError(msg)
    if status == "partial" and (amount_paid <= 0 or amount_paid >= amount):
        msg = "partial invoices require amount_paid between zero and amount"
        raise InvoiceValidationError(msg)
    if status == "paid" and (amount_paid < amount or balance_due != 0):
        msg = "paid invoices require full payment and zero balance_due"
        raise InvoiceValidationError(msg)


def _validate_status_transition(
    payload: dict[str, Any],
    *,
    partial: bool,
    existing: dict[str, Any] | None,
) -> None:
    new_status = payload.get("status")
    if new_status is None:
        return

    if not partial or existing is None:
        return

    old_status = str(existing.get("status") or "draft")
    if new_status == old_status:
        return

    if old_status == "void":
        msg = "void invoices cannot be modified"
        raise InvoiceValidationError(msg)

    if old_status == "paid":
        msg = "paid invoices cannot be modified"
        raise InvoiceValidationError(msg)

    allowed = _ALLOWED_TRANSITIONS.get(old_status, frozenset())
    if new_status not in allowed:
        msg = f"invalid invoice status transition: {old_status} -> {new_status}"
        raise InvoiceValidationError(msg)

    if new_status == "void":
        merged = {**existing, **payload}
        amount_paid = _decimal(merged.get("amount_paid"))
        if amount_paid > 0:
            msg = "cannot void invoice with payments applied"
            raise InvoiceValidationError(msg)


def validate_invoice_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    merged = {**(existing or {}), **payload}

    _validate_status_transition(payload, partial=partial, existing=existing)

    if merged.get("amount") is not None:
        _validate_amount_consistency(merged)
