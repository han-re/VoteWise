"""
backend-tracker FastAPI — chatbot RAG endpoint for the Stormont MLA Tracker.

Deploy: Railway (root directory = /backend-tracker)
Local:  uvicorn backend_tracker.main:app --reload --port 8001

Endpoints:
  GET  /health
  POST /chat
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

# Ensure api/ subpackage is importable without a package prefix
sys.path.insert(0, str(BACKEND_DIR))

from api.chat import router as chat_router

app = FastAPI(
    title="MLA Tracker Chatbot API",
    version="1.0.0",
    description="RAG chatbot for Stormont session transcripts",
)

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://votewise.vercel.app",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(chat_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
