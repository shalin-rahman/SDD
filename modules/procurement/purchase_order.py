"""Purchase order business rules — line rollup and receive → stock movement (P25)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

PO_STATUSES: tuple[str, ...] = ("draft", "submitted", "received", "cancelled")


class PurchaseOrderValidationError(ValueError):
    """Raised when PURCHASE_ORDER payload violates procurement rules."""


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except Exception as exc:
        msg = f"invalid numeric value: {value}"
        raise PurchaseOrderValidationError(msg) from exc


def rollup_po_lines(
    po_id: str,
    *,
    repo: Any,
    registry: Any,
) -> Decimal:
    line_entity = registry.get("PURCHASE_ORDER_LINE")
    lines = [
        line
        for line in repo.list_records(line_entity)
        if str(line.get("po_id")) == str(po_id)
    ]
    total = Decimal("0")
    for line in lines:
        qty = _decimal(line.get("quantity"))
        price = _decimal(line.get("unit_price"))
        if qty <= 0:
            msg = "line quantity must be positive"
            raise PurchaseOrderValidationError(msg)
        total += qty * price
    return total


def _spawn_receive_movement(
    po: dict[str, Any],
    *,
    po_id: str,
    repo: Any,
    registry: Any,
) -> None:
    warehouse_id = po.get("warehouse_id")
    if not warehouse_id:
        msg = "warehouse_id is required to receive goods"
        raise PurchaseOrderValidationError(msg)

    line_entity = registry.get("PURCHASE_ORDER_LINE")
    po_lines = [
        line
        for line in repo.list_records(line_entity)
        if str(line.get("po_id")) == str(po_id)
    ]
    if not po_lines:
        msg = "cannot receive purchase order without lines"
        raise PurchaseOrderValidationError(msg)

    movement_entity = registry.get("STOCK_MOVEMENT")
    line_movement_entity = registry.get("STOCK_MOVEMENT_LINE")
    movement_number = f"RCV-{po.get('po_number', po_id)[:20]}"
    movement_date = po.get("order_date") or date.today().isoformat()

    movement = repo.create_record(
        movement_entity,
        {
            "movement_number": movement_number,
            "movement_type": "receive",
            "movement_date": movement_date,
            "warehouse_id": warehouse_id,
            "reference_type": "purchase_order",
            "reference_id": str(po_id),
            "status": "draft",
            "active": True,
        },
    )

    for po_line in po_lines:
        repo.create_record(
            line_movement_entity,
            {
                "movement_id": movement["id"],
                "product_id": po_line["product_id"],
                "quantity": po_line["quantity"],
                "unit_cost": po_line.get("unit_price"),
            },
        )


def _is_receive_transition(
    payload: dict[str, Any],
    *,
    partial: bool,
    existing: dict[str, Any] | None,
) -> bool:
    if not partial or existing is None:
        return False
    return payload.get("status") == "received" and existing.get("status") != "received"


def validate_purchase_order_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    merged = {**(existing or {}), **payload}
    new_status = payload.get("status")

    if new_status == "received" and not partial:
        msg = "cannot create purchase order directly in received status"
        raise PurchaseOrderValidationError(msg)

    if not partial or existing is None:
        return

    if _is_receive_transition(payload, partial=partial, existing=existing):
        if existing.get("status") == "cancelled":
            msg = "cancelled purchase orders cannot be received"
            raise PurchaseOrderValidationError(msg)

        if context is None:
            return

        repo = context.get("repo")
        registry = context.get("registry")
        record_id = context.get("record_id")
        if repo is None or registry is None or record_id is None:
            return

        total = rollup_po_lines(str(record_id), repo=repo, registry=registry)
        amount_paid = _decimal(existing.get("amount_paid"))
        balance_due = total - amount_paid
        if balance_due < 0:
            msg = "amount_paid exceeds rolled-up total"
            raise PurchaseOrderValidationError(msg)

        payload["total_amount"] = float(total)
        payload["balance_due"] = float(balance_due)

        _spawn_receive_movement(
            {**merged, "total_amount": float(total), "balance_due": float(balance_due)},
            po_id=str(record_id),
            repo=repo,
            registry=registry,
        )
