"""
Authentication Router.
This module defines public endpoints for User registration (signup)
and OAuth2-compatible credential validation (login) leading to JWT issuance.
"""

from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User, UserCreate, UserPublic

router = APIRouter()

@router.post("/signup", response_model=UserPublic)
def signup(*, session: Session = Depends(get_session), user_in: UserCreate) -> Any:
    """
    Register a new user account.
    
    1. Checks if the requested email is already registered in the system.
    2. Hashes the plain text password using bcrypt.
    3. Persists the new User entity to the database.
    
    Raises:
        HTTPException: 400 error if email is already taken.
    """
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user_create = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
    )
    session.add(user_create)
    session.commit()
    session.refresh(user_create)
    return user_create

@router.post("/login")
def login(
    session: Session = Depends(get_session),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2-compatible token login.
    
    1. Validates user credentials (username corresponds to email, password matched against hash).
    2. Checks if user is active.
    3. Returns a signed JWT token with a 7-day expiration.
    
    Raises:
        HTTPException: 400 error if username/password are incorrect or if user is inactive.
    """
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Sign token to expire in 7 days
    access_token_expires = timedelta(minutes=60 * 24 * 7)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
