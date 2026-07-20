"""
Blogs Router.
This module defines endpoints for blog generation, SSE streaming of live drafts,
retrieval of blog history, individual blog updates (markdown content), titles,
deletion, and contextual AI section regeneration.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, update
import json
import time
import asyncio
from datetime import date
from pydantic import BaseModel

from app.core.db import get_session
from app.models.blog import Blog
from app.models.user import User
from app.api.deps import get_current_user, get_current_user_from_query
# Graph is injected via request.app.state
from app.core import llm_models
from app.core.model_registry import get_model_spec, is_allowed_for_plan, normalize_provider_id, public_catalog
from app.services.model_selector import create_chat_model
from app.core.limiter import limiter

router = APIRouter()

@router.get("/models")
def available_models(current_user: User = Depends(get_current_user)):
    """Return registry-backed providers that the authenticated user may select."""
    return {"default_provider": "openai", "providers": public_catalog(current_user.plan_name)}
def response_text(content) -> str:
    """Normalize provider-specific message content into plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                parts.append(str(part.get("text") or part.get("content") or ""))
            else:
                parts.append(str(getattr(part, "text", "") or getattr(part, "content", "") or ""))
        return "".join(parts)
    if isinstance(content, dict):
        return str(content.get("text") or content.get("content") or "")
    return str(getattr(content, "text", "") or getattr(content, "content", "") or content or "")

class BlogGenerateRequest(BaseModel):
    """
    Pydantic schema to validate the payload for generating a new blog.
    """
    topic: str
    tone: str
    audience: str
    model_name: str
    image_model_name: str = "pollinations-flux"
    depth: str = "Standard Guide"
    reference_urls: str = ""

@router.post("/generate")
@limiter.limit("10/minute")
def generate_blog(
    request: Request,
    payload: BlogGenerateRequest, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Core entry point for blog generation.
    Creates a database record with PENDING status, deducts one credit
    from the authenticated user, and returns the blog_id immediately.
    
    Raises:
        HTTPException: 403 error if the user has 0 credits.
    """
    if current_user.credits <= 0:
        print(f"[DEBUG] User {current_user.email} attempted to generate a blog but has 0 credits.")
        raise HTTPException(status_code=403, detail="Not enough credits to generate a blog.")
        
    try:
        provider_id = normalize_provider_id(payload.model_name)
        complex_model = get_model_spec(provider_id, "complex")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not is_allowed_for_plan(complex_model, current_user.plan_name):
        raise HTTPException(status_code=403, detail="This AI provider is a Pro feature. Please upgrade to use it.")
    payload.model_name = provider_id        
    print(f"[DEBUG] Blog generation request validated for user {current_user.email}. Creating DB record...")
        
    db_blog = Blog(
        topic=payload.topic,
        tone=payload.tone,
        audience=payload.audience,
        model_name=payload.model_name,
        image_model_name=payload.image_model_name,
        depth=payload.depth,
        user_id=current_user.id,
        reference_urls=payload.reference_urls,
        mode="auto",
        status="PENDING"
    )
    
    # Deduct credit atomically and save the pending blog
    stmt = update(User).where(User.id == current_user.id).values(credits=User.credits - 1)
    session.exec(stmt)
    session.add(db_blog)
    session.commit()
    
    # Refresh to pull the auto-generated database ID
    session.refresh(db_blog)
    
    return {"blog_id": db_blog.id}

@router.get("/stream/{blog_id}")
async def stream_blog(
    blog_id: int, 
    request: Request, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user_from_query)
):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Triggers the LangGraph multi-agent workflow asynchronously and yields 
    live updates (logs, markdown, images, plan, metrics) back to the frontend.
    
    Raises:
        HTTPException: 404 if the blog doesn't exist or is not owned by the user.
        HTTPException: 400 if the blog generation has already completed or erred out.
    """
    print(f"[DEBUG] SSE stream requested for blog_id {blog_id} by user {current_user.email}")
    db_blog = session.get(Blog, blog_id)
    if not db_blog or db_blog.user_id != current_user.id:
        print(f"[DEBUG] Blog {blog_id} not found or unauthorized for user {current_user.email}")
        raise HTTPException(status_code=404, detail="Blog not found")

    if db_blog.status == "COMPLETED":
        print(f"[DEBUG] Blog {blog_id} already completed.")
        raise HTTPException(status_code=400, detail="Blog processing already finished.")

    # If resuming an errored blog, we must deduct a credit since it was refunded on error
    if db_blog.status == "ERROR":
        print(f"[DEBUG] Resuming ERRORED blog {blog_id}.")
        if current_user.credits <= 0:
            print(f"[DEBUG] User {current_user.email} attempted to resume blog but has 0 credits.")
            raise HTTPException(status_code=403, detail="Not enough credits to resume blog generation.")
        stmt = update(User).where(User.id == current_user.id).values(credits=User.credits - 1)
        session.exec(stmt)
        session.commit()
        session.refresh(db_blog)

    async def event_generator():
        # Establish a fresh session specifically for generator iterations
        from app.core.db import engine
        with Session(engine) as gen_session:
            gen_db_blog = gen_session.get(Blog, blog_id)
            
            # Update database status to GENERATING
            start_time = time.time()
            gen_db_blog.status = "GENERATING"
            gen_session.add(gen_db_blog)
            gen_session.commit()
            gen_session.refresh(gen_db_blog)
    
            current_logs = ["Sending request to start agent workflow...", f"Created blog record #{gen_db_blog.id}. Opening SSE stream..."]
            current_plan = {}
            current_evidence = []
    
            try:
                # Prepare initial state inputs for the LangGraph agents
                inputs = {
                    "topic": gen_db_blog.topic,
                    "mode": "auto",
                    "model_name": gen_db_blog.model_name or llm_models.DEFAULT_TEXT_PROVIDER,
                    "image_model_name": gen_db_blog.image_model_name or llm_models.IMAGE_MODEL_POLLINATIONS,
                    "depth": gen_db_blog.depth or "Standard Guide",
                    "reference_urls": gen_db_blog.reference_urls or "",
                    "need_research": False,
                    "queries": [],
                    "evidence": [],
                    "plan": None,
                    "as_of": date.today().isoformat(),
                    "recency_days": 7,
                    "sections": [],
                    "merged_md": "",
                    "image_specs": [],
                    "final_blog": "",
                    "seo_metadata": {},
                    "metrics": [],
                    "cloudinary_cloud_name": current_user.cloudinary_cloud_name,
                    "cloudinary_api_key": current_user.cloudinary_api_key,
                    "cloudinary_api_secret": current_user.cloudinary_api_secret,
                    "brand_persona": current_user.brand_persona,
                    "plan_name": current_user.plan_name,
                }
    
                final_state = None
                current_metrics = []
                
                # Checkpoint configuration for LangGraph state persistence
                config = {"configurable": {"thread_id": str(blog_id)}}
                graph = request.app.state.agent_graph
                current_state_info = await graph.aget_state(config)
                
                if current_state_info.next:
                    # Resume execution from last checkpoint in case of network disconnection
                    iterator = graph.astream(None, config=config).__aiter__()
                    current_logs.append("[RESUME] Connection restored. Resuming workflow from last saved checkpoint...")
                    
                    st_vals = current_state_info.values
                    if st_vals:
                        p = st_vals.get("plan")
                        if p:
                            current_plan = p.model_dump() if hasattr(p, 'model_dump') else dict(p)
                        ev = st_vals.get("evidence", [])
                        current_evidence = [e.model_dump() if hasattr(e, 'model_dump') else dict(e) for e in ev]
                        current_metrics = st_vals.get("metrics", [])
                else:
                    # Start fresh graph execution
                    iterator = graph.astream(inputs, config=config).__aiter__()
                
                pending_task = None
                
                while True:
                    # If browser closes/disconnects, cancel execution
                    if await request.is_disconnected():
                        if pending_task:
                            pending_task.cancel()
                        break
                    
                    if pending_task is None:
                        # Schedule background task to retrieve the next event from the graph iterator
                        pending_task = asyncio.create_task(iterator.__anext__())
                    
                    # Wait for graph output with a keep-alive ping timeout
                    done, pending = await asyncio.wait([pending_task], timeout=15.0)
                    
                    if not done:
                        # Send periodic SSE comment ping to keep connection alive in browser
                        yield ": ping\n\n"
                        continue
                    
                    try:
                        event = pending_task.result()
                        pending_task = None  # Reset for next graph step
                    except StopAsyncIteration:
                        break
    
                    final_state = event
                    node_name = list(event.keys())[0]
                    
                    # Clean user-facing statuses corresponding to active graph nodes
                    status_map = {
                        "router": {"status": "routing", "message": "Analyzing topic and determining workflow..."},
                        "research": {"status": "researching", "message": "Scouring the web for latest technical evidence..."},
                        "orchestrator": {"status": "orchestrating", "message": "Orchestrating blog structure and detailed outline..."},
                        "worker": {"status": "writing", "message": "Drafting blog sections concurrently..."},
                        "decide_images": {"status": "assembling", "message": "Planning image placements..."},
                        "merge_content": {"status": "assembling", "message": "Assembling sections..."},
                        "generate_and_place_images": {"status": "assembling", "message": "Generating and placing images..."},
                        "editor": {"status": "editing", "message": "Refining content and generating SEO metadata..."}
                    }
                    
                    info = status_map.get(node_name, {"status": "generating", "message": f"Processing {node_name}..."})
                    current_logs.append(f"[{info['status'].upper()}] {info['message']}")
                    
                    # Save updates to local variables and gen_db_blog
                    if node_name == "router" and "mode" in event[node_name]:
                        info["mode"] = event[node_name]["mode"]
                        gen_db_blog.mode = event[node_name]["mode"]
                        gen_session.add(gen_db_blog)
                        gen_session.commit()
                    if node_name == "research" and "evidence" in event[node_name]:
                        evidence = event[node_name]["evidence"]
                        current_evidence = [e.model_dump() if hasattr(e, 'model_dump') else dict(e) for e in evidence]
                        info["evidence"] = current_evidence
                    if node_name == "orchestrator" and "plan" in event[node_name]:
                        plan = event[node_name]["plan"]
                        current_plan = plan.model_dump() if hasattr(plan, 'model_dump') else dict(plan)
                        info["plan"] = current_plan
                    if node_name == "editor" and "seo_metadata" in event[node_name]:
                        info["seo_metadata"] = event[node_name]["seo_metadata"]
                        
                    if node_name in ["generate_and_place_images", "editor"] and "final_blog" in event[node_name]:
                        info["markdown"] = event[node_name]["final_blog"]
                        
                    if "metrics" in event[node_name] and event[node_name]["metrics"]:
                        current_metrics.extend(event[node_name]["metrics"])
                        info["metrics"] = current_metrics
                    
                    info["latency"] = round(time.time() - start_time, 2)
                    
                    yield f"data: {json.dumps(info)}\n\n"
    
                # Retrieve final blog output markdown from editor node or fallback
                final_blog = None
                if final_state and "editor" in final_state:
                    final_blog = final_state["editor"].get("final_blog")
                
                if not final_blog and final_state:
                    for val in final_state.values():
                        if isinstance(val, dict) and "final_blog" in val:
                            final_blog = val["final_blog"]
                            break
    
                if final_blog:
                    # Update database entry with final results
                    gen_db_blog.markdown_content = final_blog
                    gen_db_blog.status = "COMPLETED"
                    gen_db_blog.plan = current_plan
                    gen_db_blog.evidence = current_evidence
                    gen_db_blog.metrics = current_metrics
                    gen_db_blog.latency = round(time.time() - start_time, 2)
                    if final_state and "editor" in final_state:
                        gen_db_blog.seo_metadata = final_state["editor"].get("seo_metadata", {})
                    current_logs.append("[COMPLETE] Blog generated successfully!")
                    gen_db_blog.logs = current_logs
                    gen_session.add(gen_db_blog)
                    gen_session.commit()
                    
                    yield f"data: {json.dumps({'status': 'complete', 'message': 'Blog generated successfully!'})}\n\n"
                else:
                    raise ValueError("Graph execution finished but failed to generate blog markdown.")
    
            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"ERROR DETAILS: {repr(e)}")
                
                # Mark blog generation as failed
                gen_db_blog.status = "ERROR"
                gen_session.add(gen_db_blog)
                
                # Refund credit atomically
                stmt = update(User).where(User.id == gen_db_blog.user_id).values(credits=User.credits + 1)
                gen_session.exec(stmt)
                
                gen_session.commit()
                
                error_info = {"status": "error", "message": f"Workflow failed: {str(e)}"}
                yield f"data: {json.dumps(error_info)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/")
def list_blogs(
    limit: int = 10,
    offset: int = 0,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    List historically completed or errored blogs owned by the authenticated user.
    """
    statement = (
        select(Blog)
        .where(Blog.status.in_(["COMPLETED", "ERROR"]), Blog.user_id == current_user.id)
        .order_by(Blog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    results = session.exec(statement).all()
    return results

@router.get("/{blog_id}")
def get_blog(blog_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Retrieve details of a specific blog by ID.
    
    Raises:
        HTTPException: 404 error if blog doesn't exist or is not owned by the user.
    """
    db_blog = session.get(Blog, blog_id)
    if not db_blog or db_blog.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Blog not found")
    return db_blog

class BlogUpdateRequest(BaseModel):
    """
    Validation schema to update a blog's markdown content.
    """
    markdown_content: str

@router.put("/{blog_id}")
def update_blog(
    blog_id: int, 
    payload: BlogUpdateRequest, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Update the markdown content of an existing blog.
    
    Raises:
        HTTPException: 404 if not found or unauthorized.
    """
    db_blog = session.get(Blog, blog_id)
    if not db_blog or db_blog.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Blog not found")
    db_blog.markdown_content = payload.markdown_content
    session.add(db_blog)
    session.commit()
    return {"status": "success"}

class BlogRenameRequest(BaseModel):
    """
    Validation schema to rename a blog's topic.
    """
    topic: str

@router.put("/{blog_id}/title")
def rename_blog(
    blog_id: int, 
    payload: BlogRenameRequest, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Rename the topic (title) of an existing blog.
    
    Raises:
        HTTPException: 404 if not found or unauthorized.
    """
    db_blog = session.get(Blog, blog_id)
    if not db_blog or db_blog.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Blog not found")
    db_blog.topic = payload.topic
    session.add(db_blog)
    session.commit()
    return {"status": "success", "topic": db_blog.topic}

@router.delete("/{blog_id}")
def delete_blog(
    blog_id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Permanently delete a blog from the database.
    
    Raises:
        HTTPException: 404 if not found or unauthorized.
    """
    db_blog = session.get(Blog, blog_id)
    if not db_blog or db_blog.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Blog not found")
    session.delete(db_blog)
    session.commit()
    return {"status": "success"}

class RegenerateRequest(BaseModel):
    """
    Validation schema for modifying and regenerating a selection of text.
    """
    selected_text: str
    prompt: str
    model_name: str = llm_models.DEFAULT_TEXT_PROVIDER
    full_text: str = ""

@router.post("/{blog_id}/regenerate-selection")
def regenerate_selection(
    blog_id: int, 
    payload: RegenerateRequest, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Regenerate a specific selection of text inside a blog using the selected LLM.
    Uses the full blog text as context if provided, and performs edits based on
    user-submitted instructions.
    
    Raises:
        HTTPException: 404 if not found or unauthorized.
    """
    if current_user.plan_name != "Pro":
        raise HTTPException(status_code=403, detail="Regeneration is a Pro feature. Please upgrade to use this.")
        
    db_blog = session.get(Blog, blog_id)
    if not db_blog or db_blog.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Blog not found")
        
    from langchain_core.messages import SystemMessage, HumanMessage

    try:
        provider_id = normalize_provider_id(payload.model_name)
        spec = get_model_spec(provider_id, "complex")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not is_allowed_for_plan(spec, current_user.plan_name):
        raise HTTPException(status_code=403, detail="This AI provider is a Pro feature. Please upgrade to use it.")
    llm = create_chat_model(spec)
    system_prompt = (
        "You are an expert technical editor. Rewrite the provided selected text based on the user's instructions. "
        "Return ONLY the new markdown text. Do not include any conversational filler."
    )
    
    human_content = f"User instructions:\n{payload.prompt}\n\n"
    if payload.full_text:
        human_content += f"--- FULL BLOG CONTEXT (Do NOT rewrite all of this, just use it for context) ---\n{payload.full_text}\n\n"
    
    human_content += f"--- TEXT TO REWRITE (You must ONLY rewrite this specific section) ---\n{payload.selected_text}"
    
    # Invoke the LLM synchronously
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_content)
    ])
    
    new_text = response_text(response.content)
    if isinstance(new_text, str):
        new_text = new_text.strip()
        if new_text.startswith("```markdown\n"):
            new_text = new_text[len("```markdown\n"):]
            if new_text.endswith("```"):
                new_text = new_text[:-3]
        elif new_text.startswith("```md\n"):
            new_text = new_text[len("```md\n"):]
            if new_text.endswith("```"):
                new_text = new_text[:-3]
        elif new_text.startswith("```") and new_text.endswith("```") and not new_text.startswith("```mermaid"):
            # Generic empty backticks wrapper without a specific language tag
            lines = new_text.split("\n")
            if len(lines) > 1 and lines[0].strip() == "```":
                new_text = "\n".join(lines[1:-1])
        new_text = new_text.strip()
        
    return {"new_text": new_text}

class PublishRequest(BaseModel):
    platform: str

@router.post("/{blog_id}/publish")
def publish_blog_endpoint(
    blog_id: int, 
    payload: PublishRequest,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Publishes a completed blog to the configured CMS.
    """
    if current_user.plan_name != "Pro":
        raise HTTPException(status_code=403, detail="CMS Publishing is a Pro feature. Please upgrade to use this.")
        
    db_blog = session.get(Blog, blog_id)
    if not db_blog or db_blog.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Blog not found")
        
    if db_blog.status != "COMPLETED" or not db_blog.markdown_content:
        raise HTTPException(status_code=400, detail="Cannot publish an incomplete blog.")
        
    from app.services.cms_service import publish_blog, CMSPublishError
    
    try:
        url = publish_blog(db_blog, current_user, payload.platform)
        db_blog.published_url = url
        db_blog.cms_platform = payload.platform
        session.add(db_blog)
        session.commit()
        return {"status": "success", "url": url}
    except CMSPublishError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{blog_id}/promote/linkedin")
def promote_on_linkedin(
    blog_id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Promotes a published blog on LinkedIn by generating a short post 
    via an LLM and using the LinkedIn Posts API.
    """
    if current_user.plan_name != "Pro":
        raise HTTPException(status_code=403, detail="LinkedIn promotion is a Pro feature. Please upgrade to use this.")
        
    db_blog = session.get(Blog, blog_id)
    if not db_blog or db_blog.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Blog not found")
        
    if not db_blog.published_url:
        raise HTTPException(status_code=400, detail="Blog must be published to a CMS first.")
        
    # Generate the short post
    from langchain_core.messages import SystemMessage, HumanMessage

    spec = get_model_spec("openai", "cheap")
    llm = create_chat_model(spec)
    system_prompt = (
        "You are an expert social media manager. Create an engaging, professional LinkedIn post "
        "to promote a new blog article. Keep it under 100 words. Include 2-3 relevant hashtags. "
        "End with a call to action to read the full article at the link below. "
        "Do NOT include the actual URL in your text (it will be attached automatically)."
    )
    
    # Optimize tokens by only sending the plan and SEO metadata
    plan_str = json.dumps(db_blog.plan) if isinstance(db_blog.plan, dict) else str(db_blog.plan)
    seo_str = json.dumps(db_blog.seo_metadata) if isinstance(db_blog.seo_metadata, dict) else str(db_blog.seo_metadata)
    
    human_content = f"Blog Topic: {db_blog.topic}\n\nBlog Outline/Plan: {plan_str}\n\nSEO Metadata: {seo_str}"
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_content)
    ])
    
    post_text = response_text(response.content).strip()
    
    from app.services.cms_service import share_to_linkedin, CMSPublishError
    
    try:
        linkedin_post_id = share_to_linkedin(db_blog, current_user, post_text)
        return {"status": "success", "linkedin_post_id": linkedin_post_id, "generated_post": post_text}
    except CMSPublishError as e:
        raise HTTPException(status_code=400, detail=str(e))
