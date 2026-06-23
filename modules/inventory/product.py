"""Product business rules — guard ``quantity_on_hand`` against direct API edits (P28)."""

from __future__ import annotations

from typing import Any


class ProductValidationError(ValueError):
    """Raised when PRODUCT payload violates inventory rules."""


def validate_product_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    """Reject direct ``quantity_on_hand`` changes on update; use posted STOCK_MOVEMENT."""
    del context  # reserved for platform hook parity; stock post updates bypass validators via repo

    if not partial or existing is None:
        return

    if "quantity_on_hand" not in payload:
        return

    new_qty = int(payload.get("quantity_on_hand") or 0)
    current_qty = int(existing.get("quantity_on_hand") or 0)
    if new_qty == current_qty:
        return

    msg = (
        "quantity_on_hand cannot be changed directly; "
        "post a STOCK_MOVEMENT to adjust inventory"
    )
    raise ProductValidationError(msg)
