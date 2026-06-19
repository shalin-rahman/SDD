"""Unit tests for document virus scan hooks."""

from emcap.documents.hooks import DocumentHooks, scan_document_content


def test_scan_document_content_returns_clean_by_default() -> None:
    assert scan_document_content(b"hello world") == "clean"


def test_scan_document_content_detects_eicar_marker() -> None:
    assert scan_document_content(b"EICAR-TEST-FILE") == "infected"


def test_scan_document_content_skipped_when_disabled() -> None:
    assert scan_document_content(b"EICAR-TEST-FILE", enabled=False) == "skipped"


def test_document_hooks_extract_ocr_truncates_text() -> None:
    hooks = DocumentHooks()
    assert hooks.extract_ocr(b"short") == "short"
