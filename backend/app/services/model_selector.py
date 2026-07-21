"""Provider adapters backed by the canonical model registry."""

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_cohere import ChatCohere
from langchain_openrouter import ChatOpenRouter

from app.core.config import settings
from app.core.model_registry import ModelSpec


def create_chat_model(spec: ModelSpec, *, max_tokens: int | None = None):
    kwargs = {"model": spec.model_id}
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    if spec.provider_id == "openai":
        return ChatOpenAI(api_key=settings.OPENAI_API_KEY, **kwargs)
    if spec.provider_id == "anthropic":
        return ChatAnthropic(api_key=settings.ANTHROPIC_API_KEY, **kwargs)
    if spec.provider_id == "gemini":
        return ChatGoogleGenerativeAI(api_key=settings.GOOGLE_API_KEY, **kwargs)
    if spec.provider_id == "deepseek":
        return ChatOpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url="https://api.deepseek.com/v1", **kwargs)
    if spec.provider_id == "groq":
        return ChatGroq(api_key=settings.GROQ_API_KEY, max_tokens=max_tokens, **kwargs)
    if spec.provider_id == "cohere":
        return ChatCohere(cohere_api_key=settings.COHERE_API_KEY, **kwargs)
    if spec.provider_id == "openrouter":
        return ChatOpenRouter(model=spec.model_id, openrouter_api_key=settings.OPENROUTER_API_KEY)
    raise ValueError(f"No adapter configured for {spec.provider_id}")
