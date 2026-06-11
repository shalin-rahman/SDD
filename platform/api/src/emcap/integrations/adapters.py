from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import IntegrationJobRow


class RestAdapter:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id

    def dispatch(self, url: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = IntegrationJobRow(
            adapter="rest",
            target=url,
            payload=payload,
            tenant_id=self._tenant_id,
            status="dispatched",
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return {"job_id": row.id, "adapter": "rest", "target": url, "status": row.status}


class KafkaAdapter:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id

    def publish(self, topic: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = IntegrationJobRow(
            adapter="kafka",
            target=topic,
            payload=payload,
            tenant_id=self._tenant_id,
            status="published",
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return {"job_id": row.id, "adapter": "kafka", "target": topic, "status": row.status}


class SoapAdapter:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id

    def invoke(self, endpoint: str, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = IntegrationJobRow(
            adapter="soap",
            target=f"{endpoint}#{action}",
            payload={"action": action, **payload},
            tenant_id=self._tenant_id,
            status="invoked",
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return {
            "job_id": row.id,
            "adapter": "soap",
            "endpoint": endpoint,
            "action": action,
            "status": row.status,
        }


class SftpAdapter:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id

    def upload(self, host: str, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = IntegrationJobRow(
            adapter="sftp",
            target=f"{host}:{path}",
            payload=payload,
            tenant_id=self._tenant_id,
            status="uploaded",
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return {
            "job_id": row.id,
            "adapter": "sftp",
            "host": host,
            "path": path,
            "status": row.status,
        }
