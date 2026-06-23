"""Journal entry business rules — double-entry balance and account rollup (P25)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

JE_STATUSES: tuple[str, ...] = ("draft", "posted", "void")
SOURCE_TYPES: tuple[str, ...] = (
    "manual",
    "vendor_payment",
    "customer_payment",
    "purchase_order",
    "invoice",
)

CREDIT_NORMAL_TYPES: frozenset[str] = frozenset({"liability", "equity", "revenue"})


class JournalValidationError(ValueError):
    """Raised when JOURNAL_ENTRY payload violates GL rules."""


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except Exception as exc:
        msg = f"invalid amount: {value}"
        raise JournalValidationError(msg) from exc


def _line_totals(lines: list[dict[str, Any]]) -> tuple[Decimal, Decimal]:
    debits = Decimal("0")
    credits = Decimal("0")
    for line in lines:
        debits += _decimal(line.get("debit"))
        credits += _decimal(line.get("credit"))
    return debits, credits


def _balance_delta(account_type: str, debit: Decimal, credit: Decimal) -> Decimal:
    if account_type in CREDIT_NORMAL_TYPES:
        return credit - debit
    return debit - credit


def _apply_posted_balances(
    lines: list[dict[str, Any]],
    *,
    repo: Any,
    registry: Any,
    commit: bool,
    reverse: bool = False,
) -> None:
    account_entity = registry.get("ACCOUNT")
    sign = Decimal("-1") if reverse else Decimal("1")

    for line in lines:
        account_id = str(line["account_id"])
        account = repo.get_record(account_entity, account_id)
        account_type = str(account.get("account_type") or "asset")
        debit = _decimal(line.get("debit"))
        credit = _decimal(line.get("credit"))
        delta = _balance_delta(account_type, debit, credit) * sign
        new_balance = _decimal(account.get("balance")) + delta
        repo.update_record(
            account_entity,
            account_id,
            {"balance": float(new_balance)},
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


def _validate_status_transition(
    payload: dict[str, Any],
    *,
    partial: bool,
    existing: dict[str, Any] | None,
) -> None:
    if not partial or existing is None:
        status = payload.get("status")
        if status == "posted":
            msg = "cannot create journal entry directly in posted status"
            raise JournalValidationError(msg)
        if status == "void":
            msg = "cannot create journal entry directly in void status"
            raise JournalValidationError(msg)
        return

    old_status = str(existing.get("status") or "draft")
    if old_status == "void":
        msg = "void journal entries cannot be modified"
        raise JournalValidationError(msg)

    new_status = payload.get("status")
    if new_status is None:
        if old_status == "posted":
            msg = "posted journal entries cannot be modified except to void"
            raise JournalValidationError(msg)
        return

    new_status = str(new_status)
    if new_status == old_status:
        return

    if old_status == "posted":
        if new_status != "void":
            msg = "posted journal entries cannot be modified except to void"
            raise JournalValidationError(msg)
        return

    if new_status == "posted":
        if old_status != "draft":
            msg = "only draft journal entries can be posted"
            raise JournalValidationError(msg)
        return

    if new_status == "void":
        msg = "only posted journal entries can be voided"
        raise JournalValidationError(msg)


def validate_journal_entry_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    _validate_status_transition(payload, partial=partial, existing=existing)

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

    line_entity = registry.get("JOURNAL_ENTRY_LINE")
    lines = [
        line
        for line in repo.list_records(line_entity)
        if str(line.get("journal_entry_id")) == str(record_id)
    ]
    if not lines:
        msg = "cannot post journal entry without lines"
        raise JournalValidationError(msg)

    debits, credits = _line_totals(lines)
    if debits != credits:
        msg = f"journal entry is not balanced: debits={debits}, credits={credits}"
        raise JournalValidationError(msg)

    commit = context.get("commit", True)
    _apply_posted_balances(lines, repo=repo, registry=registry, commit=commit, reverse=voiding)
