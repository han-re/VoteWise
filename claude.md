# CLAUDE.md — VoteWise Build Instructions

This file is the source of truth for the 8-hour final sprint. Read top to bottom before doing anything. Every feature is in priority order. Do not skip ahead. Do not invent features not listed here.

## Project context

VoteWise is a political accountability platform for Northern Ireland. The core insight: NI voters back parties on tribal/identity lines rather than policy alignment. VoteWise breaks that pattern with a 90-second quiz that maps the user's policy positions to each party's actual voting record (not their manifesto rhetoric), then lets them investigate the parties and their MLAs.

The hackathon is HackBelfast 2026 (Builder track, brief: "Belfast 2036"). Submission deadline: 10:56 Sunday. We have ~6 hours of build time, then 1 hour for demo recording, then 1 hour submission buffer.

The team:

- **Rehan** — backend, integration, MLA profiles
- **Ryan** — quiz logic, alignment engine, ElevenLabs, results page
- **Conor** — frontend polish, demo recording
- **Das** — Solana (already done), running chain verification on real data

## Tech stack

- **Backend:** FastAPI + Motor (async MongoDB) + Solana devnet (already wired)
- **Frontend:** Next.js 16, React 19, TypeScript 5, Tailwind 4
- **Database:** MongoDB Atlas, database name `mandatewatch`
- **Deployments:** Vercel (frontend), Railway (backend), MongoDB Atlas (Ireland region)
- **External APIs:** ElevenLabs (audio briefings), Solana devnet (already integrated)

## What's already built (DO NOT REBUILD)

- Solana on-chain stamping (`backend/services/solana_service.py`)
- ChainPanel + VerifiedBadge React components
- MongoDB connection + chain_state collection
- `POST /chain/verify/{id}` endpoint with double fallback
- `GET /politician/{id}/chain` endpoint
- `GET /parties` endpoint
- Seed data for 3 fake politicians (will be replaced with 14 real MLAs)
- Seed data for 3 fake parties (will be replaced with 7 real NI parties)
- HTML prototype at `frontend/html/index.html` (NOT migrated to React yet)

## What's missing (BUILD ORDER)

Priority is strict. Each feature must work end-to-end before moving to the next. If you fall behind, cut from the bottom, not the top.

### Feature 1: Real party seed data

**File:** `backend/seed/seed_real_parties.py`

Create a seed script that populates `db.parties` with 7 NI parties: Alliance, DUP, Sinn Féin, UUP, SDLP, PBP, TUV.

Each party document needs:

```python
{
    "_id": "party_alliance",  # snake_case party id
    "name": "Alliance Party",
    "short_name": "Alliance",
    "leader": "Naomi Long",
    "seats_2022": 17,
    "ideology": "Liberal, non-sectarian, pro-EU",
    "logo_url": "/images/alliance.png",
    "primary_color": "#F6CB2F",  # for UI theming
    "manifesto_summary": "Three-sentence summary of their 2022 platform.",
    "promises": [
        {
            "id": "all_001",
            "title": "Integrated education legislation",
            "category": "Education",
            "status": "kept",  # one of: kept, in_progress, broken
            "evidence": "Integrated Education Act 2022 passed.",
            "source_url": "https://..."
        },
        # ~8-12 promises per party
    ],
    "scorecard_summary": {
        "kept": 1,
        "in_progress": 6,
        "broken": 4
    }
}
```

Use the SDLP and PBP delivery review documents already in the project as the source of truth. For Alliance, DUP, Sinn Féin, UUP, use the four-party scorecard document. For TUV, generate plausible promise data based on their 2022 manifesto positions (cut Protocol, oppose NI Protocol, traditional unionism).

Run via `python -m backend.seed.seed_real_parties` from project root.

### Feature 2: Real MLA seed data

**File:** `backend/seed/seed_real_mlas.py`

14 MLAs total — 2 per party, picked for being prominent or having distinctive records:

- **Alliance:** Naomi Long, Andrew Muir
- **DUP:** Gavin Robinson, Edwin Poots (or Paul Givan)
- **Sinn Féin:** Michelle O'Neill, Conor Murphy
- **UUP:** Doug Beattie, Robbie Butler
- **SDLP:** Matthew O'Toole, Colin McGrath
- **PBP:** Gerry Carroll (only PBP MLA — pair with another nominal entry or note "single MLA")
- **TUV:** Jim Allister, Timothy Gaston

Each MLA document:

```python
{
    "_id": "mla_naomi_long",
    "name": "Naomi Long",
    "party_id": "party_alliance",
    "constituency": "Belfast East",
    "role": "Justice Minister",  # if relevant
    "photo_url": "/images/mlas/naomi_long.jpg",
    "votes": [
        {
            "bill": "Climate Change Act 2022",
            "date": "2022-03-09",
            "vote": "For",  # For / Against / Abstain
            "policy_axis": "environment",  # for quiz scoring
            "stance_value": 2,  # -2 to +2
            "hansard_url": "https://..."
        },
        # 7-10 votes per MLA, hand-picked to be illustrative
    ],
    "declared_interests": [
        {
            "type": "Directorship",
            "entity": "Example Ltd",
            "registered_date": "2023-04-15",
            "value": "£12,000-£70,000"
        },
        # 2-3 entries per MLA
    ],
    "donations": [
        {
            "donor": "Donor Name",
            "amount": 5000,
            "date": "2024-09-01",
            "type": "Individual" # or Trade Union, Company etc
        },
        # 2-3 entries per MLA
    ],
    "party_line_voting_pct": 87,  # how often they vote with party
    "bio_short": "Two-sentence bio."
}
```

For votes, focus on issues that map to the quiz axes (housing, health, education, environment, equality, language, economy, justice, welfare, integration). Use real bills where possible (Climate Change Act 2022, Identity and Language Act 2022, Private Tenancies Bill, etc.). For declared interests and donations, use Register of Members' Interests and Electoral Commission records where convenient; otherwise plausible synthetic data is acceptable for the demo.

Run via `python -m backend.seed.seed_real_mlas`.

### Feature 3: Quiz questions and party position mapping

**Files:**
- `backend/data/quiz_questions.json`
- `backend/data/party_positions.json`

Quiz questions: 10 questions, each on a 5-point Likert scale (-2 strongly disagree, -1 disagree, 0 neutral, +1 agree, +2 strongly agree). Each question maps to one policy axis.

```json
[
    {
        "id": "q1",
        "axis": "housing",
        "question": "Private rents should be capped as a percentage of tenant income.",
        "axis_label": "Housing intervention"
    },
    {
        "id": "q2",
        "axis": "education",
        "question": "Academic selection at age 11 should be abolished.",
        "axis_label": "Education reform"
    },
    {
        "id": "q3",
        "axis": "language",
        "question": "Irish should have equal legal status to English in NI.",
        "axis_label": "Language and identity"
    },
    {
        "id": "q4",
        "axis": "environment",
        "question": "NI should commit to net zero by 2035, not 2050.",
        "axis_label": "Climate ambition"
    },
    {
        "id": "q5",
        "axis": "health",
        "question": "Private companies should be removed from delivering NHS services.",
        "axis_label": "Health privatisation"
    },
    {
        "id": "q6",
        "axis": "equality",
        "question": "A standalone Hate Crime Bill should be passed without delay.",
        "axis_label": "Equality legislation"
    },
    {
        "id": "q7",
        "axis": "economy",
        "question": "Corporation tax in NI should be cut below the UK rate.",
        "axis_label": "Economic policy"
    },
    {
        "id": "q8",
        "axis": "welfare",
        "question": "Welfare cuts should be mitigated locally regardless of cost.",
        "axis_label": "Welfare protection"
    },
    {
        "id": "q9",
        "axis": "integration",
        "question": "Cross-border cooperation with Ireland should be deepened.",
        "axis_label": "All-island integration"
    },
    {
        "id": "q10",
        "axis": "justice",
        "question": "Legacy cases from the Troubles should be reopened, not closed.",
        "axis_label": "Legacy and justice"
    }
]
```

Party positions: each party's stance on each axis, scored -2 to +2, derived from their voting record and manifesto delivery. Example:

```json
{
    "party_alliance": {
        "housing": 1,
        "education": 2,
        "language": 1,
        "environment": 2,
        "health": 0,
        "equality": 2,
        "economy": -1,
        "welfare": 1,
        "integration": 2,
        "justice": 1
    },
    "party_sinn_fein": { ... },
    "party_dup": { ... },
    ...
}
```

These values must be defensible with reference to the four-party scorecard doc and the SDLP/PBP delivery reviews.

### Feature 4: Backend endpoints

**File:** `backend/main.py` — extend existing file.

Add these endpoints:

- `GET /parties` — already exists, now returns 7 real parties
- `GET /party/{party_id}` — single party with full scorecard
- `GET /party/{party_id}/mlas` — list MLAs for that party
- `GET /mla/{mla_id}` — full MLA profile (replaces the current stub `/politician/{id}`)
- `GET /quiz/questions` — returns quiz_questions.json
- `POST /quiz/score` — body: `{ "answers": [{ "id": "q1", "value": 2 }, ...] }`. Returns:

```json
{
    "party_alignment": [
        { "party_id": "party_alliance", "name": "Alliance", "alignment_pct": 78, "color": "#F6CB2F" },
        ...sorted descending
    ],
    "top_match": "party_alliance",
    "mla_alignment": [
        { "mla_id": "mla_naomi_long", "name": "Naomi Long", "party_id": "party_alliance", "alignment_pct": 82 },
        ...top 6 only
    ]
}
```

Alignment formula: for each axis, distance = `|user_answer - party_position|`. Max distance per axis = 4. Sum distances across all 10 axes (max total = 40). Alignment % = `100 - (total_distance / 40 * 100)`. Round to nearest integer.

For MLA alignment, score against the MLA's vote record on each axis (use `stance_value` from the votes array). If an MLA has no vote on an axis, fall back to their party's position on that axis.

### Feature 5: Solana fingerprinting on real MLAs

**File:** `backend/seed/run_chain_verify_all.py`

After MLAs are seeded, run a one-shot script that calls `solana_service.verify_profile_on_chain` for each MLA. This stamps them on devnet so the VerifiedBadge appears on every profile.

```python
async def main():
    db = get_db()
    mlas = await db.mlas.find({}).to_list(None)
    for mla in mlas:
        result = await verify_profile_on_chain(mla["_id"], mla, db)
        print(f"Verified {mla['name']}: {result['tx_signature']}")
```

This is Das's task once Rehan's seed data is in.

### Feature 6: Frontend — homepage with quiz CTA

**File:** `frontend/app/page.tsx` — REPLACE the current stub.

Reference `frontend/html/index.html` for the existing visual design (Stormont hero, 7-party arc). Migrate that visual style but change the primary CTA.

Layout:

1. Hero: "Vote for who actually represents you, not who you've always voted for." Subtitle: "Find out which NI party your views actually align with — based on how they've voted, not what they've promised." Large CTA button: "Take the 90-second quiz" → routes to `/quiz`.
2. Below the fold: 7-party arc (clickable, routes to `/party/[id]`) — keep this from the HTML prototype but de-emphasise relative to the quiz CTA.
3. Footer: brief explainer of methodology, link to Solana Explorer for the methodology hash.

Use Tailwind. Match the existing design system from `html/index.html`.

### Feature 7: Frontend — quiz flow

**File:** `frontend/app/quiz/page.tsx`

One question per screen. Progress bar at top showing "Question 3 of 10."

For each question:

- Question text large and clear
- 5 buttons in a row: Strongly Disagree / Disagree / Neutral / Agree / Strongly Agree
- Selecting an answer auto-advances to the next question after a 200ms delay
- On question 10, the final selection routes to `/results` with answers stored in URL state or sessionStorage

Use sessionStorage to preserve answers across the route transition. Format: `{ "q1": 2, "q2": -1, ... }`.

Fetch questions via `GET /quiz/questions` on mount.

### Feature 8: Frontend — results page

**File:** `frontend/app/results/page.tsx`

On mount: read answers from sessionStorage, POST to `/quiz/score`, render results.

Layout:

1. Hero: "You aligned most with **{top_match.name}**." Show alignment percentage as a large number.
2. **Bar chart** (use Recharts horizontal `BarChart`): all 7 parties, sorted descending by alignment %. Top match highlighted with party color. Each bar labeled with party name + percentage.
3. **Audio player section:** play `/audio/result-{top_match_id}.mp3` automatically. ElevenLabs personalised briefing, 90 seconds. Header: "Your personalised briefing."
4. **CTA button:** "See your matched MLAs" → scrolls down to MLA section.
5. **MLA section:** show top 6 MLA matches as cards. Each card: photo, name, party (with party color stripe), constituency, alignment percentage. Click → routes to `/mla/[id]`.
6. **Surprise insight (if applicable):** if top match differs from the dominant party in NI politics OR if user's top match is more than 20% above their second choice, surface a "you might be surprised" callout.

Recharts is already in your `package.json`. Use the responsive container.

### Feature 9: Frontend — party scorecard page

**File:** `frontend/app/party/[id]/page.tsx`

Layout:

1. Header: party logo, name, leader, seat count, ideology one-liner.
2. **Scorecard summary:** three big numbers — Kept (green), In Progress (amber), Broken (red).
3. **Promises list:** all 8-12 promises grouped by status. Each promise row: title, category badge, status badge, evidence one-liner, source link.
4. **MLAs section:** the 2 MLAs from this party, as cards. Click → MLA profile.

Fetch via `GET /party/{id}` and `GET /party/{id}/mlas`.

### Feature 10: Frontend — MLA profile page

**File:** `frontend/app/mla/[id]/page.tsx`

Layout:

1. Header: photo, name, party (color stripe), constituency, role.
2. **VerifiedBadge** (already built component) — top right.
3. **Alignment widget** (only if user came from /results): "You align 73% with this MLA." Pull from sessionStorage.
4. **Tabs:** Overview / Voting Record / Interests / Verification.
5. **Overview tab:** bio, party-line voting %, top 3 votes by alignment with the user.
6. **Voting Record tab:** full list of votes, each with bill, date, vote (For/Against/Abstain), Hansard link.
7. **Interests tab:** declared interests table + donations table.
8. **Verification tab:** the existing ChainPanel component — pass `politicianId={mlaId}`.

Fetch via `GET /mla/{id}` and `GET /mla/{id}/chain`.

### Feature 11: ElevenLabs audio briefings

**Owner:** Ryan, in parallel with frontend work.

Generate 7 audio files locally using ElevenLabs API, save to `frontend/public/audio/result-{party_id}.mp3`.

Each script ~90 seconds, ~250 words. Template:

> "You aligned most with the {Party Name}. Their record on {top issue from your alignment} matches yours: {one specific kept promise or vote}. But here's where they may diverge from you: {one specific broken or in-progress promise}. The {Party Name} holds {seat count} seats at Stormont and is led by {leader}. In the next term, watch for {one upcoming or expected policy area}. VoteWise is anchored on the Solana blockchain so this analysis cannot be silently changed. Your views matter. Vote for the policy, not the tribe."

Generate once, commit to repo.

## Coding conventions

- **British spelling** in user-facing copy.
- **No em dashes** anywhere — use commas, semicolons, or two short sentences.
- **Tailwind classes** only, no custom CSS unless absolutely necessary.
- **TypeScript strict mode**, no `any` unless explicitly justified.
- **Async everywhere** in Python (Motor, not PyMongo).
- **Snake_case** in Python, **camelCase** in TypeScript.
- **No live API calls during demo.** All ElevenLabs files pre-generated. All Solana stamping done before recording. All data seeded.
- **Fallbacks for everything.** If MongoDB times out, return cached data. If Solana is unreachable, the existing fallback in `solana_service.py` handles it.

## What NOT to do

- Do not scrape Hansard or any live source.
- Do not call Companies House or Electoral Commission APIs.
- Do not implement Phantom wallet integration.
- Do not build postcode lookup.
- Do not build the action layer (mailto, upcoming bills).
- Do not implement universal name search.
- Do not refactor the existing Solana code. It works. Leave it.
- Do not commit `keys.txt` further. The existing committed keypair stays as it is — devnet only, no real value at risk, but do not generate a new one and re-commit.

## Build order summary

1. Seed parties (Rehan)
2. Seed MLAs (Rehan)
3. Quiz questions + party positions JSON (Ryan)
4. Backend endpoints (Rehan)
5. Quiz UI (Ryan)
6. Results page with chart (Ryan)
7. Homepage migration (Rehan/Conor)
8. Party page (Rehan)
9. MLA profile page (Rehan)
10. ElevenLabs audio (Ryan, in parallel)
11. Solana chain verification on all MLAs (Das, after seed data lands)
12. Polish, fallbacks, end-to-end testing (all)

## Demo recording checklist

Before recording:

- All 14 MLAs have green VerifiedBadge
- Quiz completes in under 90 seconds
- Results page audio plays automatically
- All 7 party pages load without errors
- Party color theming visible throughout

Demo script (90 seconds):

1. (10s) Hook: "NI politics is dominated by tribal voting. VoteWise breaks that pattern."
2. (15s) Homepage → click quiz CTA.
3. (20s) Speed-run 5 quiz questions on screen.
4. (15s) Results — bar chart appears, audio plays. Voice-over the surprise alignment.
5. (15s) Click into top-match party → show scorecard.
6. (10s) Click into matched MLA → show voting record + Solana badge.
7. (5s) Tagline: "Vote for who actually represents you, not who you've always voted for."

## Submission checklist

- Devpost write-up uses the demo script as the spine.
- 5 screenshots: homepage, quiz mid-flow, results page, party page, MLA page.
- Repo public, README updated with quickstart.
- Live URLs working: Vercel frontend + Railway backend.
- Solana methodology hash visible on the methodology section of homepage footer.
- Submit at 10:30 latest. Do not submit at 10:55.