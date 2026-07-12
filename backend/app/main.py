from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import init_db
# Import Blog model to make sure SQLModel registry is aware of it when creating tables
from app.models.blog import Blog
from app.api.routes.blogs import router as blogs_router

# Lifespan manager to execute logic when FastAPI starts up and shuts down
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

# Register the blog routes under the '/api/blogs' prefix
app.include_router(blogs_router, prefix="/api/blogs", tags=["blogs"])

# Basic health check endpoint
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
