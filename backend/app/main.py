from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys
import os
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.core.db import init_db
# Import models to make sure SQLModel registry is aware of them when creating tables
from app.models.blog import Blog
from app.models.user import User
from app.models.support import ContactMessage, FeedbackMessage
from app.api.routes.blogs import router as blogs_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.payments import router as payments_router
from app.api.routes.support import router as support_router
from app.services.agent import builder
from app.core.config import settings
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter



# Setup LangSmith tracing environment variables for LangChain/LangGraph
if settings.LANGCHAIN_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = settings.LANGCHAIN_TRACING_V2
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
    os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT

# Lifespan manager to execute logic when FastAPI starts up and shuts down
# The @asynccontextmanager is a decorator, It lets you turn a simple function into a context manager using a single yield statement. The yield acts as a dividing line:
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initializes tables in PostgreSQL database
    init_db()
    # Checkpointer Setup
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
        from psycopg_pool import AsyncConnectionPool
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
        import sys
        import asyncio
        
        # Fix for psycopg async on Windows
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
        sanitized_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
        app.state.pool = AsyncConnectionPool(conninfo=sanitized_url, max_size=10, open=False, kwargs={"autocommit": True})
        await app.state.pool.open()
        memory = AsyncPostgresSaver(app.state.pool)
        await memory.setup()
        app.state.agent_graph = builder.compile(checkpointer=memory)
    else:
        from langgraph.checkpoint.memory import MemorySaver
        memory = MemorySaver()
        app.state.agent_graph = builder.compile(checkpointer=memory)
        
    yield
    
    # Teardown
    if hasattr(app.state, "pool"):
        await app.state.pool.close()

app = FastAPI(
    title="BlogFusion API",
    version="1.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS (Cross-Origin Resource Sharing) configuration.
# This allows our React frontend (running on a different port/host) to talk to this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,  # Restricted to production frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allow all request headers
)

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(blogs_router, prefix="/api/blogs", tags=["blogs"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
app.include_router(support_router, prefix="/api/support", tags=["support"])

# Basic health check endpoint
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
