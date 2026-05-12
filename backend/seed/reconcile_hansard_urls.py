"""
Reconcile every MLA vote date against the scraped NI Assembly Hansard index.

Run from project root:  python -m backend.seed.reconcile_hansard_urls

Reads MLAS from backend.seed.seed_real_mlas and backend/data/hansard_index.json
(produced by scrape_hansard_index.py). For each vote it works out the correct
report.aspx deep link (eveDate + real docID) when the vote's date matches a real
sitting, or falls back to the canonical Official Reports index page when it does
not. Prints a per-MLA report and writes backend/data/hansard_reconciliation.json
so apply-step (and any future re-run) is reproducible.

This is a one-shot dev tool. It does not touch the database or the network.
"""
import json
import re
from pathlib import Path

from backend.seed.seed_real_mlas import MLAS

ROOT_DIR = Path(__file__).resolve().parents[2]
INDEX_PATH = ROOT_DIR / "backend" / "data" / "hansard_index.json"
OUT_PATH = ROOT_DIR / "backend" / "data" / "hansard_reconciliation.json"

# When a vote's date does not line up with a real plenary sitting, point at the
# Official Reports index, which always renders real content; the frontend label
# tells the reader which sitting date to look for.
INDEX_FALLBACK_URL = "https://aims.niassembly.gov.uk/officialreport/reports.aspx"

PREFERRED_VENUE = "Assembly Chamber"

_ISO_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
_SLASH_RE = re.compile(r"^(\d{4})/(\d{2})/(\d{2})$")


def _to_iso(value: str) -> str:
    value = (value or "").strip()
    if _ISO_RE.match(value):
        return value
    m = _SLASH_RE.match(value)
    if m:
        return "%s-%s-%s" % m.groups()
    return value  # leave anything unexpected as-is; it simply won't match


def _load_index() -> dict:
    entries = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    by_date: dict[str, list] = {}
    for e in entries:
        by_date.setdefault(_to_iso(e["eveDate"]), []).append(e)
    return by_date


def _pick(entries: list) -> dict:
    for e in entries:
        if e.get("venue") == PREFERRED_VENUE:
            return e
    return entries[0]


def reconcile() -> list:
    by_date = _load_index()
    records = []
    for mla in MLAS:
        for vote_index, vote in enumerate(mla.get("votes", [])):
            iso = _to_iso(vote.get("date", ""))
            existing_url = vote.get("hansard_url", "")
            entries = by_date.get(iso)
            if entries:
                chosen = _pick(entries)
                expected_url = chosen["url"]
                matched = True
            else:
                expected_url = INDEX_FALLBACK_URL
                matched = False
            records.append({
                "mla_id": mla["_id"],
                "vote_index": vote_index,
                "date": iso,
                "bill": vote.get("bill", ""),
                "matched": matched,
                "existing_url": existing_url,
                "expected_url": expected_url,
                "diff": None if existing_url == expected_url else {"from": existing_url, "to": expected_url},
            })
    return records


def _print_report(records: list) -> None:
    by_mla: dict[str, list] = {}
    for r in records:
        by_mla.setdefault(r["mla_id"], []).append(r)

    for mla_id, rows in by_mla.items():
        print(f"\n{mla_id}")
        for r in rows:
            mark = "✓" if r["matched"] else "✗"
            print(f"  [{mark}] {mla_id} | {r['date']} | {r['bill']} | {'matched' if r['matched'] else 'no sitting on this date'}")
        matched = sum(1 for r in rows if r["matched"])
        print(f"  -- {matched}/{len(rows)} matched")

    total = len(records)
    matched = sum(1 for r in records if r["matched"])
    unmatched = total - matched
    unmatched_dates = sorted({r["date"] for r in records if not r["matched"]})
    print("\n" + "=" * 60)
    print(f"Total votes:        {total}")
    print(f"Matched:            {matched}")
    print(f"Unmatched:          {unmatched}")
    print(f"Distinct unmatched dates ({len(unmatched_dates)}): {', '.join(unmatched_dates) if unmatched_dates else '(none)'}")
    if unmatched:
        print("\nUnmatched votes fall back to the Official Reports index page; the seed comment\n"
              "and the frontend label both flag them. Correcting the underlying dates is a\n"
              "separate follow-up - not part of this fix.")


def main() -> None:
    records = reconcile()
    _print_report(records)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nWrote {len(records)} reconciliation records to {OUT_PATH.relative_to(ROOT_DIR)}")


if __name__ == "__main__":
    main()
