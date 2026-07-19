from typing import TypedDict, Annotated, List, Literal, Optional
import operator
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
from app.services.cloudinary_service import upload_image_bytes
from app.services.agent.prompt import ROUTER_SYSTEM_PROMPT, RESEARCH_SYSTEM_PROMPT, PLANNER_SYSTEM_PROMPT, WORKER_SYSTEM_PROMPT, DECIDE_IMAGES_SYSTEM_PROMPT, EDITOR_SYSTEM_PROMPT
from app.services.agent.state import BlogState, Task, Plan, EvidenceItem, EvidencePack, RouterDecision, ImageSpec, GlobalImagePlan, SEOMetadata, EditorOutput, fetch_youtube_video

os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY

def get_llm(state: dict, expensive: bool = True):
    """
    Selects and returns the appropriate LLM chat instance based on requested
    model name in state and whether an expensive (large reasoning) or cheap
    (fast parsing) model is desired for the active graph node.
    """
    model_name = state.get("model_name", llm_models.FAMILY_GPT).lower()
    
    if "claude" in model_name:
        if expensive:
            real_model = llm_models.REAL_MODEL_MAP.get(llm_models.MODEL_CLAUDE_EXPENSIVE, "claude-3-5-sonnet-20240620")
            return ChatAnthropic(model=real_model, api_key=settings.ANTHROPIC_API_KEY)
        else:
            real_model = llm_models.REAL_MODEL_MAP.get(llm_models.MODEL_CLAUDE_CHEAP, "claude-3-haiku-20240307")
            return ChatAnthropic(model=real_model, api_key=settings.ANTHROPIC_API_KEY)
    elif "gemini" in model_name:
        if expensive:
            real_model = llm_models.REAL_MODEL_MAP.get(llm_models.MODEL_GEMINI_EXPENSIVE, "gemini-1.5-pro")
            return ChatGoogleGenerativeAI(model=real_model, api_key=settings.GOOGLE_API_KEY)
        else:
            real_model = llm_models.REAL_MODEL_MAP.get(llm_models.MODEL_GEMINI_CHEAP, "gemini-1.5-flash")
            return ChatGoogleGenerativeAI(model=real_model, api_key=settings.GOOGLE_API_KEY)
    else:
        if expensive:
            real_model = llm_models.REAL_MODEL_MAP.get(llm_models.MODEL_GPT_BALANCED, "gpt-4o")
            return ChatOpenAI(model=real_model, api_key=settings.OPENAI_API_KEY)
        else:
            real_model = llm_models.REAL_MODEL_MAP.get(llm_models.MODEL_GPT_CHEAP, "gpt-4o-mini")
            return ChatOpenAI(model=real_model, api_key=settings.OPENAI_API_KEY)

def extract_usage(raw, node_name: str, model_name: str):
    """
    Extracts token usage metadata from raw chat response objects
    for tracking dashboard API metrics and latency.
    """
    usage = getattr(raw, "usage_metadata", None)
    if not usage and hasattr(raw, "response_metadata"):
        token_usage = raw.response_metadata.get("token_usage", {})
        usage = {
            "input_tokens": token_usage.get("prompt_tokens", 0),
            "output_tokens": token_usage.get("completion_tokens", 0),
            "total_tokens": token_usage.get("total_tokens", 0)
        }
    if not usage:
        usage = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
        
    return {
        "node": node_name,
        "model_name": model_name,
        "input_tokens": usage.get("input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0)
    }



def router_node(state: BlogState):
    """
    Node that runs the router agent.
    Determines if web research is required, the generation mode, and relevant queries.
    """
    topic = state["topic"]
    as_of = state.get("as_of", date.today().isoformat())
    model_name = state.get("model_name", llm_models.FAMILY_GPT)
    llm = get_llm(state, expensive=False)
    decider_llm = llm.with_structured_output(RouterDecision, include_raw=True)
    
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
    
    decision = response["parsed"]
    metrics_log = extract_usage(response["raw"], "Router Node", model_name)

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
# Research Node:
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



def research_node(state: BlogState) -> dict:
    """
    Executes concurrent search queries via ThreadPoolExecutor.
    Also extracts page contents from user-provided reference URLs if present.
    Deduplicates results through a structured LLM call.
    """
    queries = (state.get("queries", []) or [])
    max_results = 6
    llm = get_llm(state, expensive=False)

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
    extractor = llm.with_structured_output(EvidencePack)
    pack = extractor.invoke(
        [
            SystemMessage(content=RESEARCH_SYSTEM_PROMPT),
            HumanMessage(content=f"Raw results:\n{raw_results}"),
        ]
    )

    # Deduplicate matching results by URL
    dedup = {}
    for e in pack.evidence:
        if e.url:
            dedup[e.url] = e

    return {"evidence": list(dedup.values())}


# ---------------------------------------------------------------------
# Orchestrator Node
# ---------------------------------------------------------------------

def orchestrator_node(state: BlogState):
    """
    Generates a structured outline (plan) for the blog based on depth configuration.
    Incorporates web search evidence to ground claims if in hybrid/open_book modes.
    """
    llm = get_llm(state)
    model_name = state.get("model_name", llm_models.FAMILY_GPT)
    planner = llm.with_structured_output(Plan, include_raw=True)
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
                    f"{[e.model_dump() for e in evidence][:16]}\n\n"
                    f"Instruction: Ensure the section count matches the requested Target Depth."
                )
            ),
        ]
    )
    
    plan = response["parsed"]
    metrics_log = extract_usage(response["raw"], "Orchestrator Node", model_name)

    if forced_kind:
        plan.blog_kind = "news_roundup"

    return {"plan": plan, "metrics": [metrics_log]}


# ---------------------------------------------------------------------
# Fanout Node: Splits the blog plan tasks to be executed concurrently
# ---------------------------------------------------------------------
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


# ---------------------------------------------------------------------
# Worker Node: Generates the content of a single section
# ---------------------------------------------------------------------

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
    llm = get_llm(payload)

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
    
    model_name = payload.get("model_name", llm_models.FAMILY_GPT)
    metrics_log = extract_usage(section_md, f"Worker ({task.title})", model_name)

    content = section_md.content
    if isinstance(content, list):
        content = "".join([c.get("text", "") for c in content if isinstance(c, dict) and "text" in c])
    elif not isinstance(content, str):
        content = str(content)

    return {"sections": [(task.id, content.strip())], "metrics": [metrics_log]}


# ---------------------------------------------------------------------
# Reducer Subgraph Nodes: Merging & Images
# ---------------------------------------------------------------------
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


def decide_images(state: BlogState) -> dict:
    """
    Plans details for a thumbnail image to represent the blog visual.
    Outputs a prompt instructions payload.
    """
    plan = state["plan"]
    assert plan is not None
    llm = get_llm(state, expensive=False)
    model_name = state.get("model_name", llm_models.FAMILY_GPT)

    plan_name = state.get("plan_name", "Free")
    image_prompt_instruction = "Propose ONLY 1 image prompt for the thumbnail."
    if plan_name == "Pro":
        image_prompt_instruction = "Propose 2 to 3 image prompts total (1 thumbnail + 1 or 2 inline images) and assign them to the most relevant task_id."

    image_insertion_planner = llm.with_structured_output(GlobalImagePlan, include_raw=True)
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
    
    image_plan = response["parsed"]
    metrics_log = extract_usage(response["raw"], "Image Planner Node", model_name)

    return {
        "image_specs": [img.model_dump() for img in image_plan.images],
        "metrics": [metrics_log]
    }


def openai_generate_image_bytes(prompt: str, size: str = "1536x1024", quality: str = "standard") -> bytes:
    """
    Generates an image using OpenAI DALL-E-3 API and downloads the raw bytes.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    client = OpenAI(api_key=api_key)

    resp = client.images.generate(
        model=llm_models.MODEL_GPT_IMAGE,
        prompt=prompt,
        n=1,
        size=size,
        quality=quality
    )

    if not resp.data:
        raise RuntimeError("No image content returned from OpenAI.")

    if resp.data[0].b64_json:
        import base64
        return base64.b64decode(resp.data[0].b64_json)

    if not resp.data[0].url:
        raise RuntimeError("Neither b64_json nor url was returned.")

    image_url = resp.data[0].url
    
    # Download the image bytes
    r = requests.get(image_url)
    r.raise_for_status()
    
    return r.content


def generate_and_place_images(state: BlogState):
    """
    Triggers Dall-E-3 image generation based on prompts, uploads the output to
    Cloudinary, and replaces placeholder tokens in the blog markdown body with 
    the secure HTTPS image URLs.
    """
    md = state.get("merged_md")
    image_specs = state.get("image_specs", [])

    if not image_specs:
        return {"final_blog": md}

    image_count = 0
    for spec in image_specs:
        placeholder = spec["placeholder"]
        try:
            img_bytes = openai_generate_image_bytes(
                prompt=spec["prompt"], 
                size=spec.get("size", "1536x1024"),
                quality=spec.get("quality", "medium")
            )
            image_count += 1
        except Exception as e:
            error_msg = f"OPENAI DALL-E ERROR: {e}"
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
        "model_name": llm_models.MODEL_GPT_IMAGE,
        "images_generated": image_count
    }
    
    return {"final_blog": md, "metrics": [metrics_log]}


def editor_node(state: BlogState):
    """
    Synthesizes SEO meta descriptions, slugs, and focus keywords.
    Also queries and embeds a relevant YouTube tutorial at the footer of the markdown.
    """
    llm = get_llm(state, expensive=False)
    model_name = state.get("model_name", llm_models.FAMILY_GPT)
    
    editor = llm.with_structured_output(EditorOutput, include_raw=True)
    
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
    
    parsed = response["parsed"]
    metrics_log = extract_usage(response["raw"], "Editor Node", model_name)
    
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
        "seo_metadata": parsed.seo_metadata.model_dump(),
        "metrics": [metrics_log]
    }


# ---------------------------------------------------------------------
