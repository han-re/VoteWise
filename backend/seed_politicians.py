"""
Run once to insert 3 demo politicians into MongoDB.
Usage: python seed_politicians.py
"""
import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

POLITICIANS = [
    {
        "_id": "pol_001",
        "name": "Margaret Collins",
        "party": "Progressive Party",
        "constituency": "Belfast North",
        "role": "MP",
        "donations": [
            {"donor": "Ulster Property Group", "amount": 45000, "date": "2023-03-12"},
            {"donor": "Belfast Developers Ltd", "amount": 28000, "date": "2023-09-01"},
        ],
        "votes": [
            {"bill": "Housing Reform Bill", "vote": "Against", "date": "2023-06-15"},
            {"bill": "Planning Permission Act", "vote": "For",   "date": "2024-01-20"},
        ],
        "declared_interests": ["Director, Collins Property Holdings"],
    },
    {
        "_id": "pol_002",
        "name": "David Harrington",
        "party": "Reform Alliance",
        "constituency": "East Antrim",
        "role": "MLA",
        "donations": [
            {"donor": "Harrington Energy Ltd", "amount": 60000, "date": "2022-11-05"},
            {"donor": "NI Gas Partners",        "amount": 15000, "date": "2023-07-22"},
        ],
        "votes": [
            {"bill": "Renewable Energy Subsidy Bill", "vote": "Against", "date": "2023-04-10"},
            {"bill": "Fossil Fuel Licensing Act",     "vote": "For",     "date": "2023-10-03"},
        ],
        "declared_interests": ["Shareholder, Harrington Energy Ltd"],
    },
    {
        "_id": "pol_003",
        "name": "Siobhan Murray",
        "party": "Citizens First",
        "constituency": "South Down",
        "role": "MP",
        "donations": [
            {"donor": "PharmaCare NI",  "amount": 35000, "date": "2023-01-18"},
            {"donor": "MediGroup Ltd",  "amount": 22000, "date": "2023-08-30"},
        ],
        "votes": [
            {"bill": "NHS Privatisation Amendment", "vote": "For",     "date": "2023-05-25"},
            {"bill": "Drug Pricing Transparency",   "vote": "Against", "date": "2024-02-14"},
        ],
        "declared_interests": ["Advisory board, PharmaCare NI"],
    },
]


async def seed():
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client["votewise"]

    for pol in POLITICIANS:
        await db.politicians.replace_one(
            {"_id": pol["_id"]},
            pol,
            upsert=True,
        )
        print(f"  Seeded: {pol['name']} ({pol['_id']})")

    count = await db.politicians.count_documents({})
    print(f"\nDone. {count} politicians in database.")
    client.close()


asyncio.run(seed())
