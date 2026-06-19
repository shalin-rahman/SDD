import base64

from fastapi.testclient import TestClient


def _admin_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _png_bytes() -> bytes:
    # Minimal valid 1x1 PNG
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )


def test_organization_profile_get_defaults(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/admin/organization-profile", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["profile"]["display_name"] == "EMCAP Demo Corp"
    assert body["profile"]["address"]["city"] == "Demo City"
    assert "organization_profile.display_name" in body["editable_paths"]
    assert body["override_paths"] == []


def test_organization_profile_update_and_persist(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    updated = client.put(
        "/api/v1/admin/organization-profile",
        headers=headers,
        json={
            "profile": {
                "display_name": "Acme Widgets",
                "email": "billing@acme.test",
                "website": "https://acme.test",
                "currency": "EUR",
                "address": {"city": "Paris", "country": "FR"},
                "invoice": {"header": "Acme Invoice", "footer": "Pay within 30 days"},
            }
        },
    )
    assert updated.status_code == 200
    profile = updated.json()["profile"]
    assert profile["display_name"] == "Acme Widgets"
    assert profile["email"] == "billing@acme.test"
    assert profile["address"]["city"] == "Paris"
    assert profile["invoice"]["header"] == "Acme Invoice"
    assert "organization_profile.display_name" in updated.json()["override_paths"]

    fetched = client.get("/api/v1/admin/organization-profile", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["profile"]["display_name"] == "Acme Widgets"

    settings = client.get("/api/v1/admin/settings", headers=headers)
    assert settings.status_code == 200
    org = settings.json()["settings"]["organization_profile"]
    assert org["display_name"] == "Acme Widgets"


def test_organization_profile_validation_rejects_bad_email(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put(
        "/api/v1/admin/organization-profile",
        headers=headers,
        json={"profile": {"email": "not-an-email"}},
    )
    assert response.status_code == 400
    assert "email" in response.json()["detail"].lower()


def test_organization_profile_validation_rejects_bad_currency(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put(
        "/api/v1/admin/organization-profile",
        headers=headers,
        json={"profile": {"currency": "EURO"}},
    )
    assert response.status_code == 400
    assert "currency" in response.json()["detail"].lower()


def test_organization_logo_upload_sets_logo_url_and_serves_content(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    png = _png_bytes()

    uploaded = client.post(
        "/api/v1/admin/organization-profile/logo",
        headers=headers,
        json={
            "filename": "logo.png",
            "content_base64": base64.b64encode(png).decode("ascii"),
        },
    )
    assert uploaded.status_code == 200
    body = uploaded.json()
    assert body["virus_scan_status"] in {"clean", "skipped"}
    assert body["logo_url"].startswith("/api/v1/documents/")
    assert body["logo_url"].endswith("/content")
    assert body["profile"]["logo_url"] == body["logo_url"]

    content = client.get(body["logo_url"])
    assert content.status_code == 200
    assert content.headers["content-type"] == "image/png"
    assert content.content == png

    profile = client.get("/api/v1/admin/organization-profile", headers=headers)
    assert profile.json()["profile"]["logo_url"] == body["logo_url"]


def test_organization_logo_upload_rejects_bad_extension(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/admin/organization-profile/logo",
        headers=headers,
        json={
            "filename": "logo.exe",
            "content_base64": base64.b64encode(b"fake").decode("ascii"),
        },
    )
    assert response.status_code == 400
    assert "image file" in response.json()["detail"].lower()


def test_organization_logo_upload_rejects_oversized_file(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    huge = b"x" * (26 * 1024 * 1024)

    response = client.post(
        "/api/v1/admin/organization-profile/logo",
        headers=headers,
        json={
            "filename": "logo.png",
            "content_base64": base64.b64encode(huge).decode("ascii"),
        },
    )
    assert response.status_code == 400
    assert "max upload size" in response.json()["detail"].lower()


def test_organization_logo_upload_rejects_eicar_virus_marker(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    infected = b"EICAR-TEST-FILE" + _png_bytes()

    response = client.post(
        "/api/v1/admin/organization-profile/logo",
        headers=headers,
        json={
            "filename": "logo.png",
            "content_base64": base64.b64encode(infected).decode("ascii"),
        },
    )
    assert response.status_code == 400
    assert "virus scan" in response.json()["detail"].lower()


def test_organization_logo_upload_rejects_invalid_base64(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/admin/organization-profile/logo",
        headers=headers,
        json={"filename": "logo.png", "content_base64": "!!!not-base64!!!"},
    )
    assert response.status_code == 400
    assert "base64" in response.json()["detail"].lower()


def test_organization_logo_upload_rejects_empty_file(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/admin/organization-profile/logo",
        headers=headers,
        json={
            "filename": "logo.png",
            "content_base64": base64.b64encode(b"").decode("ascii"),
        },
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_organization_logo_upload_rejects_svg_with_script(client: TestClient) -> None:
    token = _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'

    response = client.post(
        "/api/v1/admin/organization-profile/logo",
        headers=headers,
        json={
            "filename": "logo.svg",
            "content_base64": base64.b64encode(svg).decode("ascii"),
        },
    )
    assert response.status_code == 400
    assert "script" in response.json()["detail"].lower()
