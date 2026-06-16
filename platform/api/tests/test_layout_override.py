"""Layout override merge + admin API — P13-T31 / ADR-007."""

from fastapi.testclient import TestClient


def _admin_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_layout_override_reorders_grid_columns(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}

    before = client.get("/api/v1/metadata/grids/PRODUCT", headers=admin_headers)
    assert before.status_code == 200
    before_fields = [column["field"] for column in before.json()["columns"]]
    assert before_fields.index("sku") < before_fields.index("name")

    saved = client.put(
        "/api/v1/admin/metadata/layouts/PRODUCT/override",
        headers=admin_headers,
        json={
            "grid": {
                "columns": [
                    {"field": "name", "sortable": True, "filterable": True, "width": 200},
                    {"field": "sku", "sortable": False, "filterable": True, "width": 120},
                ]
            }
        },
    )
    assert saved.status_code == 200

    after = client.get("/api/v1/metadata/grids/PRODUCT", headers=admin_headers)
    assert after.status_code == 200
    body = after.json()
    fields = [column["field"] for column in body["columns"] if column["field"] not in {"created_at", "updated_at", "created_by", "updated_by", "record_version", "deleted_at"}]
    assert fields[:2] == ["name", "sku"]
    sku_column = next(column for column in body["columns"] if column["field"] == "sku")
    assert sku_column["sortable"] is False
    assert sku_column.get("width") == 120

    deleted = client.delete(
        "/api/v1/admin/metadata/layouts/PRODUCT/override",
        headers=admin_headers,
    )
    assert deleted.status_code == 200

    reverted = client.get("/api/v1/metadata/grids/PRODUCT", headers=admin_headers)
    reverted_fields = [column["field"] for column in reverted.json()["columns"]]
    assert reverted_fields.index("sku") < reverted_fields.index("name")


def test_layout_override_is_tenant_scoped(client: TestClient) -> None:
    admin_headers = {
        "Authorization": f"Bearer {_admin_token(client)}",
        "X-Tenant-ID": "tenant-a",
    }
    saved = client.put(
        "/api/v1/admin/metadata/layouts/PRODUCT/override",
        headers=admin_headers,
        json={"grid": {"columns": [{"field": "name", "sortable": True, "filterable": True}]}},
    )
    assert saved.status_code == 200

    tenant_b = {
        "Authorization": f"Bearer {_admin_token(client)}",
        "X-Tenant-ID": "tenant-b",
    }
    grid_b = client.get("/api/v1/metadata/grids/PRODUCT", headers=tenant_b)
    fields_b = [column["field"] for column in grid_b.json()["columns"]]
    assert "sku" in fields_b

    missing = client.get(
        "/api/v1/admin/metadata/layouts/PRODUCT/override",
        headers=tenant_b,
    )
    assert missing.status_code == 404


def test_layout_override_rejects_unknown_field(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    response = client.put(
        "/api/v1/admin/metadata/layouts/PRODUCT/override",
        headers=admin_headers,
        json={"grid": {"columns": [{"field": "not_a_field", "sortable": True, "filterable": True}]}},
    )
    assert response.status_code == 400


def test_layout_override_get_returns_404_when_missing(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    response = client.get(
        "/api/v1/admin/metadata/layouts/CUSTOMER/override",
        headers=admin_headers,
    )
    assert response.status_code == 404


def test_layout_override_delete_returns_404_when_missing(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    response = client.delete(
        "/api/v1/admin/metadata/layouts/CUSTOMER/override",
        headers=admin_headers,
    )
    assert response.status_code == 404


def test_layout_override_rejects_unknown_entity(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    response = client.put(
        "/api/v1/admin/metadata/layouts/NOT_A_ENTITY/override",
        headers=admin_headers,
        json={"grid": {"columns": [{"field": "name", "sortable": True, "filterable": True}]}},
    )
    assert response.status_code == 400


def test_layout_override_rejects_unknown_form_field(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    response = client.put(
        "/api/v1/admin/metadata/layouts/CUSTOMER/override",
        headers=admin_headers,
        json={
            "form": {
                "sections": [
                    {
                        "code": "main",
                        "fields": [{"name": "not_a_field", "row": 1, "col": 1, "span": 6}],
                    }
                ]
            }
        },
    )
    assert response.status_code == 400


def test_layout_override_form_merge_and_update_existing_row(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}

    created = client.put(
        "/api/v1/admin/metadata/layouts/CUSTOMER/override",
        headers=admin_headers,
        json={
            "form": {
                "sections": [
                    {
                        "code": "main",
                        "fields": [
                            {"name": "email", "row": 1, "col": 1, "span": 12, "read_only": True},
                            {"name": "name", "row": 2, "col": 1, "span": 8, "read_only": False},
                        ],
                    }
                ]
            }
        },
    )
    assert created.status_code == 200

    effective = client.get("/api/v1/admin/metadata/layouts/CUSTOMER", headers=admin_headers)
    assert effective.status_code == 200
    body = effective.json()
    assert body["has_override"] is True
    main_fields = body["form"]["sections"][0]["fields"]
    assert [field["name"] for field in main_fields[:2]] == ["email", "name"]
    assert main_fields[0]["read_only"] is True

    updated = client.put(
        "/api/v1/admin/metadata/layouts/CUSTOMER/override",
        headers=admin_headers,
        json={
            "form": {
                "sections": [
                    {
                        "code": "main",
                        "fields": [
                            {"name": "email", "row": 1, "col": 1, "span": 12, "read_only": True},
                            {"name": "name", "row": 2, "col": 1, "span": 8, "read_only": False},
                        ],
                    }
                ]
            },
            "grid": {
                "columns": [
                    {"field": "active", "sortable": False, "filterable": False, "width": 70},
                    {"field": "name", "sortable": True, "filterable": True, "width": 220},
                ]
            },
        },
    )
    assert updated.status_code == 200

    fetched = client.get("/api/v1/admin/metadata/layouts/CUSTOMER/override", headers=admin_headers)
    assert fetched.status_code == 200
    assert "form" in fetched.json()["override"]
    assert "grid" in fetched.json()["override"]

    deleted = client.delete(
        "/api/v1/admin/metadata/layouts/CUSTOMER/override",
        headers=admin_headers,
    )
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True


def test_layout_effective_metadata_without_override(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    response = client.get("/api/v1/admin/metadata/layouts/CUSTOMER", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["entity_code"] == "CUSTOMER"
    assert body["has_override"] is False
    assert body["form"]["entity_code"] == "CUSTOMER"
    assert body["grid"]["entity_code"] == "CUSTOMER"
