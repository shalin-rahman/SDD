"""Entity list pagination API tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _seed_products(client: TestClient, count: int) -> list[str]:
    ids: list[str] = []
    for i in range(count):
        resp = client.post(
            "/api/v1/entities/PRODUCT/records",
            json={"sku": f"PG-{i:03d}", "name": f"Product {i}", "active": True},
        )
        assert resp.status_code == 201, resp.text
        ids.append(resp.json()["id"])
    return ids


def test_list_records_pagination(client: TestClient) -> None:
    _seed_products(client, 12)
    page1 = client.get("/api/v1/entities/PRODUCT/records?limit=5&offset=0")
    assert page1.status_code == 200
    body1 = page1.json()
    assert len(body1["records"]) == 5
    assert body1["total"] >= 12
    assert body1["limit"] == 5
    assert body1["offset"] == 0

    page2 = client.get("/api/v1/entities/PRODUCT/records?limit=5&offset=5")
    assert page2.status_code == 200
    body2 = page2.json()
    assert len(body2["records"]) == 5
    ids1 = {r["id"] for r in body1["records"]}
    ids2 = {r["id"] for r in body2["records"]}
    assert ids1.isdisjoint(ids2)


def test_list_records_without_limit_returns_all(client: TestClient) -> None:
    _seed_products(client, 12)
    before = client.get("/api/v1/entities/PRODUCT/records")
    assert before.status_code == 200
    count = len(before.json()["records"])
    assert "total" not in before.json()
    assert count >= 12


def test_search_records_pagination(client: TestClient) -> None:
    _seed_products(client, 5)
    resp = client.get("/api/v1/entities/PRODUCT/records?q=PG-&limit=3&offset=0")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["records"]) <= 3
    assert body["total"] >= 3
    assert body["limit"] == 3
