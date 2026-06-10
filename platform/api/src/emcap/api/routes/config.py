from typing import Any, cast

from fastapi import APIRouter, Request

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/platform")
def get_platform_config(request: Request) -> dict[str, Any]:
    return cast(dict[str, Any], request.app.state.platform_config.model_dump(mode="json"))
