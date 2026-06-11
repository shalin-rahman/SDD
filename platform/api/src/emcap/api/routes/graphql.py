from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/graphql", tags=["graphql"])


class GraphQLRequest(BaseModel):
    query: str
    variables: dict[str, Any] = {}


@router.post("")
def execute_graphql(payload: GraphQLRequest, request: Request) -> dict[str, Any]:
    """Minimal GraphQL entrypoint for SDD §15 — health and entity list queries."""
    query = payload.query.strip()
    if "health" in query:
        config = request.app.state.platform_config
        return {
            "data": {
                "health": {
                    "status": "ok",
                    "multi_tenant": config.platform.multi_tenant,
                    "tenant_strategy": config.tenant_strategy.mode,
                }
            }
        }
    if "entities" in query:
        registry = request.app.state.entity_registry
        return {"data": {"entities": registry.list_codes()}}
    return {"errors": [{"message": "Unsupported query — use health or entities"}]}
