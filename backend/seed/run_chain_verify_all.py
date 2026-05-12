"""
Stamp all 14 MLAs on Solana devnet.
Run from project root: python -m backend.seed.run_chain_verify_all
"""
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / "backend" / ".env")


async def main() -> None:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client["votewise"]

    from backend.services.solana_service import verify_profile_on_chain

    mlas = await db.mlas.find({}).to_list(None)
    print(f"Verifying {len(mlas)} MLAs on Solana devnet...\n")

    for mla in mlas:
        mla_id = mla["_id"]
        try:
            result = await verify_profile_on_chain(mla_id, mla, db)
            sig = result.get("tx_signature", "missing-tx")
            print(f"  {mla['name']:<30} {sig}")
        except Exception as exc:
            print(f"  {mla['name']:<30} ERROR: {exc}")

    count = await db.chain_state.count_documents({})
    print(f"\nDone. {count} chain_state records in Atlas.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
