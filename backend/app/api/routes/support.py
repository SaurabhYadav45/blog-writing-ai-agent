from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from pydantic import BaseModel
from app.core.db import get_session
from app.models.support import ContactMessage, FeedbackMessage

router = APIRouter()

class ContactRequest(BaseModel):
    full_name: str
    email: str
    message: str

class FeedbackRequest(BaseModel):
    type: str
    title: str
    description: str

@router.post("/contact", status_code=status.HTTP_201_CREATED)
def submit_contact(request: ContactRequest, session: Session = Depends(get_session)):
    new_message = ContactMessage(
        full_name=request.full_name,
        email=request.email,
        message=request.message
    )
    session.add(new_message)
    session.commit()
    return {"message": "Message received"}

@router.post("/feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(request: FeedbackRequest, session: Session = Depends(get_session)):
    new_feedback = FeedbackMessage(
        feedback_type=request.type,
        title=request.title,
        description=request.description
    )
    session.add(new_feedback)
    session.commit()
    return {"message": "Feedback received"}
