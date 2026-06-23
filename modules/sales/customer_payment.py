"""Customer payment business rules — overpay guard and invoice balance updates (P25)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

PAYMENT_STATUSES: tuple[str, ...] = ("draft", "posted", "void")
PAYMENT_METHODS: tuple[str, ...] = ("check", "wire", "ach", "cash", "card", "other")


class CustomerPaymentValidationError(ValueError):
    """Raised when CUSTOMER_PAYMENT payload violates AR rules."""


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except Exception as exc:
        msg = f"invalid amount: {value}"
        raise CustomerPaymentValidationError(msg) from exc


def _find_account_by_code(repo: Any, registry: Any, code: str) -> str | None:
    account_entity = registry.get("ACCOUNT")
    for account in repo.list_records(account_entity):
        if str(account.get("code", "")).upper() == code.upper():
            return str(account["id"])
    return None


def _create_payment_journal(
    payment: dict[str, Any],
    *,
    payment_id: str,
    repo: Any,
    registry: Any,
) -> None:
    ar_account_id = _find_account_by_code(repo, registry, "AR")
    cash_account_id = _find_account_by_code(repo, registry, "CASH")
    if ar_account_id is None or cash_account_id is None:
        return

    amount = _decimal(payment.get("amount"))
    je_entity = registry.get("JOURNAL_ENTRY")
    je_line_entity = registry.get("JOURNAL_ENTRY_LINE")
    reference = f"CP-{payment.get('payment_number', payment_id)[:30]}"

    entry = repo.create_record(
        je_entity,
        {
            "reference": reference,
            "source_type": "customer_payment",
            "source_id": str(payment_id),
            "status": "draft",
            "active": True,
        },
    )

    repo.create_record(
        je_line_entity,
        {
            "journal_entry_id": entry["id"],
            "account_id": cash_account_id,
            "debit": float(amount),
            "credit": 0.0,
        },
    )
    repo.create_record(
        je_line_entity,
        {
            "journal_entry_id": entry["id"],
            "account_id": ar_account_id,
            "debit": 0.0,
            "credit": float(amount),
        },
    )


def _invoice_status(amount_paid: Decimal, invoice_amount: Decimal) -> str:
    if amount_paid >= invoice_amount:
        return "paid"
    if amount_paid > 0:
        return "partial"
    return "sent"


def _apply_invoice_payment(
    invoice_id: str,
    amount: Decimal,
    *,
    repo: Any,
    registry: Any,
    commit: bool,
) -> None:
    invoice_entity = registry.get("INVOICE")
    invoice = repo.get_record(invoice_entity, invoice_id)
    balance_due = _decimal(invoice.get("balance_due", invoice.get("amount")))
    if amount > balance_due:
        msg = f"payment exceeds balance due: {amount} > {balance_due}"
        raise CustomerPaymentValidationError(msg)

    invoice_amount = _decimal(invoice.get("amount"))
    amount_paid = _decimal(invoice.get("amount_paid")) + amount
    new_balance = balance_due - amount
    status = _invoice_status(amount_paid, invoice_amount)

    repo.update_record(
        invoice_entity,
        invoice_id,
        {
            "amount_paid": float(amount_paid),
            "balance_due": float(new_balance),
            "status": status,
        },
        commit=commit,
    )


def _reverse_invoice_payment(
    invoice_id: str,
    amount: Decimal,
    *,
    repo: Any,
    registry: Any,
    commit: bool,
) -> None:
    invoice_entity = registry.get("INVOICE")
    invoice = repo.get_record(invoice_entity, invoice_id)
    invoice_amount = _decimal(invoice.get("amount"))
    amount_paid = _decimal(invoice.get("amount_paid")) - amount
    if amount_paid < 0:
        msg = "cannot void payment: amount_paid would be negative"
        raise CustomerPaymentValidationError(msg)

    balance_due = _decimal(invoice.get("balance_due")) + amount
    status = _invoice_status(amount_paid, invoice_amount)
    repo.update_record(
        invoice_entity,
        invoice_id,
        {
            "amount_paid": float(amount_paid),
            "balance_due": float(balance_due),
            "status": status,
        },
        commit=commit,
    )


def _is_posting_transition(
    payload: dict[str, Any],
    *,
    partial: bool,
    existing: dict[str, Any] | None,
) -> bool:
    if not partial or existing is None:
        return payload.get("status") == "posted"
    return payload.get("status") == "posted" and existing.get("status") == "draft"


def _is_void_transition(
    payload: dict[str, Any],
    *,
    partial: bool,
    existing: dict[str, Any] | None,
) -> bool:
    if not partial or existing is None:
        return False
    return payload.get("status") == "void" and existing.get("status") == "posted"


def validate_customer_payment_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    merged = {**(existing or {}), **payload}
    amount = _decimal(merged.get("amount"))
    if amount <= 0:
        msg = "payment amount must be positive"
        raise CustomerPaymentValidationError(msg)

    if payload.get("status") == "posted" and not partial:
        msg = "cannot create customer payment directly in posted status"
        raise CustomerPaymentValidationError(msg)

    if payload.get("status") == "void" and not partial:
        msg = "cannot create customer payment directly in void status"
        raise CustomerPaymentValidationError(msg)

    posting = _is_posting_transition(payload, partial=partial, existing=existing)
    voiding = _is_void_transition(payload, partial=partial, existing=existing)
    if not posting and not voiding:
        return

    if context is None:
        return

    repo = context.get("repo")
    registry = context.get("registry")
    record_id = context.get("record_id")
    if repo is None or registry is None or record_id is None:
        return

    invoice_id = str(merged.get("invoice_id") or "")
    if not invoice_id:
        msg = "invoice_id is required to post or void customer payment"
        raise CustomerPaymentValidationError(msg)

    commit = context.get("commit", True)
    if voiding:
        _reverse_invoice_payment(invoice_id, amount, repo=repo, registry=registry, commit=commit)
        return

    _apply_invoice_payment(invoice_id, amount, repo=repo, registry=registry, commit=commit)
    _create_payment_journal(merged, payment_id=str(record_id), repo=repo, registry=registry)
