from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated, List, Literal, Optional
import operator
from langgraph.types import Send

from langchain_openai import ChatOpenAI
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

# Initialize LLM using our config API key
llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.OPENAI_API_KEY)


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
        "system_design"
    ] = "explainer"
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
    size: Literal["1024x1024", "1024x1536", "1536x1024"] = "1024x1024"
    quality: Literal["low", "medium", "high"] = "medium"
    placeholder: Optional[str] = None # Set programmatically


class GlobalImagePlan(BaseModel):
    images: List[ImageSpec] = Field(default_factory=list)


class BlogState(TypedDict):
    topic: str
    
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


# -------------------------------------------------------------------
# Router Node:
# -------------------------------------------------------------------
ROUTER_SYSTEM_PROMPT = """You are a routing module for a technical blog planner.

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
    decider_llm = llm.with_structured_output(RouterDecision)
    decision = decider_llm.invoke(
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

    # Set default recency window based on mode
    if decision.mode == "open_book":
        recency_days = 7
    elif decision.mode == "hybrid":
        recency_days = 45
    else:
        recency_days = 3650

    return {
        "need_research": decision.need_research,
        "mode": decision.mode,
        "queries": decision.queries,
        "recency_days": recency_days,
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

    raw_results: List[dict] = []
    for q in queries:
        raw_results.extend(_tavily_search(q, max_results=max_results))

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
PLANNER_SYSTEM_PROMPT = """You are a senior technical writer and developer advocate.
Your job is to produce a highly actionable outline for a technical blog post.

Hard requirements:
- Create 5–9 sections (tasks) suitable for the topic and audience.
- Each task must include:
  1) goal (1 sentence)
  2) 3–6 bullets that are concrete, specific, and non-overlapping
  3) target word count (120-550)

Flexibility:
- Do NOT use a fixed taxonomy unless it naturally fits.
- You may tag tasks (tags field), but tags are flexible.

Quality bar:
- Assume the reader is a developer; use correct terminology.
- Bullets must be actionable: build/compare/measure/verify/debug.
- Ensure the overall plan includes at least 2 of these somewhere:
  * minimal code sketch / MWE (set requires_code=True for that section)
  * edge cases / failure modes
  * performance/cost considerations
  * security/privacy considerations (if relevant)
  * debugging/observability tips

Grounding rules:
- Mode closed_book: keep it evergreen; do not depend on evidence.
- Mode hybrid:
  - Use evidence for up-to-date examples (models/tools/releases) in bullets.
  - Mark sections using fresh info as requires_research=True and requires_citations=True.
- Mode open_book (weekly news roundup):
  - Set blog_kind = "news_roundup".
  - Every section is about summarizing events + implications.
  - DO NOT include tutorial/how-to sections (no scraping/RSS/how to fetch news) unless user explicitly asked for that.
  - If evidence is empty or insufficient, create a plan that transparently says "insufficient fresh sources"
    and includes only what can be supported.

Output must strictly match the Plan schema.
"""

def orchestrator_node(state: BlogState):
    planner = llm.with_structured_output(Plan)
    evidence = state.get("evidence", [])
    mode = state.get("mode", "closed_book")

    forced_kind = "news_roundup" if mode == "open_book" else None

    plan = planner.invoke(
        [
            SystemMessage(content=PLANNER_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Topic: {state['topic']}\n"
                    f"Mode: {mode}\n"
                    f"As-of: {state['as_of']} (recency_days={state['recency_days']})\n"
                    f"{'Force blog_kind=news_roundup' if forced_kind else ''}\n\n"
                    f"Evidence (ONLY use for fresh claims; may be empty):\n"
                    f"{[e.model_dump() for e in evidence][:16]}\n\n"
                    f"Instruction: If mode=open_book, your plan must NOT drift into a tutorial."
                )
            ),
        ]
    )

    if forced_kind:
        plan.blog_kind = "news_roundup"

    return {"plan": plan}


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
WORKER_SYSTEM_PROMPT = """You are a senior technical writer and developer advocate.
Write ONE section of a technical blog post in Markdown.

Hard constraints:
- Follow the provided Goal and cover ALL Bullets in order (do not skip or merge bullets).
- Stay close to Target words (±15%).
- Output ONLY the section content in Markdown (no blog title H1, no extra commentary).
- Start with a '## <Section Title>' heading.

Scope guard (prevents mid-blog topic drift):
- If blog_kind == "news_roundup": do NOT turn this into a tutorial/how-to guide.
  Do NOT teach web scraping, RSS, automation, or "how to fetch news" unless bullets explicitly ask for it.
  Focus on summarizing events and implications.

Grounding policy:
- If mode == open_book (weekly news):
  - Do NOT introduce any specific event/company/model/funding/policy claim unless it is supported by provided Evidence URLs.
  - For each event claim, attach a source as a Markdown link: ([Source](URL)).
  - Only use URLs provided in Evidence. If not supported, write: "Not found in provided sources."
- If requires_citations == true (hybrid sections):
  - For outside-world claims, cite Evidence URLs the same way.
- Evergreen reasoning (concepts, intuition) is OK without citations unless requires_citations is true.

Code:
- If requires_code == true, include at least one minimal, correct code snippet relevant to the bullets.

Style:
- Short paragraphs, bullets where helpful, code fences for code.
- Avoid fluff/marketing. Be precise and implementation-oriented.
"""

def worker_node(payload: dict) -> dict:
    task = Task(**payload["task"])
    plan = Plan(**payload["plan"])
    evidence = [EvidenceItem(**e) for e in payload.get("evidence", [])]
    topic = payload["topic"]
    mode = payload.get("mode", "closed_book")
    as_of = payload.get("as_of")
    recency_days = payload.get("recency_days")

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
    ).content.strip()

    return {"sections": [(task.id, section_md)]}


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
    for i, spec in enumerate(image_specs):
        # We assign the placeholder programmatically
        spec["placeholder"] = f"[[IMAGE_{i}]]"
        task_placeholders[spec.get("task_id", 0)].append(f"[[IMAGE_{i}]]")

    ordered_sections = []
    for task_id, markdown in sorted_sections:
        if task_id in task_placeholders:
            images_ph = "\n\n".join(task_placeholders[task_id])
            markdown = f"{markdown}\n\n{images_ph}"
        ordered_sections.append(markdown)
    
    body = "\n\n".join(ordered_sections).strip()
    merged_md = f"# {plan.blog_title}\n\n{body}\n"
    
    # Return updated image_specs with placeholders and the merged_md
    return {"merged_md": merged_md, "image_specs": image_specs}


DECIDE_IMAGES_SYSTEM_PROMPT = """
You are an expert Technical Editor. decide if images/diagrams are needed for THIS blog.

Rules:
- You MUST generate at least 1 image for visual flair, up to a maximum of 3 images total.
- Each image should be highly relevant (e.g., conceptual diagram, architecture, or tech visualization).
- Assign each image to a specific task_id from the plan.
- Do not return empty images list.
Return STRICTLY GlobalImagePlan.
"""

def decide_images(state: BlogState) -> dict:
    plan = state["plan"]
    assert plan is not None

    image_insertion_planner = llm.with_structured_output(GlobalImagePlan)
    image_plan = image_insertion_planner.invoke(
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

    return {
        "image_specs": [img.model_dump() for img in image_plan.images]
    }


import requests

def openai_generate_image_bytes(prompt: str) -> bytes:
    """
    Generates an image using OpenAI DALL-E-3 API and downloads the raw bytes.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    client = OpenAI(api_key=api_key)

    resp = client.images.generate(
        model="dall-e-2",
        prompt=prompt,
        n=1,
        size="1024x1024"
    )

    if not resp.data or not resp.data[0].url:
        raise RuntimeError("No image content returned from OpenAI.")

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

    for spec in image_specs:
        placeholder = spec["placeholder"]
        try:
            # 1. Generate image bytes
            img_bytes = openai_generate_image_bytes(spec["prompt"])
            # 2. Upload to Cloudinary to get hosted secure URL
            img_url = upload_image_bytes(img_bytes)
        except Exception as e:
            print(f"IMAGE GENERATION / UPLOAD ERROR: {e}")
            prompt_block = (
                f"\n> **[IMAGE GENERATION FAILED]** {spec.get('caption','')}\n>\n"
                f"> **Alt:** {spec.get('alt','')}\n>\n"
                f"> **Prompt:** {spec.get('prompt','')}\n>\n"
                f"> **Error:** {e}\n"
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
    
    return {"final_blog": md}


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


# ---------------------------------------------------------------------
# Compile Main Agent Graph
# ---------------------------------------------------------------------
builder = StateGraph(BlogState)

builder.add_node("router", router_node)
builder.add_node("research", research_node)
builder.add_node("orchestrator", orchestrator_node)
builder.add_node("worker", worker_node)
builder.add_node("reducer", reducer_subgraph)

builder.add_edge(START, "router")
builder.add_conditional_edges("router", route_next, {"research": "research", "orchestrator": "orchestrator"})
builder.add_edge("research", "orchestrator")
builder.add_conditional_edges("orchestrator", fanout, ["worker"])
builder.add_edge("worker", "reducer")
builder.add_edge("reducer", END)

# Expose compiled graph to be imported by the FastAPI router
graph = builder.compile()
