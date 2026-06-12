from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import RoleRow


class AdminValidationError(Exception):
    pass


def list_roles(session: Session) -> list[dict[str, Any]]:
    rows = session.query(RoleRow).order_by(RoleRow.code).all()
    return [
        {"id": row.id, "code": row.code, "name": row.name, "permissions": list(row.permissions)}
        for row in rows
    ]


def get_role(session: Session, role_id: str) -> dict[str, Any]:
    row = session.query(RoleRow).filter_by(id=role_id).one_or_none()
    if row is None:
        msg = f"Unknown role: {role_id}"
        raise AdminValidationError(msg)
    return {"id": row.id, "code": row.code, "name": row.name, "permissions": list(row.permissions)}


def create_role(
    session: Session,
    *,
    code: str,
    name: str,
    permissions: list[str],
) -> dict[str, Any]:
    normalized = code.strip().lower()
    if session.query(RoleRow).filter_by(code=normalized).one_or_none() is not None:
        msg = f"Role already exists: {normalized}"
        raise AdminValidationError(msg)
    row = RoleRow(code=normalized, name=name.strip(), permissions=list(permissions))
    session.add(row)
    session.commit()
    return get_role(session, row.id)


def update_role(
    session: Session,
    role_id: str,
    *,
    name: str | None = None,
    permissions: list[str] | None = None,
) -> dict[str, Any]:
    row = session.query(RoleRow).filter_by(id=role_id).one_or_none()
    if row is None:
        msg = f"Unknown role: {role_id}"
        raise AdminValidationError(msg)
    if name is not None:
        row.name = name.strip()
    if permissions is not None:
        row.permissions = list(permissions)
    session.commit()
    return get_role(session, role_id)
