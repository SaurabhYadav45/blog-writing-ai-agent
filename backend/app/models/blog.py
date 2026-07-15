from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from typing import Optional, Dict, List
from datetime import datetime

class BlogBase(SQLModel):
    topic: str
    tone: str
    audience: str
    depth: Optional[str] = "Standard Guide"

    reference_urls: Optional[str] = None
    model_name: Optional[str] = "GPT-4o"
    metrics: Optional[Dict] = Field(default={}, sa_column=Column(JSON))
    seo_metadata: Optional[Dict] = Field(default={}, sa_column=Column(JSON))
    latency: float = Field(default=0.0)

class Blog(BlogBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    mode: Optional[str] = Field(default=None)
    status: str = Field(default="PENDING")
    markdown_content: Optional[str] = Field(default=None)
    plan: Optional[Dict] = Field(default={}, sa_column=Column(JSON))
    evidence: Optional[List] = Field(default=[], sa_column=Column(JSON))
    logs: Optional[List] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BlogCreate(BlogBase):
    pass
