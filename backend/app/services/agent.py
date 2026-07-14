from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated, List, Literal, Optional
import operator
from langgraph.types import Send

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from langchain_tavily import TavilySearch
from datetime import date
from openai import OpenAI
import base64

from app.core.config import settings
from app.services.cloudinary_service import upload_image_bytes
import os

os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY

def get_llm(state: dict):
    model_name = state.get("model_name", "GPT-4o").lower()
    
    if "claude" in model_name:
        return ChatAnthropic(model="claude-sonnet-5", api_key=settings.ANTHROPIC_API_KEY)
    elif "gemini" in model_name:
        return ChatGoogleGenerativeAI(model="gemini-1.5-pro", api_key=settings.GOOGLE_API_KEY)
    else:
        return ChatOpenAI(model="gpt-4o-mini", api_key=settings.OPENAI_API_KEY)

def extract_usage(raw, node_name: str, model_name: str):
    usage = getattr(raw, "usage_metadata", None)
    if not usage and hasattr(raw, "response_metadata"):
        # fallback for some older LLM returns
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

# ------------------------------------------------------------
# Pydantic Schemas for LangGraph State and structured output
# ------------------------------------------------------------

class Task(BaseModel):
    id: int
    title: str
    goal: str = Field(
        ...,
        description="One sentence describing what the reader should be able to do /understand after this section."
    )
    bullets: List[str] = Field(
        ...,
        min_length=3,
        max_length=5,
        description="3-5 concrete non-overlapping subpoints to cover in this section"
    )
    target_words: int = Field(
        ...,
        description="target word count for this section is (120-450)"
    )
    tags: List[str] = Field(default_factory=list)
    requires_research: bool = False
    requires_citations: bool = False
    requires_code: bool = False


class Plan(BaseModel):
    blog_title: str
    audience: str = Field(
        ...,
        description="who this blog is for."
    )
    tone: str = Field(
        ...,
        description="Writing tone of this blog (e.g., practical, crisp)."
    )
    blog_kind: Literal[
        "explainer",
        "tutorial",
        "news_roundup",
        "comparison",
        "system_design",
        "listicle",
        "lifestyle",
        "opinion",
        "review",
        "general"
    ] = "general"
    constraints: List[str] = Field(default_factory=list)
    tasks: List[Task]


class EvidenceItem(BaseModel):
    title: str
    url: str
    published_at: Optional[str] = None
    snippet: Optional[str] = None
    source: Optional[str] = None


class EvidencePack(BaseModel):
    evidence: List[EvidenceItem] = Field(default_factory=list)


class RouterDecision(BaseModel):
    need_research: bool
    mode: Literal["closed_book", "hybrid", "open_book"]
    queries: List[str] = Field(default_factory=list)


class ImageSpec(BaseModel):
    task_id: int = Field(..., description="The ID of the task/section where this image should be inserted.")
    filename: str = Field(..., description="Save under /images, e.g. abc_flow.png")
    alt: str
    caption: str
    prompt: str = Field(..., description="Prompt to send to image model")
    size: Literal["1536x1024"] = "1536x1024"
    quality: Literal["low", "medium"] = "medium"
    placeholder: Optional[str] = None # Set programmatically


class GlobalImagePlan(BaseModel):
    images: List[ImageSpec] = Field(default_factory=list)


class BlogState(TypedDict):
    topic: str
    model_name: str
    depth: str
    cta: Optional[str]
    reference_urls: Optional[str]
    
    # routing and research
    mode: str
    need_research: bool
    queries: List[str]
    # Planner
    evidence: List[EvidenceItem]
    plan: Optional[Plan]

    # recency control
    as_of: str           # ISO date, e.g. "2026-01-29"
    recency_days: int    # 7 for weekly news, 30 for hybrid, etc.

    # workers
    sections: Annotated[List[tuple[int, str]], operator.add]

    # images
    merged_md: str
    md_with_placeholders: str
    image_specs: List[dict]

    # Final generated blog
    final_blog: str
    seo_metadata: dict
    
    # Metrics
    metrics: Annotated[List[dict], operator.add]


# -------------------------------------------------------------------
# Router Node:
# -------------------------------------------------------------------
ROUTER_SYSTEM_PROMPT = """You are a highly intelligent routing module for a versatile blog planner.

Decide whether web research is needed BEFORE planning.

Modes:
- closed_book (needs_research=false):
  Evergreen topics where correctness does not depend on recent facts (concepts, fundamentals).
- hybrid (needs_research=true):
  Mostly evergreen but needs up-to-date examples/tools/models to be useful.
- open_book (needs_research=true):
  Mostly volatile: weekly roundups, "this week", "latest", rankings, pricing, policy/regulation.

If needs_research=true:
- Output 3–10 high-signal queries.
- Queries should be scoped and specific (avoid generic queries like just "AI" or "LLM").
- Ensure all queries target the most up-to-date and relevant information up to the provided Current Date/As-Of (do not generate queries with outdated years like 2023 unless explicitly requested, use the current year/timeframe).
- If user asked for "last week/this week/latest", reflect that constraint IN THE QUERIES.
"""

def router_node(state: BlogState):
    topic = state["topic"]
    as_of = state.get("as_of", date.today().isoformat())
    model_name = state.get("model_name", "GPT-4o")
    llm = get_llm(state)
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

    # Set default recency window based on mode
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
    need_research = state["need_research"]
    if need_research:
        return "research"
    else:
        return "orchestrator"


# --------------------------------------------------------------------
# Research Node:
# --------------------------------------------------------------------
def _tavily_search(query: str, max_results: int = 5) -> List[dict]:
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


RESEARCH_SYSTEM_PROMPT = """ 
You are a research synthesizer for technical writing.

Given raw web search results, produce a deduplicated list of EvidenceItem objects.

Rules:
- Only include items with a non-empty url.
- Prefer relevant + authoritative sources (company blogs, docs, reputable outlets).
- If a published date is explicitly present in the result payload, keep it as YYYY-MM-DD.
If missing or unclear, set published_at=null. Do NOT guess.
- Keep snippets short.
- Deduplicate by URL.
"""

def research_node(state: BlogState) -> dict:
    queries = (state.get("queries", []) or [])
    max_results = 6
    llm = get_llm(state)

    raw_results: List[dict] = []
    
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_query = {executor.submit(_tavily_search, q, max_results): q for q in queries}
        for future in concurrent.futures.as_completed(future_to_query):
            try:
                results = future.result()
                raw_results.extend(results)
            except Exception as e:
                print(f"Tavily search generated an exception: {e}")
                
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

    extractor = llm.with_structured_output(EvidencePack)
    pack = extractor.invoke(
        [
            SystemMessage(content=RESEARCH_SYSTEM_PROMPT),
            HumanMessage(content=f"Raw results:\n{raw_results}"),
        ]
    )

    # Deduplicate by URL
    dedup = {}
    for e in pack.evidence:
        if e.url:
            dedup[e.url] = e

    return {"evidence": list(dedup.values())}


# ---------------------------------------------------------------------
# Orchestrator Node
# ---------------------------------------------------------------------
PLANNER_SYSTEM_PROMPT = """You are an expert orchestrator and blog planner.
Your job is to produce a highly actionable outline for a blog post based on the requested Depth / Complexity.

Depth / Complexity Guidelines:
- "Brief Overview": Create exactly 3-4 sections (tasks). Keep goals very concise.
- "Standard Guide": Create exactly 5-6 sections (tasks).
- "Ultimate Deep-Dive": Create exactly 7-10 sections (tasks).

Hard requirements:
- Each task must include:
  1) goal (1 sentence)
  2) 3–6 bullets that are concrete, specific, and non-overlapping
  3) target word count (calculate appropriately to reach the target length)

Tone & Universal Readability:
- No matter the audience, the blog should be universally engaging.
- Plan to explain the core intuition using analogies so a junior can follow, while planning deep-dive code blocks for seniors.

Grounding rules:
- Mode closed_book: keep it evergreen; do not depend on evidence.
- Mode hybrid:
  - Use evidence for up-to-date examples in bullets.
  - Mark sections using fresh info as requires_research=True and requires_citations=True.
- Mode open_book (weekly news roundup):
  - Set blog_kind = "news_roundup".
  - Every section is about summarizing events + implications.
  - If evidence is empty, create a plan that says "insufficient fresh sources".

Output must strictly match the Plan schema.
"""

def orchestrator_node(state: BlogState):
    llm = get_llm(state)
    model_name = state.get("model_name", "GPT-4o")
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
            "evidence": [evidence_item.model_dump() for evidence_item in state.get("evidence", [])]
        }
        send = Send("worker", worker_state)
        sends.append(send)

    return sends


# ---------------------------------------------------------------------
# Worker Node: Generates the content of a single section
# ---------------------------------------------------------------------
WORKER_SYSTEM_PROMPT = """You are an expert developer and writer crafting an engaging, story-driven blog for a platform like Hashnode.
Write ONE section of a blog post in Markdown.

Hard constraints:
- Follow the provided Goal and cover ALL Bullets in order (do not skip or merge bullets).
- Stay close to Target words (±15%).
- Output ONLY the section content in Markdown (no blog title H1, no extra commentary).
- Start with a '## <Section Title>' heading.

Hashnode Style & Universal Readability constraints:
- Write like a human speaking to a colleague over coffee. Start with an engaging narrative or hook if appropriate.
- ALWAYS explain the intuition behind complex topics using simple analogies so a junior can follow along.
- NEVER write a 'wall of text'. Paragraphs must NOT exceed 3 sentences.
- Break up your writing using '###' subheadings for each logical part of the section.
- Use frequent line breaks, bold emphasis, blockquotes, and bullet points.
- Use GitHub-style callouts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`) to highlight key takeaways, tips, or warnings.

Grounding policy:
- Do NOT introduce any specific event/company/model claim unless supported by Evidence URLs.
- Cite Evidence URLs as Markdown links: ([Source](URL)).
- Evergreen reasoning (concepts, intuition) is OK without citations.

Code & Diagrams:
- If requires_code == true, include at least one minimal, correct code snippet.
- For complex technical flows or architectures, generate ` ```mermaid ` blocks instead of asking for images.
"""

def worker_node(payload: dict) -> dict:
    task = Task(**payload["task"])
    plan = Plan(**payload["plan"])
    evidence = [EvidenceItem(**e) for e in payload.get("evidence", [])]
    topic = payload["topic"]
    mode = payload.get("mode", "closed_book")
    as_of = payload.get("as_of")
    recency_days = payload.get("recency_days")
    llm = get_llm(payload)

    bullets_text = "\n- " + "\n- ".join(task.bullets)

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
    
    model_name = payload.get("model_name", "GPT-4o")
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
    plan = state["plan"]
    sorted_sections = sorted(state["sections"], key=lambda x: x[0])
    image_specs = state.get("image_specs", [])

    # Map task_id to placeholders
    from collections import defaultdict
    task_placeholders = defaultdict(list)
    thumbnail_ph = ""
    
    for i, spec in enumerate(image_specs):
        # We assign the placeholder programmatically
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
    
    # Return updated image_specs with placeholders and the merged_md
    return {"merged_md": merged_md, "image_specs": image_specs}


DECIDE_IMAGES_SYSTEM_PROMPT = """
You are an expert Technical Editor. You must plan the images for this blog post.

Rules:
1. You MUST always generate exactly 1 "Featured Thumbnail" image that captures the overarching theme of the blog. This image MUST use the '1536x1024' (landscape) size and should be assigned to the first task_id (the introduction).
2. DO NOT generate any additional images for the body. Internal diagrams will be handled via Mermaid.js.
3. Therefore, you must return EXACTLY 1 image in total.
4. Keep the image quality to be 'medium'.
5. Assign the image to the first task_id from the plan.

Return STRICTLY GlobalImagePlan.
"""

def decide_images(state: BlogState) -> dict:
    plan = state["plan"]
    assert plan is not None
    llm = get_llm(state)
    model_name = state.get("model_name", "GPT-4o")

    image_insertion_planner = llm.with_structured_output(GlobalImagePlan, include_raw=True)
    response = image_insertion_planner.invoke(
        [
            SystemMessage(content=DECIDE_IMAGES_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Blog kind: {plan.blog_kind}\n"
                    f"Topic: {state['topic']}\n\n"
                    f"Plan Tasks: {[({'id': t.id, 'title': t.title}) for t in plan.tasks]}\n\n"
                    f"Propose image prompts and assign them to the most relevant task_id."
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


import requests

def openai_generate_image_bytes(prompt: str, size: str = "1536x1024", quality: str = "standard") -> bytes:
    """
    Generates an image using OpenAI DALL-E-3 API and downloads the raw bytes.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    client = OpenAI(api_key=api_key)

    resp = client.images.generate(
        model="gpt-image-1",
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
    Generates images via OpenAI and uploads them to Cloudinary.
    Replaces placeholders in the markdown content with hosted image URLs.
    No local filesystem writes are made.
    """
    md = state.get("merged_md")
    image_specs = state.get("image_specs", [])

    if not image_specs:
        return {"final_blog": md}

    image_count = 0
    for spec in image_specs:
        placeholder = spec["placeholder"]
        try:
            # 1. Generate image bytes
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
            # 2. Upload to Cloudinary to get hosted secure URL
            img_url = upload_image_bytes(img_bytes)
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

        # Format image to be responsive and center-aligned using HTML with hosted Cloudinary URL
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
        "model_name": "gpt-image-1",
        "images_generated": image_count
    }
    
    return {"final_blog": md, "metrics": [metrics_log]}


# Compile Reducer Subgraph
reducer_graph = StateGraph(BlogState)
reducer_graph.add_node("decide_images", decide_images)
reducer_graph.add_node("merge_content", merge_content)
reducer_graph.add_node("generate_and_place_images", generate_and_place_images)

reducer_graph.add_edge(START, "decide_images")
reducer_graph.add_edge("decide_images", "merge_content")
reducer_graph.add_edge("merge_content", "generate_and_place_images")
reducer_graph.add_edge("generate_and_place_images", END)

reducer_subgraph = reducer_graph.compile()


class SEOMetadata(BaseModel):
    meta_description: str
    slug: str
    focus_keywords: List[str]

class EditorOutput(BaseModel):
    seo_metadata: SEOMetadata
    youtube_embed_html: Optional[str] = Field(default=None, description="If highly relevant, an HTML iframe tag for a YouTube video. Provide ONLY the iframe tag.")
    cta_paragraph: Optional[str] = Field(default=None, description="A seamlessly woven conclusion paragraph that includes the requested Call to Action (CTA).")

EDITOR_SYSTEM_PROMPT = """You are an expert technical SEO specialist and Editor.
You will receive the final draft of a blog post, along with a user-provided Call to Action (CTA).
Your job is to:
1. Generate structured SEO metadata based on the content (meta_description, slug, focus_keywords).
2. If a Call to Action (CTA) is provided, write a compelling final conclusion paragraph (`cta_paragraph`) that seamlessly weaves the CTA into the ending of the blog post.

Return ONLY the metadata and the optional cta paragraph. Do NOT rewrite the entire blog post!
"""

def fetch_youtube_video(topic: str) -> str:
    try:
        from googleapiclient.discovery import build
    except ImportError:
        return ""
        
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("YOUTUBE_API_KEY not found in .env, skipping YouTube integration.")
        return ""
    
    youtube = build("youtube", "v3", developerKey=api_key)
    query = f"{topic} tutorial explanation"
    
    try:
        request = youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=1,
            order="relevance",
            videoEmbeddable="true"
        )
        response = request.execute()
        
        if "items" in response and len(response["items"]) > 0:
            video_id = response["items"][0]["id"]["videoId"]
            title = response["items"][0]["snippet"]["title"]
            
            iframe = (
                f'\n\n## Related Video Tutorial\n\n'
                f'<p align="center">\n'
                f'  <iframe width="750" height="422" src="https://www.youtube.com/embed/{video_id}" '
                f'frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '
                f'allowfullscreen style="max-width: 100%; border-radius: 8px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);"></iframe>\n'
                f'  <br />\n'
                f'  <em>{title}</em>\n'
                f'</p>\n'
            )
            return iframe
        return ""
    except Exception as e:
        print(f"YouTube search error: {e}")
        return ""

def editor_node(state: BlogState):
    llm = get_llm(state)
    model_name = state.get("model_name", "GPT-4o")
    
    cta = state.get("cta", "")
        
    editor = llm.with_structured_output(EditorOutput, include_raw=True)
    
    response = editor.invoke(
        [
            SystemMessage(content=EDITOR_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"CTA to weave into conclusion: {cta}\n\n"
                f"Blog Content:\n{state.get('final_blog', '')}"
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
    
    # If the AI generated a CTA paragraph, append it
    if parsed.cta_paragraph:
        final_blog = f"{final_blog}\n\n## Conclusion\n\n{parsed.cta_paragraph}"
        
    # Directly fetch and prepend the official YouTube iframe
    youtube_iframe = fetch_youtube_video(state.get("topic", ""))
    if youtube_iframe:
        final_blog = f"{youtube_iframe}\n\n{final_blog}"
        
    return {
        "final_blog": final_blog,
        "seo_metadata": parsed.seo_metadata.model_dump(),
        "metrics": [metrics_log]
    }


# ---------------------------------------------------------------------
# Compile Main Agent Graph
# ---------------------------------------------------------------------
builder = StateGraph(BlogState)

builder.add_node("router", router_node)
builder.add_node("research", research_node)
builder.add_node("orchestrator", orchestrator_node)
builder.add_node("worker", worker_node)
builder.add_node("reducer", reducer_subgraph)
builder.add_node("editor", editor_node)

builder.add_edge(START, "router")
builder.add_conditional_edges("router", route_next, {"research": "research", "orchestrator": "orchestrator"})
builder.add_edge("research", "orchestrator")
builder.add_conditional_edges("orchestrator", fanout, ["worker"])
builder.add_edge("worker", "reducer")
builder.add_edge("reducer", "editor")
builder.add_edge("editor", END)

# Expose compiled graph to be imported by the FastAPI router
graph = builder.compile()
