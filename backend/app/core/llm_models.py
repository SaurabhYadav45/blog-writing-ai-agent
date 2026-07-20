"""
Centralized Configuration for AI Models across the application.
"""

# OpenAI Models
MODEL_GPT_EXPENSIVE = "gpt-5.6-sol"
MODEL_GPT_BALANCED = "gpt-5.6-terra"
MODEL_GPT_CHEAP = "gpt-5.6-luna"
MODEL_GPT_IMAGE = "gpt-image-1"

# Anthropic Models
MODEL_CLAUDE_EXPENSIVE = "claude-sonnet-5"
MODEL_CLAUDE_CHEAP = "claude-haiku-4-5"

# Gemini Models
MODEL_GEMINI_EXPENSIVE = "gemini-3.1-pro"
MODEL_GEMINI_CHEAP = "gemini-3.5-flash"

# Generic string references used by the frontend to match model families
FAMILY_GPT = "GPT-5.6-Sol"
FAMILY_CLAUDE = "Claude-Sonnet-5"
FAMILY_GEMINI = "Gemini-3.1-Pro"
FAMILY_DEEPSEEK = "DeepSeek-V4"
FAMILY_GROQ = "Groq-GPT-OSS"
FAMILY_OPENROUTER = "OpenRouter-Auto"
FAMILY_COHERE = "Cohere-Command"

# Map mock model names to actual API model strings
REAL_MODEL_MAP = {
    MODEL_GPT_EXPENSIVE: "gpt-4o",
    MODEL_GPT_BALANCED: "gpt-4o",
    MODEL_GPT_CHEAP: "gpt-4o-mini",
    MODEL_GPT_IMAGE: "gpt-image-1",
    MODEL_CLAUDE_EXPENSIVE: "claude-3-5-sonnet-20240620",
    MODEL_CLAUDE_CHEAP: "claude-3-haiku-20240307",
    MODEL_GEMINI_EXPENSIVE: "gemini-1.5-pro",
    MODEL_GEMINI_CHEAP: "gemini-1.5-flash",
    "deepseek-v4-pro": "deepseek-coder",
    "deepseek-v4-flash": "deepseek-chat",
    "groq-planner": "qwen/qwen3.6-27b",
    "groq-researcher": "qwen/qwen3.6-27b",
    "groq-writer": "openai/gpt-oss-120b",
    "groq-seo": "qwen/qwen3.6-27b",
    "openrouter-fallback": "openrouter-fallback", # special case for our nodes.py
    "cohere-command-r-plus": "command-r-plus-08-2024",
    "cohere-command-r": "command-r-08-2024",
}

# Image Model Constants
IMAGE_MODEL_OPENAI = "gpt-image-1"
IMAGE_MODEL_GEMINI = "gemini-3.1-flash-image"
IMAGE_MODEL_CLOUDFLARE = "@cf/stabilityai/stable-diffusion-xl-base-1.0"
IMAGE_MODEL_HUGGINGFACE = "black-forest-labs/FLUX.1-schnell"
IMAGE_MODEL_POLLINATIONS = "pollinations-flux"
