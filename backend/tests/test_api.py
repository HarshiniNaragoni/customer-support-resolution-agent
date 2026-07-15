from __future__ import annotations

from main import app


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Customer Support" in data["name"]


def test_create_ticket(client):
    payload = {
        "customer_name": "Test User",
        "customer_email": "test@example.com",
        "ticket_type": "general",
        "message": "I need help with my order.",
        "priority": "medium",
    }
    response = client.post("/api/v1/tickets", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["customer_name"] == "Test User"
    assert data["status"] == "open"


def test_list_tickets(client):
    response = client.get("/api/v1/tickets")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_orders(client):
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_policies(client):
    response = client.get("/api/v1/policies")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_audit_logs(client):
    response = client.get("/api/v1/audit")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_ticket(client):
    response = client.get("/api/v1/tickets/nonexistent-id")
    assert response.status_code == 404


def test_get_nonexistent_order(client):
    response = client.get("/api/v1/orders/nonexistent-id")
    assert response.status_code == 404


def test_system_health(client):
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
