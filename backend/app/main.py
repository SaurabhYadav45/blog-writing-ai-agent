from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import init_db
# Import models to make sure SQLModel registry is aware of them when creating tables
from app.models.blog import Blog
from app.models.user import User
from app.api.routes.blogs import router as blogs_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.payments import router as payments_router

# Lifespan manager to execute logic when FastAPI starts up and shuts down
# The @asynccontextmanager is a decorator, It lets you turn a simple function into a context manager using a single yield statement. The yield acts as a dividing line:
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initializes tables in PostgreSQL database
    init_db()
    yield

app = FastAPI(
    title="BlogFusion API",
    version="1.0",
    lifespan=lifespan
)

# CORS (Cross-Origin Resource Sharing) configuration.
# This allows our React frontend (running on a different port/host) to talk to this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; narrow down in production
    allow_credentials=True,
    allow_methods=["*"],  # Allow GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allow all request headers
)

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(blogs_router, prefix="/api/blogs", tags=["blogs"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])

# Basic health check endpoint
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
