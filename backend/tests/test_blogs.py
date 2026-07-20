import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models.blog import Blog
from app.models.user import User

@pytest.fixture
def mock_blog(session: Session, test_user: User):
    blog = Blog(
        user_id=test_user.id,
        topic="Test Blog",
        tone="Professional",
        audience="Developers",
        status="COMPLETED",
        markdown_content="# Test Blog\n\nThis is a test blog."
    )
    session.add(blog)
    session.commit()
    session.refresh(blog)
    return blog

def test_list_blogs(auth_client: TestClient, mock_blog: Blog):
    response = auth_client.get("/api/blogs/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["topic"] == "Test Blog"

def test_get_blog(auth_client: TestClient, mock_blog: Blog):
    response = auth_client.get(f"/api/blogs/{mock_blog.id}")
    assert response.status_code == 200
    assert response.json()["topic"] == "Test Blog"

def test_get_blog_not_found(auth_client: TestClient):
    response = auth_client.get("/api/blogs/9999")
    assert response.status_code == 404

def test_get_blog_other_user(pro_client: TestClient, mock_blog: Blog):
    # pro_client should not be able to access test_user's blog
    response = pro_client.get(f"/api/blogs/{mock_blog.id}")
    assert response.status_code == 404

def test_update_blog(auth_client: TestClient, mock_blog: Blog, session: Session):
    response = auth_client.put(
        f"/api/blogs/{mock_blog.id}",
        json={"markdown_content": "# Updated Content"}
    )
    assert response.status_code == 200
    session.refresh(mock_blog)
    assert mock_blog.markdown_content == "# Updated Content"

def test_rename_blog(auth_client: TestClient, mock_blog: Blog, session: Session):
    response = auth_client.put(
        f"/api/blogs/{mock_blog.id}/title",
        json={"topic": "New Title"}
    )
    assert response.status_code == 200
    session.refresh(mock_blog)
    assert mock_blog.topic == "New Title"

def test_delete_blog(auth_client: TestClient, mock_blog: Blog, session: Session):
    response = auth_client.delete(f"/api/blogs/{mock_blog.id}")
    assert response.status_code == 200
    
    # Check if actually deleted
    deleted_blog = session.get(Blog, mock_blog.id)
    assert deleted_blog is None

def test_publish_blog_not_pro(auth_client: TestClient, mock_blog: Blog):
    response = auth_client.post(
        f"/api/blogs/{mock_blog.id}/publish",
        json={"platform": "wordpress"}
    )
    # test_user is Free tier, so should be 403
    assert response.status_code == 403
    assert "Pro feature" in response.json()["detail"]

from unittest.mock import patch

@patch("app.services.cms_service.publish_blog")
def test_publish_blog_pro(mock_publish, pro_client: TestClient, session: Session, pro_user: User):
    blog = Blog(
        user_id=pro_user.id,
        topic="Pro Blog",
        tone="Professional",
        audience="Developers",
        status="COMPLETED",
        markdown_content="# Pro Blog\n\nThis is a test blog."
    )
    session.add(blog)
    session.commit()
    session.refresh(blog)

    mock_publish.return_value = "https://example.com/published"
    
    response = pro_client.post(
        f"/api/blogs/{blog.id}/publish",
        json={"platform": "wordpress"}
    )
    
    assert response.status_code == 200
    assert response.json()["url"] == "https://example.com/published"

@patch("app.services.cms_service.share_to_linkedin")
@patch("app.api.routes.blogs.create_chat_model")
def test_promote_linkedin_pro(mock_llm, mock_share, pro_client: TestClient, session: Session, pro_user: User):
    blog = Blog(
        user_id=pro_user.id,
        topic="LinkedIn Blog",
        tone="Professional",
        audience="Developers",
        status="COMPLETED",
        markdown_content="# LinkedIn Blog",
        published_url="https://example.com/published"
    )
    session.add(blog)
    session.commit()
    session.refresh(blog)
    
    class MockLLMResponse:
        content = "Great post!"
    
    class MockLLM:
        def invoke(self, *args, **kwargs):
            return MockLLMResponse()
            
    mock_llm.return_value = MockLLM()
    mock_share.return_value = "urn:li:share:123"

    response = pro_client.post(f"/api/blogs/{blog.id}/promote/linkedin")
    assert response.status_code == 200
    assert response.json()["linkedin_post_id"] == "urn:li:share:123"

@patch("app.api.routes.blogs.create_chat_model")
def test_regenerate_selection_pro(mock_llm, pro_client: TestClient, session: Session, pro_user: User):
    blog = Blog(
        user_id=pro_user.id,
        topic="Regen Blog",
        tone="Professional",
        audience="Developers",
        status="COMPLETED"
    )
    session.add(blog)
    session.commit()
    session.refresh(blog)
    
    class MockLLMResponse:
        content = "Rewritten text"
        
    class MockLLM:
        def invoke(self, *args, **kwargs):
            return MockLLMResponse()
            
    mock_llm.return_value = MockLLM()
    
    response = pro_client.post(
        f"/api/blogs/{blog.id}/regenerate-selection",
        json={
            "selected_text": "Old text",
            "prompt": "Make it better",
            "model_name": "openai",
            "full_text": "Full text context"
        }
    )
    assert response.status_code == 200
    assert response.json()["new_text"] == "Rewritten text"
