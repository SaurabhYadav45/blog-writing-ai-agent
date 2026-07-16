"""
Security and authentication helpers.
This module provides utilities for password hashing and verification
using Passlib and bcrypt, and JWT access token creation/validation
using the PyJWT library.
"""

from datetime import datetime, timedelta
from typing import Any, Union, Optional
from passlib.context import CryptContext
import jwt

# Secret key used for signing JWTs.
# WARNING: Always change this to a secure random string in production!
SECRET_KEY = "super_secret_key_change_me_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # Default expiration: 7 days

# Password hashing context using the bcrypt hashing algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JSON Web Token (JWT) representing user authentication.
    
    Args:
        subject: The unique identifier of the user (e.g. user ID or email).
        expires_delta: An optional custom duration for the token's lifetime.
        
    Returns:
        The encoded and signed JWT string.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies that a plain text password matches its stored hash.
    
    Args:
        plain_password: The user-supplied password string.
        hashed_password: The stored hashed password from the database.
        
    Returns:
        True if the passwords match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hashes a plain text password using the bcrypt algorithm.
    
    Args:
        password: The plain text password to hash.
        
    Returns:
        The hashed password string ready to be stored in the database.
    """
    return pwd_context.hash(password)
