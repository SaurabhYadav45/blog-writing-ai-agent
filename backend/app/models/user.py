"""
User models and schemas.
This module defines the database models and validation schemas for Users
using SQLModel (which integrates SQLAlchemy and Pydantic).
It contains models for base properties, database storage, user creation inputs,
and public-facing profiles.
"""

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class UserBase(SQLModel):
    """
    Base properties shared across all User models.
    Provides standard fields such as email, activity status, plan details, and remaining credits.
    """
    email: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    is_active: bool = True
    plan_name: str = Field(default="Free")
    credits: int = Field(default=5)

class User(UserBase, table=True):
    """
    Database representation of a User.
    Includes database-specific columns like the primary key, hashed password, and creation timestamp.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    """
    Schema for validating user registration input.
    Requires a plain text password during sign up.
    """
    password: str

class UserPublic(UserBase):
    """
    Schema for returned user data in API responses.
    Excludes sensitive fields like hashed_password, and guarantees that ID and creation date are present.
    """
    id: int
    created_at: datetime
