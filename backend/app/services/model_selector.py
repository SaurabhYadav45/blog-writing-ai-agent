"""Provider adapters backed by the canonical model registry."""
from app.core.config import settings
from app.core.model_registry import ModelSpec


def create_chat_model(spec: ModelSpec, *, max_tokens: int | None = None):
    kwargs = {"model": spec.model_id}
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    if spec.provider_id == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(api_key=settings.OPENAI_API_KEY, **kwargs)
    if spec.provider_id == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(api_key=settings.ANTHROPIC_API_KEY, **kwargs)
    if spec.provider_id == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(api_key=settings.GOOGLE_API_KEY, **kwargs)
    if spec.provider_id == "deepseek":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url="https://api.deepseek.com/v1", **kwargs)
    if spec.provider_id == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(api_key=settings.GROQ_API_KEY, max_tokens=max_tokens, **kwargs)
    if spec.provider_id == "cohere":
        from langchain_cohere import ChatCohere
        return ChatCohere(cohere_api_key=settings.COHERE_API_KEY, **kwargs)
    if spec.provider_id == "openrouter":
        from langchain_openrouter import ChatOpenRouter
        return ChatOpenRouter(model=spec.model_id, openrouter_api_key=settings.OPENROUTER_API_KEY)
    raise ValueError(f"No adapter configured for {spec.provider_id}")
