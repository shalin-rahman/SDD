from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request) -> dict[str, object]:
    config = request.app.state.platform_config
    return {
        "status": "ok",
        "service": "emcap-api",
        "multi_tenant": config.platform.multi_tenant,
        "tenant_strategy": config.tenant_strategy.mode.value,
    }
