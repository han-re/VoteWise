"""
process_session.py — End-to-end pipeline: PDF → 4 JSON output files.

Steps:
  1. Extract text from PDF → hansard.txt
  2. Parse speaker metadata → metadata.json
  3. Summarise via gpt-4o-mini → summary.json
  4. Chunk by speaker turn + embed via text-embedding-3-small → embeddings.json
  5. Update data/mla-tracker/page.json with the new session

Usage (from project root):
  python backend-tracker/scripts/process_session.py raw-pdfs/session.pdf YYYY-MM-DD-slug
"""

import json
import os
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPTS_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load .env from backend-tracker/ directory
sys.path.insert(0, str(BACKEND_DIR))
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

from openai import OpenAI

# Import sibling scripts directly (no package prefix needed)
from extract_pdf import extract_text, write_hansard
from extract_metadata import build_metadata, write_metadata
from summarise import summarise, write_summary
from chunk_and_embed import extract_turns, make_chunks, embed_chunks, write_embeddings

DATA_DIR = PROJECT_ROOT / "data" / "mla-tracker"
SESSIONS_DIR = DATA_DIR / "sessions"


def update_page_json(slug: str, summary: dict) -> None:
    page_path = DATA_DIR / "page.json"
    page: dict = {}
    if page_path.exists():
        try:
            page = json.loads(page_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            page = {}

    session_entry = {
        "slug": slug,
        "date": summary.get("date", ""),
        "headline": summary.get("card_summary", ""),
        "session_type": summary.get("session_type", "plenary"),
        "key_topics": summary.get("key_topics", []),
    }

    # Featured = most recent by date, set after sorting
    pass  # set below after sort

    existing = page.get("recent_sessions", [])
    existing = [s for s in existing if s["slug"] != slug]
    existing.append(session_entry)
    # Always sort by date descending so newest session is first regardless of processing order
    existing.sort(key=lambda s: s.get("date", ""), reverse=True)
    page["recent_sessions"] = existing[:20]
    page["schema_version"] = "1.0"
    page["last_updated"] = existing[0]["date"] if existing else summary.get("date", slug[:10])

    # Featured is always the most recent session by date
    most_recent = existing[0] if existing else session_entry
    # Load that session's summary to get the full headline
    most_recent_slug = most_recent["slug"]
    most_recent_summary_path = SESSIONS_DIR / most_recent_slug / "summary.json"
    if most_recent_summary_path.exists():
        import json as _json
        mr_summary = _json.loads(most_recent_summary_path.read_text(encoding="utf-8"))
        page["featured"] = {
            "headline": mr_summary.get("card_summary", ""),
            "kicker": mr_summary.get("session_type", "plenary").title(),
            "summary": mr_summary.get("card_summary", ""),
            "session_slug": most_recent_slug,
        }
    else:
        page["featured"] = {
            "headline": summary.get("card_summary", ""),
            "kicker": summary.get("session_type", "plenary").title(),
            "summary": summary.get("card_summary", ""),
            "session_slug": slug,
        }

    tmp = page_path.with_suffix(".tmp")
    tmp.write_text(json.dumps(page, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.rename(page_path)


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python backend-tracker/scripts/process_session.py <pdf> <slug>")
        print("  slug format: YYYY-MM-DD-description")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    slug = sys.argv[2]

    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}")
        sys.exit(1)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY not set — check backend-tracker/.env")
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    session_dir = SESSIONS_DIR / slug
    session_dir.mkdir(parents=True, exist_ok=True)

    print(f"[1/5] Extracting PDF: {pdf_path.name}")
    text = extract_text(pdf_path)
    write_hansard(slug, text)
    lines = text.splitlines()
    print(f"      {len(lines)} lines extracted")

    print("[2/5] Parsing speaker metadata")
    meta = build_metadata(slug, lines)
    write_metadata(slug, meta)
    print(f"      {len(meta['speakers'])} speakers, {len(meta['topics_raised'])} topics")

    print("[3/5] Summarising session (gpt-4o-mini)")
    summary = summarise(slug, client)
    write_summary(slug, summary)
    print(f"      {summary.get('card_summary', '')[:80]}")

    print("[4/5] Chunking and embedding (text-embedding-3-small)")
    turns = extract_turns(lines)
    chunks = make_chunks(slug, turns)
    print(f"      {len(chunks)} chunks to embed")
    chunks = embed_chunks(chunks, client)
    write_embeddings(slug, chunks)

    print("[5/5] Updating page.json")
    update_page_json(slug, summary)

    print(f"\nDone. '{slug}' ready.")
    print(f"  Output: {session_dir}")


if __name__ == "__main__":
    main()
