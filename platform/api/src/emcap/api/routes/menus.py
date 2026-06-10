from typing import Any

from fastapi import APIRouter, Request

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get("")
def list_menus(request: Request) -> dict[str, Any]:
    menus: list[dict[str, str]] = []
    for module in request.app.state.modules:
        for menu in module.menus:
            menus.append(
                {
                    "module": module.code,
                    "code": menu.code,
                    "label": menu.label,
                    "entity_code": menu.entity_code,
                    "permission": menu.permission,
                }
            )
    return {"menus": menus}
