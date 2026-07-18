"""
Centralized Configuration for AI Models across the application.
"""

# OpenAI Models
MODEL_GPT_EXPENSIVE = "gpt-5.6-sol"
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
