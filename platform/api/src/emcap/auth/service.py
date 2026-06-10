import base64
import hashlib
import hmac
import secrets
from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import RoleRow, UserRoleRow, UserRow

PBKDF2_ITERATIONS = 100_000


class AuthServiceError(Exception):
    pass


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    salt, digest = hashed.split("$", maxsplit=1)
    check = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), PBKDF2_ITERATIONS)
    return hmac.compare_digest(check.hex(), digest)


def get_user_by_username(session: Session, username: str) -> UserRow | None:
    return session.query(UserRow).filter_by(username=username).one_or_none()


def list_user_permissions(session: Session, user: UserRow) -> list[str]:
    rows = session.query(RoleRow).join(UserRoleRow, UserRoleRow.role_id == RoleRow.id).filter(
        UserRoleRow.user_id == user.id
    )
    permissions: set[str] = set()
    for role in rows:
        permissions.update(role.permissions)
    return sorted(permissions)


def authenticate_user(session: Session, username: str, password: str) -> UserRow:
    user = get_user_by_username(session, username)
    if user is None or not verify_password(password, user.password_hash):
        msg = "Invalid username or password"
        raise AuthServiceError(msg)
    return user


def seed_default_auth(session: Session) -> None:
    if session.query(UserRow).count() > 0:
        return

    admin_role = RoleRow(
        code="admin",
        name="Administrator",
        permissions=["*.*", "demo.access", "customer.*"],
    )
    session.add(admin_role)
    session.flush()

    admin_user = UserRow(
        username="admin",
        password_hash=hash_password("admin123"),
        tenant_id="default",
        attributes={"department": "platform"},
    )
    session.add(admin_user)
    session.flush()
    session.add(UserRoleRow(user_id=admin_user.id, role_id=admin_role.id))
    session.commit()


def generate_mfa_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("utf-8").rstrip("=")


def verify_totp(secret: str, code: str) -> bool:
    counter = int(__import__("time").time()) // 30
    for offset in (-1, 0, 1):
        expected = _totp_at(secret, counter + offset)
        if hmac.compare_digest(expected, code):
            return True
    return False


def _totp_at(secret: str, counter: int) -> str:
    padded = secret + "=" * (-len(secret) % 8)
    key = base64.b32decode(padded, casefold=True)
    msg = counter.to_bytes(8, "big")
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = int.from_bytes(digest[offset : offset + 4], "big") & 0x7FFFFFFF
    return str(binary % 1_000_000).zfill(6)


def user_to_attributes(user: UserRow) -> dict[str, Any]:
    return {"username": user.username, **user.attributes}
