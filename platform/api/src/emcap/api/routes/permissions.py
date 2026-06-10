from typing import Any

from fastapi import APIRouter, Request

from emcap.auth.permissions import module_permissions

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("")
def list_permissions(request: Request) -> dict[str, Any]:
    return {"permissions": module_permissions(request.app.state.modules)}
