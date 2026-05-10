"""
extract_pdf.py — Extract raw text from a Hansard PDF.

Output: plain text with one line per PDF line, written to
  data/mla-tracker/sessions/<slug>/hansard.txt

Usage:
  python -m backend_tracker.scripts.extract_pdf <path-to-pdf> <session-slug>
"""

import sys
import os
import tempfile
from pathlib import Path

import pypdf


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data" / "mla-tracker" / "sessions"


def extract_text(pdf_path: Path) -> str:
    reader = pypdf.PdfReader(str(pdf_path))
    pages = []
    for page in reader.pages:
        text = page.extract_text(extraction_mode="layout")
        if text:
            pages.append(text)
    return "\n".join(pages)


def write_hansard(slug: str, text: str) -> Path:
    session_dir = DATA_DIR / slug
    session_dir.mkdir(parents=True, exist_ok=True)
    out = session_dir / "hansard.txt"
    # Atomic write
    tmp = out.with_suffix(".tmp")
    tmp.write_text(text, encoding="utf-8")
    tmp.rename(out)
    return out


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python -m backend_tracker.scripts.extract_pdf <pdf> <slug>")
        sys.exit(1)
    pdf_path = Path(sys.argv[1])
    slug = sys.argv[2]
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}")
        sys.exit(1)
    text = extract_text(pdf_path)
    out = write_hansard(slug, text)
    print(f"Extracted {len(text.splitlines())} lines → {out}")


if __name__ == "__main__":
    main()
