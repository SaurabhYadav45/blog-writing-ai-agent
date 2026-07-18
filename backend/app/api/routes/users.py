"""
Users Router.
This module defines endpoints relating to the authenticated user's profile and analytics,
including gathering total generation counts, remaining credits, average word count, 
and compiling data for Recharts visualizations (30-day activity, content categories).
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.core.db import get_session
from app.models.user import User, UserPublic, UserUpdate
from app.models.blog import Blog
from app.api.deps import get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.get("/me", response_model=UserPublic)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve details of the currently authenticated user.
    """
    return current_user

@router.put("/me", response_model=UserPublic)
def update_user_me(
    user_in: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Update the current user's profile information.
    """
    from fastapi import HTTPException
    
    user_data = user_in.model_dump(exclude_unset=True)
    
    if "brand_persona" in user_data and user_data["brand_persona"] and current_user.plan_name != "Pro":
        raise HTTPException(status_code=403, detail="Custom Brand Persona is a Pro feature.")
        
    for key, value in user_data.items():
        setattr(current_user, key, value)
        
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@router.get("/me/dashboard")
def get_user_dashboard(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Generate aggregate analytics metrics and chart data for the user dashboard.
    
    Metrics returned:
    - Current Plan (e.g. Free, Pro)
    - Remaining Generation Credits
    - Total Blogs Generated
    - Total Tokens Processed (aggregated from blog generation records)
    - Estimated Time Saved (based on an average of 3 hours per blog)
    - Average Blog Word Count
    - Recent Blog Activity (top 5 latest blogs)
    - Top Categories Chart Data (AI outline type breakdown)
    - 30-Day Activity Chart Data (list of 30 days mapping dates to count)
    """
    # Fetch all blogs owned by the user, ordered by creation date descending
    statement = select(Blog).where(Blog.user_id == current_user.id).order_by(Blog.created_at.desc())
    blogs = session.exec(statement).all()
    
    total_blogs_generated = len(blogs)
    
    # Initialize trackers
    total_tokens = 0
    status_counts = {"PENDING": 0, "COMPLETED": 0, "ERROR": 0}
    content_kinds = {}
    
    recent_activity = []
    
    total_words = 0
    completed_blogs_count = 0
    
    # Define date threshold for last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    activity_map = {}
    
    for i, blog in enumerate(blogs):
        # Accumulate total tokens processed from nested generation metrics
        if blog.metrics and isinstance(blog.metrics, list):
            for m in blog.metrics:
                if isinstance(m, dict):
                    total_tokens += m.get("total_tokens", 0)
                    
        # Count blog records by status
        status = blog.status or "PENDING"
        if status in status_counts:
            status_counts[status] += 1
        else:
            status_counts[status] = 1
            
        # Accumulate completed blog word count to calculate average length
        if status in ["COMPLETED", "DONE"] and blog.markdown_content:
            total_words += len(blog.markdown_content.split())
            completed_blogs_count += 1
            
        # Map blogs to created date (for the 30-day activity chart)
        blog_created_at = blog.created_at
        if blog_created_at.tzinfo is None:
            blog_created_at = blog_created_at.replace(tzinfo=timezone.utc)
            
        if blog_created_at >= thirty_days_ago:
            date_str = blog_created_at.strftime("%b %d")
            activity_map[date_str] = activity_map.get(date_str, 0) + 1
            
        # Extract the style / topic category determined by the AI
        if blog.plan and isinstance(blog.plan, dict):
            kind = blog.plan.get("blog_kind", "explainer")
            content_kinds[kind] = content_kinds.get(kind, 0) + 1
            
        # Limit recent activity array to top 5
        if i < 5:
            recent_activity.append({
                "id": blog.id,
                "topic": blog.topic,
                "status": blog.status,
                "created_at": blog.created_at
            })
            
    # Format data strictly for frontend Recharts consumption
    status_chart_data = [{"name": k, "value": v} for k, v in status_counts.items() if v > 0]
    kind_chart_data = [{"name": k.replace("_", " ").title(), "value": v} for k, v in content_kinds.items()]
    
    # Generate contiguous 30-day timeline ensuring zero-activity days are populated
    activity_chart_data = []
    for d in range(29, -1, -1):
        dt = datetime.now(timezone.utc) - timedelta(days=d)
        ds = dt.strftime("%b %d")
        activity_chart_data.append({"date": ds, "blogs": activity_map.get(ds, 0)})
    
    time_saved_hours = total_blogs_generated * 3
    avg_words = int(total_words / completed_blogs_count) if completed_blogs_count > 0 else 0
    
    total_credits_capacity = max(current_user.credits, 55 if current_user.plan_name == "Pro" else 5)
    
    return {
        "current_plan": current_user.plan_name,
        "remaining_credits": current_user.credits,
        "total_credits_per_account": total_credits_capacity,
        "total_blogs_generated": total_blogs_generated,
        "total_tokens_processed": total_tokens,
        "time_saved_hours": time_saved_hours,
        "avg_blog_length": avg_words,
        "recent_activity": recent_activity,
        "status_chart_data": status_chart_data,
        "kind_chart_data": kind_chart_data,
        "activity_chart_data": activity_chart_data
    }
