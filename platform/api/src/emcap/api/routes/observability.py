from fastapi import APIRouter, Response

from emcap.observability.metrics import metrics_response

router = APIRouter(tags=["observability"])


@router.get("/metrics")
def prometheus_metrics() -> Response:
    content, media_type = metrics_response()
    return Response(content=content, media_type=media_type)
