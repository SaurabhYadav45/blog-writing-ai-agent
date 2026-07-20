from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models.user import User

def test_get_current_user_success(auth_client: TestClient):
    response = auth_client.get("/api/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Test User"
    assert data["credits"] == 5

def test_get_current_user_unauthorized(client: TestClient):
    response = client.get("/api/users/me")
    assert response.status_code == 401

def test_update_user_profile(auth_client: TestClient):
    response = auth_client.put(
        "/api/users/me",
        json={
            "full_name": "Updated Name",
            "brand_persona": "Professional"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["brand_persona"] == "Professional"

def test_get_dashboard_stats(auth_client: TestClient):
    response = auth_client.get("/api/users/me/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "remaining_credits" in data
    assert "total_blogs_generated" in data
    assert "avg_blog_length" in data

def test_delete_user_account(auth_client: TestClient, session: Session):
    response = auth_client.delete("/api/users/me")
    assert response.status_code == 200
    assert response.json() == {"status": "success"}
    
    # Try to login again
    login_response = auth_client.post(
        "/api/auth/login",
        data={"username": "testuser@example.com", "password": "TestPassword123!"}
    )
    assert login_response.status_code == 400
