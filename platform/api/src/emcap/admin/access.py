from fastapi import HTTPException

from emcap.auth.models import CurrentUser


def require_permission(user: CurrentUser, permission: str) -> None:
    if (
        user.has_permission(permission)
        or user.has_permission("admin.*")
        or user.has_permission("*.*")
    ):
        return
    raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")
