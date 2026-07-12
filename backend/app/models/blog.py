from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from typing import Optional, Dict, List
from datetime import datetime

class BlogBase(SQLModel):
    topic: str
    tone: str
    audience: str
    length: Optional[str] = "Medium (~1000 words)"
    model_name: Optional[str] = "GPT-4o"
    metrics: Optional[Dict] = Field(default={}, sa_column=Column(JSON))

class Blog(BlogBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    mode: Optional[str] = Field(default=None)
    status: str = Field(default="PENDING")
    markdown_content: Optional[str] = Field(default=None)
    plan: Optional[Dict] = Field(default={}, sa_column=Column(JSON))
    evidence: Optional[List] = Field(default=[], sa_column=Column(JSON))
    logs: Optional[List] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BlogCreate(BlogBase):
    pass
