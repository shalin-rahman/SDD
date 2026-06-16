"""Ops-only admin APIs (P13-T20 tenant isolation write)."""

from __future__ import annotations

import os
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from emcap.config.models import TenantStrategyMode
from emcap.persistence.database import AdminAuditRow, SettingOverrideRow

TENANT_STRATEGY_KEY = "tenant_strategy.mode"
DEFAULT_CONFIRMATION_TOKEN = "confirm-isolation-change"


class OpsValidationError(ValueError):
    pass


def confirmation_token() -> str:
    return os.environ.get("EMCAP_OPS_CONFIRMATION_TOKEN", DEFAULT_CONFIRMATION_TOKEN)


def load_tenant_strategy_mode(session: Session, default: TenantStrategyMode) -> TenantStrategyMode:
    row = session.query(SettingOverrideRow).filter_by(key=TENANT_STRATEGY_KEY).one_or_none()
    if row is None:
        return default
    raw = row.value
    if isinstance(raw, str):
        try:
            return TenantStrategyMode(raw)
        except ValueError:
            return default
    return default


def get_tenant_isolation_state(
    session: Session,
    *,
    configured_mode: TenantStrategyMode,
) -> dict[str, Any]:
    row = session.query(SettingOverrideRow).filter_by(key=TENANT_STRATEGY_KEY).one_or_none()
    effective_mode = load_tenant_strategy_mode(session, configured_mode)
    return {
        "configured_mode": configured_mode.value,
        "effective_mode": effective_mode.value,
        "has_override": row is not None,
        "reload_hint": "Effective strategy is active for this API process after save.",
    }


def update_tenant_isolation_mode(
    session: Session,
    *,
    mode: TenantStrategyMode,
    confirmation_token_value: str,
    actor: str,
) -> dict[str, Any]:
    if confirmation_token_value != confirmation_token():
        raise OpsValidationError("invalid confirmation token")

    row = session.query(SettingOverrideRow).filter_by(key=TENANT_STRATEGY_KEY).one_or_none()
    if row is None:
        row = SettingOverrideRow(
            key=TENANT_STRATEGY_KEY,
            value=mode.value,
            updated_by=actor,
        )
        session.add(row)
    else:
        row.value = mode.value
        row.updated_by = actor
        row.updated_at = datetime.now(UTC)

    session.add(
        AdminAuditRow(
            actor=actor,
            action="ops.tenant_isolation.update",
            target=TENANT_STRATEGY_KEY,
            payload={"mode": mode.value},
        )
    )
    session.commit()
    return {
        "mode": mode.value,
        "reload_hint": "Tenant strategy updated for this API process.",
    }
