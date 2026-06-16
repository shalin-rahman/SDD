"""Tenant isolation ops write API — P13-T20."""

from fastapi.testclient import TestClient

from emcap.admin.ops_service import DEFAULT_CONFIRMATION_TOKEN


def _admin_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _viewer_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "viewer", "password": "viewer123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_tenant_isolation_ops_requires_confirmation_token(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}

    forbidden = client.put(
        "/api/v1/admin/ops/tenant-isolation",
        headers=admin_headers,
        json={"mode": "database_per_tenant", "confirmation_token": "wrong-token"},
    )
    assert forbidden.status_code == 400

    viewer_headers = {"Authorization": f"Bearer {_viewer_token(client)}"}
    viewer = client.put(
        "/api/v1/admin/ops/tenant-isolation",
        headers=viewer_headers,
        json={"mode": "database_per_tenant", "confirmation_token": DEFAULT_CONFIRMATION_TOKEN},
    )
    assert viewer.status_code == 403


def test_tenant_isolation_ops_updates_effective_mode(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}

    updated = client.put(
        "/api/v1/admin/ops/tenant-isolation",
        headers=admin_headers,
        json={
            "mode": "database_per_tenant",
            "confirmation_token": DEFAULT_CONFIRMATION_TOKEN,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["mode"] == "database_per_tenant"

    state = client.get("/api/v1/admin/ops/tenant-isolation", headers=admin_headers)
    assert state.status_code == 200
    assert state.json()["effective_mode"] == "database_per_tenant"
    assert state.json()["has_override"] is True

    audit = client.get("/api/v1/admin/audit", headers=admin_headers)
    assert any(
        item["action"] == "ops.tenant_isolation.update"
        for item in audit.json()["audit"]
    )

    reverted = client.put(
        "/api/v1/admin/ops/tenant-isolation",
        headers=admin_headers,
        json={
            "mode": "shared_database",
            "confirmation_token": DEFAULT_CONFIRMATION_TOKEN,
        },
    )
    assert reverted.status_code == 200
