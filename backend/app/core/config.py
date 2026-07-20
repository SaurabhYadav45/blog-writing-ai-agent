"""
Configuration settings for the Blog Writing AI Agent application.
This module uses Pydantic Settings to load and validate environment variables
from a local .env file. It provides configuration for database connections, 
AI model API keys, Cloudinary image upload services, and YouTube media lookups.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    """
    Application-wide settings container loaded from environment variables.
    Pydantic automatically validates types during loading.
    """
    
    # Database Connection URL (e.g. PostgreSQL connection string)
    DATABASE_URL: str
    
    # Security Configuration settings
    from pydantic import Field
    SECRET_KEY: str = Field(default_factory=lambda: __import__('secrets').token_hex(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # Default expiration: 7 days
    
    # OAuth Configurations
    GOOGLE_CLIENT_ID: Optional[str] = None
    
    # Razorpay Payment Gateway Configurations
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    
    # API Keys for AI Services
    OPENAI_API_KEY: str     # OpenAI API Key (used for GPT models)
    ANTHROPIC_API_KEY: str  # Anthropic API Key (used for Claude models)
    GOOGLE_API_KEY: str     # Google Gemini API Key (used for Gemini models)
    TAVILY_API_KEY: str     # Tavily Search API Key (used by AI Agents for web research)
    DEEPSEEK_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    COHERE_API_KEY: str = ""
    HF_TOKEN: str = ""  # Hugging Face hf_ token with Inference Providers permission
    HUGGINGFACE_API_KEY: str = ""  # Legacy fallback; prefer HF_TOKEN
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_API_KEY: str = ""
    
    # Cloudinary Cloud Storage configuration for storing generated blog images
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # YouTube API Key for searching contextually relevant videos to embed in blogs
    YOUTUBE_API_KEY: str = ""
    
    # Brevo Configuration for sending emails (OTP, Receipts, etc)
    BREVO_API_KEY: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@blogfusion.ai"
    EMAILS_FROM_NAME: str = "BlogFusion AI"
    
    # Frontend URL used for generating links in emails
    FRONTEND_URL: str = "http://localhost:5173"
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Settings configuration: direct Pydantic to read from a local .env file
    # and ignore extra keys that are not declared above.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Global settings instance to import and use across the backend
settings = Settings()
