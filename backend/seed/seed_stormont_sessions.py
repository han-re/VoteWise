"""
Seed Stormont plenary sessions and per-MLA participation.

Run from project root:
    python -m backend.seed.seed_stormont_sessions

Source: backend/data/stormont_sessions.json (hand-curated, 6 plenary sittings).
All speech_count / division_votes / written_questions values are SYNTHETIC,
flagged in the source JSON's `_note`. Real Hansard counts would replace them
in production.

Writes two collections:
  db.stormont_sessions             — one document per sitting, _id = session_id
  db.mla_session_participation     — one document per (mla_id, session_id)

Idempotent: upserts on session_id and on (mla_id, session_id).
Each collection gets a {_id: "_meta", last_seeded_at: ISO} marker.

Engagement score per backend/data/engagement_methodology.md:
    engagement_score = 0.5 × speech_count_percentile
                     + 0.3 × division_participation_pct
                     + 0.2 × written_questions_percentile

Percentiles are computed within the cohort of MLAs who attended that sitting
so a single high-speech-count MLA does not punish the rest of the cohort.
"""
import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
SOURCE_PATH = DATA_DIR / "stormont_sessions.json"


def _percentile_within(value: int, cohort: list[int]) -> float:
    """Standard percentile-rank within a cohort, returned on a 0-100 scale.

    Uses (rank_below + 0.5 × ties) / cohort_size, which puts the median at 50
    and the lone maximum at <100 only when there are ties at the top.
    """
    if not cohort:
        return 0.0
    below = sum(1 for v in cohort if v < value)
    equal = sum(1 for v in cohort if v == value)
    return (below + 0.5 * equal) / len(cohort) * 100.0


def _engagement_score(
    speech: int,
    divisions: int,
    written: int,
    *,
    speech_cohort: list[int],
    written_cohort: list[int],
    total_divisions: int,
) -> float:
    speech_pctile = _percentile_within(speech, speech_cohort)
    written_pctile = _percentile_within(written, written_cohort)
    div_pct = (divisions / total_divisions * 100.0) if total_divisions else 0.0
    score = 0.5 * speech_pctile + 0.3 * div_pct + 0.2 * written_pctile
    return round(score, 1)


async def main() -> dict:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client["votewise"]

    with open(SOURCE_PATH, encoding="utf-8") as f:
        payload = json.load(f)
    sessions = payload["sessions"]

    sessions_written = 0
    participation_rows = 0

    for session in sessions:
        session_id = session["session_id"]
        total_divisions = int(session.get("total_divisions", 0))
        mla_rows = session["mla_participation"]

        attended = [r for r in mla_rows if r["attended"]]
        speech_cohort = [r["speech_count"] for r in attended]
        written_cohort = [r["written_questions"] for r in attended]

        session_doc = {
            "_id":              session_id,
            "session_id":       session_id,
            "date":             session["date"],
            "title":            session["title"],
            "agenda_summary":   session["agenda_summary"],
            "hansard_url":      session["hansard_url"],
            "total_divisions":  total_divisions,
            "attendee_count":   len(attended),
            "speech_count_total": sum(speech_cohort),
        }
        await db.stormont_sessions.replace_one(
            {"_id": session_id}, session_doc, upsert=True
        )
        sessions_written += 1

        for row in mla_rows:
            mla_id = row["mla_id"]
            attended_flag = bool(row["attended"])
            speech = int(row["speech_count"])
            divisions = int(row["division_votes"])
            written = int(row["written_questions"])

            if attended_flag:
                score = _engagement_score(
                    speech, divisions, written,
                    speech_cohort=speech_cohort,
                    written_cohort=written_cohort,
                    total_divisions=total_divisions,
                )
            else:
                score = 0.0

            participation_doc = {
                "mla_id":            mla_id,
                "session_id":        session_id,
                "session_date":      session["date"],
                "attended":          attended_flag,
                "speech_count":      speech,
                "division_votes":    divisions,
                "written_questions": written,
                "engagement_score":  score,
            }
            await db.mla_session_participation.update_one(
                {"mla_id": mla_id, "session_id": session_id},
                {"$set": participation_doc},
                upsert=True,
            )
            participation_rows += 1

    last_seeded_at = datetime.now(timezone.utc).isoformat()
    for coll in (db.stormont_sessions, db.mla_session_participation):
        await coll.update_one(
            {"_id": "_meta"},
            {"$set": {"_id": "_meta", "last_seeded_at": last_seeded_at}},
            upsert=True,
        )

    print(f"sessions: {sessions_written}")
    print(f"participation_rows: {participation_rows}")
    print(f"last_seeded_at: {last_seeded_at}")

    return {
        "sessions": sessions_written,
        "participation_rows": participation_rows,
        "last_seeded_at": last_seeded_at,
    }


if __name__ == "__main__":
    asyncio.run(main())
