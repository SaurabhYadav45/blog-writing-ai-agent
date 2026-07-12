from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

# The Engine is the starting point for any SQLModel application.
# It manages the database connections. echo=True enables logging generated SQL query statements.
engine = create_engine(settings.DATABASE_URL, echo=True)

# Create all database tables registered with SQLModel
def init_db():
    SQLModel.metadata.create_all(engine)

# Dependency to get a database session.
# Using a generator (yield) ensures the session is closed automatically after a request.
def get_session():
    with Session(engine) as session:
        yield session
