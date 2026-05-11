import json
import os
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

from routers.quiz_router import router as quiz_router
from routers.pro_router import router as pro_router
app.include_router(quiz_router)
app.include_router(pro_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_mongo_client: AsyncIOMotorClient | None = None
_chain_state_cache: dict = {}
_politician_cache: dict = {
    "pol_001": {"politician_id": "pol_001", "stub": True},
}
_TRACKER_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "mla-tracker"


def get_db():
    global _mongo_client
    if _mongo_client is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3000)
    return _mongo_client["votewise"]
def _read_tracker_json(relative_path: str) -> dict:
    full_path = _TRACKER_DATA_DIR / relative_path
    with open(full_path, encoding="utf-8") as f:
        return json.load(f)


def _validate_tracker_slug(slug: str) -> None:
    if not re.fullmatch(r"[A-Za-z0-9_-]+", slug):
        raise HTTPException(status_code=400, detail="Invalid tracker id")


def _tracker_mla_payload(mla_id: str) -> dict:
    _validate_tracker_slug(mla_id)
    data = _read_tracker_json("mlas.json")
    mla = next((item for item in data.get("mlas", []) if item.get("id") == mla_id), None)
    if not mla:
        raise HTTPException(status_code=404, detail="Tracker MLA not found")
    return {
        "record_type": "tracker_mla",
        "mla_id": mla_id,
        "mla": mla,
    }


def _tracker_session_payload(slug: str) -> dict:
    _validate_tracker_slug(slug)
    session_dir = _TRACKER_DATA_DIR / "sessions" / slug
    summary_path = session_dir / "summary.json"
    if not summary_path.exists():
        raise HTTPException(status_code=404, detail="Tracker session not found")

    with open(summary_path, encoding="utf-8") as f:
        summary = json.load(f)

    metadata = None
    metadata_path = session_dir / "metadata.json"
    if metadata_path.exists():
        with open(metadata_path, encoding="utf-8") as f:
            metadata = json.load(f)

    return {
        "record_type": "tracker_session",
        "slug": slug,
        "summary": summary,
        "metadata": metadata,
    }


async def _get_chain_record(politician_id: str) -> dict | None:
    """Shared lookup for chain_state — used by all /chain endpoints."""
    try:
        db = get_db()
        await db.command("ping")
        return await db.chain_state.find_one(
            {"politician_id": politician_id}, {"_id": 0}
        )
    except Exception:
        return _chain_state_cache.get(politician_id)


async def _get_mla(mla_id: str) -> dict | None:
    """Shared MLA lookup — used by /mla/{id} and /politician/{id}."""
    db = get_db()
    return await db["mlas"].find_one({"_id": mla_id})


# ------------------------------------------------------------------ health

@app.get("/health")
def health():
    return {"status": "ok"}


# ------------------------------------------------------------------ parties

@app.get("/parties")
async def get_parties():
    db = get_db()
    parties = await db["parties"].find({}).to_list(None)
    if parties:
        return parties
    return await db["Parties"].find({}).to_list(None)


@app.get("/party/{party_id}")
async def get_party(party_id: str):
    db = get_db()
    party = await db["parties"].find_one({"_id": party_id})
    if not party:
        party = await db["Parties"].find_one({"_id": party_id})
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


@app.get("/party/{party_id}/mlas")
async def get_party_mlas(party_id: str):
    db = get_db()
    return await db["mlas"].find({"party_id": party_id}).to_list(None)


@app.post("/admin/seed-parties")
async def seed_parties():
    """One-shot: seeds the 7 real NI parties into db.parties."""
    from seed.seed_real_parties import PARTIES
    db = get_db()
    seeded = []
    for party in PARTIES:
        await db["parties"].replace_one({"_id": party["_id"]}, party, upsert=True)
        seeded.append(party["_id"])
    count = await db["parties"].count_documents({})
    return {"seeded": seeded, "total_in_db": count}


@app.post("/admin/seed-mlas")
async def seed_mlas():
    """One-shot: seeds the 14 MLAs into db.mlas."""
    from seed.seed_real_mlas import MLAS
    db = get_db()
    seeded = []
    for mla in MLAS:
        await db["mlas"].replace_one({"_id": mla["_id"]}, mla, upsert=True)
        seeded.append(mla["_id"])
    count = await db["mlas"].count_documents({})
    return {"seeded": seeded, "total_in_db": count}


@app.post("/admin/seed-party-donations")
async def seed_party_donations():
    """One-shot: ingest backend/data/electoral_commission_donations.csv into db.party_donations."""
    from seed.seed_party_donations import main as run_seed
    result = await run_seed()
    return result


@app.post("/admin/seed-party-spending")
async def seed_party_spending():
    """One-shot: ingest backend/data/electoral_commission_spending.csv into db.party_spending."""
    from seed.seed_party_spending import main as run_seed
    result = await run_seed()
    return result


@app.post("/admin/seed-stormont-sessions")
async def seed_stormont_sessions():
    """One-shot: ingest backend/data/stormont_sessions.json into db.stormont_sessions and db.mla_session_participation."""
    from seed.seed_stormont_sessions import main as run_seed
    result = await run_seed()
    return result


@app.post("/admin/verify-all-mlas")
async def verify_all_mlas():
    """One-shot: stamps all MLAs on Solana devnet and stores chain_state records."""
    from services.solana_service import verify_profile_on_chain
    db = get_db()
    mlas = await db.mlas.find({}).to_list(None)
    results = []
    for mla in mlas:
        try:
            result = await verify_profile_on_chain(mla["_id"], mla, db)
            results.append({"mla_id": mla["_id"], "name": mla["name"], "tx": result.get("tx_signature")})
        except Exception as exc:
            results.append({"mla_id": mla["_id"], "name": mla["name"], "error": str(exc)})
    count = await db.chain_state.count_documents({})
    return {"verified": results, "chain_state_total": count}


# -------------------------------------------------------------- tracker chain

@app.get("/tracker/mla/{mla_id}")
async def get_tracker_mla(mla_id: str):
    return _tracker_mla_payload(mla_id)["mla"]


@app.get("/tracker/session/{slug}")
async def get_tracker_session(slug: str):
    return _tracker_session_payload(slug)


# --------------------------------------------------------------------- MLAs

@app.get("/mla/{mla_id}")
async def get_mla(mla_id: str):
    mla = await _get_mla(mla_id)
    if not mla:
        raise HTTPException(status_code=404, detail="MLA not found")
    return mla


@app.get("/mla/{mla_id}/chain")
async def mla_chain(mla_id: str):
    record = await _get_chain_record(mla_id)
    if not record:
        raise HTTPException(status_code=404, detail="Not verified yet")
    return record


# ----------------------------------------- legacy /politician/* (kept for VerifiedBadge / ChainPanel)

@app.get("/politician/{politician_id}")
async def get_politician(politician_id: str):
    mla = await _get_mla(politician_id)
    if mla:
        return mla
    return {"politician_id": politician_id, "stub": True}


@app.get("/politician/{politician_id}/chain")
async def politician_chain(politician_id: str):
    record = await _get_chain_record(politician_id)
    if not record:
        raise HTTPException(status_code=404, detail="Not verified yet")
    return record


@app.get("/chain/status/{politician_id}")
async def chain_status(politician_id: str):
    record = await _get_chain_record(politician_id)
    if not record:
        raise HTTPException(status_code=404, detail="Not verified yet")
    return record


# ----------------------------------------- chain verification (Solana — Das's domain)

@app.post("/chain/verify/{politician_id}")
async def chain_verify(politician_id: str):
    from services.solana_service import verify_profile_on_chain

    db = get_db()
    await db.command("ping")

    profile_data = await _get_mla(politician_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="MLA not found")

    try:
        return await verify_profile_on_chain(politician_id, profile_data, db)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

