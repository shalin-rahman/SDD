from fastapi.testclient import TestClient

from emcap.notifications.template_render import (
    build_organization_template_vars,
    interpolate_template,
    render_notification_template,
)


def _admin_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_interpolate_template_replaces_tokens() -> None:
    result = interpolate_template(
        "Hello {{name}} from {{display_name}}",
        {"name": "Alex", "display_name": "Acme"},
    )
    assert result == "Hello Alex from Acme"


def test_build_organization_template_vars_from_profile() -> None:
    vars = build_organization_template_vars(
        {
            "display_name": "Acme Corp",
            "email": "ops@acme.com",
            "phone": "+1-555-0100",
            "address": {"line1": "1 Main St", "city": "Boston"},
        }
    )
    assert vars["display_name"] == "Acme Corp"
    assert vars["email"] == "ops@acme.com"
    assert vars["address_line1"] == "1 Main St"
    assert vars["city"] == "Boston"
    assert len(vars["date"]) == 10


def test_render_notification_appends_email_signature() -> None:
    profile = {
        "display_name": "Acme Corp",
        "email": "billing@acme.com",
        "phone": "+1-555-0100",
        "address": {},
        "email_signature": "{{display_name}}\n{{email}} | {{phone}}",
    }
    subject, body = render_notification_template(
        subject="Invoice {{name}}",
        body="Dear {{name}}, your invoice is ready.",
        channel="email",
        profile=profile,
        context={"name": "Pat"},
    )
    assert subject == "Invoice Pat"
    assert "Dear Pat, your invoice is ready." in body
    assert "Acme Corp" in body
    assert "billing@acme.com | +1-555-0100" in body
    assert body.endswith("billing@acme.com | +1-555-0100")


def test_render_notification_inline_signature_placeholder() -> None:
    profile = {
        "display_name": "Acme Corp",
        "email": "billing@acme.com",
        "phone": "",
        "address": {},
        "email_signature": "{{display_name}}",
    }
    _, body = render_notification_template(
        subject="Hi",
        body="Thanks.\n\n{{signature}}",
        channel="email",
        profile=profile,
    )
    assert body == "Thanks.\n\nAcme Corp"
    assert "--" not in body


def test_render_notification_skips_signature_for_non_email() -> None:
    profile = {
        "display_name": "Acme Corp",
        "email_signature": "Acme Corp",
        "address": {},
    }
    _, body = render_notification_template(
        subject="Alert",
        body="Low stock",
        channel="push",
        profile=profile,
    )
    assert body == "Low stock"


def test_send_template_notification_merges_signature(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    client.put(
        "/api/v1/admin/organization-profile",
        json={
            "display_name": "Tenant Org",
            "email": "hello@tenant.org",
            "phone": "555-9999",
            "email_signature": "{{display_name}}\n{{email}}",
        },
        headers=headers,
    )
    created = client.post(
        "/api/v1/admin/templates",
        json={
            "code": "invoice_ready",
            "channel": "email",
            "subject": "Invoice for {{name}}",
            "body": "Hello {{name}}, invoice {{code}} is ready.",
        },
        headers=headers,
    )
    assert created.status_code == 201

    sent = client.post(
        "/api/v1/notifications/send-template",
        json={
            "template_code": "invoice_ready",
            "recipient": "customer@example.com",
            "context": {"name": "Sam", "code": "INV-42"},
        },
    )
    assert sent.status_code == 200
    assert sent.json()["status"] == "sent"

    listed = client.get("/api/v1/notifications")
    assert listed.status_code == 200
    notifications = listed.json()["notifications"]
    assert any(n["recipient"] == "customer@example.com" for n in notifications)
