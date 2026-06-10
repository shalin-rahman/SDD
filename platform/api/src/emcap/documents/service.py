import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from emcap.persistence.database import DocumentRow

STORAGE_ROOT = Path(os.environ.get("EMCAP_STORAGE_PATH", "./storage"))


class DocumentHooks:
    def scan_virus(self, content: bytes) -> str:
        return "clean"

    def extract_ocr(self, content: bytes) -> str:
        try:
            return content.decode("utf-8")[:500]
        except UnicodeDecodeError:
            return ""


class DocumentService:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id
        self._hooks = DocumentHooks()
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

        row = DocumentRow(
            id=doc_id,
            tenant_id=self._tenant_id,
            entity_code=entity_code,
            record_id=record_id,
            filename=filename,
            version=1,
            storage_key=storage_key,
            virus_scan_status=self._hooks.scan_virus(content),
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
