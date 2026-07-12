import cloudinary
import cloudinary.uploader
from io import BytesIO
from app.core.config import settings

# Initialize Cloudinary only if credentials are set and are not placeholders
has_credentials = (
    settings.CLOUDINARY_CLOUD_NAME and 
    settings.CLOUDINARY_API_KEY and 
    settings.CLOUDINARY_API_SECRET and
    "your_cloudinary" not in settings.CLOUDINARY_CLOUD_NAME
)

if has_credentials:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

def upload_image_bytes(image_bytes: bytes, folder: str = "blogfusion") -> str:
    """
    Uploads raw image bytes to Cloudinary and returns the secure URL.
    If Cloudinary is not configured, it returns a high-quality fallback placeholder image URL.
    """
    if not has_credentials:
        print("WARNING: Cloudinary is not configured. Using placeholder image fallback.")
        # Return a beautiful tech placeholder image so the app is still functional for testing
        return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
        
    try:
        # Wrap raw bytes in a file-like BytesIO stream for the Cloudinary uploader
        file_obj = BytesIO(image_bytes)
        upload_result = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type="image"
        )
        # secure_url provides the HTTPS version of the uploaded image
        return upload_result.get("secure_url")
    except Exception as e:
        print(f"Error uploading image to Cloudinary: {e}")
        # Fallback to visual placeholder in case of API failure
        return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
