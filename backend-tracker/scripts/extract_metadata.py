"""
extract_metadata.py — Parse speaker turns and vote records from hansard.txt.

Speaker turns are identified by the pattern:
  FIRSTNAME LASTNAME (PARTY):
at the start of a line. Lines that follow until the next speaker are
attributed to that speaker.

Vote records are identified by division headings such as:
  "The Question was put and agreed to."
  "Division: The result was..."

Output: data/mla-tracker/sessions/<slug>/metadata.json (atomic write)
"""

import json
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data" / "mla-tracker" / "sessions"

# Matches "Firstname Lastname (Party):" at the start of a line.
# Tolerates multi-word names and parenthetical party names.
SPEAKER_RE = re.compile(r"^([A-Z][a-zA-ZÀ-ÿ'\-]+(?: [A-Z][a-zA-ZÀ-ÿ'\-]+)+)\s+\(([^)]+)\)\s*:", re.MULTILINE)

# Match actual Stormont division markers — not the word "division" in general speech.
# Hansard division records appear on their own line with these exact patterns.
VOTE_RE = re.compile(
    r"^\s*(?:"
    r"The\s+(?:Assembly\s+)?(?:Question\s+was\s+put|divided)"
    r"|Question\s+accordingly\s+(?:agreed|negatived)"
    r"|Ayes\s*\d"
    r"|Noes\s*\d"
    r"|Members\s+voting\s+(?:for|against)"
    r"|The\s+result\s+was"
    r"|(?:Motion|Amendment)\s+(?:agreed|negatived|carried|defeated)"
    r")",
    re.IGNORECASE,
)

TOPIC_KEYWORDS: dict[str, list[str]] = {
    "Health": ["health", "nhs", "hospital", "mental health", "waiting list"],
    "Housing": ["housing", "rent", "landlord", "tenant", "planning"],
    "Education": ["education", "school", "university", "curriculum", "teacher"],
    "Environment": ["climate", "environment", "net zero", "carbon", "renewable"],
    "Economy": ["budget", "economy", "tax", "finance", "investment", "spending"],
    "Justice": ["justice", "police", "legacy", "troubles", "probation"],
    "Equality": ["equality", "discrimination", "hate crime", "lgbtq", "disability"],
    "Language": ["irish language", "ulster scots", "language act"],
    "Welfare": ["welfare", "universal credit", "benefits", "poverty"],
    "Infrastructure": ["roads", "broadband", "transport", "rail", "bus"],
}


def parse_speakers(lines: list[str]) -> list[dict]:
    """Return ordered list of (name, party, line_number) for each speaker turn."""
    turns = []
    for i, line in enumerate(lines):
        m = SPEAKER_RE.match(line)
        if m:
            turns.append({
                "name": m.group(1).strip(),
                "party": m.group(2).strip(),
                "line": i + 1,
            })
    return turns


def aggregate_speakers(turns: list[dict]) -> list[dict]:
    counts: dict[str, dict] = {}
    for t in turns:
        key = t["name"]
        if key not in counts:
            counts[key] = {"name": t["name"], "party": t["party"], "contribution_count": 0}
        counts[key]["contribution_count"] += 1
    return sorted(counts.values(), key=lambda x: -x["contribution_count"])


def detect_topics(lines: list[str]) -> list[dict]:
    found: dict[str, int] = {}
    for i, line in enumerate(lines):
        lower = line.lower()
        for topic, keywords in TOPIC_KEYWORDS.items():
            if topic not in found and any(kw in lower for kw in keywords):
                found[topic] = i + 1
    return [{"topic": t, "first_mention_line": ln} for t, ln in sorted(found.items(), key=lambda x: x[1])]


def detect_votes(lines: list[str]) -> list[dict]:
    votes = []
    for i, line in enumerate(lines):
        if VOTE_RE.search(line):
            votes.append({"motion": line.strip(), "result": "", "for": 0, "against": 0, "abstain": 0, "line": i + 1})
    return votes


def build_metadata(slug: str, lines: list[str]) -> dict:
    turns = parse_speakers(lines)
    return {
        "session_id": slug,
        "speakers": aggregate_speakers(turns),
        "topics_raised": detect_topics(lines),
        "votes_recorded": detect_votes(lines),
    }


def write_metadata(slug: str, data: dict) -> Path:
    out = DATA_DIR / slug / "metadata.json"
    tmp = out.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.rename(out)
    return out


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m backend_tracker.scripts.extract_metadata <slug>")
        sys.exit(1)
    slug = sys.argv[1]
    hansard = DATA_DIR / slug / "hansard.txt"
    if not hansard.exists():
        print(f"hansard.txt not found for session: {slug}")
        sys.exit(1)
    lines = hansard.read_text(encoding="utf-8").splitlines()
    data = build_metadata(slug, lines)
    out = write_metadata(slug, data)
    print(f"Metadata: {len(data['speakers'])} speakers, {len(data['topics_raised'])} topics → {out}")


if __name__ == "__main__":
    main()
