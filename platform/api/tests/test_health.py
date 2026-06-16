from fastapi.testclient import TestClient


def test_health_returns_tenant_mode(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["multi_tenant"] is False


def test_platform_config_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/config/platform")
    assert response.status_code == 200
    body = response.json()
    assert body["modules"]["workflow"]["enabled"] is True
    assert body["documents"]["storage_backend"] == "filesystem"
    assert body["documents"]["virus_scan_enabled"] is True


def test_customer_entity_registered(client: TestClient) -> None:
    response = client.get("/api/v1/entities")
    assert response.status_code == 200
    assert "CUSTOMER" in response.json()["entities"]


def test_customer_crud_and_audit(client: TestClient) -> None:
    create = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "Acme Corp", "email": "ops@acme.com", "active": True},
    )
    assert create.status_code == 201
    record = create.json()
    record_id = record["id"]

    listing = client.get("/api/v1/entities/CUSTOMER/records")
    assert listing.status_code == 200
    assert len(listing.json()["records"]) == 1

    search = client.get("/api/v1/entities/CUSTOMER/records", params={"q": "acme"})
    assert search.status_code == 200
    assert len(search.json()["records"]) == 1

    update = client.put(
        f"/api/v1/entities/CUSTOMER/records/{record_id}",
        json={"name": "Acme International"},
    )
    assert update.status_code == 200
    assert update.json()["name"] == "Acme International"

    audit = client.get("/api/v1/entities/CUSTOMER/audit")
    assert audit.status_code == 200
    assert len(audit.json()["audit"]) >= 2

    delete = client.delete(f"/api/v1/entities/CUSTOMER/records/{record_id}")
    assert delete.status_code == 200
    assert delete.json()["deleted_at"] is not None


def test_menus_and_permissions(client: TestClient) -> None:
    menus = client.get("/api/v1/menus")
    assert menus.status_code == 200
    menu_entities = {menu["entity_code"] for menu in menus.json()["menus"]}
    assert "CUSTOMER" in menu_entities
    assert "LEAD" in menu_entities

    permissions = client.get("/api/v1/permissions")
    assert permissions.status_code == 200
    perms = permissions.json()["permissions"]
    assert "customer.read" in perms
    assert "demo.access" in perms
    assert "crm.access" in perms
