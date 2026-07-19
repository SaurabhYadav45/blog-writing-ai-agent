"""
Security and authentication helpers.
This module provides utilities for password hashing and verification
using Passlib and bcrypt, and JWT access token creation/validation
using the PyJWT library.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import jwt
import bcrypt

from app.core.config import settings

# Security configurations loaded from environment settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


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
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_password_reset_token(email: str) -> str:
    """
    Creates a signed JWT used for resetting passwords, expiring in 15 minutes.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": email, "type": "reset_password"}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verifies a password reset token and returns the associated email.
    """
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded_token.get("type") != "reset_password":
            return None
        return decoded_token.get("sub")
    except jwt.PyJWTError:
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies that a plain text password matches its stored hash.
    
    Args:
        plain_password: The user-supplied password string.
        hashed_password: The stored hashed password from the database.
        
    Returns:
        True if the passwords match, False otherwise.
    """
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        import logging
        logging.error(f"Password verification failed with exception: {e}", exc_info=True)
        return False

def get_password_hash(password: str) -> str:
    """
    Hashes a plain text password using the bcrypt algorithm.
    
    Args:
        password: The plain text password to hash.
        
    Returns:
        The hashed password string ready to be stored in the database.
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

import os
from cryptography.fernet import Fernet

def get_encryption_key() -> bytes:
    key = os.environ.get("ENCRYPTION_KEY")
    if not key:
        key = Fernet.generate_key().decode('utf-8')
        os.environ["ENCRYPTION_KEY"] = key
    return key.encode('utf-8')

def encrypt_token(token: Optional[str]) -> Optional[str]:
    if not token:
        return token
    f = Fernet(get_encryption_key())
    return f.encrypt(token.encode('utf-8')).decode('utf-8')

def decrypt_token(encrypted_token: Optional[str]) -> Optional[str]:
    if not encrypted_token:
        return encrypted_token
    f = Fernet(get_encryption_key())
    return f.decrypt(encrypted_token.encode('utf-8')).decode('utf-8')
