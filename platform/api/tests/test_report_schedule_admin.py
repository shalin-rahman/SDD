"""Admin report schedule overrides — P19 Sprint 12."""

from fastapi.testclient import TestClient


def _admin_headers(client: TestClient) -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_admin_report_schedules_list(client: TestClient) -> None:
    headers = _admin_headers(client)
    response = client.get("/api/v1/admin/reports/schedules", headers=headers)
    assert response.status_code == 200
    schedules = response.json()["schedules"]
    assert len(schedules) >= 1
    low_stock = next((row for row in schedules if row["code"] == "LOW_STOCK"), None)
    assert low_stock is not None
    assert low_stock["default_schedule_cron"] == "0 7 * * *"
    assert low_stock["schedule_cron"] == "0 7 * * *"
    assert low_stock["has_override"] is False


def test_admin_report_schedule_override_applies_to_public_list(client: TestClient) -> None:
    headers = _admin_headers(client)
    updated = client.put(
        "/api/v1/admin/reports/schedules/LOW_STOCK",
        headers=headers,
        json={"schedule_cron": "0 9 * * *"},
    )
    assert updated.status_code == 200
    assert updated.json()["has_override"] is True
    assert updated.json()["schedule_cron"] == "0 9 * * *"

    listed = client.get("/api/v1/reports")
    assert listed.status_code == 200
    report = next(row for row in listed.json()["reports"] if row["code"] == "LOW_STOCK")
    assert report["schedule_cron"] == "0 9 * * *"


def test_admin_report_schedule_rejects_invalid_cron(client: TestClient) -> None:
    headers = _admin_headers(client)
    response = client.put(
        "/api/v1/admin/reports/schedules/LOW_STOCK",
        headers=headers,
        json={"schedule_cron": "not-a-cron"},
    )
    assert response.status_code == 400


def test_admin_settings_documents_editable(client: TestClient) -> None:
    headers = _admin_headers(client)
    before = client.get("/api/v1/admin/settings", headers=headers)
    assert before.status_code == 200
    assert "documents.storage_backend" in before.json()["editable_paths"]

    updated = client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={
            "settings": {
                "documents": {
                    "storage_backend": "filesystem",
                    "max_upload_size_mb": 30,
                    "virus_scan_enabled": True,
                    "retention_days": 400,
                }
            }
        },
    )
    assert updated.status_code == 200
    docs = updated.json()["settings"]["documents"]
    assert docs["max_upload_size_mb"] == 30
    assert docs["retention_days"] == 400
    assert "documents.max_upload_size_mb" in updated.json()["override_paths"]
