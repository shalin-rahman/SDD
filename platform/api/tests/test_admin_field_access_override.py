"""Field read_roles override API — P13-T10/T11."""

from fastapi.testclient import TestClient


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
    body = response.json()
    assert "inventory.access" not in body["permissions"]
    return body["access_token"]


def _seed_product(client: TestClient, headers: dict[str, str]) -> str:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        headers=headers,
        json={
            "sku": "SKU-FIELD-SEC",
            "name": "Field Security Widget",
            "unit_price": 42.5,
            "quantity_on_hand": 10,
            "reorder_level": 2,
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_field_access_override_restricts_viewer_record_api(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    record_id = _seed_product(client, admin_headers)

    # Open field first — viewer can read unit_price without inventory.access.
    opened = client.put(
        "/api/v1/admin/security/field-access",
        headers=admin_headers,
        json={
            "entity_code": "PRODUCT",
            "field_name": "unit_price",
            "read_roles": [],
        },
    )
    assert opened.status_code == 200
    assert opened.json()["read_roles"] == []

    viewer_headers = {"Authorization": f"Bearer {_viewer_token(client)}"}
    open_record = client.get(
        f"/api/v1/entities/PRODUCT/records/{record_id}",
        headers=viewer_headers,
    )
    assert open_record.status_code == 200
    assert open_record.json()["unit_price"] == 42.5

    restricted = client.put(
        "/api/v1/admin/security/field-access",
        headers=admin_headers,
        json={
            "entity_code": "PRODUCT",
            "field_name": "unit_price",
            "read_roles": ["inventory.access"],
        },
    )
    assert restricted.status_code == 200
    assert restricted.json()["read_roles"] == ["inventory.access"]

    policies = client.get("/api/v1/admin/security/policies", headers=admin_headers)
    assert policies.status_code == 200
    product = next(item for item in policies.json()["entities"] if item["code"] == "PRODUCT")
    unit_price = next(field for field in product["fields"] if field["name"] == "unit_price")
    assert unit_price["read_roles"] == ["inventory.access"]
    assert unit_price["access"] == "restricted"

    secured = client.get(
        f"/api/v1/entities/PRODUCT/records/{record_id}",
        headers=viewer_headers,
    )
    assert secured.status_code == 200
    body = secured.json()
    assert "unit_price" not in body
    assert body["sku"] == "SKU-FIELD-SEC"

    audit = client.get("/api/v1/admin/audit", headers=admin_headers)
    assert any(
        item["action"] == "security.field_access.update"
        and item["target"] == "PRODUCT.unit_price"
        for item in audit.json()["audit"]
    )


def test_field_access_override_validation(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}

    unknown_entity = client.put(
        "/api/v1/admin/security/field-access",
        headers=admin_headers,
        json={
            "entity_code": "NOT_REAL",
            "field_name": "unit_price",
            "read_roles": ["inventory.access"],
        },
    )
    assert unknown_entity.status_code == 400

    unknown_field = client.put(
        "/api/v1/admin/security/field-access",
        headers=admin_headers,
        json={
            "entity_code": "PRODUCT",
            "field_name": "not_a_field",
            "read_roles": ["inventory.access"],
        },
    )
    assert unknown_field.status_code == 400

    viewer_headers = {"Authorization": f"Bearer {_viewer_token(client)}"}
    forbidden = client.put(
        "/api/v1/admin/security/field-access",
        headers=viewer_headers,
        json={
            "entity_code": "PRODUCT",
            "field_name": "unit_price",
            "read_roles": ["inventory.access"],
        },
    )
    assert forbidden.status_code == 403


def test_metadata_form_hides_restricted_fields_for_viewer(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    record_id = _seed_product(client, admin_headers)

    restricted = client.put(
        "/api/v1/admin/security/field-access",
        headers=admin_headers,
        json={
            "entity_code": "PRODUCT",
            "field_name": "unit_price",
            "read_roles": ["inventory.access"],
        },
    )
    assert restricted.status_code == 200

    viewer_headers = {"Authorization": f"Bearer {_viewer_token(client)}"}
    form_meta = client.get("/api/v1/metadata/forms/PRODUCT", headers=viewer_headers)
    assert form_meta.status_code == 200
    main = next(section for section in form_meta.json()["sections"] if section["code"] == "main")
    field_names = {field["name"] for field in main["fields"]}
    assert "unit_price" not in field_names
    assert "sku" in field_names

    grid_meta = client.get("/api/v1/metadata/grids/PRODUCT", headers=viewer_headers)
    assert grid_meta.status_code == 200
    grid_body = grid_meta.json()
    column_names = {column["field"] for column in grid_body["columns"]}
    assert "unit_price" not in column_names
    assert "sku" in column_names
    assert "created_at" in column_names
    assert "unit_price" not in grid_body.get("i18n", {}).get("en", {})

    record = client.get(
        f"/api/v1/entities/PRODUCT/records/{record_id}",
        headers=viewer_headers,
    )
    assert "unit_price" not in record.json()
