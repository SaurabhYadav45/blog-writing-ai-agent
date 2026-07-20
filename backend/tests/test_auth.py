import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models.user import User

def test_signup_success(client: TestClient, session: Session):
    response = client.post(
        "/api/auth/signup",
        json={
            "full_name": "New User",
            "email": "newuser@example.com",
            "password": "StrongPassword123!"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "otp_sent"
    
    # Check DB
    user = session.exec(select(User).where(User.email == "newuser@example.com")).first()
    assert user is not None
    assert user.is_verified is False
    assert user.otp_code is not None

def test_signup_weak_password(client: TestClient):
    response = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Weak User",
            "email": "weakuser@example.com",
            "password": "weak"
        }
    )
    assert response.status_code == 400
    assert "at least 8 characters" in response.json()["detail"]

def test_login_success(client: TestClient, test_user: User):
    response = client.post(
        "/api/auth/login",
        data={
            "username": "testuser@example.com",
            "password": "TestPassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client: TestClient, test_user: User):
    response = client.post(
        "/api/auth/login",
        data={
            "username": "testuser@example.com",
            "password": "WrongPassword123!"
        }
    )
    assert response.status_code == 400

def test_login_unverified_user(client: TestClient, session: Session):
    # Setup unverified user
    client.post(
        "/api/auth/signup",
        json={
            "full_name": "Unverified",
            "email": "unverified@example.com",
            "password": "StrongPassword123!"
        }
    )
    response = client.post(
        "/api/auth/login",
        data={
            "username": "unverified@example.com",
            "password": "StrongPassword123!"
        }
    )
    assert response.status_code == 403
    assert "verify your email" in response.json()["detail"]

def test_verify_otp(client: TestClient, session: Session):
    client.post(
        "/api/auth/signup",
        json={
            "full_name": "OTP User",
            "email": "otpuser@example.com",
            "password": "StrongPassword123!"
        }
    )
    user = session.exec(select(User).where(User.email == "otpuser@example.com")).first()
    
    response = client.post(
        "/api/auth/verify-otp",
        json={
            "email": "otpuser@example.com",
            "otp": user.otp_code
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    
    session.refresh(user)
    assert user.is_verified is True
    assert user.otp_code is None

def test_verify_otp_invalid(client: TestClient, session: Session):
    client.post(
        "/api/auth/signup",
        json={
            "full_name": "OTP User Invalid",
            "email": "otpuserinvalid@example.com",
            "password": "StrongPassword123!"
        }
    )
    
    response = client.post(
        "/api/auth/verify-otp",
        json={
            "email": "otpuserinvalid@example.com",
            "otp": "000000"
        }
    )
    assert response.status_code == 400
    assert "Invalid OTP" in response.json()["detail"]

def test_forgot_password(client: TestClient, test_user: User):
    response = client.post(
        "/api/auth/forgot-password",
        json={"email": test_user.email}
    )
    assert response.status_code == 200
    assert "message" in response.json()
