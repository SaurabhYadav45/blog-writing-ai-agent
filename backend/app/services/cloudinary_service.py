"""
Cloudinary Image Storage Service.
This service configures and coordinates direct uploads of raw image bytes
to Cloudinary, returning a secure HTTPS URL.
If Cloudinary configuration is missing or invalid, it gracefully falls back
to yielding static Unsplash image placeholders to keep the system operational.
"""

import cloudinary
import cloudinary.uploader
from io import BytesIO
from app.core.config import settings

# Evaluate whether credentials are set and aren't default placeholder strings
has_credentials = (
    settings.CLOUDINARY_CLOUD_NAME and 
    settings.CLOUDINARY_API_KEY and 
    settings.CLOUDINARY_API_SECRET and
    "your_cloudinary" not in settings.CLOUDINARY_CLOUD_NAME
)

# Apply global configuration if credentials exist
if has_credentials:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

def upload_image_bytes(image_bytes: bytes, folder: str = "blogfusion") -> str:
    """
    Upload raw image bytes to Cloudinary.
    
    Args:
        image_bytes: Raw binary bytes representing the generated image.
        folder: Cloudinary remote folder target for storage.
        
    Returns:
        The secure HTTPS URL of the hosted image, or an Unsplash fallback URL.
    """
    if not has_credentials:
        print("WARNING: Cloudinary is not configured. Using placeholder image fallback.")
        # Return a high-quality tech placeholder image so the app remains visual during local development/testing
        return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
        
    try:
        # Wrap raw bytes in a file-like BytesIO stream for the uploader
        file_obj = BytesIO(image_bytes)
        upload_result = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type="image"
        )
        return upload_result.get("secure_url")
    except Exception as e:
        print(f"Error uploading image to Cloudinary: {e}")
        # Return fallback on api exception to prevent hard failure of the agent workflow
        return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
