from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel


class AuthCredentials(BaseModel):
    username: str | None = None
    password: str | None = None
    grant_type: str | None = None
    client_id: str | None = None
    client_secret: str | None = None
    code: str | None = None


class AuthResult(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    tenant_id: str
    permissions: list[str] = []
    attributes: dict[str, Any] = {}


class AuthProvider(ABC):
    name: str

    @abstractmethod
    def authenticate(self, credentials: AuthCredentials) -> AuthResult:
        pass
