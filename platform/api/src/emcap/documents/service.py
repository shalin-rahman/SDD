import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from emcap.documents.hooks import DocumentHooks, scan_document_content
from emcap.persistence.database import DocumentRow

STORAGE_ROOT = Path(os.environ.get("EMCAP_STORAGE_PATH", "./storage"))

LOGO_ENTITY_CODE = "organization_profile"
LOGO_RECORD_ID = "logo"

_MIME_BY_EXT: dict[str, str] = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
}


def document_content_url(document_id: str) -> str:
    return f"/api/v1/documents/{document_id}/content"


def guess_image_mime_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return _MIME_BY_EXT.get(ext, "application/octet-stream")


class DocumentService:
    def __init__(
        self,
        session: Session,
        tenant_id: str = "default",
        *,
        virus_scan_enabled: bool = True,
        hooks: DocumentHooks | None = None,
    ) -> None:
        self._session = session
        self._tenant_id = tenant_id
        self._virus_scan_enabled = virus_scan_enabled
        self._hooks = hooks or DocumentHooks()
        STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

    def upload(
        self,
        *,
        entity_code: str,
        record_id: str,
        filename: str,
        content: bytes,
    ) -> dict[str, Any]:
        doc_id = str(uuid4())
        storage_key = f"{self._tenant_id}/{entity_code}/{record_id}/{doc_id}/{filename}"
        path = STORAGE_ROOT / storage_key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

        virus_scan_status = scan_document_content(content, enabled=self._virus_scan_enabled)

        row = DocumentRow(
            id=doc_id,
            tenant_id=self._tenant_id,
            entity_code=entity_code,
            record_id=record_id,
            filename=filename,
            version=1,
            storage_key=storage_key,
            virus_scan_status=virus_scan_status,
            ocr_text=self._hooks.extract_ocr(content),
        )
        self._session.add(row)
        self._session.commit()
        return self._to_dict(row)

    def get(self, document_id: str) -> dict[str, Any]:
        row = (
            self._session.query(DocumentRow)
            .filter_by(id=document_id, tenant_id=self._tenant_id)
            .one_or_none()
        )
        if row is None:
            msg = f"Document not found: {document_id}"
            raise KeyError(msg)
        path = STORAGE_ROOT / row.storage_key
        return {**self._to_dict(row), "content_base64": path.read_bytes().hex()[:64]}

    def read_content(self, document_id: str) -> tuple[bytes, str, str]:
        row = (
            self._session.query(DocumentRow)
            .filter_by(id=document_id, tenant_id=self._tenant_id)
            .one_or_none()
        )
        if row is None:
            msg = f"Document not found: {document_id}"
            raise KeyError(msg)
        path = STORAGE_ROOT / row.storage_key
        content = path.read_bytes()
        mime = guess_image_mime_type(row.filename)
        return content, row.filename, mime

    def list_for_record(self, entity_code: str, record_id: str) -> list[dict[str, Any]]:
        rows = (
            self._session.query(DocumentRow)
            .filter_by(entity_code=entity_code, record_id=record_id, tenant_id=self._tenant_id)
            .all()
        )
        return [self._to_dict(row) for row in rows]

    @staticmethod
    def _to_dict(row: DocumentRow) -> dict[str, Any]:
        return {
            "id": row.id,
            "entity_code": row.entity_code,
            "record_id": row.record_id,
            "filename": row.filename,
            "version": row.version,
            "virus_scan_status": row.virus_scan_status,
            "ocr_text": row.ocr_text,
        }
