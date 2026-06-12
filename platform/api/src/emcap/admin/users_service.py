from typing import Any

from sqlalchemy.orm import Session

from emcap.auth.service import hash_password
from emcap.persistence.database import RoleRow, UserRoleRow, UserRow


class AdminValidationError(Exception):
    pass


def _user_payload(session: Session, user: UserRow) -> dict[str, Any]:
    role_rows = (
        session.query(RoleRow)
        .join(UserRoleRow, UserRoleRow.role_id == RoleRow.id)
        .filter(UserRoleRow.user_id == user.id)
        .all()
    )
    return {
        "id": user.id,
        "username": user.username,
        "tenant_id": user.tenant_id,
        "active": user.active,
        "attributes": user.attributes,
        "mfa_enabled": user.mfa_enabled,
        "roles": [{"code": row.code, "name": row.name} for row in role_rows],
    }


def list_users(session: Session) -> list[dict[str, Any]]:
    users = session.query(UserRow).order_by(UserRow.username).all()
    return [_user_payload(session, user) for user in users]


def get_user(session: Session, user_id: str) -> dict[str, Any]:
    user = session.query(UserRow).filter_by(id=user_id).one_or_none()
    if user is None:
        msg = f"Unknown user: {user_id}"
        raise AdminValidationError(msg)
    return _user_payload(session, user)


def create_user(
    session: Session,
    *,
    username: str,
    password: str,
    tenant_id: str = "default",
    role_codes: list[str] | None = None,
    attributes: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if session.query(UserRow).filter_by(username=username).one_or_none() is not None:
        msg = f"Username already exists: {username}"
        raise AdminValidationError(msg)
    if len(password) < 6:
        msg = "Password must be at least 6 characters"
        raise AdminValidationError(msg)

    user = UserRow(
        username=username.strip(),
        password_hash=hash_password(password),
        tenant_id=tenant_id,
        attributes=attributes or {},
        active=True,
    )
    session.add(user)
    session.flush()
    _sync_roles(session, user, role_codes or [])
    session.commit()
    return _user_payload(session, user)


def update_user(
    session: Session,
    user_id: str,
    *,
    tenant_id: str | None = None,
    active: bool | None = None,
    attributes: dict[str, Any] | None = None,
    role_codes: list[str] | None = None,
    password: str | None = None,
) -> dict[str, Any]:
    user = session.query(UserRow).filter_by(id=user_id).one_or_none()
    if user is None:
        msg = f"Unknown user: {user_id}"
        raise AdminValidationError(msg)

    if tenant_id is not None:
        user.tenant_id = tenant_id
    if active is not None:
        user.active = active
    if attributes is not None:
        user.attributes = attributes
    if password:
        if len(password) < 6:
            msg = "Password must be at least 6 characters"
            raise AdminValidationError(msg)
        user.password_hash = hash_password(password)
    if role_codes is not None:
        session.query(UserRoleRow).filter_by(user_id=user.id).delete()
        _sync_roles(session, user, role_codes)

    session.commit()
    return _user_payload(session, user)


def deactivate_user(session: Session, user_id: str) -> dict[str, Any]:
    return update_user(session, user_id, active=False)


def _sync_roles(session: Session, user: UserRow, role_codes: list[str]) -> None:
    for code in role_codes:
        role = session.query(RoleRow).filter_by(code=code).one_or_none()
        if role is None:
            msg = f"Unknown role: {code}"
            raise AdminValidationError(msg)
        session.add(UserRoleRow(user_id=user.id, role_id=role.id))
