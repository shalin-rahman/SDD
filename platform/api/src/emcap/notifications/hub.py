from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import NotificationRow


class NotificationHub:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id

    def send(self, channel: str, recipient: str, subject: str, body: str) -> dict[str, Any]:
        row = NotificationRow(
            channel=channel,
            recipient=recipient,
            subject=subject,
            body=body,
            tenant_id=self._tenant_id,
            status="sent",
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return {
            "id": row.id,
            "channel": row.channel,
            "recipient": row.recipient,
            "status": row.status,
        }

    def list_sent(self, channel: str | None = None) -> list[dict[str, Any]]:
        query = self._session.query(NotificationRow).filter_by(tenant_id=self._tenant_id)
        if channel:
            query = query.filter_by(channel=channel)
        rows = query.order_by(NotificationRow.created_at.desc()).all()
        return [
            {
                "id": row.id,
                "channel": row.channel,
                "recipient": row.recipient,
                "subject": row.subject,
                "status": row.status,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
