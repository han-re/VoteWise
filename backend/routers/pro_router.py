"""
VoteWise Pro analytics router.

Mounted at /pro. Read-only endpoints serving the Pro dashboard from the four
Pro-only collections seeded in Phases 1 and 2:

    db.party_donations              (Electoral Commission donations CSV)
    db.party_spending               (Electoral Commission campaign spending CSV)
    db.stormont_sessions            (hand-curated plenary sittings)
    db.mla_session_participation    (per-MLA attendance + engagement score)

Free-product collections (db.mlas, db.parties / db.Parties, db.chain_state) are
read-only here. We never mutate them: doing so would invalidate the Solana
profile-hash invariant (CODEBASE_KNOWLEDGE.md § 5.1).
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from routers.quiz_router import _PARTY_META

router = APIRouter(prefix="/pro", tags=["pro"])

_mongo_client: Optional[AsyncIOMotorClient] = None
_mlas_lookup_cache: Optional[dict[str, dict]] = None


def _get_db():
    global _mongo_client
    if _mongo_client is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3000)
    return _mongo_client["votewise"]


async def _get_mlas_lookup() -> dict[str, dict]:
    """Cache MLA names + parties + constituencies in-process for join calls.

    Refreshed lazily once per process. The free-product MLA seed is
    immutable post-stamping, so the cache does not need invalidation.
    Excludes mla.placeholder MLAs (the synthetic PBP second seat).
    """
    global _mlas_lookup_cache
    if _mlas_lookup_cache is None:
        db = _get_db()
        mlas = await db.mlas.find({}).to_list(None)
        _mlas_lookup_cache = {
            m["_id"]: m for m in mlas if not m.get("placeholder")
        }
    return _mlas_lookup_cache


def _party_meta(party_id: str) -> dict:
    return _PARTY_META.get(
        party_id, {"name": party_id, "short_name": party_id, "color": "#888888"}
    )


def _quarter_label(iso_date: str) -> str:
    """'2024-05-13' -> '2024-Q2'."""
    try:
        d = datetime.strptime(iso_date, "%Y-%m-%d")
    except ValueError:
        return ""
    return f"{d.year}-Q{((d.month - 1) // 3) + 1}"


def _year_label(iso_date: str) -> str:
    return iso_date[:4] if iso_date else ""


# --------------------------------------------------------------------- health

class HealthResponse(BaseModel):
    last_donations_seeded_at: Optional[str]
    last_spending_seeded_at: Optional[str]
    last_sessions_seeded_at: Optional[str]


@router.get("/health", response_model=HealthResponse)
async def pro_health() -> HealthResponse:
    db = _get_db()
    don = await db.party_donations.find_one({"_id": "_meta"})
    spend = await db.party_spending.find_one({"_id": "_meta"})
    sess = await db.stormont_sessions.find_one({"_id": "_meta"})
    return HealthResponse(
        last_donations_seeded_at=(don or {}).get("last_seeded_at"),
        last_spending_seeded_at=(spend or {}).get("last_seeded_at"),
        last_sessions_seeded_at=(sess or {}).get("last_seeded_at"),
    )


# ------------------------------------------------------------------ donations

def _split_csv(raw: Optional[str]) -> Optional[list[str]]:
    """Splits a comma-separated query param into a clean list, or None if empty."""
    if not raw:
        return None
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    return parts or None


@router.get("/donations/parties")
async def donations_by_party(
    date_from: Optional[str] = Query(default=None, alias="from"),
    date_to: Optional[str] = Query(default=None, alias="to"),
    donor_type: Optional[str] = Query(default=None),
):
    """Per-party donation totals over an optional date window (accepted_date).

    Dates are ISO YYYY-MM-DD; from/to are inclusive. Empty parties return zero
    rows so the frontend can render a stable bar chart with all 7 ids.

    donor_type is an optional comma-separated filter against the canonical
    {Individual, Company, Trade Union, Other} bucket assigned by the seed.
    """
    db = _get_db()
    match: dict = {"raw_id": {"$exists": True}}
    if date_from or date_to:
        date_clause: dict = {}
        if date_from:
            date_clause["$gte"] = date_from
        if date_to:
            date_clause["$lte"] = date_to
        match["accepted_date"] = date_clause
    types = _split_csv(donor_type)
    if types:
        match["donor_type"] = {"$in": types}

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$party_id",
            "total_gbp": {"$sum": "$amount_gbp"},
            "donor_count": {"$addToSet": "$donor_name"},
        }},
        {"$project": {
            "_id": 0,
            "party_id": "$_id",
            "total_gbp": 1,
            "donor_count": {"$size": "$donor_count"},
        }},
        {"$sort": {"total_gbp": -1}},
    ]
    rows = await db.party_donations.aggregate(pipeline).to_list(None)
    enriched = []
    for r in rows:
        meta = _party_meta(r["party_id"])
        enriched.append({
            "party_id":    r["party_id"],
            "party_name":  meta["name"],
            "party_color": meta["color"],
            "total_gbp":   round(r["total_gbp"], 2),
            "donor_count": r["donor_count"],
        })
    return enriched


@router.get("/donations/top-donors")
async def top_donors(
    party_id: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    donor_type: Optional[str] = Query(default=None),
    party_ids: Optional[str] = Query(default=None),
    date_from: Optional[str] = Query(default=None, alias="from"),
    date_to: Optional[str] = Query(default=None, alias="to"),
):
    """Top donors by total donation value, optionally filtered.

    party_id is the legacy single-party filter; party_ids is the newer
    comma-separated multi-party filter (used by the donations dashboard).
    Each donor row carries a per-party breakdown so the UI can show a chip
    list of recipients alongside the headline total.
    """
    db = _get_db()
    match: dict = {"raw_id": {"$exists": True}, "donor_name": {"$ne": ""}}
    if party_id:
        match["party_id"] = party_id
    multi = _split_csv(party_ids)
    if multi:
        match["party_id"] = {"$in": multi}
    types = _split_csv(donor_type)
    if types:
        match["donor_type"] = {"$in": types}
    if date_from or date_to:
        date_clause: dict = {}
        if date_from:
            date_clause["$gte"] = date_from
        if date_to:
            date_clause["$lte"] = date_to
        match["accepted_date"] = date_clause

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": {"donor": "$donor_name", "donor_type": "$donor_type", "party_id": "$party_id"},
            "subtotal_gbp": {"$sum": "$amount_gbp"},
            "subcount": {"$sum": 1},
        }},
        {"$group": {
            "_id": {"donor": "$_id.donor", "donor_type": "$_id.donor_type"},
            "total_gbp": {"$sum": "$subtotal_gbp"},
            "donation_count": {"$sum": "$subcount"},
            "parties": {"$push": {"party_id": "$_id.party_id", "total_gbp": "$subtotal_gbp"}},
        }},
        {"$sort": {"total_gbp": -1}},
        {"$limit": limit},
    ]
    rows = await db.party_donations.aggregate(pipeline).to_list(None)
    out = []
    for r in rows:
        parties = []
        for p in r["parties"]:
            meta = _party_meta(p["party_id"])
            parties.append({
                "party_id":   p["party_id"],
                "party_name": meta["name"],
                "total_gbp":  round(p["total_gbp"], 2),
            })
        parties.sort(key=lambda x: x["total_gbp"], reverse=True)
        out.append({
            "donor_name":     r["_id"]["donor"],
            "donor_type":     r["_id"]["donor_type"],
            "total_gbp":      round(r["total_gbp"], 2),
            "donation_count": r["donation_count"],
            "parties":        parties,
        })
    return out


@router.get("/donations/timeseries")
async def donations_timeseries(
    party_ids: Optional[str] = Query(default=None),
    granularity: str = Query(default="quarter", pattern="^(quarter|year)$"),
    donor_type: Optional[str] = Query(default=None),
    date_from: Optional[str] = Query(default=None, alias="from"),
    date_to: Optional[str] = Query(default=None, alias="to"),
):
    """Donations over time, grouped by period × party.

    party_ids is a comma-separated list of party_* ids. Empty/omitted means
    all 7 canonical NI parties. Period labels: '2024-Q2' or '2024'.
    """
    db = _get_db()
    ids = _split_csv(party_ids) or list(_PARTY_META.keys())

    match: dict = {"raw_id": {"$exists": True}, "party_id": {"$in": ids}}
    types = _split_csv(donor_type)
    if types:
        match["donor_type"] = {"$in": types}
    if date_from or date_to:
        date_clause: dict = {}
        if date_from:
            date_clause["$gte"] = date_from
        if date_to:
            date_clause["$lte"] = date_to
        match["accepted_date"] = date_clause
    rows = await db.party_donations.find(
        match, {"party_id": 1, "amount_gbp": 1, "accepted_date": 1, "_id": 0}
    ).to_list(None)

    bucket_fn = _year_label if granularity == "year" else _quarter_label
    buckets: dict[tuple[str, str], float] = {}
    for r in rows:
        period = bucket_fn(r.get("accepted_date") or "")
        if not period:
            continue
        key = (period, r["party_id"])
        buckets[key] = buckets.get(key, 0.0) + float(r.get("amount_gbp", 0.0))

    out = [
        {"period": period, "party_id": pid, "total_gbp": round(v, 2)}
        for (period, pid), v in buckets.items()
    ]
    out.sort(key=lambda x: (x["period"], x["party_id"]))
    return out


# ------------------------------------------------------------------- spending

@router.get("/spending/parties")
async def spending_by_party(
    date_from: Optional[str] = Query(default=None, alias="from"),
    date_to: Optional[str] = Query(default=None, alias="to"),
    party_ids: Optional[str] = Query(default=None),
):
    db = _get_db()
    match: dict = {"raw_id": {"$exists": True}}
    if date_from or date_to:
        date_clause: dict = {}
        if date_from:
            date_clause["$gte"] = date_from
        if date_to:
            date_clause["$lte"] = date_to
        match["payment_date"] = date_clause
    ids = _split_csv(party_ids)
    if ids:
        match["party_id"] = {"$in": ids}

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$party_id",
            "total_gbp": {"$sum": "$amount_gbp"},
            "donor_count": {"$addToSet": "$supplier"},
        }},
        {"$project": {
            "_id": 0,
            "party_id": "$_id",
            "total_gbp": 1,
            "donor_count": {"$size": "$donor_count"},
        }},
        {"$sort": {"total_gbp": -1}},
    ]
    rows = await db.party_spending.aggregate(pipeline).to_list(None)
    enriched = []
    for r in rows:
        meta = _party_meta(r["party_id"])
        enriched.append({
            "party_id":    r["party_id"],
            "party_name":  meta["name"],
            "party_color": meta["color"],
            "total_gbp":   round(r["total_gbp"], 2),
            "donor_count": r["donor_count"],
        })
    return enriched


@router.get("/spending/timeseries")
async def spending_timeseries(
    party_ids: Optional[str] = Query(default=None),
    granularity: str = Query(default="quarter", pattern="^(quarter|year)$"),
    date_from: Optional[str] = Query(default=None, alias="from"),
    date_to: Optional[str] = Query(default=None, alias="to"),
):
    """Campaign spending over time, grouped by period × party. Mirrors
    the donations timeseries shape so the dashboard can re-use the chart
    component."""
    db = _get_db()
    ids = _split_csv(party_ids) or list(_PARTY_META.keys())

    match: dict = {"raw_id": {"$exists": True}, "party_id": {"$in": ids}}
    if date_from or date_to:
        date_clause: dict = {}
        if date_from:
            date_clause["$gte"] = date_from
        if date_to:
            date_clause["$lte"] = date_to
        match["payment_date"] = date_clause
    rows = await db.party_spending.find(
        match, {"party_id": 1, "amount_gbp": 1, "payment_date": 1, "_id": 0}
    ).to_list(None)

    bucket_fn = _year_label if granularity == "year" else _quarter_label
    buckets: dict[tuple[str, str], float] = {}
    for r in rows:
        period = bucket_fn(r.get("payment_date") or "")
        if not period:
            continue
        key = (period, r["party_id"])
        buckets[key] = buckets.get(key, 0.0) + float(r.get("amount_gbp", 0.0))

    out = [
        {"period": period, "party_id": pid, "total_gbp": round(v, 2)}
        for (period, pid), v in buckets.items()
    ]
    out.sort(key=lambda x: (x["period"], x["party_id"]))
    return out


@router.get("/spending/top-categories")
async def top_spending_categories(
    party_id: Optional[str] = Query(default=None),
):
    """Spending broken down by Electoral Commission expense category."""
    db = _get_db()
    match: dict = {"raw_id": {"$exists": True}, "category": {"$ne": ""}}
    if party_id:
        match["party_id"] = party_id

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$category",
            "total_gbp": {"$sum": "$amount_gbp"},
            "payment_count": {"$sum": 1},
        }},
        {"$project": {
            "_id": 0,
            "category": "$_id",
            "total_gbp": {"$round": ["$total_gbp", 2]},
            "payment_count": 1,
        }},
        {"$sort": {"total_gbp": -1}},
    ]
    return await db.party_spending.aggregate(pipeline).to_list(None)


# ----------------------------------------------------------------- attendance

@router.get("/attendance/mlas")
async def attendance_by_mla():
    """Attendance percentage per MLA across the dataset."""
    db = _get_db()
    mlas = await _get_mlas_lookup()

    pipeline = [
        {"$match": {"_id": {"$ne": "_meta"}}},
        {"$group": {
            "_id": "$mla_id",
            "attended_sessions": {"$sum": {"$cond": ["$attended", 1, 0]}},
            "total_sessions": {"$sum": 1},
        }},
    ]
    raw = await db.mla_session_participation.aggregate(pipeline).to_list(None)
    out = []
    for r in raw:
        mla = mlas.get(r["_id"])
        if not mla:
            continue
        meta = _party_meta(mla.get("party_id", ""))
        attended = r["attended_sessions"]
        total = r["total_sessions"]
        pct = round(attended / total * 100.0, 1) if total else 0.0
        out.append({
            "mla_id":            r["_id"],
            "name":              mla.get("name", ""),
            "party_id":          mla.get("party_id", ""),
            "party_name":        meta["name"],
            "party_color":       meta["color"],
            "constituency":      mla.get("constituency", ""),
            "attended_sessions": attended,
            "total_sessions":    total,
            "attendance_pct":    pct,
        })
    out.sort(key=lambda x: x["attendance_pct"], reverse=True)
    return out


@router.get("/attendance/timeseries")
async def attendance_timeseries(mla_id: str = Query(...)):
    """One row per session for a single MLA."""
    db = _get_db()
    pipeline = [
        {"$match": {"mla_id": mla_id, "_id": {"$ne": "_meta"}}},
        {"$project": {
            "_id": 0,
            "session_id": 1,
            "session_date": 1,
            "attended": 1,
            "speech_count": 1,
        }},
        {"$sort": {"session_date": 1}},
    ]
    return await db.mla_session_participation.aggregate(pipeline).to_list(None)


# ----------------------------------------------------------------- engagement

@router.get("/engagement/leaderboard")
async def engagement_leaderboard(
    limit: int = Query(default=20, ge=1, le=100),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
):
    """Per-MLA average engagement score across attended sittings."""
    db = _get_db()
    mlas = await _get_mlas_lookup()

    pipeline = [
        {"$match": {"_id": {"$ne": "_meta"}}},
        {"$group": {
            "_id": "$mla_id",
            "engagement_score": {"$avg": {"$cond": ["$attended", "$engagement_score", None]}},
            "attended_sessions": {"$sum": {"$cond": ["$attended", 1, 0]}},
            "total_sessions": {"$sum": 1},
            "speech_count_total": {"$sum": "$speech_count"},
            "division_votes_total": {"$sum": "$division_votes"},
            "written_questions_total": {"$sum": "$written_questions"},
        }},
    ]
    raw = await db.mla_session_participation.aggregate(pipeline).to_list(None)
    out = []
    for r in raw:
        mla = mlas.get(r["_id"])
        if not mla:
            continue
        meta = _party_meta(mla.get("party_id", ""))
        attended = r["attended_sessions"]
        total = r["total_sessions"]
        attendance_pct = round(attended / total * 100.0, 1) if total else 0.0
        score = r.get("engagement_score") or 0.0
        out.append({
            "mla_id":                  r["_id"],
            "name":                    mla.get("name", ""),
            "party_id":                mla.get("party_id", ""),
            "party_name":              meta["name"],
            "party_color":             meta["color"],
            "constituency":            mla.get("constituency", ""),
            "engagement_score":        round(float(score), 1),
            "attendance_pct":          attendance_pct,
            "speech_count_total":      r["speech_count_total"],
            "division_votes_total":    r["division_votes_total"],
            "written_questions_total": r["written_questions_total"],
        })
    out.sort(key=lambda x: x["engagement_score"], reverse=(order == "desc"))
    return out[:limit]


# ------------------------------------------------------------------- sessions

@router.get("/sessions/latest")
async def latest_sessions(n: int = Query(default=10, ge=1, le=50)):
    db = _get_db()
    pipeline = [
        {"$match": {"_id": {"$ne": "_meta"}}},
        {"$project": {
            "_id": 0,
            "session_id": 1,
            "date": 1,
            "title": 1,
            "agenda_summary": 1,
            "attendee_count": 1,
            "speech_count_total": 1,
        }},
        {"$sort": {"date": -1}},
        {"$limit": n},
    ]
    return await db.stormont_sessions.aggregate(pipeline).to_list(None)


@router.get("/sessions/{session_id}")
async def session_detail(session_id: str):
    """Single session metadata + every MLA's participation row.

    Ryan's chatbot uses this to ground its responses on a single source of
    truth — the same data the page renders.
    """
    db = _get_db()
    session = await db.stormont_sessions.find_one(
        {"_id": session_id}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    mlas = await _get_mlas_lookup()
    rows = await db.mla_session_participation.find(
        {"session_id": session_id}, {"_id": 0}
    ).to_list(None)
    enriched = []
    for r in rows:
        mla = mlas.get(r["mla_id"])
        if not mla:
            continue
        meta = _party_meta(mla.get("party_id", ""))
        enriched.append({
            **r,
            "name":        mla.get("name", ""),
            "party_id":    mla.get("party_id", ""),
            "party_name":  meta["name"],
            "party_color": meta["color"],
        })
    enriched.sort(key=lambda x: x["engagement_score"], reverse=True)
    return {**session, "mla_participation": enriched}
