"""CRM module end-to-end smoke tests."""

from fastapi.testclient import TestClient


def _auth_headers(client: TestClient) -> dict[str, str]:
    login = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    tenant = login.json()["tenant_id"]
    return {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant}


def test_crm_menus_loaded(client: TestClient) -> None:
    headers = _auth_headers(client)
    menus = client.get("/api/v1/menus", headers=headers)
    assert menus.status_code == 200
    crm = [m for m in menus.json()["menus"] if m["module"] == "CRM"]
    codes = {m["entity_code"] for m in crm}
    assert "LEAD" in codes
    assert "CONTACT" in codes


def test_lead_crud(client: TestClient) -> None:
    headers = _auth_headers(client)
    created = client.post(
        "/api/v1/entities/LEAD/records",
        headers=headers,
        json={"company": "Acme", "contact_name": "Jane", "status": "new"},
    )
    assert created.status_code == 201
    record_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/entities/LEAD/records/{record_id}",
        headers=headers,
        json={"company": "Acme Corp", "contact_name": "Jane", "status": "qualified"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "qualified"

    search = client.get("/api/v1/entities/LEAD/records?q=Acme", headers=headers)
    assert search.status_code == 200
    assert len(search.json()["records"]) >= 1

    deleted = client.delete(f"/api/v1/entities/LEAD/records/{record_id}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["deleted_at"] is not None
