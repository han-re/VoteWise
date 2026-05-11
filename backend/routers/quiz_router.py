import json
import os
from pathlib import Path

from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from services.alignment_service import score_parties, score_mla

router = APIRouter(prefix="/quiz", tags=["quiz"])

_DATA_DIR = Path(__file__).parent.parent / "data"

_PARTY_META: dict[str, dict] = {
    "party_alliance":  {"name": "Alliance Party",              "short_name": "Alliance", "color": "#F6CB2F"},
    "party_dup":       {"name": "Democratic Unionist Party",   "short_name": "DUP",      "color": "#D4213D"},
    "party_sinn_fein": {"name": "Sinn Féin",                   "short_name": "SF",       "color": "#326760"},
    "party_uup":       {"name": "Ulster Unionist Party",       "short_name": "UUP",      "color": "#48A5DD"},
    "party_sdlp":      {"name": "SDLP",                        "short_name": "SDLP",     "color": "#2E9A41"},
    "party_pbp":       {"name": "People Before Profit",        "short_name": "PBP",      "color": "#C0392B"},
    "party_tuv":       {"name": "Traditional Unionist Voice",  "short_name": "TUV",      "color": "#4A7AB5"},
}

_mongo_client: AsyncIOMotorClient | None = None


def _get_db():
    global _mongo_client
    if _mongo_client is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3000)
    return _mongo_client["votewise"]


class AnswerItem(BaseModel):
    id: str
    value: int


class ScoreRequest(BaseModel):
    answers: list[AnswerItem]


@router.get("/questions")
def get_questions() -> list:
    with open(_DATA_DIR / "quiz_questions.json") as f:
        return json.load(f)


@router.post("/score")
async def score_quiz(body: ScoreRequest) -> dict:
    answers = {item.id: item.value for item in body.answers}

    raw_scores = score_parties(answers)

    party_alignment = []
    for entry in raw_scores:
        pid = entry["party_id"]
        meta = _PARTY_META.get(pid, {"name": pid, "short_name": pid, "color": "#888888"})
        party_alignment.append({
            "party_id":     pid,
            "name":         meta["name"],
            "short_name":   meta["short_name"],
            "alignment_pct": entry["alignment_pct"],
            "color":        meta["color"],
        })

    top_match = party_alignment[0]["party_id"] if party_alignment else None

    mla_alignment: list[dict] = []
    try:
        db = _get_db()
        await db.command("ping")
        mlas = await db.mlas.find({}).to_list(None)
        scored_mlas = []
        for mla in mlas:
            pct = score_mla(mla, answers)
            scored_mlas.append({
                "mla_id":       str(mla["_id"]),
                "name":         mla.get("name", ""),
                "party_id":     mla.get("party_id", ""),
                "constituency": mla.get("constituency", ""),
                "photo_url":    mla.get("photo_url", ""),
                "alignment_pct": pct,
            })
        scored_mlas.sort(key=lambda x: x["alignment_pct"], reverse=True)
        mla_alignment = scored_mlas[:6]
    except Exception:
        pass

    return {
        "party_alignment": party_alignment,
        "top_match":       top_match,
        "mla_alignment":   mla_alignment,
    }
