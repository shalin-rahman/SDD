"""Stock movement business rules — validation and posting (W5).

Domain logic lives in ``modules/inventory/`` per EMCAP layering; platform persistence
stays generic. ``apply_posted_movement`` updates product-level ``quantity_on_hand``;
warehouse fields on the header are audit context until per-warehouse balances exist.
"""

from __future__ import annotations

from collections.abc import Callable
from decimal import Decimal
from typing import Any

MOVEMENT_TYPES: tuple[str, ...] = (
    "receive",
    "return",
    "bonus",
    "gift",
    "damage",
    "lost",
    "transfer",
    "adjustment",
    "issue",
)

REFERENCE_TYPES: tuple[str, ...] = (
    "manual",
    "purchase_order",
    "sales_order",
    "stock_adjustment",
)

MOVEMENT_STATUSES: tuple[str, ...] = ("draft", "posted", "cancelled")

IN_MOVEMENT_TYPES: frozenset[str] = frozenset({"receive", "return", "bonus"})
OUT_MOVEMENT_TYPES: frozenset[str] = frozenset({"gift", "damage", "lost", "issue"})
NET_ZERO_MOVEMENT_TYPES: frozenset[str] = frozenset({"transfer"})

ProductGetter = Callable[[str], dict[str, Any]]
ProductUpdater = Callable[[str, dict[str, Any]], None]
LineFetcher = Callable[[str], list[dict[str, Any]]]


class StockMovementValidationError(ValueError):
    """Raised when STOCK_MOVEMENT payload violates inventory business rules."""


def _line_quantity(value: Any) -> Decimal:
    try:
        qty = Decimal(str(value))
    except Exception as exc:
        msg = f"invalid line quantity: {value}"
        raise StockMovementValidationError(msg) from exc
    if qty <= 0:
        msg = "line quantity must be positive"
        raise StockMovementValidationError(msg)
    return qty


def movement_quantity_delta(movement_type: str, quantity: Decimal) -> Decimal:
    """Signed delta for product-level ``quantity_on_hand`` from movement type."""
    if movement_type in IN_MOVEMENT_TYPES:
        return quantity
    if movement_type in OUT_MOVEMENT_TYPES:
        return -quantity
    if movement_type in NET_ZERO_MOVEMENT_TYPES:
        return Decimal("0")
    if movement_type == "adjustment":
        # W5: no line direction field — positive qty increases on-hand; use issue/damage for decreases.
        return quantity
    msg = f"unsupported movement_type: {movement_type}"
    raise StockMovementValidationError(msg)


def apply_posted_movement(
    movement: dict[str, Any],
    lines: list[dict[str, Any]],
    *,
    get_product: ProductGetter,
    update_product: ProductUpdater,
    allow_negative: bool = False,
) -> None:
    """Apply posted movement quantities to product-level ``quantity_on_hand``."""
    movement_type = str(movement.get("movement_type") or "")
    if movement_type == "transfer":
        source = movement.get("source_warehouse_id")
        if not source:
            msg = "source_warehouse_id is required when movement_type is transfer"
            raise StockMovementValidationError(msg)

    if not lines:
        msg = "cannot post movement without lines"
        raise StockMovementValidationError(msg)

    for line in lines:
        qty = _line_quantity(line.get("quantity"))
        delta = movement_quantity_delta(movement_type, qty)
        if delta == 0:
            continue

        product_id = str(line["product_id"])
        product = get_product(product_id)
        current = int(product.get("quantity_on_hand") or 0)
        new_qty = current + int(delta)
        if not allow_negative and new_qty < 0:
            msg = (
                f"insufficient quantity_on_hand for product {product_id}: "
                f"current={current}, delta={int(delta)}"
            )
            raise StockMovementValidationError(msg)
        update_product(product_id, {"quantity_on_hand": new_qty})


def _is_posting_transition(
    payload: dict[str, Any],
    *,
    partial: bool,
    existing: dict[str, Any] | None,
) -> bool:
    if not partial or existing is None:
        return payload.get("status") == "posted"
    return payload.get("status") == "posted" and existing.get("status") == "draft"


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
        if new_status == "posted":
            msg = "cannot create movement directly in posted status"
            raise StockMovementValidationError(msg)
        return

    old_status = existing.get("status")
    if payload.get("status") == "posted" and old_status == "posted":
        msg = "movement is already posted"
        raise StockMovementValidationError(msg)

    if new_status == old_status:
        return

    if new_status == "posted":
        if old_status != "draft":
            msg = "only draft movements can be posted"
            raise StockMovementValidationError(msg)
        return

    if old_status == "posted" and new_status != "cancelled":
        msg = "posted movements cannot be edited except to cancel"
        raise StockMovementValidationError(msg)


def validate_stock_movement_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    """Validate header fields; on draft→posted apply ``quantity_on_hand`` updates."""
    merged = {**(existing or {}), **payload}
    movement_type = merged.get("movement_type")

    if movement_type == "transfer":
        source = merged.get("source_warehouse_id")
        if not source:
            msg = "source_warehouse_id is required when movement_type is transfer"
            raise StockMovementValidationError(msg)
        destination = merged.get("warehouse_id")
        if destination and str(source) == str(destination):
            msg = "source_warehouse_id and warehouse_id must differ for transfer"
            raise StockMovementValidationError(msg)

    _validate_status_transition(payload, partial=partial, existing=existing)

    if not _is_posting_transition(payload, partial=partial, existing=existing):
        return

    if context is None:
        return

    repo = context.get("repo")
    registry = context.get("registry")
    record_id = context.get("record_id")
    if repo is None or registry is None or record_id is None:
        return

    product_entity = registry.get("PRODUCT")
    line_entity = registry.get("STOCK_MOVEMENT_LINE")
    lines = [
        line
        for line in repo.list_records(line_entity)
        if str(line.get("movement_id")) == str(record_id)
    ]

    commit = context.get("commit", True)

    def get_product(product_id: str) -> dict[str, Any]:
        return repo.get_record(product_entity, product_id)

    def update_product(product_id: str, patch: dict[str, Any]) -> None:
        repo.update_record(product_entity, product_id, patch, commit=commit)

    apply_posted_movement(merged, lines, get_product=get_product, update_product=update_product)
