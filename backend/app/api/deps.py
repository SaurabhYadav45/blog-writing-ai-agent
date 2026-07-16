"""
API Dependency Injection helpers.
This module provides FastAPI dependencies for routing security, specifically
JWT token decoding, verification, and loading the authenticated user context
either from standard HTTP Authorization headers or URL query parameters.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
import jwt
from pydantic import ValidationError

from app.core.db import get_session
from app.core.security import ALGORITHM, SECRET_KEY
from app.models.user import User

# OAuth2 schema instance referencing the endpoint that yields credentials/tokens.
# Used by FastAPI to automatically parse "Authorization: Bearer <Token>" headers.
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)

def get_current_user(
    session: Session = Depends(get_session), token: str = Depends(reusable_oauth2)
) -> User:
    """
    Standard HTTP Header Authentication Dependency.
    Extracts the Bearer JWT token from the Authorization header, validates it, 
    and returns the active user corresponding to the token subject.
    
    Raises:
        HTTPException: 403 status if token is invalid or expired.
        HTTPException: 404 status if user doesn't exist in the database.
        HTTPException: 400 status if user account is deactivated.
    """
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=403, detail="Could not validate credentials")
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def get_current_user_from_query(
    token: str, session: Session = Depends(get_session)
) -> User:
    """
    Query Parameter Authentication Dependency.
    Extracts the JWT token from the url query parameters, validates it,
    and returns the active user context. Useful for SSE (EventSource) connections
    where HTTP custom headers cannot be set natively.
    
    Raises:
        HTTPException: 403 status if token is invalid or expired.
        HTTPException: 404 status if user doesn't exist in the database.
        HTTPException: 400 status if user account is deactivated.
    """
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=403, detail="Could not validate credentials")
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user
