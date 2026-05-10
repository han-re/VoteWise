"""
api/chat.py — RAG chatbot endpoint.

POST /chat
  Body: { "session_slug": str, "question": str, "history": [...] }
  Returns: { "answer": str, "sources": [chunk_id, ...] }

Strategy:
  1. Load embeddings.json for the requested session
  2. Embed the user question with text-embedding-3-small
  3. Cosine-similarity rank all chunks, take top 5
  4. Pass retrieved chunks + conversation history to gpt-4o-mini
  5. Parse JSON response and return
"""

import json
import math
import os
from pathlib import Path
from functools import lru_cache

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SESSIONS_DIR = PROJECT_ROOT / "data" / "mla-tracker" / "sessions"
PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

EMBED_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o-mini"
TOP_K = 5

router = APIRouter()


def get_client() -> OpenAI:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=key)


@lru_cache(maxsize=8)
def load_embeddings(session_slug: str) -> list[dict]:
    path = SESSIONS_DIR / session_slug / "embeddings.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("chunks", [])


def load_system_prompt() -> str:
    return (PROMPTS_DIR / "chatbot_system.txt").read_text(encoding="utf-8")


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def retrieve(question_embedding: list[float], chunks: list[dict], top_k: int) -> list[dict]:
    scored = [
        (cosine_similarity(question_embedding, c["embedding"]), c)
        for c in chunks
        if c.get("embedding")
    ]
    scored.sort(key=lambda x: -x[0])
    return [c for _, c in scored[:top_k]]


class ChatRequest(BaseModel):
    session_slug: str
    question: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    chunks = load_embeddings(req.session_slug)
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=f"No embeddings found for session '{req.session_slug}'. Run process_session.py first.",
        )

    client = get_client()

    # Embed the question
    emb_response = client.embeddings.create(model=EMBED_MODEL, input=[req.question])
    q_embedding = emb_response.data[0].embedding

    # Retrieve top-k chunks
    top_chunks = retrieve(q_embedding, chunks, TOP_K)
    context_text = "\n\n---\n\n".join(
        f"[{c['chunk_id']}] {c['speaker']} ({c['party']}, lines {c['line_start']}-{c['line_end']}):\n{c['text']}"
        for c in top_chunks
    )

    system = load_system_prompt()
    messages = [
        {"role": "system", "content": f"{system}\n\nCONTEXT FROM SESSION {req.session_slug}:\n{context_text}"},
    ]
    # Append conversation history (last 6 turns to stay within context)
    for turn in req.history[-6:]:
        messages.append(turn)
    messages.append({"role": "user", "content": req.question})

    completion = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    raw = completion.choices[0].message.content
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {"answer": raw, "sources": []}

    return ChatResponse(
        answer=parsed.get("answer", ""),
        sources=parsed.get("sources", []),
    )
