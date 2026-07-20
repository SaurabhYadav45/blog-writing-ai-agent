from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session
from pydantic import BaseModel, Field, EmailStr
from app.core.db import get_session
from app.models.support import ContactMessage, FeedbackMessage
from app.core.limiter import limiter

router = APIRouter()

class ContactRequest(BaseModel):
    full_name: str = Field(..., max_length=100)
    email: EmailStr
    message: str = Field(..., max_length=2000)

class FeedbackRequest(BaseModel):
    type: str = Field(..., max_length=50)
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=5000)

@router.post("/contact", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def submit_contact(request: Request, payload: ContactRequest, session: Session = Depends(get_session)):
    new_message = ContactMessage(
        full_name=payload.full_name,
        email=payload.email,
        message=payload.message
    )
    session.add(new_message)
    session.commit()
    return {"message": "Message received"}

@router.post("/feedback", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def submit_feedback(request: Request, payload: FeedbackRequest, session: Session = Depends(get_session)):
    new_feedback = FeedbackMessage(
        feedback_type=payload.type,
        title=payload.title,
        description=payload.description
    )
    session.add(new_feedback)
    session.commit()
    return {"message": "Feedback received"}
