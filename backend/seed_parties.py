"""
Run once to insert sample parties into MongoDB.
Usage: python seed_parties.py
"""
import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

PARTIES = [
    {
        "_id": "party_001",
        "party_name": "Progressive Party",
        "politicians": [
            {"id": "pol_001", "name": "Margaret Collins", "role": "MP", "constituency": "Belfast North"},
        ],
        "promises": [
            {"description": "Build 10,000 affordable homes by 2025", "delivered": False},
            {"description": "Freeze council tax for two years", "delivered": True},
            {"description": "Increase NHS funding by 15%", "delivered": False},
        ],
    },
    {
        "_id": "party_002",
        "party_name": "Reform Alliance",
        "politicians": [
            {"id": "pol_002", "name": "David Harrington", "role": "MLA", "constituency": "East Antrim"},
        ],
        "promises": [
            {"description": "Cut business rates by 20%", "delivered": True},
            {"description": "Expand road infrastructure across NI", "delivered": False},
            {"description": "Introduce energy independence strategy", "delivered": False},
        ],
    },
    {
        "_id": "party_003",
        "party_name": "Citizens First",
        "politicians": [
            {"id": "pol_003", "name": "Siobhan Murray", "role": "MP", "constituency": "South Down"},
        ],
        "promises": [
            {"description": "Cap prescription charges at £2", "delivered": True},
            {"description": "Free school meals for all primary pupils", "delivered": True},
            {"description": "Publish full drug pricing transparency report", "delivered": False},
        ],
    },
]


async def seed():
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client["votewise"]

    for party in PARTIES:
        await db["Parties"].replace_one({"_id": party["_id"]}, party, upsert=True)
        print(f"  Seeded: {party['party_name']} ({party['_id']})")

    count = await db["Parties"].count_documents({})
    print(f"\nDone. {count} parties in database.")
    client.close()


asyncio.run(seed())
