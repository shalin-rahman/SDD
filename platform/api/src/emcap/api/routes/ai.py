from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from emcap.ai.service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatRequest(BaseModel):
    prompt: str


class SummarizeRequest(BaseModel):
    text: str


@router.post("/chat")
def ai_chat(payload: ChatRequest, request: Request) -> dict[str, Any]:
    if not request.app.state.platform_config.modules.ai.enabled:
        raise HTTPException(status_code=403, detail="AI platform disabled")
    if not request.app.state.platform_config.ai.enabled:
        raise HTTPException(status_code=403, detail="AI platform disabled")
    return AIService().chat(payload.prompt)


@router.post("/summarize")
def ai_summarize(payload: SummarizeRequest, request: Request) -> dict[str, Any]:
    if not request.app.state.platform_config.ai.enabled:
        raise HTTPException(status_code=403, detail="AI platform disabled")
    return AIService().summarize(payload.text)
