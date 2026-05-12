"""
summarise.py — Generate summary.json for a session using gpt-4o-mini.

Reads hansard.txt (or a 32k-token excerpt if too long), sends to OpenAI
with the summariser system prompt, writes summary.json atomically.

Output: data/mla-tracker/sessions/<slug>/summary.json
"""

import json
import os
import sys
from pathlib import Path

from openai import OpenAI
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

DATA_DIR = PROJECT_ROOT / "data" / "mla-tracker" / "sessions"
PROMPTS_DIR = Path(__file__).resolve().parents[1] / "prompts"

SUMMARISE_MODEL = "gpt-4o-mini"
# gpt-4o-mini context window is 128k tokens; we cap hansard input at ~100k chars (~25k tokens)
MAX_HANSARD_CHARS = 100_000


def load_system_prompt() -> str:
    return (PROMPTS_DIR / "summariser_system.txt").read_text(encoding="utf-8")


def summarise(slug: str, client: OpenAI) -> dict:
    hansard_path = DATA_DIR / slug / "hansard.txt"
    if not hansard_path.exists():
        raise FileNotFoundError(f"hansard.txt not found for {slug}")

    text = hansard_path.read_text(encoding="utf-8")
    if len(text) > MAX_HANSARD_CHARS:
        # Take first and last quarter to preserve opening and voting records
        quarter = MAX_HANSARD_CHARS // 4
        text = text[:MAX_HANSARD_CHARS // 2] + "\n\n[...transcript truncated for length...]\n\n" + text[-quarter:]

    system = load_system_prompt()
    response = client.chat.completions.create(
        model=SUMMARISE_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"SESSION SLUG: {slug}\n\nHANSARD TEXT:\n{text}"},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    summary = json.loads(raw)
    summary["session_id"] = slug
    # Extract date from slug (expects YYYY-MM-DD-... format)
    parts = slug.split("-")
    if len(parts) >= 3:
        summary["date"] = f"{parts[0]}-{parts[1]}-{parts[2]}"
    return summary


def write_summary(slug: str, data: dict) -> Path:
    out = DATA_DIR / slug / "summary.json"
    tmp = out.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.rename(out)
    return out


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m backend_tracker.scripts.summarise <slug>")
        sys.exit(1)
    slug = sys.argv[1]
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY not set")
        sys.exit(1)
    client = OpenAI(api_key=api_key)
    data = summarise(slug, client)
    out = write_summary(slug, data)
    print(f"Summary written → {out}")
    print(f"  session_type: {data.get('session_type')}")
    print(f"  card_summary: {data.get('card_summary')}")


if __name__ == "__main__":
    main()
