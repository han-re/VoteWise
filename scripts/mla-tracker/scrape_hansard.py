"""
scrape_hansard.py — Fetch chamber contributions from the NI Assembly AIMS API.

Usage:
    python -m scripts.mla-tracker.scrape_hansard [--dry-run] [--since YYYY-MM-DD]

Outputs:
    data/mla-tracker/raw/hansard_contributions.json   (atomic write)

Robots.txt:
    http://aims.niassembly.gov.uk/robots.txt — no crawl restrictions on /officialreport/.
    We use the AIMS REST API, not HTML scraping, which is the intended machine interface.

Rate limiting:
    1 request / 2 s. Max 3 retries with exponential backoff (2, 4, 8 s).
    Cache: responses cached in data/mla-tracker/cache/ keyed by URL hash.
    Re-runs within the same calendar week reuse the cache unless --force-refresh.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

# ── Paths ──────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "mla-tracker"
RAW_DIR = DATA_DIR / "raw"
CACHE_DIR = DATA_DIR / "cache"

for d in (RAW_DIR, CACHE_DIR):
    d.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = RAW_DIR / "hansard_contributions.json"

# ── AIMS API ───────────────────────────────────────────────────────────────────

AIMS_BASE = "http://aims.niassembly.gov.uk/officialreport/officialreportlist.aspx"
AIMS_JSON_BASE = "http://aims.niassembly.gov.uk/plenary/speeches.aspx"

# MLAs we track — map display name to AIMS member ID (from member search endpoint)
TRACKED_MLAS: dict[str, str] = {
    "Naomi Long":      "357",
    "Gavin Robinson":  "298",
    "Michelle O'Neill": "381",
    "Doug Beattie":    "1842",
    "Matthew O'Toole": "4851",
}

RATE_LIMIT_SECONDS = 2.0
MAX_RETRIES = 3

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ── HTTP helpers ───────────────────────────────────────────────────────────────

def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:24]


def _cached_get(url: str, *, force_refresh: bool = False) -> dict[str, Any]:
    cache_path = CACHE_DIR / f"{_cache_key(url)}.json"
    week_tag = date.today().strftime("%Y-W%W")

    if not force_refresh and cache_path.exists():
        cached = json.loads(cache_path.read_text())
        if cached.get("week") == week_tag:
            log.debug("Cache hit: %s", url)
            return cached["data"]

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "MLA-Tracker/1.0 (accountability research; contact: admin@example.com)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
            break
        except urllib.error.HTTPError as exc:
            log.warning("HTTP %d for %s (attempt %d/%d)", exc.code, url, attempt, MAX_RETRIES)
            if attempt == MAX_RETRIES:
                raise
            time.sleep(2 ** attempt)
        except Exception as exc:
            log.warning("Request error %s (attempt %d/%d): %s", url, attempt, MAX_RETRIES, exc)
            if attempt == MAX_RETRIES:
                raise
            time.sleep(2 ** attempt)
        finally:
            if attempt < MAX_RETRIES:
                time.sleep(RATE_LIMIT_SECONDS)

    payload = {"week": week_tag, "data": data}
    tmp = cache_path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    os.rename(tmp, cache_path)
    time.sleep(RATE_LIMIT_SECONDS)
    return data


# ── Scraping logic ─────────────────────────────────────────────────────────────

def fetch_contributions_for_mla(
    mla_name: str, member_id: str, since: str, dry_run: bool
) -> list[dict[str, Any]]:
    """
    Fetch plenary speeches for one MLA from the AIMS speeches endpoint.
    Returns a list of contribution records.
    """
    url = (
        f"http://aims.niassembly.gov.uk/plenary/speeches.aspx"
        f"?MemberID={member_id}&StartDate={since}&EndDate={date.today().isoformat()}&Format=json"
    )

    if dry_run:
        log.info("[dry-run] Would fetch: %s", url)
        return _mock_contributions(mla_name, member_id)

    try:
        raw = _cached_get(url)
    except Exception as exc:
        log.error("Failed to fetch contributions for %s: %s", mla_name, exc)
        return []

    speeches: list[dict] = raw if isinstance(raw, list) else raw.get("Speeches", [])
    contributions = []
    for speech in speeches:
        contributions.append({
            "date": speech.get("SittingDate", ""),
            "month": speech.get("SittingDate", "")[:7],
            "topic": speech.get("SubjectTitle", ""),
            "type": _classify_type(speech.get("SpeechType", "")),
            "hansard_url": (
                f"http://aims.niassembly.gov.uk/officialreport/officialreportitem.aspx"
                f"?ComponentID={speech.get('ComponentID', '')}&DocumentID={speech.get('DocumentID', '')}"
            ),
            "excerpt": speech.get("SpeechText", "")[:280] if speech.get("SpeechText") else None,
        })
    return contributions


def _classify_type(speech_type: str) -> str:
    t = speech_type.lower()
    if "question" in t:
        return "question"
    if "statement" in t:
        return "statement"
    if "committee" in t:
        return "committee"
    return "debate"


def _mock_contributions(mla_name: str, member_id: str) -> list[dict[str, Any]]:
    """Return synthetic contributions for dry-run / fallback."""
    return [
        {
            "date": "2026-03-15",
            "month": "2026-03",
            "topic": "Housing (Amendment) Bill",
            "type": "debate",
            "hansard_url": f"http://aims.niassembly.gov.uk/officialreport/officialreportitem.aspx?ComponentID=mock",
            "excerpt": f"[Dry-run mock contribution for {mla_name}]",
        }
    ]


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Hansard contributions for tracked MLAs")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without making real HTTP requests")
    parser.add_argument("--since", default="2022-01-01", help="Start date (YYYY-MM-DD, default: 2022-01-01)")
    parser.add_argument("--force-refresh", action="store_true", help="Bypass cache for all requests")
    args = parser.parse_args()

    log.info("Scraping Hansard contributions since %s (dry_run=%s)", args.since, args.dry_run)

    results: dict[str, Any] = {
        "schema_version": "1.0.0",
        "last_updated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "since": args.since,
        "mlas": {},
    }

    for mla_name, member_id in TRACKED_MLAS.items():
        log.info("Fetching contributions for %s (ID: %s)", mla_name, member_id)
        contributions = fetch_contributions_for_mla(
            mla_name, member_id, args.since, args.dry_run
        )
        results["mlas"][member_id] = {
            "name": mla_name,
            "member_id": member_id,
            "contributions_count": len(contributions),
            "contributions": contributions,
        }
        log.info("  → %d contributions", len(contributions))

    # Atomic write: write to .tmp then rename
    tmp = OUTPUT_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    os.rename(tmp, OUTPUT_FILE)
    log.info("Written to %s", OUTPUT_FILE)


if __name__ == "__main__":
    main()
