"""Vendor payment business rules — overpay guard and PO balance updates (P25)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

PAYMENT_STATUSES: tuple[str, ...] = ("draft", "posted", "void")
PAYMENT_METHODS: tuple[str, ...] = ("check", "wire", "ach", "cash", "other")


class VendorPaymentValidationError(ValueError):
    """Raised when VENDOR_PAYMENT payload violates AP rules."""


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except Exception as exc:
        msg = f"invalid amount: {value}"
        raise VendorPaymentValidationError(msg) from exc


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
    ap_account_id = _find_account_by_code(repo, registry, "AP")
    cash_account_id = _find_account_by_code(repo, registry, "CASH")
    if ap_account_id is None or cash_account_id is None:
        return

    amount = _decimal(payment.get("amount"))
    je_entity = registry.get("JOURNAL_ENTRY")
    je_line_entity = registry.get("JOURNAL_ENTRY_LINE")
    reference = f"VP-{payment.get('payment_number', payment_id)[:30]}"

    entry = repo.create_record(
        je_entity,
        {
            "reference": reference,
            "source_type": "vendor_payment",
            "source_id": str(payment_id),
            "status": "draft",
            "active": True,
        },
    )

    repo.create_record(
        je_line_entity,
        {
            "journal_entry_id": entry["id"],
            "account_id": ap_account_id,
            "debit": float(amount),
            "credit": 0.0,
        },
    )
    repo.create_record(
        je_line_entity,
        {
            "journal_entry_id": entry["id"],
            "account_id": cash_account_id,
            "debit": 0.0,
            "credit": float(amount),
        },
    )


def _apply_po_payment(
    po_id: str,
    amount: Decimal,
    *,
    repo: Any,
    registry: Any,
    commit: bool,
) -> None:
    po_entity = registry.get("PURCHASE_ORDER")
    po = repo.get_record(po_entity, po_id)
    balance_due = _decimal(po.get("balance_due", po.get("total_amount")))
    if amount > balance_due:
        msg = f"payment exceeds balance due: {amount} > {balance_due}"
        raise VendorPaymentValidationError(msg)

    amount_paid = _decimal(po.get("amount_paid")) + amount
    new_balance = balance_due - amount
    repo.update_record(
        po_entity,
        po_id,
        {"amount_paid": float(amount_paid), "balance_due": float(new_balance)},
        commit=commit,
    )


def _reverse_po_payment(
    po_id: str,
    amount: Decimal,
    *,
    repo: Any,
    registry: Any,
    commit: bool,
) -> None:
    po_entity = registry.get("PURCHASE_ORDER")
    po = repo.get_record(po_entity, po_id)
    amount_paid = _decimal(po.get("amount_paid")) - amount
    if amount_paid < 0:
        msg = "cannot void payment: amount_paid would be negative"
        raise VendorPaymentValidationError(msg)

    balance_due = _decimal(po.get("balance_due")) + amount
    repo.update_record(
        po_entity,
        po_id,
        {"amount_paid": float(amount_paid), "balance_due": float(balance_due)},
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


def validate_vendor_payment_payload(
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
        raise VendorPaymentValidationError(msg)

    if payload.get("status") == "posted" and not partial:
        msg = "cannot create vendor payment directly in posted status"
        raise VendorPaymentValidationError(msg)

    if payload.get("status") == "void" and not partial:
        msg = "cannot create vendor payment directly in void status"
        raise VendorPaymentValidationError(msg)

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

    po_id = str(merged.get("po_id") or "")
    if not po_id:
        msg = "po_id is required to post or void vendor payment"
        raise VendorPaymentValidationError(msg)

    commit = context.get("commit", True)
    if voiding:
        _reverse_po_payment(po_id, amount, repo=repo, registry=registry, commit=commit)
        return

    _apply_po_payment(po_id, amount, repo=repo, registry=registry, commit=commit)
    _create_payment_journal(merged, payment_id=str(record_id), repo=repo, registry=registry)
