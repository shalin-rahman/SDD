from typing import Any

from pydantic import BaseModel, Field


class CurrentUser(BaseModel):
    user_id: str
    tenant_id: str
    permissions: list[str] = Field(default_factory=list)
    attributes: dict[str, Any] = Field(default_factory=dict)
    mfa_verified: bool = False

    def has_permission(self, permission: str) -> bool:
        if permission in self.permissions:
            return True
        wildcard = [item for item in self.permissions if item.endswith(".*")]
        return any(permission.startswith(item[:-1]) for item in wildcard)
