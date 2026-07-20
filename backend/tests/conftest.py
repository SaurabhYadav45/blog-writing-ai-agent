import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool
import uuid

# Set test environment variables BEFORE importing the app
import os
os.environ["SECRET_KEY"] = "test-secret-key-12345678901234567890123456789012"
os.environ["POSTGRES_USER"] = "test_user"
os.environ["POSTGRES_PASSWORD"] = "test_pass"
os.environ["POSTGRES_DB"] = "test_db"
os.environ["ENVIRONMENT"] = "development"

from app.main import app
from app.core.db import get_session
from app.models.user import User
from app.core.security import get_password_hash
from app.core.limiter import limiter

# Disable rate limiting for tests to prevent 429s during fixture logins
limiter.enabled = False

# Setup mock in-memory SQLite database for testing
engine = create_engine(
    "sqlite://", 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    user = User(
        email="testuser@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("TestPassword123!"),
        is_verified=True,
        is_active=True,
        plan_name="Free",
        credits=5
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@pytest.fixture(name="pro_user")
def pro_user_fixture(session: Session):
    user = User(
        email="prouser@example.com",
        full_name="Pro User",
        hashed_password=get_password_hash("ProPassword123!"),
        is_verified=True,
        is_active=True,
        plan_name="Pro",
        credits=100
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@pytest.fixture(name="auth_client")
def auth_client_fixture(client: TestClient, test_user: User):
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser@example.com", "password": "TestPassword123!"}
    )
    token = response.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client

@pytest.fixture(name="pro_client")
def pro_client_fixture(client: TestClient, pro_user: User):
    response = client.post(
        "/api/auth/login",
        data={"username": "prouser@example.com", "password": "ProPassword123!"}
    )
    token = response.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
