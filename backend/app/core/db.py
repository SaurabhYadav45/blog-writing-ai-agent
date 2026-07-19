"""
Database configuration and session management.
This module initializes the SQLAlchemy/SQLModel database engine,
and provides helper functions for database table initialization
and dependency injection of database sessions into API routes.
"""

from sqlmodel import create_engine, Session, SQLModel
from app.models.user import User
from app.models.blog import Blog
from app.models.payment import PaymentTransaction
from app.core.config import settings

# Create the DB Engine using our DATABASE_URL setting.
# The engine handles connection pooling and communication with Postgres/SQLite.
engine = create_engine(settings.DATABASE_URL, echo=False)

def init_db():
    """
    Initializes the database by creating all database tables
    registered in the SQLModel metadata registry.
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    FastAPI dependency that yields a database session.
    The session is initialized from the engine and is automatically
    closed when the context manager completes, ensuring connection cleanup.
    """
    with Session(engine) as session:
        yield session
