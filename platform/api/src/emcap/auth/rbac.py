from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import RoleRow, UserRoleRow


def list_roles(session: Session) -> list[dict[str, Any]]:
    rows = session.query(RoleRow).order_by(RoleRow.code).all()
    return [
        {"id": row.id, "code": row.code, "name": row.name, "permissions": row.permissions}
        for row in rows
    ]


def assign_role(session: Session, user_id: str, role_code: str) -> None:
    role = session.query(RoleRow).filter_by(code=role_code).one_or_none()
    if role is None:
        msg = f"Unknown role: {role_code}"
        raise KeyError(msg)

    existing = session.query(UserRoleRow).filter_by(user_id=user_id, role_id=role.id).one_or_none()
    if existing is None:
        session.add(UserRoleRow(user_id=user_id, role_id=role.id))
        session.commit()
