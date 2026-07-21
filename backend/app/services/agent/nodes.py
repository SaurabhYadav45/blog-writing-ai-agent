from typing import TypedDict, Annotated, List, Literal, Optional
import operator
import json
import threading
from langgraph.types import Send
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_tavily import TavilySearch
from datetime import date
from openai import OpenAI
import base64
import requests
import os

from app.core.config import settings
from app.core import llm_models
from app.core.model_registry import ModelSpec, get_model_spec
from app.services.model_selector import create_chat_model
from app.services.cloudinary_service import upload_image_bytes
from app.services.agent.prompt import ROUTER_SYSTEM_PROMPT, RESEARCH_SYSTEM_PROMPT, PLANNER_SYSTEM_PROMPT, WORKER_SYSTEM_PROMPT, DECIDE_IMAGES_SYSTEM_PROMPT, EDITOR_SYSTEM_PROMPT
from app.services.agent.state import BlogState, Task, Plan, EvidenceItem, EvidencePack, RouterDecision, ImageSpec, GlobalImagePlan, SEOMetadata
from app.services.youtube_service import fetch_youtube_video

# Get the API KEY Tavily from environment variable
os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY


def parse_structured_response(response):
    """
    Safely extract parsed pydantic object and raw message from langchain's
    with_structured_output response. Handles cases where the model returns 
    the Pydantic object directly instead of a dict wrapper.
    """
    if isinstance(response, dict):
        return response.get("parsed"), response.get("raw")
    return response, None

def get_model_for_task(state: dict, expensive: bool = True) -> ModelSpec:
    """Resolve the provider and workload tier from the canonical registry."""
    return get_model_spec(state.get("model_name", llm_models.DEFAULT_TEXT_PROVIDER), "complex" if expensive else "cheap")


def get_llm(state: dict, expensive: bool = True, agent_role: Optional[str] = None):
    """Create the correct provider client for the selected registry model."""
    return create_chat_model(get_model_for_task(state, expensive))


class JsonObjectStructuredOutput:
    """DeepSeek JSON-mode adapter with local Pydantic validation."""
    def __init__(self, llm, schema, include_raw: bool):
        self.llm = llm.bind(response_format={"type": "json_object"})
        self.schema = schema
        self.include_raw = include_raw

    @staticmethod
    def _text(content) -> str:
        if isinstance(content, list):
            return "".join(part.get("text", "") for part in content if isinstance(part, dict))
        return str(content)

    def _parse(self, content: str):
        payload = json.loads(content)
        # A common JSON-mode failure is echoing the supplied schema instead of
        # returning a data instance. Treat it as invalid and issue one retry.
        if isinstance(payload, dict) and "properties" in payload and "required" in payload:
            raise ValueError("model returned a JSON Schema instead of JSON data")
        return self.schema.model_validate(payload)

    def invoke(self, messages):
        schema_text = json.dumps(self.schema.model_json_schema(), separators=(",", ":"))
        fields = ", ".join(self.schema.model_fields.keys())
        instruction = SystemMessage(content=(
            "Return only a populated JSON DATA object for the user's request. "
            "Never return, repeat, explain, or describe the schema itself; do not output keys such as "
            "'properties', 'required', 'type', or 'description'. Required data fields are: " + fields + ".\n"
            "Validate your DATA object against this schema internally:\n" + schema_text
        ))
        raw = self.llm.invoke([instruction, *messages])
        content = self._text(raw.content)
        try:
            parsed = self._parse(content)
        except Exception:
            correction = HumanMessage(content=(
                "Your last answer was not a populated data object. Return only the requested JSON data now. "
                f"Use these fields: {fields}. Do not output the schema, type definitions, or descriptions."
            ))
            raw = self.llm.invoke([instruction, *messages, correction])
            content = self._text(raw.content)
            try:
                parsed = self._parse(content)
            except Exception as exc:
                raise ValueError(f"{self.schema.__name__} JSON validation failed after retry: {content!r}") from exc
        return {"parsed": parsed, "raw": raw} if self.include_raw else parsed


def structured_output(llm, state: dict, schema, *, include_raw: bool = False):
    """Select a structured-output mode supported by the active provider."""
    if get_model_for_task(state, expensive=False).provider_id == "deepseek":
        return JsonObjectStructuredOutput(llm, schema, include_raw)
    return llm.with_structured_output(schema, include_raw=include_raw)


def extract_usage(raw, node_name: str, spec: ModelSpec):
    """Normalize provider usage and attach the price snapshot used for this call."""
    usage = getattr(raw, "usage_metadata", None)
    if not usage and hasattr(raw, "response_metadata"):
        token_usage = raw.response_metadata.get("token_usage", {})
        usage = {
            "input_tokens": token_usage.get("prompt_tokens", 0),
            "output_tokens": token_usage.get("completion_tokens", 0),
            "total_tokens": token_usage.get("total_tokens", 0),
        }
    usage = usage or {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
    input_tokens, output_tokens = usage.get("input_tokens", 0), usage.get("output_tokens", 0)
    metadata = getattr(raw, "response_metadata", {}) or {}
    token_usage = metadata.get("token_usage", {}) or {}
    cached_input_tokens = (usage.get("cache_read_input_tokens") or usage.get("cached_input_tokens") or token_usage.get("prompt_cache_hit_tokens") or 0)
    uncached_input_tokens = token_usage.get("prompt_cache_miss_tokens") or max(input_tokens - cached_input_tokens, 0)
    if spec.input_per_million is None or spec.output_per_million is None:
        cost_usd = None
    else:
        cached_rate = spec.cached_input_per_million if spec.cached_input_per_million is not None else spec.input_per_million
        cost_usd = (uncached_input_tokens * spec.input_per_million + cached_input_tokens * cached_rate + output_tokens * spec.output_per_million) / 1_000_000
    return {
        "node": node_name, "provider": spec.provider_id, "requested_model": spec.model_id,
        "model_name": metadata.get("model_name") or metadata.get("model") or spec.model_id,
        "tier": spec.tier, "input_tokens": input_tokens, "cached_input_tokens": cached_input_tokens, "output_tokens": output_tokens,
        "total_tokens": usage.get("total_tokens", 0), "cost_usd": cost_usd,
    }


# ====================================================================
# Router Node: It decide if Blog needs research or not
# ====================================================================

def router_node(state: BlogState):
    """
    Node that runs the router agent.
    Determines if web research is required, the generation mode, and relevant queries.
    """
    topic = state["topic"]
    as_of = state.get("as_of", date.today().isoformat())
    model_name = state.get("model_name", llm_models.DEFAULT_TEXT_PROVIDER)
    llm = get_llm(state, expensive=False, agent_role="router")
    decider_llm = structured_output(llm, state, RouterDecision, include_raw=True)
    
    response = decider_llm.invoke(
        [
            SystemMessage(content=ROUTER_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Topic: {topic}\n"
                    f"Current Date/As-Of: {as_of}"
                )
            )
        ]
    )
    
    decision, raw_response = parse_structured_response(response)
    metrics_log = extract_usage(raw_response, "Router Node", get_model_for_task(state, False))

    # Set recency threshold based on routing decision mode
    if decision.mode == "open_book":
        recency_days = 7
    elif decision.mode == "hybrid":
        recency_days = 45
    else:
        recency_days = 365
        
    return {
        "mode": decision.mode,
        "need_research": decision.need_research,
        "queries": decision.queries,
        "recency_days": recency_days,
        "metrics": [metrics_log]
    }

# ====================================================================
# Conditional Edge Router
# ====================================================================

def route_next(state: BlogState):
    """
    Conditional edge router.
    Directs execution flow to 'research' if needed, otherwise skips straight to 'orchestrator'.
    """
    need_research = state["need_research"]
    if need_research:
        return "research"
    else:
        return "orchestrator"


# --------------------------------------------------------------------
# Tavily helper function for Research Node
# --------------------------------------------------------------------
def _tavily_search(query: str, max_results: int = 5) -> List[dict]:
    """
    Helper function to query Tavily API and normalize results.
    """
    tool = TavilySearch(max=max_results)
    tavily_response = tool.invoke({"query": query})
    results = tavily_response.get("results", [])

    normalized = []
    for result in results:
        normalized.append(
            {
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "snippet": result.get("snippet", "") or result.get("content", ""),
                "published_at": result.get("published_at", "") or result.get("published_date", ""),
                "source": result.get("source", "")
            }
        )
    return normalized

# ====================================================================
# Research Node : It research about the blog title from the internet
# ====================================================================

def research_node(state: BlogState) -> dict:
    """
    Executes concurrent search queries via ThreadPoolExecutor.
    Also extracts page contents from user-provided reference URLs if present.
    Deduplicates results through a structured LLM call.
    """
    queries = (state.get("queries", []) or [])
    max_results = 3
    llm = get_llm(state, expensive=False, agent_role="research_analyzer")

    raw_results: List[dict] = []
    
    # Run multiple Tavily queries concurrently to minimize latency
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_query = {executor.submit(_tavily_search, q, max_results): q for q in queries}
        for future in concurrent.futures.as_completed(future_to_query):
            try:
                results = future.result()
                raw_results.extend(results)
            except Exception as e:
                print(f"Tavily search generated an exception: {e}")
                
    # Crawl any custom URLs supplied directly by the user
    reference_urls = state.get("reference_urls")
    if reference_urls:
        import requests
        for url in reference_urls.split(","):
            url = url.strip()
            if url:
                try:
                    r = requests.get(url, timeout=5)
                    raw_results.append({
                        "title": f"Reference: {url}",
                        "url": url,
                        "snippet": r.text[:2000],
                        "published_at": "",
                        "source": "User Reference"
                    })
                except Exception as e:
                    print(f"Error fetching reference URL {url}: {e}")

    if not raw_results:
        return {"evidence": []}

    # Use LLM to extract structure and filter high-quality evidence
    extractor = structured_output(llm, state, EvidencePack)
    pack = extractor.invoke(
        [
            SystemMessage(content=RESEARCH_SYSTEM_PROMPT),
            HumanMessage(content=f"Raw results:\n{raw_results[:12]}"),
        ]
    )

    # Deduplicate matching results by URL
    dedup = {}
    for e in pack.evidence:
        if e.url:
            dedup[e.url] = e

    return {"evidence": list(dedup.values())}


# ====================================================================
# Orchestrator Node: It generates a detailed Plan for the Blog
# ====================================================================

def orchestrator_node(state: BlogState):
    """
    Generates a structured outline (plan) for the blog based on depth configuration.
    Incorporates web search evidence to ground claims if in hybrid/open_book modes.
    """
    llm = get_llm(state, agent_role="planner")
    model_name = state.get("model_name", llm_models.DEFAULT_TEXT_PROVIDER)
    planner = structured_output(llm, state, Plan, include_raw=True)
    evidence = state.get("evidence", [])
    mode = state.get("mode", "closed_book")

    forced_kind = "news_roundup" if mode == "open_book" else None

    response = planner.invoke(
        [
            SystemMessage(content=PLANNER_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Topic: {state['topic']}\n"
                    f"Mode: {mode}\n"
                    f"Target Depth: {state.get('depth', 'Standard Guide')}\n"
                    f"As-of: {state['as_of']} (recency_days={state['recency_days']})\n"
                    f"{'Force blog_kind=news_roundup' if forced_kind else ''}\n\n"
                    f"Evidence (ONLY use for fresh claims; may be empty):\n"
                    f"{[e.model_dump() for e in evidence][:8]}\n\n"
                    f"Instruction: Ensure the section count matches the requested Target Depth."
                )
            ),
        ]
    )
    
    plan, raw_response = parse_structured_response(response)
    if plan is None:
        raise ValueError("Planner did not return a valid Plan. Check the provider response and structured-output configuration.")
    metrics_log = extract_usage(raw_response, "Orchestrator Node", get_model_for_task(state, True))

    if forced_kind:
        plan.blog_kind = "news_roundup"

    return {"plan": plan, "metrics": [metrics_log]}


# ====================================================================
# Fanout Node: Splits the blog plan tasks to be executed concurrently
# ====================================================================

def fanout(state: BlogState):
    """
    Orchestrates the dynamic parallel execution map.
    Spawns concurrent worker node threads for each task defined in the blog plan.
    """
    plan = state["plan"]
    if plan is None:
        raise ValueError("Plan is Missing")
    
    sends = []
    for task in plan.tasks:
        worker_state = {
            "task": task.model_dump(),
            "topic": state["topic"],
            "depth": state.get("depth", "Standard Guide"),
            "model_name": state.get("model_name"),
            "mode": state["mode"],
            "as_of": state["as_of"],
            "recency_days": state["recency_days"],
            "plan": plan.model_dump(),
            "evidence": [evidence_item.model_dump() for evidence_item in state.get("evidence", [])],
            "brand_persona": state.get("brand_persona")
        }
        send = Send("worker", worker_state)
        sends.append(send)

    return sends


# ====================================================================
# Worker Node: Each worker instance will generate a particular section of the blog
# ====================================================================

def worker_node(payload: dict) -> dict:
    """
    Executes in parallel. Writes a single section of the blog post
    using structural constraints, style guides, and citations.
    """
    task = Task(**payload["task"])
    plan = Plan(**payload["plan"])
    evidence = [EvidenceItem(**e) for e in payload.get("evidence", [])]
    topic = payload["topic"]
    mode = payload.get("mode", "closed_book")
    as_of = payload.get("as_of")
    recency_days = payload.get("recency_days")
    llm = get_llm(payload, agent_role="blog_writer")

    bullets_text = "\n- " + "\n- ".join(task.bullets)

    # Format relevant evidence payload to guide worker generation
    evidence_text = ""
    if evidence:
        evidence_text = "\n".join(
            f"- {e.title} | {e.url} | {e.published_at or 'date:unknown'}"
            for e in evidence[:20]
        )

    section_md = llm.invoke(
        [
            SystemMessage(content=WORKER_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Blog title: {plan.blog_title}\n"
                    f"Audience: {plan.audience}\n"
                    f"Tone: {plan.tone}\n"
                    f"Brand Persona / Tone Override: {payload.get('brand_persona') or 'None'}\n"
                    f"Target Depth: {payload.get('depth', 'Standard Guide')}\n"
                    f"Blog kind: {plan.blog_kind}\n"
                    f"Constraints: {plan.constraints}\n"
                    f"Topic: {topic}\n"
                    f"Mode: {mode}\n"
                    f"As-of: {as_of} (recency_days={recency_days})\n\n"
                    f"Section title: {task.title}\n"
                    f"Goal: {task.goal}\n"
                    f"Target words: {task.target_words}\n"
                    f"Tags: {task.tags}\n"
                    f"requires_research: {task.requires_research}\n"
                    f"requires_citations: {task.requires_citations}\n"
                    f"requires_code: {task.requires_code}\n"
                    f"Bullets:{bullets_text}\n\n"
                    f"Evidence (ONLY use these URLs when citing):\n{evidence_text}\n"
                )
            ),
        ]
    )
    
    model_name = payload.get("model_name", llm_models.DEFAULT_TEXT_PROVIDER)
    metrics_log = extract_usage(section_md, f"Worker ({task.title})", get_model_for_task(payload, True))

    content = section_md.content
    if isinstance(content, list):
        content = "".join([c.get("text", "") for c in content if isinstance(c, dict) and "text" in c])
    elif not isinstance(content, str):
        content = str(content)

    # Post-process: Replace unicode em-dashes (—) which make content look obviously AI-generated
    content = content.replace(" — ", ", ")
    content = content.replace("—", ", ")

    return {"sections": [(task.id, content.strip())], "metrics": [metrics_log]}


# ====================================================================
# Reducer Node: Merge content generated from various sections
# ====================================================================

def merge_content(state: BlogState):
    """
    Merges section drafts completed by workers back into a unified markdown.
    Maps image plans to their programmatic placeholders (`[[IMAGE_i]]`) in order.
    """
    plan = state["plan"]
    sorted_sections = sorted(state["sections"], key=lambda x: x[0])
    image_specs = state.get("image_specs", [])

    # Map task_id to placeholders
    from collections import defaultdict
    task_placeholders = defaultdict(list)
    thumbnail_ph = ""
    
    for i, spec in enumerate(image_specs):
        spec["placeholder"] = f"[[IMAGE_{i}]]"
        
        # The prompt mandates the first image is the thumbnail
        if i == 0:
            thumbnail_ph = f"[[IMAGE_{i}]]\n\n"
        else:
            t_id = spec.get("task_id")
            valid_ids = [t for t, m in sorted_sections]
            # Fallback to last valid section if AI hallucinates task_id
            if t_id not in valid_ids and valid_ids:
                t_id = valid_ids[-1]
            task_placeholders[t_id].append(spec["placeholder"])

    ordered_sections = []
    for task_id, markdown in sorted_sections:
        if task_id in task_placeholders:
            images_ph = "\n\n".join(task_placeholders[task_id])
            markdown = f"{markdown}\n\n{images_ph}"
        ordered_sections.append(markdown)
    
    body = "\n\n".join(ordered_sections).strip()
    merged_md = f"# {plan.blog_title}\n\n{thumbnail_ph}{body}\n"
    
    return {"merged_md": merged_md, "image_specs": image_specs}


# ====================================================================
# Decide Images Node
# ====================================================================

def decide_images(state: BlogState) -> dict:
    """
    Plans details for a thumbnail image to represent the blog visual.
    Outputs a prompt instructions payload.
    """
    plan = state["plan"]
    assert plan is not None
    llm = get_llm(state, expensive=False, agent_role="image_planner")
    model_name = state.get("model_name", llm_models.DEFAULT_TEXT_PROVIDER)

    plan_name = state.get("plan_name", "Free")
    image_prompt_instruction = "Propose ONLY 1 image prompt for the thumbnail."
    if plan_name == "Pro":
        image_prompt_instruction = "Propose 2 to 3 image prompts total (1 thumbnail + 1 or 2 inline images) and assign them to the most relevant task_id."

    image_insertion_planner = structured_output(llm, state, GlobalImagePlan, include_raw=True)
    response = image_insertion_planner.invoke(
        [
            SystemMessage(content=DECIDE_IMAGES_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Blog kind: {plan.blog_kind}\n"
                    f"Topic: {state['topic']}\n\n"
                    f"Plan Tasks: {[({'id': t.id, 'title': t.title}) for t in plan.tasks]}\n\n"
                    f"{image_prompt_instruction}"
                )
            )
        ]
    )
    
    image_plan, raw_response = parse_structured_response(response)
    metrics_log = extract_usage(raw_response, "Image Planner Node", get_model_for_task(state, False))

    return {
        "image_specs": [img.model_dump() for img in image_plan.images],
        "metrics": [metrics_log]
    }


from app.services.agent.image_service import generate_image_bytes


# ====================================================================
# Generate and Place images node
# ====================================================================

def generate_and_place_images(state: BlogState):
    """
    Triggers gpt-image-1 image generation based on prompts, uploads the output to
    Cloudinary, and replaces placeholder tokens in the blog markdown body with 
    the secure HTTPS image URLs.
    """
    md = state.get("merged_md")
    image_specs = state.get("image_specs", [])

    if not image_specs:
        return {"final_blog": md}

    image_model = state.get("image_model_name") or llm_models.IMAGE_MODEL_CLOUDFLARE

    image_count = 0
    for spec in image_specs:
        placeholder = spec["placeholder"]
        try:
            # The factory handles sizing for different providers internally
            img_bytes = generate_image_bytes(
                prompt=spec["prompt"], 
                provider=image_model,
                size=spec.get("size", "1536x1024")
            )
            image_count += 1
        except Exception as e:
            error_msg = f"IMAGE GENERATION ERROR ({image_model}): {e}"
            print(error_msg)
            prompt_block = (
                f"\n> **[IMAGE GENERATION FAILED]** {spec.get('caption','')}\n>\n"
                f"> **Alt:** {spec.get('alt','')}\n>\n"
                f"> **Prompt:** {spec.get('prompt','')}\n>\n"
                f"> **Error:** {error_msg}\n"
            )
            md = md.replace(placeholder, prompt_block)
            continue

        try:
            img_url = upload_image_bytes(
                img_bytes,
                user_cloud_name=state.get("cloudinary_cloud_name"),
                user_api_key=state.get("cloudinary_api_key"),
                user_api_secret=state.get("cloudinary_api_secret")
            )
        except Exception as e:
            error_msg = f"CLOUDINARY UPLOAD ERROR: {e}"
            print(error_msg)
            prompt_block = (
                f"\n> **[IMAGE UPLOAD FAILED]** {spec.get('caption','')}\n>\n"
                f"> **Alt:** {spec.get('alt','')}\n>\n"
                f"> **Prompt:** {spec.get('prompt','')}\n>\n"
                f"> **Error:** {error_msg}\n"
            )
            md = md.replace(placeholder, prompt_block)
            continue

        # Place the hosted image into standard responsive HTML markdown
        img_md = (
            f'<p align="center">\n'
            f'  <img src="{img_url}" alt="{spec["alt"]}" width="750" style="max-width: 100%; height: auto; border-radius: 8px;" />\n'
            f'  <br />\n'
            f'  <em>{spec["caption"]}</em>\n'
            f'</p>'
        )
        md = md.replace(placeholder, img_md)
        
    metrics_log = {
        "node": "Generate Images",
        "provider": image_model,
        "model_name": image_model,
        "images_generated": image_count,
        "cost_usd": None
    }
    
    return {"final_blog": md, "metrics": [metrics_log]}


# ====================================================================
# Editor Node: Generate Seo metadata and insert youtube video
# ====================================================================

def editor_node(state: BlogState):
    """
    Synthesizes SEO meta descriptions, slugs, and focus keywords.
    Also queries and embeds a relevant YouTube tutorial at the footer of the markdown.
    """
    llm = get_llm(state, expensive=False, agent_role="seo_optimizer")
    model_name = state.get("model_name", llm_models.DEFAULT_TEXT_PROVIDER)
    
    editor = structured_output(llm, state, SEOMetadata, include_raw=True)
    
    plan = state.get("plan")
    plan_dict = plan.model_dump() if hasattr(plan, 'model_dump') else dict(plan) if plan else {}
    
    response = editor.invoke(
        [
            SystemMessage(content=EDITOR_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"Blog Topic: {state.get('topic', '')}\n\n"
                f"Blog Plan / Outline:\n{plan_dict}"
            ))
        ]
    )
    
    parsed, raw_response = parse_structured_response(response)
    metrics_log = extract_usage(raw_response, "Editor Node", get_model_for_task(state, False))
    
    final_blog = state.get("final_blog", "")
    
    if not parsed:
        print("Warning: Editor structured output failed to parse.")
        return {
            "final_blog": final_blog,
            "seo_metadata": {"meta_description": "", "slug": "", "focus_keywords": []},
            "metrics": [metrics_log]
        }
        
    # Query YouTube and append tutorial to bottom of blog markdown
    youtube_iframe = fetch_youtube_video(state.get("topic", ""))
    if youtube_iframe:
        final_blog = f"{final_blog}\n\n{youtube_iframe}"
        
    return {
        "final_blog": final_blog,
        "seo_metadata": parsed.model_dump(),
        "metrics": [metrics_log]
    }


# ---------------------------------------------------------------------
