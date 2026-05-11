"""
scrape_voting.py — Fetch division (voting) records from the NI Assembly AIMS API.

Usage:
    python -m scripts.mla-tracker.scrape_voting [--dry-run] [--since YYYY-MM-DD]

Outputs:
    data/mla-tracker/raw/voting_records.json   (atomic write)

Source:
    AIMS Divisions API: http://aims.niassembly.gov.uk/voting/divisions.aspx
    No crawl restrictions. API is the intended machine interface.
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

OUTPUT_FILE = RAW_DIR / "voting_records.json"

AIMS_DIVISIONS_BASE = "http://aims.niassembly.gov.uk/voting/divisions.aspx"

TRACKED_MLAS: dict[str, str] = {
    "Naomi Long":       "357",
    "Gavin Robinson":   "298",
    "Michelle O'Neill": "381",
    "Doug Beattie":     "1842",
    "Matthew O'Toole":  "4851",
}

# Map bill keywords to policy axis
POLICY_AXIS_MAP: list[tuple[str, str]] = [
    ("Climate",        "environment"),
    ("Housing",        "housing"),
    ("Education",      "education"),
    ("Health",         "health"),
    ("Identity",       "language"),
    ("Language",       "language"),
    ("Hate Crime",     "equality"),
    ("Welfare",        "welfare"),
    ("Justice",        "justice"),
    ("Economy",        "economy"),
    ("Corporation",    "economy"),
    ("Legacy",         "justice"),
    ("Integrated",     "education"),
]

RATE_LIMIT_SECONDS = 2.0
MAX_RETRIES = 3

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:24]


def _cached_get(url: str, *, force_refresh: bool = False) -> Any:
    cache_path = CACHE_DIR / f"{_cache_key(url)}.json"
    week_tag = date.today().strftime("%Y-W%W")

    if not force_refresh and cache_path.exists():
        cached = json.loads(cache_path.read_text())
        if cached.get("week") == week_tag:
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
        except Exception as exc:
            log.warning("Request error (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)
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


def _infer_policy_axis(title: str) -> str:
    for keyword, axis in POLICY_AXIS_MAP:
        if keyword.lower() in title.lower():
            return axis
    return "other"


def _normalise_vote(raw: str) -> str:
    r = raw.strip().lower()
    if r in ("aye", "for", "yes"):
        return "For"
    if r in ("no", "against", "nay"):
        return "Against"
    if r in ("abstain", "abstention"):
        return "Abstain"
    return "Not Present"


def fetch_votes_for_mla(
    mla_name: str, member_id: str, since: str, dry_run: bool
) -> list[dict[str, Any]]:
    url = (
        f"{AIMS_DIVISIONS_BASE}"
        f"?MemberID={member_id}&StartDate={since}&EndDate={date.today().isoformat()}&Format=json"
    )

    if dry_run:
        log.info("[dry-run] Would fetch: %s", url)
        return _mock_votes(mla_name)

    try:
        raw = _cached_get(url)
    except Exception as exc:
        log.error("Failed to fetch votes for %s: %s", mla_name, exc)
        return []

    divisions: list[dict] = raw if isinstance(raw, list) else raw.get("Divisions", [])
    votes = []
    for div in divisions:
        title = div.get("DivisionTitle", div.get("MotionTitle", "Unknown bill"))
        vote_raw = div.get("MemberVote", div.get("Vote", "Not Present"))
        division_id = div.get("DivisionID", "")
        votes.append({
            "id": f"vote_{division_id}",
            "bill": title,
            "date": div.get("DivisionDate", ""),
            "vote": _normalise_vote(vote_raw),
            "policy_axis": _infer_policy_axis(title),
            "hansard_url": (
                f"http://aims.niassembly.gov.uk/voting/divisionresult.aspx?DivisionID={division_id}"
            ),
            "provenance": {
                "value": _normalise_vote(vote_raw),
                "source": "NI Assembly AIMS Divisions API",
                "source_urls": [
                    f"http://aims.niassembly.gov.uk/voting/divisionresult.aspx?DivisionID={division_id}"
                ],
                "computed_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "method": "Direct extraction from AIMS voting record",
            },
        })
    return votes


def _mock_votes(mla_name: str) -> list[dict[str, Any]]:
    return [
        {
            "id": "vote_mock_001",
            "bill": "Climate Change Act (NI) 2022",
            "date": "2022-03-09",
            "vote": "For",
            "policy_axis": "environment",
            "hansard_url": "http://aims.niassembly.gov.uk/voting/divisionresult.aspx?DivisionID=mock",
            "provenance": {
                "value": "For",
                "source": "Mock (dry-run)",
                "source_urls": [],
                "computed_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "method": "Dry-run mock",
            },
        }
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape NI Assembly division records")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--since", default="2022-01-01")
    parser.add_argument("--force-refresh", action="store_true")
    args = parser.parse_args()

    log.info("Scraping voting records since %s (dry_run=%s)", args.since, args.dry_run)

    results: dict[str, Any] = {
        "schema_version": "1.0.0",
        "last_updated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "since": args.since,
        "mlas": {},
    }

    for mla_name, member_id in TRACKED_MLAS.items():
        log.info("Fetching votes for %s (ID: %s)", mla_name, member_id)
        votes = fetch_votes_for_mla(mla_name, member_id, args.since, args.dry_run)
        results["mlas"][member_id] = {
            "name": mla_name,
            "member_id": member_id,
            "votes_count": len(votes),
            "votes": votes,
        }
        log.info("  → %d divisions", len(votes))

    tmp = OUTPUT_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    os.rename(tmp, OUTPUT_FILE)
    log.info("Written to %s", OUTPUT_FILE)


if __name__ == "__main__":
    main()
