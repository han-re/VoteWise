"""
Seed Electoral Commission donations into db.party_donations.

Run from project root:
    python -m backend.seed.seed_party_donations

Source CSV: backend/data/electoral_commission_donations.csv
(downloaded from search.electoralcommission.org.uk, NI register, 2010-present)

Idempotent: upserts on raw_id (Electoral Commission ECRef).
Writes a marker doc {_id: "_meta", last_seeded_at: ISO} after the bulk write.

Rows whose RegulatedEntityName does not map to one of the 7 canonical NI
parties (e.g. Green Party, UKIP) are logged to stderr and skipped.
"""
import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
CSV_PATH = DATA_DIR / "electoral_commission_donations.csv"

# Maps Electoral Commission RegulatedEntityName values to canonical party_* ids.
# Aliases (e.g. accented vs unaccented Sinn Féin) included so the seed is
# resilient to upstream casing/encoding drift.
PARTY_NAME_MAP: dict[str, str] = {
    "Alliance - Alliance Party of Northern Ireland": "party_alliance",
    "Alliance Party of Northern Ireland":            "party_alliance",
    "Democratic Unionist Party - D.U.P.":            "party_dup",
    "Democratic Unionist Party":                     "party_dup",
    "Sinn Féin":                                     "party_sinn_fein",
    "Sinn Fein":                                     "party_sinn_fein",
    "Ulster Unionist Party":                         "party_uup",
    "SDLP (Social Democratic & Labour Party)":       "party_sdlp",
    "Social Democratic & Labour Party":              "party_sdlp",
    "People Before Profit":                          "party_pbp",
    "People Before Profit Alliance":                 "party_pbp",
    "Traditional Unionist Voice - TUV":              "party_tuv",
    "Traditional Unionist Voice":                    "party_tuv",
}


def collapse_ws(value: str) -> str:
    return " ".join((value or "").split())


def parse_amount(value: str) -> float:
    """'£21,980.17' -> 21980.17. Returns 0.0 if unparseable."""
    if not value:
        return 0.0
    cleaned = value.replace("£", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def parse_date(value: str) -> str:
    """dd/mm/yyyy -> yyyy-mm-dd. Returns empty string if unparseable."""
    if not value:
        return ""
    try:
        return datetime.strptime(value.strip(), "%d/%m/%Y").strftime("%Y-%m-%d")
    except ValueError:
        return ""


def normalise_donor_type(status: str) -> str:
    """Maps Electoral Commission DonorStatus to {Individual, Company, Trade Union, Other}."""
    s = (status or "").strip()
    if s in ("Individual", "Company", "Trade Union"):
        return s
    return "Other"


def source_url_for(ec_ref: str) -> str:
    return (
        "https://search.electoralcommission.org.uk/Search/Donations"
        f"?currentPage=1&rows=10&query={ec_ref}"
    )


async def main() -> dict:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client["votewise"]

    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig", dtype=str, keep_default_na=False)

    inserted = 0
    skipped = 0

    for _, row in df.iterrows():
        raw_party = collapse_ws(row.get("RegulatedEntityName", ""))
        party_id = PARTY_NAME_MAP.get(raw_party)
        if not party_id:
            print(f"skip: unmapped party {raw_party!r}", file=sys.stderr)
            skipped += 1
            continue

        ec_ref = (row.get("ECRef") or "").strip()
        if not ec_ref:
            skipped += 1
            continue

        doc = {
            "party_id":             party_id,
            "donor_name":           collapse_ws(row.get("DonorName", "")),
            "donor_type":           normalise_donor_type(row.get("DonorStatus", "")),
            "amount_gbp":           parse_amount(row.get("Value", "")),
            "accepted_date":        parse_date(row.get("AcceptedDate", "")),
            "reported_date":        parse_date(row.get("ReportedDate", "")),
            "regulated_donee_type": collapse_ws(row.get("RegulatedDoneeType", "")),
            "nature_of_donation":   collapse_ws(row.get("NatureOfDonation", "")),
            "source_url":           source_url_for(ec_ref),
            "raw_id":               ec_ref,
        }

        await db.party_donations.update_one(
            {"raw_id": ec_ref}, {"$set": doc}, upsert=True
        )
        inserted += 1

    last_seeded_at = datetime.now(timezone.utc).isoformat()
    await db.party_donations.update_one(
        {"_id": "_meta"},
        {"$set": {"_id": "_meta", "last_seeded_at": last_seeded_at}},
        upsert=True,
    )

    print(f"inserted/upserted: {inserted}")
    print(f"skipped (unmapped or missing ref): {skipped}")
    print(f"last_seeded_at: {last_seeded_at}")

    return {"inserted": inserted, "skipped": skipped, "last_seeded_at": last_seeded_at}


if __name__ == "__main__":
    asyncio.run(main())
