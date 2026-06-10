from typing import Any


class AIService:
    def chat(self, prompt: str) -> dict[str, Any]:
        return {"response": f"AI stub: received {len(prompt)} chars", "model": "emcap-stub"}

    def summarize(self, text: str) -> dict[str, Any]:
        return {"summary": text[:120] + ("..." if len(text) > 120 else "")}
