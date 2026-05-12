"""
chunk_and_embed.py — Split hansard.txt into speaker-turn chunks and embed each.

Chunking strategy:
  - Each speaker turn = one chunk
  - If a turn exceeds MAX_TOKENS, split at sentence boundaries

Embedding model: text-embedding-3-small (1536 dimensions)

Output: data/mla-tracker/sessions/<slug>/embeddings.json (atomic write)
"""

import json
import os
import re
import sys
from pathlib import Path

from openai import OpenAI
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

DATA_DIR = PROJECT_ROOT / "data" / "mla-tracker" / "sessions"

MAX_TOKENS = 800
EMBED_MODEL = "text-embedding-3-small"
BATCH_SIZE = 100  # OpenAI batch limit

SPEAKER_RE = re.compile(
    r"^([A-Z][a-zA-ZÀ-ÿ'\-]+(?: [A-Z][a-zA-ZÀ-ÿ'\-]+)+)\s+\(([^)]+)\)\s*:",
    re.MULTILINE,
)


def rough_token_count(text: str) -> int:
    # ~4 chars per token is a safe approximation for English prose
    return len(text) // 4


def split_sentences(text: str, max_tokens: int) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks, current = [], ""
    for sentence in sentences:
        candidate = (current + " " + sentence).strip()
        if rough_token_count(candidate) > max_tokens and current:
            chunks.append(current.strip())
            current = sentence
        else:
            current = candidate
    if current.strip():
        chunks.append(current.strip())
    return chunks


def extract_turns(lines: list[str]) -> list[dict]:
    """Split hansard.txt into per-speaker-turn dicts with line numbers."""
    turns = []
    current = None

    for i, line in enumerate(lines):
        m = SPEAKER_RE.match(line)
        if m:
            if current:
                current["line_end"] = i
                current["text"] = "\n".join(current["_lines"]).strip()
                del current["_lines"]
                turns.append(current)
            current = {
                "speaker": m.group(1).strip(),
                "party": m.group(2).strip(),
                "line_start": i + 1,
                "line_end": i + 1,
                "_lines": [line[m.end():].strip()],
            }
        elif current:
            current["_lines"].append(line)

    if current:
        current["line_end"] = len(lines)
        current["text"] = "\n".join(current["_lines"]).strip()
        del current["_lines"]
        turns.append(current)

    return turns


def make_chunks(slug: str, turns: list[dict]) -> list[dict]:
    chunks = []
    idx = 1
    for turn in turns:
        text = turn["text"]
        if not text:
            continue
        if rough_token_count(text) <= MAX_TOKENS:
            sub_texts = [text]
        else:
            sub_texts = split_sentences(text, MAX_TOKENS)
        for sub in sub_texts:
            if sub.strip():
                chunks.append({
                    "chunk_id": f"{slug}_{idx:03d}",
                    "speaker": turn["speaker"],
                    "party": turn["party"],
                    "line_start": turn["line_start"],
                    "line_end": turn["line_end"],
                    "text": sub.strip(),
                    "embedding": [],
                })
                idx += 1
    return chunks


def embed_chunks(chunks: list[dict], client: OpenAI) -> list[dict]:
    texts = [c["text"] for c in chunks]
    embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        response = client.embeddings.create(model=EMBED_MODEL, input=batch)
        embeddings.extend([item.embedding for item in response.data])
    for chunk, emb in zip(chunks, embeddings):
        chunk["embedding"] = emb
    return chunks


def write_embeddings(slug: str, chunks: list[dict]) -> Path:
    data = {"model": EMBED_MODEL, "chunks": chunks}
    out = DATA_DIR / slug / "embeddings.json"
    tmp = out.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.rename(out)
    return out


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m backend_tracker.scripts.chunk_and_embed <slug>")
        sys.exit(1)
    slug = sys.argv[1]
    hansard = DATA_DIR / slug / "hansard.txt"
    if not hansard.exists():
        print(f"hansard.txt not found for session: {slug}")
        sys.exit(1)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY not set")
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    lines = hansard.read_text(encoding="utf-8").splitlines()
    turns = extract_turns(lines)
    chunks = make_chunks(slug, turns)
    print(f"Embedding {len(chunks)} chunks...")
    chunks = embed_chunks(chunks, client)
    out = write_embeddings(slug, chunks)
    print(f"Embeddings written → {out}")


if __name__ == "__main__":
    main()
