import time
from collections import defaultdict
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

RATE_LIMIT = 120
WINDOW_SECONDS = 60
_hits: dict[str, list[float]] = defaultdict(list)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        client = request.client.host if request.client else "unknown"
        key = f"{client}:{request.url.path}"
        now = time.time()
        window = [stamp for stamp in _hits[key] if now - stamp < WINDOW_SECONDS]
        if len(window) >= RATE_LIMIT:
            return Response("Rate limit exceeded", status_code=429)
        window.append(now)
        _hits[key] = window
        return await call_next(request)
