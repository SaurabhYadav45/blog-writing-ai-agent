from fastapi.testclient import TestClient

def test_contact_submission_success(client: TestClient):
    response = client.post(
        "/api/support/contact",
        json={
            "full_name": "John Doe",
            "email": "johndoe@example.com",
            "message": "Hello, this is a test message."
        }
    )
    assert response.status_code == 201
    assert response.json() == {"message": "Message received"}

def test_contact_submission_invalid_email(client: TestClient):
    response = client.post(
        "/api/support/contact",
        json={
            "full_name": "John Doe",
            "email": "not-an-email",
            "message": "Hello, this is a test message."
        }
    )
    assert response.status_code == 422 # Unprocessable Entity (Pydantic Validation Error)

def test_contact_submission_long_message(client: TestClient):
    # max_length is 2000
    long_msg = "A" * 2001
    response = client.post(
        "/api/support/contact",
        json={
            "full_name": "John Doe",
            "email": "johndoe@example.com",
            "message": long_msg
        }
    )
    assert response.status_code == 422

def test_feedback_submission_success(client: TestClient):
    response = client.post(
        "/api/support/feedback",
        json={
            "type": "Bug Report",
            "title": "Button not working",
            "description": "When I click the generate button, nothing happens."
        }
    )
    assert response.status_code == 201
    assert response.json() == {"message": "Feedback received"}

def test_feedback_submission_missing_fields(client: TestClient):
    response = client.post(
        "/api/support/feedback",
        json={
            "title": "Button not working"
        }
    )
    assert response.status_code == 422
