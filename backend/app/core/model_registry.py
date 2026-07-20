"""Canonical, server-side registry for every selectable text model.

The UI sends a provider id (for example ``openai``), never an arbitrary model
string.  Task code asks for either the ``cheap`` or ``complex`` tier.  Keeping
that information here prevents routing, entitlement and metrics from drifting.
"""
from dataclasses import dataclass
from typing import Literal, Optional

ModelTier = Literal["cheap", "complex"]


@dataclass(frozen=True)
class ModelSpec:
    provider_id: str
    provider_name: str
    tier: ModelTier
    model_id: str
    input_per_million: Optional[float] = None
    output_per_million: Optional[float] = None
    required_plan: str = "Free"
    status: str = "active"
    cached_input_per_million: Optional[float] = None

    @property
    def display_name(self) -> str:
        return f"{self.provider_name} · {self.tier.title()}"


# Prices are only recorded where they are known and intentionally configured.
# ``None`` means "show unavailable", never "pretend it is free".
MODEL_REGISTRY: dict[str, dict[ModelTier, ModelSpec]] = {
    "openai": {
        "complex": ModelSpec("openai", "OpenAI", "complex", "gpt-5.6-terra", 2.50, 15.00),
        "cheap": ModelSpec("openai", "OpenAI", "cheap", "gpt-5.6-luna", 1.00, 6.00),
    },
    "anthropic": {
        "complex": ModelSpec("anthropic", "Anthropic", "complex", "claude-sonnet-5", 2.00, 10.00, "Pro"),
        "cheap": ModelSpec("anthropic", "Anthropic", "cheap", "claude-haiku-4-5", 1.00, 5.00, "Pro"),
    },
    "gemini": {
        "complex": ModelSpec("gemini", "Google Gemini", "complex", "gemini-3.1-pro-preview", 2.00, 12.00, "Pro", "preview"),
        "cheap": ModelSpec("gemini", "Google Gemini", "cheap", "gemini-3.5-flash", required_plan="Pro"),
    },
    "deepseek": {
        "complex": ModelSpec("deepseek", "DeepSeek", "complex", "deepseek-v4-pro", 0.435, 0.87, cached_input_per_million=0.003625),
        "cheap": ModelSpec("deepseek", "DeepSeek", "cheap", "deepseek-v4-flash", 0.14, 0.28, cached_input_per_million=0.0028),
    },
    "openrouter": {
        # These must be checked against OpenRouter's live catalog before a release.
        "complex": ModelSpec("openrouter", "OpenRouter", "complex", "openai/gpt-oss-120b:free"),
        "cheap": ModelSpec("openrouter", "OpenRouter", "cheap", "tencent/hy3:free"),
    },
    "cohere": {
        "complex": ModelSpec("cohere", "Cohere", "complex", "command-a-reasoning-08-2025"),
        "cheap": ModelSpec("cohere", "Cohere", "cheap", "command-a-03-2025"),
    },
}

LEGACY_PROVIDER_IDS = {
    "gpt": "openai", "openai": "openai",
    "claude": "anthropic", "anthropic": "anthropic",
    "gemini": "gemini", "deepseek": "deepseek", "openrouter": "openrouter",
    "cohere": "cohere",
    # Existing saved blog records from the previous implementation.
    "gpt-5.6-terra": "openai", "gpt-5.6-luna": "openai",
    "claude-sonnet-5": "anthropic", "claude-haiku-4-5": "anthropic",
    "gemini-3.1-pro": "gemini", "gemini-3.1-pro-preview": "gemini", "gemini-3.5-flash": "gemini",
    "deepseek-v4": "deepseek", "deepseek-v4-pro": "deepseek", "deepseek-v4-flash": "deepseek",
}


def normalize_provider_id(value: str | None) -> str:
    provider_id = LEGACY_PROVIDER_IDS.get((value or "openai").strip().lower())
    if not provider_id:
        raise ValueError("Unsupported AI provider")
    return provider_id


def get_model_spec(provider_id: str | None, tier: ModelTier) -> ModelSpec:
    return MODEL_REGISTRY[normalize_provider_id(provider_id)][tier]


def is_allowed_for_plan(spec: ModelSpec, plan_name: str | None) -> bool:
    return spec.required_plan != "Pro" or plan_name == "Pro"


def public_catalog(plan_name: str | None) -> list[dict]:
    """Return selectable providers without exposing credentials or internals."""
    catalog = []
    for provider_id, tiers in MODEL_REGISTRY.items():
        complex_spec = tiers["complex"]
        if not is_allowed_for_plan(complex_spec, plan_name):
            continue
        catalog.append({
            "id": provider_id,
            "name": complex_spec.provider_name,
            "required_plan": complex_spec.required_plan,
            "models": {
                tier: {"id": spec.model_id, "status": spec.status}
                for tier, spec in tiers.items()
            },
        })
    return catalog
