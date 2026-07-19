import requests
import json
from app.models.blog import Blog
from app.models.user import User
from app.core.security import decrypt_token

class CMSPublishError(Exception):
    pass

def publish_to_wordpress(blog: Blog, user: User) -> str:
    url = user.cms_wordpress_url
    if not url:
        raise CMSPublishError("WordPress URL is not configured.")
    
    # Clean URL
    url = url.rstrip('/')
    api_url = f"{url}/wp-json/wp/v2/posts"
    
    username = user.cms_wordpress_username
    password = decrypt_token(user.cms_wordpress_app_password)
    
    if not username or not password:
        raise CMSPublishError("WordPress credentials are not configured.")
        
    # WordPress REST API payload
    from markdown_it import MarkdownIt
    md = MarkdownIt()
    html_content = md.render(blog.markdown_content)
    
    payload = {
        "title": blog.topic,
        "content": html_content,
        "status": "publish"
    }
    
    try:
        response = requests.post(api_url, auth=(username, password), json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        return data.get("link", url)
    except requests.exceptions.RequestException as e:
        raise CMSPublishError(f"Failed to publish to WordPress: {str(e)}")

def publish_to_medium(blog: Blog, user: User) -> str:
    token = decrypt_token(user.cms_medium_token)
    if not token:
        raise CMSPublishError("Medium token is not configured.")
        
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        # First get the user ID
        me_res = requests.get("https://api.medium.com/v1/me", headers=headers, timeout=10)
        me_res.raise_for_status()
        me_data = me_res.json()
        author_id = me_data.get("data", {}).get("id")
        
        if not author_id:
            raise CMSPublishError("Failed to retrieve Medium author ID.")
            
        # Publish the post
        post_url = f"https://api.medium.com/v1/users/{author_id}/posts"
        payload = {
            "title": blog.topic,
            "contentFormat": "markdown",
            "content": blog.markdown_content,
            "publishStatus": "public"
        }
        
        post_res = requests.post(post_url, headers=headers, json=payload, timeout=20)
        post_res.raise_for_status()
        post_data = post_res.json()
        
        return post_data.get("data", {}).get("url", "")
    except requests.exceptions.RequestException as e:
        raise CMSPublishError(f"Failed to publish to Medium: {str(e)}")

def share_to_linkedin(blog: Blog, user: User, post_text: str) -> str:
    token = decrypt_token(user.cms_linkedin_token)
    author_urn = user.cms_linkedin_author_urn
    if not token or not author_urn:
        raise CMSPublishError("LinkedIn token or Author URN is not configured.")
        
    url = blog.published_url
    if not url:
        raise CMSPublishError("Blog must be published to a CMS before it can be promoted on LinkedIn.")
        
    api_url = "https://api.linkedin.com/v2/ugcPosts"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json"
    }
    
    urn_str = author_urn if author_urn.startswith("urn:li:person:") else f"urn:li:person:{author_urn}"
    
    payload = {
        "author": urn_str,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": post_text
                },
                "shareMediaCategory": "ARTICLE",
                "media": [
                    {
                        "status": "READY",
                        "originalUrl": url,
                        "title": {
                            "text": blog.topic
                        }
                    }
                ]
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        return data.get("id", "LinkedIn post shared successfully")
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if e.response is not None:
            try:
                err_data = e.response.json()
                error_msg = err_data.get("message", str(e))
            except:
                pass
        raise CMSPublishError(f"Failed to share to LinkedIn: {error_msg}")

def publish_blog(blog: Blog, user: User, platform: str) -> str:
    """
    Publishes a blog to the specified CMS platform and returns the published URL.
    """
    platform = platform.lower()
    if platform == "wordpress":
        return publish_to_wordpress(blog, user)
    elif platform == "medium":
        return publish_to_medium(blog, user)
    else:
        raise CMSPublishError(f"Unsupported platform: {platform}")
