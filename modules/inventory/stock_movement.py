"""Stock movement business rules — validation and posting (W5).

Domain logic lives in ``modules/inventory/`` per EMCAP layering; platform persistence
stays generic. ``apply_posted_movement`` is implemented in P20-T19.
"""

from __future__ import annotations

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


class StockMovementValidationError(ValueError):
    """Raised when STOCK_MOVEMENT payload violates inventory business rules."""


def validate_stock_movement_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
) -> None:
    """Validate header fields; transfer requires ``source_warehouse_id``."""
    _ = partial  # reserved for partial-update rules in P20-T19
    merged = {**(existing or {}), **payload}
    movement_type = merged.get("movement_type")
    if movement_type != "transfer":
        return

    source = merged.get("source_warehouse_id")
    if not source:
        msg = "source_warehouse_id is required when movement_type is transfer"
        raise StockMovementValidationError(msg)

    destination = merged.get("warehouse_id")
    if destination and str(source) == str(destination):
        msg = "source_warehouse_id and warehouse_id must differ for transfer"
        raise StockMovementValidationError(msg)


def apply_posted_movement(
    movement: dict[str, Any],
    lines: list[dict[str, Any]],
) -> None:
    """Apply posted movement quantities to ``quantity_on_hand`` — P20-T19."""
    _ = movement, lines
    raise NotImplementedError("apply_posted_movement is implemented in P20-T19")
