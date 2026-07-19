"""
Authentication Router.
This module defines public endpoints for User registration (signup)
and OAuth2-compatible credential validation (login) leading to JWT issuance.
"""

from datetime import timedelta, datetime, timezone
from typing import Any
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.db import get_session
from app.core.security import create_access_token, get_password_hash, verify_password, create_password_reset_token, verify_password_reset_token
from app.core.email import send_reset_password_email, send_otp_email, send_welcome_email
from app.models.user import User, UserCreate, UserPublic
from app.core.config import settings

# Import limiter from core
from app.core.limiter import limiter

router = APIRouter()

@router.post("/signup")
@limiter.limit("5/minute")
def signup(*, request: Request, background_tasks: BackgroundTasks, session: Session = Depends(get_session), user_in: UserCreate) -> Any:
    """
    Register a new user account.
    
    1. Checks if the requested email is already registered and verified.
    2. Hashes the plain text password using bcrypt.
    3. Generates a 6-digit OTP and saves it to the user.
    4. Queues the OTP email.
    """
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user and user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists and is verified.",
        )
    
    otp = ''.join(random.choices(string.digits, k=6))
    expire_time = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    if user and not user.is_verified:
        # Update existing unverified user
        user.full_name = user_in.full_name
        user.hashed_password = get_password_hash(user_in.password)
        user.otp_code = otp
        user.otp_expires_at = expire_time
        user_create = user
    else:
        user_create = User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=get_password_hash(user_in.password),
            is_verified=False,
            otp_code=otp,
            otp_expires_at=expire_time
        )
        
    session.add(user_create)
    session.commit()
    session.refresh(user_create)
    
    background_tasks.add_task(send_otp_email, email_to=str(user_create.email), otp_code=str(otp))
    return {"status": "otp_sent", "message": "Verification code sent to your email."}

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

@router.post("/verify-otp")
@limiter.limit("5/minute")
def verify_otp(
    request: Request,
    payload: VerifyOtpRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
) -> Any:
    """
    Verifies the OTP sent to the user's email.
    If valid, marks user as verified, triggers welcome email, and returns JWT.
    """
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.is_verified:
        raise HTTPException(status_code=400, detail="User is already verified")
        
    if not user.otp_code or user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    now = datetime.now(timezone.utc)
    if user.otp_expires_at and user.otp_expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)
        
    if not user.otp_expires_at or user.otp_expires_at < now:
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    # Mark verified
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    session.add(user)
    session.commit()
    
    # Send welcome email
    background_tasks.add_task(send_welcome_email, email_to=user.email, name=user.full_name)
    
    access_token_expires = timedelta(minutes=60 * 24 * 7)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
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
    elif not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email to log in.")
    
    # Sign token to expire in 7 days
    access_token_expires = timedelta(minutes=60 * 24 * 7)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

class GoogleLogin(BaseModel):
    token: str

@router.post("/google")
def google_login(
    google_data: GoogleLogin,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
) -> Any:
    """
    Authenticate a user using a Google OAuth ID Token.
    """
    try:
        # Verify the token with Google
        id_info = id_token.verify_oauth2_token(
            google_data.token, 
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID
        )
        email = id_info.get("email")
        name = id_info.get("name")
        
        if not email:
            raise HTTPException(status_code=400, detail="Google token did not provide an email")
            
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            # Create a new user with a dummy password since they are logging in with Google
            import secrets
            dummy_password = secrets.token_urlsafe(32)
            user = User(
                email=email,
                full_name=name,
                hashed_password=get_password_hash(dummy_password),
                is_verified=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            
            # Send welcome email for new Google signups
            background_tasks.add_task(send_welcome_email, email_to=user.email, name=user.full_name)
        elif not user.is_verified:
            # If an existing unverified user logs in with Google, we can safely mark them as verified
            user.is_verified = True
            session.add(user)
            session.commit()
            
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
            
        access_token_expires = timedelta(minutes=60 * 24 * 7)
        return {
            "access_token": create_access_token(
                user.id, expires_delta=access_token_expires
            ),
            "token_type": "bearer",
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
) -> Any:
    """
    Sends a password reset email if the user exists.
    """
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if user:
        token = create_password_reset_token(email=user.email)
        background_tasks.add_task(send_reset_password_email, email_to=user.email, token=token)
    
    # Always return a generic success message to prevent email enumeration
    return {"message": "If an account with that email exists, we sent you a password reset link."}

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password")
@limiter.limit("3/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    session: Session = Depends(get_session)
) -> Any:
    """
    Resets the password using a valid reset token.
    """
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(payload.new_password)
    session.add(user)
    session.commit()
    
    return {"message": "Password updated successfully"}
