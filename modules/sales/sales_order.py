"""Sales order business rules — line rollup (P25)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any


class SalesOrderValidationError(ValueError):
    """Raised when SALES_ORDER payload violates sales rules."""


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except Exception as exc:
        msg = f"invalid numeric value: {value}"
        raise SalesOrderValidationError(msg) from exc


def rollup_so_lines(
    sales_order_id: str,
    *,
    repo: Any,
    registry: Any,
) -> Decimal:
    line_entity = registry.get("SALES_ORDER_LINE")
    lines = [
        line
        for line in repo.list_records(line_entity)
        if str(line.get("sales_order_id")) == str(sales_order_id)
    ]
    total = Decimal("0")
    for line in lines:
        qty = _decimal(line.get("quantity"))
        price = _decimal(line.get("unit_price"))
        if qty <= 0:
            msg = "line quantity must be positive"
            raise SalesOrderValidationError(msg)
        total += qty * price
    return total


def validate_sales_order_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    if not partial or existing is None or context is None:
        return

    repo = context.get("repo")
    registry = context.get("registry")
    record_id = context.get("record_id")
    if repo is None or registry is None or record_id is None:
        return

    if payload.get("status") not in {"confirmed", "shipped", "invoiced"}:
        return

    total = rollup_so_lines(str(record_id), repo=repo, registry=registry)
    if total > 0:
        payload["total_amount"] = float(total)
