import os
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import jwt

DEFAULT_SECRET = "emcap-dev-secret-change-in-production"
ALGORITHM = "HS256"


def jwt_secret() -> str:
    return os.environ.get("EMCAP_JWT_SECRET", DEFAULT_SECRET)


def create_access_token(
    *,
    user_id: str,
    tenant_id: str,
    permissions: list[str],
    attributes: dict[str, Any],
    expires_minutes: int = 60,
) -> str:
    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "permissions": permissions,
        "attributes": attributes,
        "exp": datetime.now(UTC) + timedelta(minutes=expires_minutes),
        "iat": datetime.now(UTC),
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, jwt_secret(), algorithms=[ALGORITHM])
