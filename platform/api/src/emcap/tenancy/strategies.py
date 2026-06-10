from abc import ABC, abstractmethod

from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from emcap.config.models import TenantStrategyMode


class TenantStrategy(ABC):
    mode: TenantStrategyMode

    @abstractmethod
    def bind_session(self, session: Session, tenant_id: str) -> None:
        pass


class SharedDatabaseStrategy(TenantStrategy):
    mode = TenantStrategyMode.SHARED_DATABASE

    def bind_session(self, session: Session, tenant_id: str) -> None:
        return None


class SchemaPerTenantStrategy(TenantStrategy):
    mode = TenantStrategyMode.SCHEMA_PER_TENANT

    def bind_session(self, session: Session, tenant_id: str) -> None:
        safe = tenant_id.replace('"', "")
        session.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{safe}"'))
        session.execute(text(f'SET search_path TO "{safe}"'))


class DatabasePerTenantStrategy(TenantStrategy):
    mode = TenantStrategyMode.DATABASE_PER_TENANT

    def bind_session(self, session: Session, tenant_id: str) -> None:
        return None


class HybridStrategy(TenantStrategy):
    mode = TenantStrategyMode.HYBRID

    def __init__(self) -> None:
        self._shared = SharedDatabaseStrategy()
        self._schema = SchemaPerTenantStrategy()

    def bind_session(self, session: Session, tenant_id: str) -> None:
        if tenant_id == "default":
            self._shared.bind_session(session, tenant_id)
        else:
            self._schema.bind_session(session, tenant_id)


def get_tenant_strategy(mode: TenantStrategyMode) -> TenantStrategy:
    mapping: dict[TenantStrategyMode, TenantStrategy] = {
        TenantStrategyMode.SHARED_DATABASE: SharedDatabaseStrategy(),
        TenantStrategyMode.SCHEMA_PER_TENANT: SchemaPerTenantStrategy(),
        TenantStrategyMode.DATABASE_PER_TENANT: DatabasePerTenantStrategy(),
        TenantStrategyMode.HYBRID: HybridStrategy(),
    }
    return mapping[mode]
