"""OAuth client-credentials provider unit tests."""

import os

import pytest

from emcap.auth.providers.base import AuthCredentials
from emcap.auth.providers.oauth import OAuthAuthProvider
from emcap.auth.service import AuthServiceError


def test_oauth_client_credentials_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("EMCAP_OAUTH_CLIENT_ID", "test-client")
    monkeypatch.setenv("EMCAP_OAUTH_CLIENT_SECRET", "test-secret")
    provider = OAuthAuthProvider()
    result = provider.authenticate(
        AuthCredentials(
            grant_type="client_credentials",
            client_id="test-client",
            client_secret="test-secret",
        )
    )
    assert result.access_token
    assert result.user_id == "oauth-service"
    assert "*.*" in result.permissions


def test_oauth_rejects_wrong_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("EMCAP_OAUTH_CLIENT_ID", "test-client")
    monkeypatch.setenv("EMCAP_OAUTH_CLIENT_SECRET", "test-secret")
    provider = OAuthAuthProvider()
    with pytest.raises(AuthServiceError, match="Invalid OAuth client"):
        provider.authenticate(
            AuthCredentials(
                grant_type="client_credentials",
                client_id="test-client",
                client_secret="wrong",
            )
        )


def test_oauth_rejects_unsupported_grant(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("EMCAP_OAUTH_CLIENT_ID", raising=False)
    monkeypatch.delenv("EMCAP_OAUTH_CLIENT_SECRET", raising=False)
    provider = OAuthAuthProvider()
    with pytest.raises(AuthServiceError, match="Unsupported OAuth grant"):
        provider.authenticate(
            AuthCredentials(
                grant_type="password",
                client_id=os.environ.get("EMCAP_OAUTH_CLIENT_ID", "emcap-client"),
                client_secret=os.environ.get("EMCAP_OAUTH_CLIENT_SECRET", "emcap-secret"),
            )
        )
