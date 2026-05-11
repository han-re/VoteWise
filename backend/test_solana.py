import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from services.solana_service import verify_profile_on_chain
import os
from dotenv import load_dotenv

load_dotenv()

db = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))["votewise"]


async def test():
    dummy = {"name": "Test Politician", "company": "Test Corp", "donation": 5000}
    result = await verify_profile_on_chain("test_001", dummy, db)
    print("\n--- Result ---")
    for k, v in result.items():
        print(f"  {k}: {v}")

    if not result.get("fallback"):
        print(f"\n[OK] REAL TX: {result['explorer_url']}")
    else:
        print("\n[FALLBACK] Fallback used -- wallet balance may be zero or key not set")
        print("   Demo still works. Check SOLANA_PRIVATE_KEY in .env and airdrop SOL.")


asyncio.run(test())
