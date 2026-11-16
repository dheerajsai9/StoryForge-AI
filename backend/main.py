import os
import sys

# Ensure current directory is on sys.path for Render/Linux deployments
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base
import models
from routes import auth, projects, requirements, stories, improver, sprints, export

load_dotenv()

# Auto-create SQLite/Postgres tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StoryForge AI API",
    description="Enterprise REST API for AI-Powered User Story Mapping, Agile Planning and Ollama Integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    frontend_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(requirements.router)
app.include_router(stories.router)
app.include_router(improver.router)
app.include_router(sprints.router)
app.include_router(export.router)

@app.get("/")
def root():
    return {
        "app": "StoryForge AI API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
