"""
scrape_register.py — Extract declared interests from the NI Assembly Register of Members' Interests.

Usage:
    python -m scripts.mla-tracker.scrape_register [--dry-run]

Outputs:
    data/mla-tracker/raw/declared_interests.json   (atomic write)

Source:
    https://www.niassembly.gov.uk/your-mlas/register-of-interests/
    Publicly available HTML. No robots.txt restriction on /your-mlas/.
    We cache aggressively (one pull per month per page) to avoid server load.

Note:
    The Register is published as HTML, not an API. We parse the member interest
    pages using the stdlib html.parser — no third-party dependencies required.
"""

from __future__ import annotations

import argparse
import hashlib
import html.parser
import json
import logging
import os
import time
import urllib.request
import urllib.error
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "mla-tracker"
RAW_DIR = DATA_DIR / "raw"
CACHE_DIR = DATA_DIR / "cache"

for d in (RAW_DIR, CACHE_DIR):
    d.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = RAW_DIR / "declared_interests.json"

REGISTER_BASE = "https://www.niassembly.gov.uk/your-mlas/register-of-interests/"

# Slug → display name (as it appears in the Register URL structure)
TRACKED_MLA_SLUGS: dict[str, str] = {
    "naomi-long":      "Naomi Long",
    "gavin-robinson":  "Gavin Robinson",
    "michelle-oneill": "Michelle O'Neill",
    "doug-beattie":    "Doug Beattie",
    "matthew-otoole":  "Matthew O'Toole",
}

RATE_LIMIT_SECONDS = 3.0  # Be conservative — HTML scraping, not API
CACHE_TTL_DAYS = 28       # Register updates monthly; cache for 4 weeks

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:24]


def _cached_fetch_html(url: str, *, force_refresh: bool = False) -> str:
    cache_path = CACHE_DIR / f"{_cache_key(url)}_html.json"

    if not force_refresh and cache_path.exists():
        cached = json.loads(cache_path.read_text())
        cached_date = date.fromisoformat(cached.get("fetched_on", "2000-01-01"))
        if (date.today() - cached_date).days < CACHE_TTL_DAYS:
            log.debug("Cache hit (HTML): %s", url)
            return cached["html"]

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "MLA-Tracker/1.0 (accountability research; source: public NI Assembly records)",
            "Accept": "text/html",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            html_content = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        log.error("HTTP %d fetching %s", exc.code, url)
        raise

    payload = {"fetched_on": date.today().isoformat(), "html": html_content}
    tmp = cache_path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False))
    os.rename(tmp, cache_path)
    time.sleep(RATE_LIMIT_SECONDS)
    return html_content


class _InterestParser(html.parser.HTMLParser):
    """
    Minimal parser that extracts interest entries from the NI Assembly
    Register of Members' Interests HTML.

    The Register uses a table structure: each category is a <th> or <h3>
    and each declaration is a <td> or <li>. This parser is intentionally
    lenient — the HTML structure varies across mandate years.
    """

    def __init__(self) -> None:
        super().__init__()
        self.interests: list[dict[str, str]] = []
        self._current_category: str = ""
        self._in_td = False
        self._td_content: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ("td", "li"):
            self._in_td = True
            self._td_content = []

    def handle_endtag(self, tag: str) -> None:
        if tag in ("td", "li") and self._in_td:
            text = " ".join(self._td_content).strip()
            if text and len(text) > 8 and self._current_category:
                self.interests.append({
                    "type": self._current_category,
                    "description": text,
                })
            self._in_td = False

    def handle_data(self, data: str) -> None:
        cleaned = data.strip()
        if not cleaned:
            return
        if self._in_td:
            self._td_content.append(cleaned)
        # Category headings are usually short uppercase strings not in a td
        elif len(cleaned) < 80 and cleaned.isupper():
            self._current_category = cleaned.title()


def parse_interests_from_html(html_content: str) -> list[dict[str, Any]]:
    parser = _InterestParser()
    parser.feed(html_content)
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for interest in parser.interests:
        key = f"{interest['type']}:{interest['description'][:60]}"
        if key not in seen:
            seen.add(key)
            unique.append({
                "type": interest["type"],
                "entity": interest["description"],
                "registered_date": "",  # Not always parseable from HTML
                "source_url": REGISTER_BASE,
                "provenance": {
                    "value": interest["description"],
                    "source": "NI Assembly Register of Members' Interests",
                    "source_urls": [REGISTER_BASE],
                    "computed_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                    "method": "HTML extraction from public Register page",
                },
            })
    return unique


def _mock_interests(mla_name: str) -> list[dict[str, Any]]:
    return [
        {
            "type": "Remunerated Employment",
            "entity": f"[Dry-run mock interest for {mla_name}]",
            "registered_date": "",
            "source_url": REGISTER_BASE,
            "provenance": {
                "value": "Mock",
                "source": "Dry-run mock",
                "source_urls": [],
                "computed_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "method": "Dry-run",
            },
        }
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape NI Assembly Register of Members' Interests")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force-refresh", action="store_true")
    args = parser.parse_args()

    log.info("Scraping Register of Interests (dry_run=%s)", args.dry_run)

    results: dict[str, Any] = {
        "schema_version": "1.0.0",
        "last_updated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "mlas": {},
    }

    for slug, mla_name in TRACKED_MLA_SLUGS.items():
        log.info("Fetching interests for %s", mla_name)

        if args.dry_run:
            interests = _mock_interests(mla_name)
        else:
            url = f"{REGISTER_BASE}{slug}/"
            try:
                html_content = _cached_fetch_html(url, force_refresh=args.force_refresh)
                interests = parse_interests_from_html(html_content)
            except Exception as exc:
                log.error("Failed to fetch interests for %s: %s", mla_name, exc)
                interests = []

        results["mlas"][slug] = {
            "name": mla_name,
            "slug": slug,
            "interests_count": len(interests),
            "interests": interests,
        }
        log.info("  → %d interest entries", len(interests))

    tmp = OUTPUT_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    os.rename(tmp, OUTPUT_FILE)
    log.info("Written to %s", OUTPUT_FILE)


if __name__ == "__main__":
    main()
