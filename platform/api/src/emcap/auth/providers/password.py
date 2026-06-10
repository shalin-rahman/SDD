from sqlalchemy.orm import Session, sessionmaker

from emcap.auth.jwt import create_access_token
from emcap.auth.providers.base import AuthCredentials, AuthProvider, AuthResult
from emcap.auth.service import (
    AuthServiceError,
    authenticate_user,
    list_user_permissions,
    user_to_attributes,
)


class PasswordAuthProvider(AuthProvider):
    name = "username_password"

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def authenticate(self, credentials: AuthCredentials) -> AuthResult:
        if not credentials.username or not credentials.password:
            msg = "Username and password required"
            raise AuthServiceError(msg)

        session = self._session_factory()
        try:
            user = authenticate_user(session, credentials.username, credentials.password)
            permissions = list_user_permissions(session, user)
            token = create_access_token(
                user_id=user.id,
                tenant_id=user.tenant_id,
                permissions=permissions,
                attributes=user_to_attributes(user),
            )
            return AuthResult(
                access_token=token,
                user_id=user.id,
                tenant_id=user.tenant_id,
                permissions=permissions,
                attributes=user_to_attributes(user),
            )
        finally:
            session.close()
