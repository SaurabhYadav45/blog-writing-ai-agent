import os
import requests
import json
import logging
from app.core.config import settings
from app.core.llm_models import (
    IMAGE_MODEL_OPENAI,
    IMAGE_MODEL_GEMINI,
    IMAGE_MODEL_CLOUDFLARE,
    IMAGE_MODEL_HUGGINGFACE,
    IMAGE_MODEL_POLLINATIONS,
    REAL_MODEL_MAP
)

logger = logging.getLogger(__name__)

def generate_image_bytes(prompt: str, provider: str = IMAGE_MODEL_POLLINATIONS, size: str = "1536x1024") -> bytes:
    """
    Factory function to generate images using the specified provider.
    Returns binary image data (bytes).
    """
    logger.info(f"Generating image using provider: {provider} and size: {size}")
    
    # Parse width and height from the size string (e.g. 1536x1024)
    try:
        width, height = map(int, size.split("x"))
    except ValueError:
        width, height = 1024, 1024

    if provider == IMAGE_MODEL_OPENAI:
        return _openai_generate(prompt, width, height)
    elif provider == IMAGE_MODEL_GEMINI:
        return _gemini_generate(prompt, width, height)
    elif provider == IMAGE_MODEL_CLOUDFLARE:
        return _cloudflare_generate(prompt, width, height)
    elif provider == IMAGE_MODEL_HUGGINGFACE:
        return _huggingface_generate(prompt, width, height)
    elif provider == IMAGE_MODEL_POLLINATIONS:
        return _pollinations_generate(prompt, width, height)
    else:
        logger.warning(f"Unknown image provider {provider}. Falling back to Pollinations.")
        return _pollinations_generate(prompt, width, height)

def _openai_generate(prompt: str, width: int, height: int) -> bytes:
    """Uses OpenAI's gpt-image-1 via the official openai package."""
    import openai
    import base64
    
    # Map to valid DALL-E-3 / gpt-image-1 aspect ratios
    if width > height:
        openai_size = "1792x1024"
    elif width < height:
        openai_size = "1024x1792"
    else:
        openai_size = "1024x1024"
        
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    real_model = REAL_MODEL_MAP.get(IMAGE_MODEL_OPENAI, "gpt-image-1")
    response = client.images.generate(
        model=real_model,
        prompt=prompt,
        size=openai_size,
        quality="standard",
        n=1,
        response_format="b64_json"
    )
    b64_json = response.data[0].b64_json
    if not b64_json:
        raise ValueError("OpenAI image generation returned empty b64_json.")
    
    return base64.b64decode(b64_json)

def _gemini_generate(prompt: str, width: int, height: int) -> bytes:
    """Uses Gemini Image Generation (gemini-3.1-flash-image) via REST."""
    api_key = settings.GOOGLE_API_KEY
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is not set.")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    # Map size aspect ratio to Gemini image request parameters if supported, 
    # otherwise defaults to raw prompt
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    try:
        part = data["candidates"][0]["content"]["parts"][0]
        if "inlineData" in part:
            import base64
            b64_data = part["inlineData"]["data"]
            return base64.b64decode(b64_data)
        else:
            raise ValueError(f"Unexpected response format from Gemini: {data}")
    except (KeyError, IndexError) as e:
        raise ValueError(f"Failed to parse Gemini response: {e}")

def _cloudflare_generate(prompt: str, width: int, height: int) -> bytes:
    """Uses Cloudflare Workers AI."""
    account_id = settings.CLOUDFLARE_ACCOUNT_ID
    api_key = settings.CLOUDFLARE_API_KEY
    if not account_id or not api_key:
        raise ValueError("CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_KEY is not set.")
        
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{IMAGE_MODEL_CLOUDFLARE}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "width": width,
        "height": height
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    
    return response.content

def _huggingface_generate(prompt: str, width: int, height: int) -> bytes:
    """Generate through Hugging Face Inference Providers (not the legacy URL)."""
    hf_token = settings.HF_TOKEN or settings.HUGGINGFACE_API_KEY
    if not hf_token:
        raise ValueError("HF_TOKEN is not set. Create an hf_ token with Inference Providers permission.")

    from io import BytesIO
    from huggingface_hub import InferenceClient

    client = InferenceClient(provider="auto", api_key=hf_token)
    image = client.text_to_image(
        prompt=prompt,
        model=IMAGE_MODEL_HUGGINGFACE,
        width=width,
        height=height,
    )
    if isinstance(image, bytes):
        return image
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()
def _pollinations_generate(prompt: str, width: int, height: int) -> bytes:
    """Uses Pollinations AI (free, keyless)."""
    import urllib.parse
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"
    
    response = requests.get(url)
    response.raise_for_status()
    
    return response.content
