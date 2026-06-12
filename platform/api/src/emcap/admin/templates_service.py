from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import AdminAuditRow, NotificationTemplateRow


class AdminValidationError(Exception):
    pass


def _template_payload(row: NotificationTemplateRow) -> dict[str, Any]:
    return {
        "id": row.id,
        "tenant_id": row.tenant_id,
        "code": row.code,
        "channel": row.channel,
        "subject": row.subject,
        "body": row.body,
    }


def list_templates(session: Session, tenant_id: str = "default") -> list[dict[str, Any]]:
    rows = (
        session.query(NotificationTemplateRow)
        .filter_by(tenant_id=tenant_id)
        .order_by(NotificationTemplateRow.code)
        .all()
    )
    return [_template_payload(row) for row in rows]


def get_template(session: Session, template_id: str) -> dict[str, Any]:
    row = session.query(NotificationTemplateRow).filter_by(id=template_id).one_or_none()
    if row is None:
        msg = f"Unknown template: {template_id}"
        raise AdminValidationError(msg)
    return _template_payload(row)


def create_template(
    session: Session,
    *,
    code: str,
    channel: str,
    subject: str,
    body: str,
    tenant_id: str = "default",
    actor: str = "system",
) -> dict[str, Any]:
    normalized = code.strip().lower()
    existing = (
        session.query(NotificationTemplateRow)
        .filter_by(tenant_id=tenant_id, code=normalized)
        .one_or_none()
    )
    if existing is not None:
        msg = f"Template already exists: {normalized}"
        raise AdminValidationError(msg)

    row = NotificationTemplateRow(
        tenant_id=tenant_id,
        code=normalized,
        channel=channel.strip().lower(),
        subject=subject.strip(),
        body=body,
    )
    session.add(row)
    session.flush()
    session.add(
        AdminAuditRow(
            actor=actor,
            action="template.create",
            target=row.id,
            payload={"code": normalized, "channel": row.channel},
        )
    )
    session.commit()
    return _template_payload(row)


def update_template(
    session: Session,
    template_id: str,
    *,
    subject: str | None = None,
    body: str | None = None,
    channel: str | None = None,
    actor: str = "system",
) -> dict[str, Any]:
    row = session.query(NotificationTemplateRow).filter_by(id=template_id).one_or_none()
    if row is None:
        msg = f"Unknown template: {template_id}"
        raise AdminValidationError(msg)
    if subject is not None:
        row.subject = subject.strip()
    if body is not None:
        row.body = body
    if channel is not None:
        row.channel = channel.strip().lower()
    session.add(
        AdminAuditRow(
            actor=actor,
            action="template.update",
            target=row.id,
            payload={"code": row.code},
        )
    )
    session.commit()
    return _template_payload(row)


def delete_template(session: Session, template_id: str, *, actor: str = "system") -> None:
    row = session.query(NotificationTemplateRow).filter_by(id=template_id).one_or_none()
    if row is None:
        msg = f"Unknown template: {template_id}"
        raise AdminValidationError(msg)
    session.add(
        AdminAuditRow(
            actor=actor,
            action="template.delete",
            target=row.id,
            payload={"code": row.code},
        )
    )
    session.delete(row)
    session.commit()
