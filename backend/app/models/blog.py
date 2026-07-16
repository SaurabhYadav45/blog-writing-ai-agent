"""
Blog models and schemas.
This module defines the database models and validation schemas for Blogs
using SQLModel. It includes fields for tracking blog generation status, 
generated markdown content, outline plans, research evidence logs, 
performance metrics, and user ownership.
"""

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from typing import Optional, Dict, List
from datetime import datetime

class BlogBase(SQLModel):
    """
    Base properties shared across all Blog models.
    Defines the initial setup options for blog generation.
    """
    topic: str
    tone: str
    audience: str
    depth: Optional[str] = "Standard Guide"

    reference_urls: Optional[str] = None
    model_name: Optional[str] = "GPT-4o"
    
    # Store dynamic dictionaries/JSON fields inside database columns
    metrics: Optional[Dict] = Field(default={}, sa_column=Column(JSON))
    seo_metadata: Optional[Dict] = Field(default={}, sa_column=Column(JSON))
    latency: float = Field(default=0.0)

class Blog(BlogBase, table=True):
    """
    Database representation of a Blog.
    Includes user ownership links, status, and generative state columns
    (such as draft content, outlines, evidence collected, and logs).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    mode: Optional[str] = Field(default=None)
    status: str = Field(default="PENDING")  # Status states: PENDING, COMPLETED, ERROR
    markdown_content: Optional[str] = Field(default=None)
    
    # Complex outline plans, search evidence links, and agent run logs
    plan: Optional[Dict] = Field(default={}, sa_column=Column(JSON))
    evidence: Optional[List] = Field(default=[], sa_column=Column(JSON))
    logs: Optional[List] = Field(default=[], sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BlogCreate(BlogBase):
    """
    Schema for validating blog generation request inputs.
    Inherits all properties from BlogBase.
    """
    pass
