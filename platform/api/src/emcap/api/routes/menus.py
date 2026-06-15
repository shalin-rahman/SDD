from typing import Any

from fastapi import APIRouter, Request

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get("")
def list_menus(request: Request) -> dict[str, Any]:
    menus: list[dict[str, str]] = []
    for module in request.app.state.modules:
        for menu in module.menus:
            entry: dict[str, str] = {
                "module": module.code,
                "code": menu.code,
                "label": menu.label,
                "entity_code": menu.entity_code,
                "permission": menu.permission,
            }
            if menu.icon:
                entry["icon"] = menu.icon
            if menu.report_code:
                entry["report_code"] = menu.report_code
            menus.append(entry)
    return {"menus": menus}
