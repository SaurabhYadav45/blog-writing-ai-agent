"""
Configuration settings for the Blog Writing AI Agent application.
This module uses Pydantic Settings to load and validate environment variables
from a local .env file. It provides configuration for database connections, 
AI model API keys, Cloudinary image upload services, and YouTube media lookups.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application-wide settings container loaded from environment variables.
    Pydantic automatically validates types during loading.
    """
    
    # Database Connection URL (e.g. PostgreSQL connection string)
    DATABASE_URL: str
    
    # API Keys for AI Services
    OPENAI_API_KEY: str     # OpenAI API Key (used for GPT models)
    ANTHROPIC_API_KEY: str  # Anthropic API Key (used for Claude models)
    GOOGLE_API_KEY: str     # Google Gemini API Key (used for Gemini models)
    TAVILY_API_KEY: str     # Tavily Search API Key (used by AI Agents for web research)
    
    # Cloudinary Cloud Storage configuration for storing generated blog images
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # YouTube API Key for searching contextually relevant videos to embed in blogs
    YOUTUBE_API_KEY: str = ""
    
    # Settings configuration: direct Pydantic to read from a local .env file
    # and ignore extra keys that are not declared above.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Global settings instance to import and use across the backend
settings = Settings()
