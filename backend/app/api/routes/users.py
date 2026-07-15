from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.core.db import get_session
from app.models.user import User, UserPublic
from app.models.blog import Blog
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserPublic)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user profile.
    """
    return current_user

@router.get("/me/dashboard")
def get_user_dashboard(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Get dashboard metrics for the current user.
    """
    statement = select(Blog).where(Blog.user_id == current_user.id)
    blogs = session.exec(statement).all()
    
    total_blogs_generated = len(blogs)
    
    return {
        "current_plan": current_user.plan_name,
        "remaining_credits": current_user.credits,
        "total_credits_per_account": 5, # or we could make it plan-dependent in the future
        "total_blogs_generated": total_blogs_generated
    }
