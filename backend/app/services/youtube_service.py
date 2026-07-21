import os
from app.core.config import settings

def fetch_youtube_video(topic: str) -> str:
    """
    Crawl YouTube API for the most relevant video tutorial explaining the blog topic
    and returns a clean embeddable iframe tag.
    """
    try:
        from googleapiclient.discovery import build
        import httplib2
        # Use httplib2 with a 10 second timeout to prevent infinite socket blocking
        http = httplib2.Http(timeout=10)
    except ImportError:
        return ""
        
    api_key = settings.YOUTUBE_API_KEY or os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("YOUTUBE_API_KEY not found in .env, skipping YouTube integration.")
        return ""
    
    youtube = build("youtube", "v3", developerKey=api_key, http=http)
    query = f"{topic} tutorial explanation"
    
    try:
        request = youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=1,
            order="relevance",
            videoEmbeddable="true"
        )
        response = request.execute()
        
        if "items" in response and len(response["items"]) > 0:
            video_id = response["items"][0]["id"]["videoId"]
            title = response["items"][0]["snippet"]["title"]
            
            iframe = (
                f'\n\n## Related Video Tutorial\n\n'
                f'<p align="center">\n'
                f'  <iframe width="750" height="422" src="https://www.youtube.com/embed/{video_id}" '
                f'frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '
                f'allowfullscreen style="max-width: 100%; border-radius: 8px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);"></iframe>\n'
                f'  <br />\n'
                f'  <em>{title}</em>\n'
                f'</p>\n'
            )
            return iframe
        return ""
    except Exception as e:
        print(f"YouTube search error: {e}")
        return ""
