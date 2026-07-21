import os
import sys

# Add backend to sys.path
sys.path.append(r"c:\Users\saura\OneDrive\Documents\Desktop\GenAi Projects\Blog Writing AI Agent\backend")

from app.services.youtube_service import fetch_youtube_video
from app.core.config import settings

print("API KEY:", bool(settings.YOUTUBE_API_KEY))
result = fetch_youtube_video("context engineering in ai")
print("RESULT:", result)
