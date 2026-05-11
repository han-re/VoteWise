"""
Stamp every MLA Tracker record on Solana devnet.

Run from the project root:

    python -m backend.seed.verify_tracker_records

This is the publication-time verification path for tracker pages. The public
frontend can verify hashes, but it cannot create new chain stamps.
"""
import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from backend.services.solana_service import verify_profile_on_chain

ROOT_DIR = Path(__file__).resolve().parents[2]
TRACKER_DATA_DIR = ROOT_DIR / "data" / "mla-tracker"


def _read_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _tracker_mla_payload(mla: dict) -> tuple[str, dict]:
    mla_id = mla["id"]
    return (
        f"tracker_mla_{mla_id}",
        {
            "record_type": "tracker_mla",
            "mla_id": mla_id,
            "mla": mla,
        },
    )


def _tracker_session_payload(session_dir: Path) -> tuple[str, dict]:
    slug = session_dir.name
    summary = _read_json(session_dir / "summary.json")
    metadata_path = session_dir / "metadata.json"
    metadata = _read_json(metadata_path) if metadata_path.exists() else None
    return (
        f"tracker_session_{slug}",
        {
            "record_type": "tracker_session",
            "slug": slug,
            "summary": summary,
            "metadata": metadata,
        },
    )


def _iter_tracker_records() -> list[tuple[str, dict, str]]:
    records: list[tuple[str, dict, str]] = []

    mlas = _read_json(TRACKER_DATA_DIR / "mlas.json").get("mlas", [])
    for mla in mlas:
        record_id, payload = _tracker_mla_payload(mla)
        records.append((record_id, payload, mla.get("name", record_id)))

    sessions_dir = TRACKER_DATA_DIR / "sessions"
    for session_dir in sorted(sessions_dir.iterdir()):
        if not session_dir.is_dir() or session_dir.name.startswith("_"):
            continue
        if not (session_dir / "summary.json").exists():
            continue
        record_id, payload = _tracker_session_payload(session_dir)
        title = payload["summary"].get("card_summary", session_dir.name)
        records.append((record_id, payload, title))

    return records


async def main() -> None:
    load_dotenv(ROOT_DIR / "backend" / ".env")

    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client["votewise"]

    records = _iter_tracker_records()
    print(f"Stamping {len(records)} tracker records on Solana devnet...\n")

    fallback_count = 0
    for record_id, payload, label in records:
        try:
            result = await verify_profile_on_chain(record_id, payload, db)
            fallback = bool(result.get("fallback"))
            fallback_count += int(fallback)
            mode = "fallback" if fallback else "real"
            print(f"  {record_id:<42} {mode:<8} {result.get('tx_signature')}")
        except Exception as exc:
            print(f"  {record_id:<42} ERROR    {label}: {exc}")

    total = await db.chain_state.count_documents({})
    print(f"\nDone. {total} total chain_state records in MongoDB.")
    if fallback_count:
        print(f"Warning: {fallback_count} tracker record(s) used fallback mode, not real Solana transactions.")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
