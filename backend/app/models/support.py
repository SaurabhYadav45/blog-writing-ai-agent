from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from typing import Optional

class ContactMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    feedback_type: str  # e.g. "idea" or "bug"
    title: str
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
