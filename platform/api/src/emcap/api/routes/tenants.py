from typing import Any

from fastapi import APIRouter, Request

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("")
def list_tenants(request: Request) -> dict[str, Any]:
    config = request.app.state.platform_config
    tenants = {
        tenant_id: {
            "domain": settings.domain,
            "theme": settings.theme,
            "primary_color": settings.primary_color,
            "logo_url": settings.logo_url,
        }
        for tenant_id, settings in config.tenants.items()
    }
    return {
        "multi_tenant": config.platform.multi_tenant,
        "white_label": config.platform.white_label,
        "strategy": config.tenant_strategy.mode.value,
        "tenants": tenants,
    }
