from fastapi.testclient import TestClient


def _admin_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_admin_users_crud(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    listed = client.get("/api/v1/admin/users", headers=headers)
    assert listed.status_code == 200
    assert any(user["username"] == "admin" for user in listed.json()["users"])

    created = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "username": "phase12-user",
            "password": "phase12pass",
            "tenant_id": "default",
            "role_codes": ["viewer"],
        },
    )
    assert created.status_code == 201
    user_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/admin/users/{user_id}",
        headers=headers,
        json={"active": False, "role_codes": ["operator"]},
    )
    assert updated.status_code == 200
    assert updated.json()["active"] is False
    assert updated.json()["roles"][0]["code"] == "operator"

    login_blocked = client.post(
        "/api/v1/auth/login",
        json={"username": "phase12-user", "password": "phase12pass"},
    )
    assert login_blocked.status_code == 401


def test_admin_roles_update(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    roles = client.get("/api/v1/admin/roles", headers=headers)
    assert roles.status_code == 200
    viewer = next(role for role in roles.json()["roles"] if role["code"] == "viewer")

    updated = client.put(
        f"/api/v1/admin/roles/{viewer['id']}",
        headers=headers,
        json={"permissions": ["*.read", "admin.settings.read"]},
    )
    assert updated.status_code == 200
    assert "admin.settings.read" in updated.json()["permissions"]


def test_admin_settings_and_templates(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    settings = client.get("/api/v1/admin/settings", headers=headers)
    assert settings.status_code == 200
    assert "modules" in settings.json()["settings"]

    updated = client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"settings": {"modules": {"ai": {"enabled": True}}}},
    )
    assert updated.status_code == 200
    assert updated.json()["settings"]["modules"]["ai"]["enabled"] is True

    template = client.post(
        "/api/v1/admin/templates",
        headers=headers,
        json={
            "code": "welcome",
            "channel": "email",
            "subject": "Welcome",
            "body": "Hello {{name}}",
        },
    )
    assert template.status_code == 201
    template_id = template.json()["id"]

    listed = client.get("/api/v1/admin/templates", headers=headers)
    assert listed.status_code == 200
    assert any(item["code"] == "welcome" for item in listed.json()["templates"])

    deleted = client.delete(f"/api/v1/admin/templates/{template_id}", headers=headers)
    assert deleted.status_code == 204

    audit = client.get("/api/v1/admin/audit", headers=headers)
    assert audit.status_code == 200
    assert len(audit.json()["audit"]) >= 1


def test_admin_payment_secret_masked(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    secret = "sk_test_super_secret_key_12345"

    updated = client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={
            "settings": {
                "payments": {
                    "provider": "stripe",
                    "stripe": {
                        "publishable_key": "pk_test_publishable",
                        "secret_key": secret,
                    },
                }
            }
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert secret not in updated.text
    assert "pk_test_publishable" in updated.text
    secret_view = body["settings"]["payments"]["stripe"]["secret_key"]
    assert secret_view["configured"] is True
    assert secret_view["masked"] == "••••••••"
    assert "payments.stripe.secret_key" in body["write_only_paths"]

    fetched = client.get("/api/v1/admin/settings", headers=headers)
    assert fetched.status_code == 200
    assert secret not in fetched.text
    fetched_secret = fetched.json()["settings"]["payments"]["stripe"]["secret_key"]
    assert fetched_secret["configured"] is True

    audit = client.get("/api/v1/admin/audit", headers=headers)
    assert audit.status_code == 200
    assert secret not in audit.text
    secret_audit = next(
        item for item in audit.json()["audit"] if item["target"] == "payments.stripe.secret_key"
    )
    assert secret_audit["payload"]["value"] == "[redacted]"
    assert secret_audit["payload"]["configured"] is True

    noop = client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"settings": {"payments": {"stripe": {"secret_key": secret_view}}}},
    )
    assert noop.status_code == 400


def test_admin_integrations_registry(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    webhook_secret = "whsec_super_secret_value_999"

    updated = client.put(
        "/api/v1/admin/integrations",
        headers=headers,
        json={
            "integrations": {
                "rest": {"base_url": "https://api.example.com/hooks"},
                "kafka": {
                    "bootstrap": "localhost:9092",
                    "topic_prefix": "emcap.events",
                },
                "soap": {"endpoint": "https://soap.example.com/service"},
                "webhook": {"signing_secret": webhook_secret},
            }
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert webhook_secret not in updated.text
    assert body["integrations"]["rest"]["base_url"] == "https://api.example.com/hooks"
    secret_view = body["integrations"]["webhook"]["signing_secret"]
    assert secret_view["configured"] is True
    assert secret_view["masked"] == "••••••••"

    fetched = client.get("/api/v1/admin/integrations", headers=headers)
    assert fetched.status_code == 200
    assert webhook_secret not in fetched.text

    tested = client.post("/api/v1/admin/integrations/test-rest", headers=headers)
    assert tested.status_code == 200
    assert tested.json()["adapter"] == "rest"

    audit = client.get("/api/v1/admin/audit", headers=headers)
    assert webhook_secret not in audit.text
    webhook_audit = next(
        item
        for item in audit.json()["audit"]
        if item["target"] == "integrations.webhook.signing_secret"
    )
    assert webhook_audit["payload"]["value"] == "[redacted]"

    invalid_kafka = client.put(
        "/api/v1/admin/integrations",
        headers=headers,
        json={
            "integrations": {
                "kafka": {"bootstrap": "localhost:9092", "topic_prefix": ""},
            }
        },
    )
    assert invalid_kafka.status_code == 400


def test_admin_abac_policies(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    listed = client.get("/api/v1/admin/security/abac", headers=headers)
    assert listed.status_code == 200
    policies = listed.json()["policies"]
    assert any(p["permission"] == "customer.read" for p in policies)

    updated = client.put(
        "/api/v1/admin/security/abac",
        headers=headers,
        json={
            "policies": [
                {
                    "permission": "inventory.access",
                    "effect": "allow",
                    "attribute": "tenant_id",
                    "operator": "equals",
                    "value": "other",
                }
            ]
        },
    )
    assert updated.status_code == 200
    assert len(updated.json()["policies"]) == 1

    denied = client.post(
        "/api/v1/auth/check",
        headers=headers,
        json={"permission": "inventory.access", "tenant_id": "default"},
    )
    assert denied.status_code == 200
    assert denied.json()["allowed"] is False

    allowed = client.post(
        "/api/v1/auth/check",
        headers=headers,
        json={"permission": "customer.read", "tenant_id": "default"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["allowed"] is True

    audit = client.get("/api/v1/admin/audit", headers=headers)
    assert any(
        item["action"] == "security.abac.update"
        for item in audit.json()["audit"]
    )


def test_admin_security_policies(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/admin/security/policies", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "entities" in body
    assert "rules" in body
    product = next(item for item in body["entities"] if item["code"] == "PRODUCT")
    assert product["row_access"] == "permission"
    assert product["read_permission"] == "product.read"
    unit_price = next(field for field in product["fields"] if field["name"] == "unit_price")
    assert unit_price["read_roles"] == ["inventory.access"]
    assert unit_price["access"] == "restricted"
    sku = next(field for field in product["fields"] if field["name"] == "sku")
    assert sku["access"] == "open"
    assert sku["read_roles"] == []


def test_admin_forbidden_for_viewer(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "viewer", "password": "viewer123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 403


def test_admin_validation_errors(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    duplicate = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={"username": "admin", "password": "short", "role_codes": ["viewer"]},
    )
    assert duplicate.status_code == 400

    missing_user = client.get("/api/v1/admin/users/missing-id", headers=headers)
    assert missing_user.status_code == 404

    invalid_settings = client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"settings": {"seed": {"demo": {"enabled": True}}}},
    )
    assert invalid_settings.status_code == 400

    created_role = client.post(
        "/api/v1/admin/roles",
        headers=headers,
        json={"code": "auditor", "name": "Auditor", "permissions": ["*.read"]},
    )
    assert created_role.status_code == 201

    duplicate_role = client.post(
        "/api/v1/admin/roles",
        headers=headers,
        json={"code": "auditor", "name": "Auditor 2", "permissions": ["*.read"]},
    )
    assert duplicate_role.status_code == 400

    template = client.post(
        "/api/v1/admin/templates",
        headers=headers,
        json={"code": "reset", "channel": "email", "subject": "Reset", "body": "Link"},
    )
    template_id = template.json()["id"]

    updated_template = client.put(
        f"/api/v1/admin/templates/{template_id}",
        headers=headers,
        json={"subject": "Reset password", "body": "Use {{link}}"},
    )
    assert updated_template.status_code == 200

    listed_users = client.get("/api/v1/admin/users", headers=headers).json()["users"]
    operator = next(user for user in listed_users if user["username"] == "operator")
    deactivate = client.patch(f"/api/v1/admin/users/{operator['id']}/deactivate", headers=headers)
    assert deactivate.status_code == 200
    assert deactivate.json()["active"] is False


def test_permissions_include_admin_catalog(client: TestClient) -> None:
    response = client.get("/api/v1/permissions")
    assert response.status_code == 200
    permissions = response.json()["permissions"]
    assert "admin.users.read" in permissions
    assert "admin.*" in permissions
