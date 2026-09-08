"""FormCheck — FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import FRONTEND_ORIGIN
from db.database import Base, engine, SessionLocal
from db.seed import seed
from routers import analysis, video, ai_chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables, seed data, download model."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created / verified.")

    # Seed reference data
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

    # Pre-download the MediaPipe model so the first request isn't slow
    from pose.landmarker import _ensure_model

    _ensure_model()

    yield  # app runs here

    print("Shutting down…")


app = FastAPI(
    title="FormCheck API",
    description="Sports form & injury-risk analyzer",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow Vite dev server, local dev, and deployed Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(video.router)
app.include_router(analysis.router)
app.include_router(ai_chat.router)


@app.get("/")
async def root():
    return {"app": "FormCheck", "status": "running"}
