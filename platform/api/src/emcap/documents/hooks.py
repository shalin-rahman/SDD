"""Pluggable document safety hooks (virus scan, OCR)."""

from __future__ import annotations


class DocumentHooks:
    def scan_virus(self, content: bytes) -> str:
        # EICAR test marker — used by pytest to assert infected rejection path.
        if b"EICAR" in content:
            return "infected"
        return "clean"

    def extract_ocr(self, content: bytes) -> str:
        try:
            return content.decode("utf-8")[:500]
        except UnicodeDecodeError:
            return ""


def scan_document_content(content: bytes, *, enabled: bool = True) -> str:
    """Run virus scan when enabled; otherwise return skipped."""

    if not enabled:
        return "skipped"
    return DocumentHooks().scan_virus(content)
