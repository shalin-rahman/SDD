import os

from emcap.auth.jwt import create_access_token
from emcap.auth.providers.base import AuthCredentials, AuthProvider, AuthResult
from emcap.auth.service import AuthServiceError


class OAuthAuthProvider(AuthProvider):
    name = "oauth"

    def authenticate(self, credentials: AuthCredentials) -> AuthResult:
        expected_client = os.environ.get("EMCAP_OAUTH_CLIENT_ID", "emcap-client")
        expected_secret = os.environ.get("EMCAP_OAUTH_CLIENT_SECRET", "emcap-secret")

        if credentials.grant_type != "client_credentials":
            msg = "Unsupported OAuth grant type"
            raise AuthServiceError(msg)
        if credentials.client_id != expected_client or credentials.client_secret != expected_secret:
            msg = "Invalid OAuth client credentials"
            raise AuthServiceError(msg)

        token = create_access_token(
            user_id="oauth-service",
            tenant_id="default",
            permissions=["*.*"],
            attributes={"client_id": credentials.client_id or ""},
        )
        return AuthResult(
            access_token=token,
            user_id="oauth-service",
            tenant_id="default",
            permissions=["*.*"],
            attributes={"client_id": credentials.client_id or ""},
        )
