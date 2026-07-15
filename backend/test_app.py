import sys
import traceback
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

try:
    response = client.post(
        "/api/auth/signup",
        json={"email": "test@test.com", "password": "password123", "full_name": "Test"}
    )
    print(response.status_code)
    print(response.json())
except Exception as e:
    print("EXCEPTION CAUGHT:")
    traceback.print_exc()
