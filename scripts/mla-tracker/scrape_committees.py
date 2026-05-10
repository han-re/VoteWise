"""
scrape_committees.py — Fetch committee attendance records from NI Assembly committee minutes.

Usage:
    python -m scripts.mla-tracker.scrape_committees [--dry-run]

Outputs:
    data/mla-tracker/raw/committee_attendance.json   (atomic write)

Source:
    https://www.niassembly.gov.uk/assembly-business/committees/
    Public committee minutes. No robots.txt restrictions.
    Cached for 28 days (minutes published monthly).
"""

from __future__ import annotations

import argparse
import hashlib
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

OUTPUT_FILE = RAW_DIR / "committee_attendance.json"

COMMITTEES_BASE = "https://www.niassembly.gov.uk/assembly-business/committees/"

# Committee pages we track per MLA
MLA_COMMITTEES: dict[str, list[dict[str, str]]] = {
    "Naomi Long": [
        {
            "name": "Committee on Justice",
            "role": "Member",
            "page": "2022-2027-mandate/justice/",
        }
    ],
    "Gavin Robinson": [
        {
            "name": "Committee for the Executive Office",
            "role": "Member",
            "page": "2022-2027-mandate/executive-office/",
        }
    ],
    "Michelle O'Neill": [
        {
            "name": "Business Committee",
            "role": "Member",
            "page": "2022-2027-mandate/business-committee/",
        }
    ],
    "Doug Beattie": [
        {
            "name": "Committee on Standards and Privileges",
            "role": "Member",
            "page": "2022-2027-mandate/standards-and-privileges/",
        }
    ],
    "Matthew O'Toole": [
        {
            "name": "Committee for Finance",
            "role": "Member",
            "page": "2022-2027-mandate/finance/",
        }
    ],
}

RATE_LIMIT_SECONDS = 3.0
CACHE_TTL_DAYS = 28

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:24]


def _cached_fetch(url: str, *, force_refresh: bool = False) -> str:
    cache_path = CACHE_DIR / f"{_cache_key(url)}_html.json"

    if not force_refresh and cache_path.exists():
        cached = json.loads(cache_path.read_text())
        fetched = date.fromisoformat(cached.get("fetched_on", "2000-01-01"))
        if (date.today() - fetched).days < CACHE_TTL_DAYS:
            return cached["html"]

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "MLA-Tracker/1.0 (accountability research)",
            "Accept": "text/html",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            content = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        log.error("HTTP %d fetching %s", exc.code, url)
        raise

    payload = {"fetched_on": date.today().isoformat(), "html": content}
    tmp = cache_path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False))
    os.rename(tmp, cache_path)
    time.sleep(RATE_LIMIT_SECONDS)
    return content


def _count_attendance_from_html(html_content: str, mla_name: str) -> dict[str, int]:
    """
    Count meetings attended and total meetings from committee minutes HTML.
    The minutes list member attendance with "Present:" or "Apologies:" sections.
    This is a heuristic — committee HTML format varies.
    """
    content_lower = html_content.lower()
    name_lower = mla_name.lower().split()[-1]  # Match on surname

    # Count pages/sections mentioning "present" — proxy for meeting records
    present_sections = content_lower.count("present:")
    attended = content_lower.count(name_lower)  # rough proxy

    return {
        "meetings_total": max(present_sections, 1),
        "meetings_attended": min(attended, present_sections),
    }


def _mock_attendance(mla_name: str, committee_name: str) -> dict[str, Any]:
    return {
        "committee": committee_name,
        "meetings_total": 12,
        "meetings_attended": 10,
        "attendance_pct": 83,
        "source_url": COMMITTEES_BASE,
        "note": "Dry-run mock",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape NI Assembly committee attendance")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force-refresh", action="store_true")
    args = parser.parse_args()

    log.info("Scraping committee attendance (dry_run=%s)", args.dry_run)

    results: dict[str, Any] = {
        "schema_version": "1.0.0",
        "last_updated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "mlas": {},
    }

    for mla_name, committees in MLA_COMMITTEES.items():
        log.info("Processing %s", mla_name)
        mla_records: list[dict[str, Any]] = []

        for committee in committees:
            url = COMMITTEES_BASE + committee["page"]

            if args.dry_run:
                record = _mock_attendance(mla_name, committee["name"])
            else:
                try:
                    html_content = _cached_fetch(url, force_refresh=args.force_refresh)
                    counts = _count_attendance_from_html(html_content, mla_name)
                    total = max(counts["meetings_total"], 1)
                    attended = min(counts["meetings_attended"], total)
                    record = {
                        "committee": committee["name"],
                        "role": committee["role"],
                        "meetings_total": total,
                        "meetings_attended": attended,
                        "attendance_pct": round((attended / total) * 100),
                        "source_url": url,
                    }
                except Exception as exc:
                    log.error("Failed to fetch committee data for %s / %s: %s", mla_name, committee["name"], exc)
                    record = {
                        "committee": committee["name"],
                        "role": committee["role"],
                        "error": str(exc),
                        "source_url": url,
                    }

            mla_records.append(record)
            log.info("  → %s: %s", committee["name"], record.get("attendance_pct", "error"))

        results["mlas"][mla_name] = {
            "committees": mla_records,
        }

    tmp = OUTPUT_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    os.rename(tmp, OUTPUT_FILE)
    log.info("Written to %s", OUTPUT_FILE)


if __name__ == "__main__":
    main()
