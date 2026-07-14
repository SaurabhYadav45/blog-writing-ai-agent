from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated, List, Literal, Optional
# from langgraph.graph.message import add_messages #Only for langchain messages(HUmanMessage, AIMesage)
import operator
#  from langgraph.constants import Send          #DEPRECATED
from langgraph.types import Send

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from pathlib import Path

from langchain_tavily import TavilySearch
from datetime import date, datetime, timedelta

# To generate blog image
# from google import genai
# from google.genai import types
from openai import OpenAI
import base64

import os
from dotenv import load_dotenv
load_dotenv()



# ------------------------------------------------------------
# Initialize LLM
# ------------------------------------------------------------
llm = ChatOpenAI(model="gpt-4o-mini")


# ------------------------------------------------------------
# Pydantic Schemas
# ------------------------------------------------------------

# Define the Task schema
class Task(BaseModel):
    id:int
    title:str
    goal:str = Field(
        ...,
        description="One sentence describing what the reader should be able to do /understand after this section."
    )
    bullets:List[str] = Field(
        ...,
        min_length=3,
        max_length=5,
        description="3-5 concrete non-overlapping subpoints to cover in this section"
    )
    target_words:int = Field(
        ...,
        description="target word count for this section is (120-450)"
    )
    # New
    tags:List[str] = Field(default_factory=list)
    requires_research:bool = False
    requires_citations:bool = False
    requires_code:bool = False

    # section_type:Literal["intro", "core", "examples", "checklist", "common_mistakes", "conclusion"] = Field(
    #     ...,
    #     description="Use 'common_mistakes' exactly once in the plan."
    # )


# Define the Plan Schema
class Plan(BaseModel):
    blog_title:str
    audience:str = Field(
        ...,
        description="who this blog is for."
    )
    tone:str = Field(
        ...,
        description="Writing tone of this blog (e.g., practical, crisp)."
    )

    blog_kind:Literal[
        "explainer",
        "tutorial",
        "news_roundup",
        "comparison",
        "system_design"
    ] = "explainer"
    constraints:List[str] = Field(default_factory=list)
    tasks:List[Task]

# default_factory is a function that creates the default value whenever a new object is instantiated.


# Plan Schema
class EvidenceItem(BaseModel):
    title:str
    url:str
    published_at:Optional[str] = None
    snippet:Optional[str] = None
    source:Optional[str] = None


# Schema for Evidence Pack used in research node
class EvidencePack(BaseModel):
    evidence:List[EvidenceItem] = Field(default_factory=list)


# Schema for Router decision 
class RouterDecision(BaseModel):
    need_research:bool
    mode:Literal["closed_book", "hybrid", "open_book"]
    queries:List[str] = Field(default_factory=list)  #Have some doubt on Default factory


# Schemas for Blog images

class ImageSpec(BaseModel):
    placeholder:str = Field(..., description="e.g. [[IMAGE_1]]")
    filename:str = Field(..., description="Svae under /images, e.g. abc_flow.png")
    alt:str
    caption:str
    prompt:str = Field(..., description="Prompt to send to image model")
    size:Literal["1024x1024", "1024x1536", "1536x1024"] = "1024x1024"
    quality:Literal["low", "medium", "high"] = "medium"

class GlobalImagePlan(BaseModel):
    md_with_placeholders: str
    images: List[ImageSpec] = Field(default_factory=list)

# Define State of Graph
class BlogState(TypedDict):
    topic:str
    
    # routing and research
    mode:str
    need_research:bool
    queries:List[str]
    # Planner
    evidence:List[EvidenceItem]
    plan:Optional[Plan]

    # recency control
    as_of: str           # ISO date, e.g. "2026-01-29"
    recency_days: int    # 7 for weekly news, 30 for hybrid, etc.

    # workers
    sections:Annotated[List[tuple[int, str]], operator.add]

    # images
    merged_md:str
    md_with_placeholders:str
    image_specs:List[dict]

    # Final generated blog
    final_blog:str


# -------------------------------------------------------------------
# Route node:
# -------------------------------------------------------------------

# System Prompt to decide whether Research is needed
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

# Router Node
def router_node(state:BlogState):
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


    return{
        "need_research": decision.need_research,
        "mode": decision.mode,
        "queries": decision.queries,
        "recency_days": recency_days,
    }


def route_next(state:BlogState):
    need_research = state["need_research"]
    if need_research:
        return "research"
    else:
        return "orchestrator"


# --------------------------------------------------------------------
# Research Node:
# --------------------------------------------------------------------

# Tavily internet Search engine
def _tavily_search(query:str, max_results:int = 5) -> List[dict]:
    """
    Uses TavilySearchResults if installed and TAVILY_API_KEY is set.
    Returns list of dict with common fields. Note: published date is often missing.
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


# System Prompt for Research analyst llm
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

# Research node
def research_node(state: BlogState) -> dict:

    # take the first 10 queries from state
    queries = (state.get("queries", []) or [])
    max_results = 6

    raw_results: List[dict] = []

    for q in queries:
        # Extends is used for merging list
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
            dedup[e.url] = e #here we replace the earlier item with latest item, we can also merge them so that we cannot lose the context. 

    return {"evidence": list(dedup.values())}


# ---------------------------------------------------------------------
# Orchestrator Node
# ---------------------------------------------------------------------

# Prompt for orchestrator llm to generate the plan for Blog

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

# Actual Orchestrator Node
def orchestrator_node(state:BlogState):
    planner = llm.with_structured_output(Plan)
    evidence = state.get("evidence", [])
    mode = state.get("mode", "closed_book")

    # Force blog_kind for open_book
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

    # Ensure open_book forces the kind even if model forgets
    if forced_kind:
        plan.blog_kind = "news_roundup"

    return {"plan": plan}


# ---------------------------------------------------------------------
# Fanout Node: It generates multiple Send command to a separate worker 
# ---------------------------------------------------------------------

def fanout(state: BlogState):
    # Get the plan from state
    plan = state["plan"]
    # Safety check
    if plan is None:
        raise ValueError("Plan is Missing")
    
    sends = []
    # Loop through every task in the plan
    for task in plan.tasks:
        worker_state = {
            "task":task.model_dump(),
            "topic":state["topic"],
            "mode":state["mode"],
            "as_of":state["as_of"],
            "recency_days":state["recency_days"],
            "plan":plan.model_dump(),
            "evidence":[evidence_item.model_dump() for evidence_item in state.get("evidence", [])]
        }

        # Create a Send object
        send = Send("worker", worker_state)
        # Add it to the list
        sends.append(send)

    return sends

# ---------------------------------------------------------------------
# Worker Node: 
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

    # Provide a compact evidence list for citation use
    evidence_text = ""
    if evidence:
        evidence_text = "\n".join(
            f"- {e.title} | {e.url} | {e.published_at or 'date:unknown'}".strip()
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

    # deterministic ordering
    return {"sections": [(task.id, section_md)]}

# def reducer_node(state:BlogState):

#     ## save to file
#     # remove the other useless character, It only allows letters and numbers (isalnum()), spaces (" "), underscores ("_"), and hyphens ("-").
#     

#     return {"final_blog": final_md}


# ============================================================
# ReducerWithImages (subgraph)
# merge_content -> decide_images -> generate_and_place_images
# ============================================================

def merge_content(state:BlogState):
    plan = state["plan"]
    sorted_sections = sorted(state["sections"], key=lambda x : x[0])

    ordered_sections = []
    for  task_id, markdown in sorted_sections:
        ordered_sections.append(markdown)
    
    body = "\n\n".join(ordered_sections).strip()
    merged_md = f"# {plan.blog_title}\n\n{body}\n"
    return {"merged_md": merged_md}


DECIDE_IMAGES_SYSTEM_PROMPT="""
You are an expert Technical Editor. decide if images/diagrams are needed for THIS blog.

Rules:
- Max 3 images total
- Each image must materially improve understanding (diagram/flow/table-like visual).
- Insert placeholders exactly: [[IMAGE_1]], [[IMAGE_2]], [[IMAGE_3]]
- If no images needed: md_with_placeholders must equal input and images=[].
- Avoid decorative images; Prefer technical diagrams with short labels.
Return STRICTLY GlobalImagePlan.
"""

def decide_images(state:BlogState) -> dict:
    plan = state["plan"]
    assert plan is not None
    merged_md = state["merged_md"]

    image_insertion_planner = llm.with_structured_output(GlobalImagePlan)
    image_plan = image_insertion_planner.invoke(
        [
            SystemMessage(content=DECIDE_IMAGES_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Blog kind: {plan.blog_kind}\n"
                    f"Topic: {state["topic"]}\n\n"
                    f"Insert placeholders + propose image prompts.\n\n"
                    f"{merged_md}"
                )
            )
        ]
    )

    return {
        "md_with_placeholders": image_plan.md_with_placeholders,
        "image_specs": [img.model_dump() for img in image_plan.images]
    }


def openai_generate_image_bytes(prompt:str)->bytes:
    """
    Returns raw image bytes generated by OpenAI.
    Requires: pip install openai
    Env var: OPENAI_API_KEY
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    client = OpenAI(api_key=api_key)

    resp = client.images.generate(
        model="gpt-image-2",
        prompt=prompt,
        n=1,
        size="1024x1024"
    )

    if not resp.data or not resp.data[0].b64_json:
        raise RuntimeError("No image content returned from OpenAI.")

    return base64.b64decode(resp.data[0].b64_json)



def generate_and_place_images(state:BlogState):
    plan = state["plan"]
    assert plan is not None
    print("\nBlog Title:: \n", plan.blog_title)
    print(repr(plan.blog_title))

    md = state.get("md_with_placeholders") or state.get("merged_md")
    image_specs = state.get("image_specs", [])

    # For debugging purpose ======================================
    print("=" * 80)
    print("IMAGE SPECS")
    print(image_specs)
    print("=" * 80)

    print("Markdown contains placeholders?")
    print(md[:500])   # first 500 chars

    # ====================================================================

    # Clean/sanitize filename to avoid illegal characters (especially colons on Windows)
    filename = "".join(c if c.isalnum() or c in (" ", "_", "-") else "" for c in plan.blog_title)
    filename = filename.strip().lower().replace(" ", "_")
    filename = filename[:60] + ".md"

    # Prepare blogs folder
    blogs_dir = Path("blogs")
    blogs_dir.mkdir(exist_ok=True)
    blog_filepath = blogs_dir / filename

    # If no images requested , just write merged markdown
    if not image_specs:
        blog_filepath.write_text(md, encoding="utf-8")
        return {"final_blog": md}
    
    images_dir = Path("images")
    images_dir.mkdir(exist_ok=True)

    for spec in image_specs:
        placeholder = spec["placeholder"]
        img_filename = spec["filename"]
        out_path = images_dir/img_filename
        # Generate only if needed
        if not out_path.exists():
            try:
                img_bytes = openai_generate_image_bytes(spec["prompt"])
                out_path.write_bytes(img_bytes)
            except Exception as e:
                print("=" * 80)
                print("IMAGE ERROR")
                print(repr(e))
                print("=" * 80)
                prompt_block = (
                    f"> **[IMAGE GENERATION FAILED]** {spec.get('caption','')}\n>\n"
                    f"> **Alt:** {spec.get('alt','')}\n>\n"
                    f"> **Prompt:** {spec.get('prompt','')}\n>\n"
                    f"> **Error:** {e}\n"
                )
                md = md.replace(placeholder, prompt_block)
                continue

        # Format image to be responsive and center-aligned using HTML with constrained size for standard blogs
        img_md = (
            f'<p align="center">\n'
            f'  <img src="../images/{img_filename}" alt="{spec["alt"]}" width="750" style="max-width: 100%; height: auto; border-radius: 8px;" />\n'
            f'  <br />\n'
            f'  <em>{spec["caption"]}</em>\n'
            f'</p>'
        )
        md = md.replace(placeholder, img_md)
    
    blog_filepath.write_text(md, encoding="utf-8")
    return {"final_blog": md}

def fetch_youtube_video(topic: str) -> str:
    try:
        from googleapiclient.discovery import build
        import httplib2
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

def embed_youtube_video(state: BlogState):
    md = state.get("md_with_placeholders") or state.get("merged_md")
    topic = state.get("topic", "")
    
    iframe_markdown = fetch_youtube_video(topic)
    if iframe_markdown:
        md += iframe_markdown
        
    return {"md_with_placeholders": md}

# Define Reducer Subgraph
reducer_graph = StateGraph(BlogState)
# create subgraph nodes
reducer_graph.add_node("merge_content", merge_content)
reducer_graph.add_node("decide_images", decide_images)
reducer_graph.add_node("embed_youtube", embed_youtube_video)
reducer_graph.add_node("generate_and_place_images", generate_and_place_images)
# Create subgraph nodes with edges
reducer_graph.add_edge(START, "merge_content")
reducer_graph.add_edge("merge_content", "decide_images")
reducer_graph.add_edge("decide_images", "embed_youtube")
reducer_graph.add_edge("embed_youtube", "generate_and_place_images")
reducer_graph.add_edge("generate_and_place_images", END)

reducer_subgraph = reducer_graph.compile()


# Graph initialization, Add Nodes and Add edges
builder = StateGraph(BlogState)

# Add Graph Nodes
builder.add_node("router", router_node)
builder.add_node("research", research_node)
builder.add_node("orchestrator", orchestrator_node)
builder.add_node("worker", worker_node)
# builder.add_node("reducer", reducer_node)
builder.add_node("reducer", reducer_subgraph)

# add Graph edges
builder.add_edge(START, "router")
builder.add_conditional_edges("router", route_next, {"research": "research", "orchestrator":"orchestrator"})
builder.add_edge("research", "orchestrator")

builder.add_conditional_edges("orchestrator", fanout, ["worker"])
builder.add_edge("worker", "reducer")
builder.add_edge("reducer", END)

graph = builder.compile()

def run(topic: str, as_of: Optional[str] = None):
    if as_of is None:
        as_of = date.today().isoformat()

    out = graph.invoke(
        {
            "topic": topic,
            "mode": "",
            "need_research": False,
            "queries": [],
            "evidence": [],
            "plan": None,
            "as_of": as_of,
            "recency_days": 7,
            "sections": [],
            "merged_md": "",
            "md_with_placeholders": "",
            "image_specs": [],
            "final_blog": "",
        }
    )

    plan: Plan = out["plan"]
    print("\n" + "=" * 100)
    print("TOPIC:", topic)
    print("AS_OF:", out.get("as_of"), "RECENCY_DAYS:", out.get("recency_days"))
    print("MODE:", out.get("mode"))
    print("BLOG_KIND:", plan.blog_kind)
    print("NEEDS_RESEARCH:", out.get("need_research"))
    print("QUERIES:", (out.get("queries") or [])[:6])
    print("EVIDENCE_COUNT:", len(out.get("evidence", [])))
    if out.get("evidence"):
        print("EVIDENCE_SAMPLE:", [e.model_dump() for e in out["evidence"][:2]])
    print("TASKS:", len(plan.tasks))
    print("SAVED_MD_CHARS:", len(out.get("final_blog", "")))
    print("=" * 100 + "\n")

    return out
run("Write a blog on Generative AI")