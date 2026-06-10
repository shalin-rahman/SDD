from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from emcap.config.models import PlatformConfig


def resolve_tenant_id(request: Request, config: PlatformConfig) -> str:
    header_tenant = request.headers.get("X-Tenant-ID")
    if header_tenant:
        return header_tenant.strip()

    host = request.headers.get("host", "").split(":")[0].lower()
    for tenant_id, tenant in config.tenants.items():
        if tenant.domain.lower() == host:
            return tenant_id

    if config.platform.multi_tenant:
        return "default"
    return "default"


class TenantMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, config: PlatformConfig) -> None:
        super().__init__(app)
        self._config = config

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request.state.tenant_id = resolve_tenant_id(request, self._config)
        return await call_next(request)
