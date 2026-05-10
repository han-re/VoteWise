import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

from routers.quiz_router import router as quiz_router
app.include_router(quiz_router)


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


def get_db():
    global _mongo_client
    if _mongo_client is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3000)
    return _mongo_client["votewise"]


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

def _parties_col(db):
    """Atlas has the collection as 'Parties' (capital P); fall back to lowercase."""
    return db["Parties"]


@app.get("/parties")
async def get_parties():
    db = get_db()
    return await _parties_col(db).find({}).to_list(None)


@app.get("/party/{party_id}")
async def get_party(party_id: str):
    db = get_db()
    party = await _parties_col(db).find_one({"_id": party_id})
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


@app.get("/party/{party_id}/mlas")
async def get_party_mlas(party_id: str):
    db = get_db()
    return await db["mlas"].find({"party_id": party_id}).to_list(None)


@app.post("/admin/seed-parties")
async def seed_parties():
    """One-shot: seeds the 7 real NI parties into db.Parties."""
    from seed.seed_real_parties import PARTIES
    db = get_db()
    seeded = []
    for party in PARTIES:
        await _parties_col(db).replace_one({"_id": party["_id"]}, party, upsert=True)
        seeded.append(party["_id"])
    count = await _parties_col(db).count_documents({})
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

    profile_data = _politician_cache.get(politician_id, {"politician_id": politician_id, "stub": True})
    try:
        db = get_db()
        politician = await db.politicians.find_one({"_id": politician_id})
        if politician:
            politician.pop("_id", None)
            profile_data = politician
    except Exception:
        pass  # MongoDB unavailable — use cached/stub profile
    _politician_cache[politician_id] = profile_data

    class MemDB:
        class chain_state:
            @staticmethod
            async def find_one(*a, **kw):
                return _chain_state_cache.get(politician_id)
            @staticmethod
            async def update_one(filter, update, **kw):
                rec = update.get("$set", {})
                _chain_state_cache[rec.get("politician_id", politician_id)] = rec

    try:
        db = get_db()
        await db.command("ping")
        result = await verify_profile_on_chain(politician_id, profile_data, db)
    except Exception:
        result = await verify_profile_on_chain(politician_id, profile_data, MemDB())

    return result
