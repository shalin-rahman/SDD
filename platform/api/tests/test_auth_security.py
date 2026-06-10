from fastapi.testclient import TestClient

from emcap.auth.service import _totp_at


def test_auth_providers_listed(client: TestClient) -> None:
    response = client.get("/api/v1/auth/providers")
    assert response.status_code == 200
    providers = response.json()["providers"]
    assert "username_password" in providers
    assert "oauth" in providers


def test_password_login(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert "access_token" in body
    assert "customer.read" in body["permissions"] or "*.*" in body["permissions"]


def test_oauth_client_credentials(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/oauth/token",
        json={
            "grant_type": "client_credentials",
            "client_id": "emcap-client",
            "client_secret": "emcap-secret",
        },
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_rbac_roles(client: TestClient) -> None:
    response = client.get("/api/v1/auth/roles")
    assert response.status_code == 200
    roles = response.json()["roles"]
    assert any(role["code"] == "admin" for role in roles)


def test_abac_check(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    token = login.json()["access_token"]
    response = client.post(
        "/api/v1/auth/check",
        headers={"Authorization": f"Bearer {token}"},
        json={"permission": "customer.read", "tenant_id": "default"},
    )
    assert response.status_code == 200
    assert response.json()["allowed"] is True


def test_mfa_enroll_and_verify(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    enroll = client.post("/api/v1/auth/mfa/enroll", headers=headers)
    assert enroll.status_code == 200
    secret = enroll.json()["secret"]

    counter = int(__import__("time").time()) // 30
    code = _totp_at(secret, counter)
    verify = client.post("/api/v1/auth/mfa/verify", headers=headers, json={"code": code})
    assert verify.status_code == 200
    assert verify.json()["access_token"]


def test_security_headers(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"


def test_tenant_header_isolation(client: TestClient) -> None:
    tenant_a = client.post(
        "/api/v1/entities/CUSTOMER/records",
        headers={"X-Tenant-ID": "tenant-a"},
        json={"name": "Tenant A", "email": "a@example.com"},
    )
    assert tenant_a.status_code == 201

    tenant_b_list = client.get(
        "/api/v1/entities/CUSTOMER/records",
        headers={"X-Tenant-ID": "tenant-b"},
    )
    assert tenant_b_list.status_code == 200
    assert tenant_b_list.json()["records"] == []

    tenant_a_list = client.get(
        "/api/v1/entities/CUSTOMER/records",
        headers={"X-Tenant-ID": "tenant-a"},
    )
    assert len(tenant_a_list.json()["records"]) == 1


def test_tenant_white_label_config(client: TestClient) -> None:
    response = client.get("/api/v1/tenants")
    assert response.status_code == 200
    body = response.json()
    assert "acme" in body["tenants"]
    assert body["tenants"]["acme"]["theme"] == "acme-blue"
