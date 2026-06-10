"""PostgreSQL integration tests — run in CI integration job only (see pytest marker)."""

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration


def test_health_with_postgres(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_entity_crud_persists_in_postgres(client: TestClient) -> None:
    create = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "Postgres User", "email": "pg@example.com"},
    )
    assert create.status_code == 201
    record_id = create.json()["id"]

    fetched = client.get(f"/api/v1/entities/CUSTOMER/records/{record_id}")
    assert fetched.status_code == 200
    assert fetched.json()["email"] == "pg@example.com"


def test_tenant_isolation_with_postgres(client: TestClient) -> None:
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
