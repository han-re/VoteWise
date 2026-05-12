# VoteWise Integration Branch Handoff

Branch: `integration/blockchain-plus-pro-tier`  
Remote: `origin/integration/blockchain-plus-pro-tier`  
Last reviewed: 2026-05-12  
Head commit: `6583122 feat(pro): integrate sessions feed and chatbot`

## Executive summary

This branch combines three major workstreams on top of `origin/main`:

1. **VoteWise Pro**: a paid-style analytics dashboard at `/pro`, backed by new FastAPI endpoints under `/pro/*` and new MongoDB collections for donations, spending, Stormont sessions, attendance, and engagement.
2. **MLA Tracker**: a rich public tracker experience at `/tracker`, backed mostly by committed JSON in `data/mla-tracker`, with visualisation, reports, MLA/party pages, session summaries, and verification UI.
3. **Blockchain verification integration**: stricter real Solana devnet stamping for main MLA profiles plus tracker MLA/session records, with browser-side hash checking and changelog display.

The branch is substantial: compared with `origin/main`, it adds 109 files and a large volume of committed data, including session embeddings, raw PDFs, tracker JSON, Pro seed CSVs, and the Pro/tracker UI surfaces.

## Commit chronology

The feature line after `origin/main` is:

| Commit | Date | Notes |
|---|---:|---|
| `88c9bbd` | 2026-05-10 | Early WIP checkpoint for tracker/pro/blockchain work. |
| `074bf96` | 2026-05-10 | Adds Electoral Commission donation and spending CSV ingestion. |
| `aa3a664` | 2026-05-10 | Adds Stormont session and per-MLA participation ingestion. |
| `364286e` | 2026-05-10 | Adds `backend/routers/pro_router.py` and the `/pro/*` analytics API. |
| `cf37a20` | 2026-05-10 | Adds Pro shell, sidebar, topbar, and visual tokens. |
| `b1abcdf` | 2026-05-10 | Adds Pro overview dashboard. |
| `1acbf14` | 2026-05-10 | Adds donations and spending Pro page. |
| `1c8c53b` | 2026-05-10 | Adds attendance and engagement Pro page. |
| `ecf2b25` | 2026-05-10 | Adds sessions feed and chatbot integration. |
| `4107b6e` | 2026-05-10 | Adds pricing page, demo polish, and chain integrity work. |
| `f0b32ad` | 2026-05-11 | Blockchain verification checkpoint from the AI summary/report branch. |
| `ad2ed05` | 2026-05-11 | Merges `origin/main` into `AI-Summary-Report-Generation-notfinished`. |
| `8c4b2a4` | 2026-05-11 | Adds the blockchain verification handoff guide. |
| `0f39fdb` | 2026-05-11 | Merges `origin/AI-Summary-Report-Generation-notfinished` into this integration branch. |
| `8ade104` | 2026-05-11 | Merge cleanup/chore commit for AI summary branch integration. |
| `6583122` | 2026-05-11 | Final sessions feed/chatbot integration on this branch. |

The existing blockchain-specific handoff remains at `docs/blockchain-verification-handoff.md` and is still useful for the Solana verification workstream.

## Repository shape

Top-level areas:

| Path | Purpose |
|---|---|
| `frontend/` | Next.js 16 / React 19 app. Contains the public VoteWise app, `/tracker`, and `/pro`. |
| `backend/` | Main FastAPI service. Serves quiz, parties, MLAs, blockchain verification, tracker read endpoints, and Pro analytics endpoints. |
| `backend-tracker/` | Separate FastAPI chatbot/RAG service for session transcript Q&A. Intended to run on port `8001` locally. |
| `data/mla-tracker/` | Static tracker source data: MLAs, parties, reports, session metadata, transcript text, and embeddings. |
| `backend/data/` | Main backend seed sources: quiz/party data plus new Pro CSV/session data. |
| `scripts/mla-tracker/` | Standard-library scrapers and processors for tracker data refresh. |
| `raw-pdfs/` | Raw plenary PDFs for 2026-04-27, 2026-04-28, and 2026-05-05. |
| `docs/` | Handoff and integration documentation. |

## Frontend overview

The frontend is a Next.js app using the App Router.

Important package scripts:

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

Important environment variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CHATBOT_API_URL=http://localhost:8001
```

### Public VoteWise app

Existing routes remain in place:

- `/quiz`
- `/results`
- `/party/[id]`
- `/mla/[id]`
- `/chain-demo`

These continue to use the main backend for quiz scoring, party/MLA profile data, and Solana verification state.

### Pro dashboard

New Pro routes:

- `/pro`
- `/pro/donations`
- `/pro/attendance`
- `/pro/sessions`
- `/pro/sessions/[id]`
- `/pro/pricing`

Core components:

- `frontend/app/pro/components/ProShell.tsx`
- `frontend/app/pro/components/ProSidebar.tsx`
- `frontend/app/pro/components/ProTopBar.tsx`
- `frontend/app/pro/components/DataTable.tsx`
- `frontend/app/pro/components/KpiTile.tsx`
- `frontend/app/pro/components/RankingList.tsx`
- `frontend/app/pro/components/TimeSeriesChart.tsx`

The Pro UI is currently client-heavy and mostly styled with inline style objects plus CSS variables from `globals.css`. The shell collapses below a 900 px breakpoint. There is no real authentication, subscription gate, organisation model, or server-side authorization yet; `localStorage` only stores a demo organisation label.

### Tracker app

New tracker routes:

- `/tracker`
- `/tracker/methodology`
- `/tracker/mla/[mla-slug]`
- `/tracker/party/[party-slug]`
- `/tracker/reports`
- `/tracker/reports/[slug]`
- `/tracker/sessions/[slug]`

Core tracker components:

- `BeeSwarm*` components for the MLA visualisation.
- `ChartWrapper.tsx` for tracker chart framing.
- `ContributionTimeline.tsx`, `VoteBreakdown.tsx`, and `SessionCard.tsx`.
- `TrackerVerificationPanel.tsx` for browser-side hash verification.
- `ChatbotProvider.tsx`, `ChatbotSidebar.tsx`, and `FloatingChatbot.tsx` for the RAG chat UX.

Tracker pages mostly read committed JSON from `data/mla-tracker` through local imports/types. The backend also exposes small read endpoints for tracker chain payloads.

## Backend overview

The main backend is FastAPI in `backend/main.py`. It mounts:

- `routers.quiz_router`
- `routers.pro_router`

Runtime dependencies are in `backend/requirements.txt`:

- `fastapi`
- `uvicorn[standard]`
- `motor`
- `pymongo>=4.9`
- `python-dotenv`
- `solders`
- `solana`
- `base58`
- `httpx`
- `pandas`

Important environment variables:

```bash
MONGODB_URI=mongodb://localhost:27017
SOLANA_PRIVATE_KEY=<base58 devnet private key>
```

The backend defaults to Mongo database `votewise`.

### Main backend endpoints

Existing/product endpoints include:

- `GET /health`
- `GET /parties`
- `GET /party/{party_id}`
- `GET /party/{party_id}/mlas`
- `GET /mla/{mla_id}`
- `GET /mla/{mla_id}/chain`
- `GET /politician/{politician_id}`
- `GET /politician/{politician_id}/chain`
- `GET /chain/status/{politician_id}`
- `POST /chain/verify/{politician_id}`
- `POST /admin/verify-all-mlas`
- `POST /admin/seed-parties`
- `POST /admin/seed-mlas`

New Pro/admin ingestion endpoints include:

- `POST /admin/seed-party-donations`
- `POST /admin/seed-party-spending`
- `POST /admin/seed-stormont-sessions`

Tracker read endpoints:

- `GET /tracker/mla/{mla_id}`
- `GET /tracker/session/{slug}`

### Pro API endpoints

All are mounted by `backend/routers/pro_router.py` under `/pro`.

Health/freshness:

- `GET /pro/health`

Donations:

- `GET /pro/donations/parties`
- `GET /pro/donations/top-donors`
- `GET /pro/donations/timeseries`

Spending:

- `GET /pro/spending/parties`
- `GET /pro/spending/timeseries`
- `GET /pro/spending/top-categories`

Attendance and engagement:

- `GET /pro/attendance/mlas`
- `GET /pro/attendance/timeseries?mla_id=...`
- `GET /pro/engagement/leaderboard`

Sessions:

- `GET /pro/sessions/latest`
- `GET /pro/sessions/{session_id}`

The Pro router intentionally reads the free-product `mlas`, `parties`, and `chain_state` collections but does not mutate them. This is important because changing stamped MLA documents invalidates Solana hashes.

## Data model and seed flow

### Existing/free collections

- `parties`
- `Parties` as a legacy fallback collection name
- `mlas`
- `chain_state`

### Pro collections

- `party_donations`
- `party_spending`
- `stormont_sessions`
- `mla_session_participation`

Each Pro seed writes a `_meta` document with `last_seeded_at`. `/pro/health` surfaces these timestamps and the frontend uses them for freshness labels/default date ranges.

### Seed commands

Run from repo root with backend dependencies installed:

```bash
python -m backend.seed.seed_party_donations
python -m backend.seed.seed_party_spending
python -m backend.seed.seed_stormont_sessions
```

Equivalent admin routes exist:

```bash
POST /admin/seed-party-donations
POST /admin/seed-party-spending
POST /admin/seed-stormont-sessions
```

Data sources:

- `backend/data/electoral_commission_donations.csv`
- `backend/data/electoral_commission_spending.csv`
- `backend/data/stormont_sessions.json`
- `backend/data/engagement_methodology.md`

Current Stormont session seed contains six sessions. The file itself says the attendance/engagement counts are synthetic or illustrative pending a production Hansard ingestion flow.

## Blockchain verification

The Solana service is in `backend/services/solana_service.py`.

Current behavior:

- Hashes profile payloads using canonical JSON with sorted keys and compact separators.
- Writes the hash to Solana devnet Memo program.
- Stores the tx signature, explorer URL, hash, timestamp, network, and fallback flag in `db.chain_state`.
- Refuses to create demo/fallback chain records if `SOLANA_PRIVATE_KEY` is not configured.
- If a record changes, the previous hash is pushed into `changelog`.

Main-site stamping:

```bash
python -m backend.seed.run_chain_verify_all
```

Tracker stamping:

```bash
python -m backend.seed.verify_tracker_records
```

Tracker record IDs are namespaced:

- `tracker_mla_{mla_id}`
- `tracker_session_{session_slug}`

Frontend verification components recompute hashes in the browser and compare them with `GET /chain/status/{recordId}`:

- Main MLA profile: `frontend/app/components/ChainPanel.tsx`
- Tracker records: `frontend/app/components/tracker/TrackerVerificationPanel.tsx`

## Chatbot/RAG service

The chatbot service lives in `backend-tracker/` and is separate from the main backend.

Local run intent from code comments:

```bash
uvicorn backend_tracker.main:app --reload --port 8001
```

Because the directory on disk is named `backend-tracker` with a hyphen, that exact module command may need adjustment unless the app is deployed with the directory as the working root. From inside `backend-tracker`, the practical local command is likely:

```bash
uvicorn main:app --reload --port 8001
```

Required environment variables:

```bash
OPENAI_API_KEY=<key>
ALLOWED_ORIGINS=http://localhost:3000,https://votewise.vercel.app
```

Endpoint:

- `GET /health`
- `POST /chat`

`POST /chat` accepts:

```json
{
  "session_slug": "2026-05-05-plenary",
  "question": "What did members say about Springhill?",
  "history": []
}
```

The service loads `data/mla-tracker/sessions/{slug}/embeddings.json`, embeds the user question, retrieves the top five chunks by cosine similarity, and calls a chat model with the transcript context. The response is expected as JSON with `answer` and `sources`.

Committed session embeddings currently exist for:

- `2026-04-27-plenary`
- `2026-04-28-plenary`
- `2026-05-05-plenary`

## Tracker data pipeline

Pipeline docs are in `scripts/mla-tracker/README.md`.

Primary commands:

```bash
python -m scripts.mla-tracker.scrape_hansard
python -m scripts.mla-tracker.scrape_voting
python -m scripts.mla-tracker.scrape_register
python -m scripts.mla-tracker.scrape_committees
python -m scripts.mla-tracker.process_pledges
```

The README says these scripts are standard-library only, use cached HTTP responses, rate-limit external calls, write atomically, and preserve editorial fields in `data/mla-tracker/mlas.json`.

Important caveat: Python module paths containing hyphens are awkward. The documented `python -m scripts.mla-tracker...` form may fail depending on import resolution. Be ready to run the scripts by file path or rename/package the directory before productionising.

## Local development checklist

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then seed Mongo if using a fresh database:

```bash
python -m backend.seed.seed_real_parties
python -m backend.seed.seed_real_mlas
python -m backend.seed.seed_party_donations
python -m backend.seed.seed_party_spending
python -m backend.seed.seed_stormont_sessions
```

Only run Solana stamping if `SOLANA_PRIVATE_KEY` is configured and you intend to publish/refresh hashes:

```bash
python -m backend.seed.run_chain_verify_all
python -m backend.seed.verify_tracker_records
```

### Chatbot backend

```bash
cd backend-tracker
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Expected local URLs:

- Frontend: `http://localhost:3000`
- Main backend: `http://localhost:8000`
- Chatbot backend: `http://localhost:8001`

## Deployment notes

Main backend:

- Deploys as FastAPI/Railway-style service from `backend/`.
- Needs `MONGODB_URI`.
- Needs `SOLANA_PRIVATE_KEY` for verification writes.
- Admin seed endpoints are public in code unless deployment infrastructure blocks them. They should be protected before any real public deployment.

Frontend:

- Deploys as Next.js/Vercel-style app from `frontend/`.
- Needs `NEXT_PUBLIC_API_URL`.
- Needs `NEXT_PUBLIC_CHATBOT_API_URL` if the chatbot service is deployed separately.

Chatbot backend:

- Deploys separately from `backend-tracker/`.
- Needs `OPENAI_API_KEY`.
- Needs `ALLOWED_ORIGINS` configured for the deployed frontend origin.

## Known risks and unfinished edges

1. **No Pro access control**  
   `/pro` is a polished dashboard, but it is not protected. Treat it as demo/prototype until authentication, billing/subscription state, and backend authorization are added.

2. **Admin endpoints are unauthenticated in code**  
   `/admin/seed-*` and `/admin/verify-all-mlas` mutate Mongo/Solana state. They should be locked down or removed from public deployments.

3. **Synthetic engagement data**  
   `backend/data/stormont_sessions.json` and `backend/data/engagement_methodology.md` document that current session participation metrics are illustrative. This must be disclosed in any serious demo.

4. **Encoding/mojibake artifacts**  
   Several files show corrupted symbols such as `â€”`, `Â£`, `Sinn FÃ©in`, and arrow glyphs. This appears throughout README text and UI strings. It should be cleaned before a polished release.

5. **Two Mongo clients**  
   `backend/main.py` and `backend/routers/pro_router.py` each maintain their own `AsyncIOMotorClient`. It works, but a shared dependency/lifespan pattern would be cleaner and easier to test.

6. **Chatbot service path mismatch**  
   Comments reference `backend_tracker.main:app`, but the folder is `backend-tracker`. Confirm the deployed start command.

7. **Committed embeddings are large**  
   `data/mla-tracker/sessions/*/embeddings.json` accounts for most of the branch size. This is fine for a hackathon branch, but for production consider object storage or a vector database.

8. **Pro frontend error handling is broad**  
   Most Pro pages call many endpoints in `Promise.all`; one endpoint failure flips the whole page to a generic error. For production, partial rendering would be more resilient.

9. **Inline style-heavy frontend**  
   The Pro and tracker UIs work as standalone surfaces, but long-term maintenance would benefit from shared UI tokens/components and fewer large page files.

10. **Blockchain writes are intentionally strict**  
    This is correct for integrity, but it means missing `SOLANA_PRIVATE_KEY` or devnet RPC failures are hard failures. Do not run publication workflows without the key and a reachable Solana devnet.

## Recommended next steps

## Validation performed during this handoff

Passed:

```bash
cd frontend
npx tsc --noEmit
```

Passed:

```bash
python ast-parse check over backend, backend-tracker, and scripts
```

Result: parsed 37 Python files with no syntax errors.

Could not use `python -m compileall backend backend-tracker scripts` because Windows denied writes/renames inside existing `__pycache__` directories. The AST parse check above was used to avoid writing bytecode.

Failed:

```bash
cd frontend
npm run lint
```

Current lint failures:

- `frontend/app/components/tracker/BeeSwarm.tsx`: `react-hooks/set-state-in-effect`
- `frontend/app/components/tracker/FloatingChatbot.tsx`: `react-hooks/set-state-in-effect`
- `frontend/app/mla/[id]/page.tsx`: `react-hooks/set-state-in-effect`
- `frontend/app/pro/components/ProSidebar.tsx`: `react-hooks/set-state-in-effect`
- `frontend/app/tracker/methodology/page.tsx`: two `react/no-unescaped-entities` errors

Current lint warnings:

- `frontend/app/components/tracker/ContributionTimeline.tsx`: unused `CSSProperties`
- `frontend/app/components/tracker/FloatingChatbot.tsx`: unused `useRef`
- `frontend/app/pro/attendance/page.tsx`: unused `useMemo`
- `frontend/app/pro/components/ProPageContext.tsx`: missing `breadcrumb` dependency
- `frontend/app/results/page.tsx`: unused expression

Failed:

```bash
cd frontend
npm run build
```

The build failed before app compilation completed because `next/font` could not fetch Google Fonts from the sandboxed environment:

- `Geist`
- `Geist Mono`
- `Source Serif 4`

Re-run the build in an environment with network access or switch these fonts to local assets before treating this as an application build failure.

## Recommended next steps

1. Re-run validation on this exact branch after fixing or accepting the known failures:

   ```bash
   cd frontend
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

   ```bash
   cd backend
   python -m compileall .
   ```

2. Smoke-test the main backend:

   - `GET /health`
   - `GET /pro/health`
   - `GET /pro/donations/parties`
   - `GET /pro/attendance/mlas`
   - `GET /pro/sessions/latest`
   - `GET /chain/status/{known_record_id}`

3. Smoke-test the frontend manually:

   - `/pro`
   - `/pro/donations`
   - `/pro/attendance`
   - `/pro/sessions`
   - `/pro/sessions/{session_id}`
   - `/tracker`
   - `/tracker/mla/{mla-slug}`
   - `/tracker/sessions/{slug}`
   - Main `/mla/{id}` verification tab

4. Smoke-test the chatbot separately:

   - Start `backend-tracker` on `8001`.
   - Set `NEXT_PUBLIC_CHATBOT_API_URL`.
   - Open a Pro or tracker session page and ask a transcript-grounded question.

5. Decide the release posture:

   - If this is hackathon/demo only, disclose synthetic Pro session metrics and keep admin routes behind private infrastructure.
   - If this is production-bound, add auth, protect admin writes, clean encoding, move embeddings out of git, and replace synthetic engagement fields with real ingestion.

## Handoff prompt for another engineer or agent

```text
You are working in the VoteWise / HackBelfast repo on branch integration/blockchain-plus-pro-tier.

This branch integrates VoteWise Pro analytics, the MLA Tracker, session chatbot/RAG work, and strict Solana devnet blockchain verification. Read docs/integration-blockchain-plus-pro-tier-handoff.md and docs/blockchain-verification-handoff.md first.

Primary surfaces:
- frontend/app/pro: Pro dashboard pages and components.
- frontend/app/tracker and frontend/app/components/tracker: public tracker, charts, reports, sessions, chatbot, and tracker verification.
- backend/routers/pro_router.py: /pro analytics API.
- backend/seed/seed_party_donations.py, seed_party_spending.py, seed_stormont_sessions.py: Pro data ingestion.
- backend/services/solana_service.py and backend/seed/verify_tracker_records.py: real Solana devnet stamping.
- backend-tracker: separate chatbot RAG API using committed session embeddings.

Be careful:
- Do not mutate stamped MLA data casually; it invalidates chain hashes.
- Do not run Solana stamping unless SOLANA_PRIVATE_KEY is configured and the team intends to publish new hashes.
- Admin seed/verify routes are not protected in code.
- Current Pro session engagement data is documented as synthetic/illustrative.
- There are encoding artifacts to clean before release.

Before merging or shipping:
- Run frontend TypeScript, lint, and build.
- Run backend syntax checks.
- Start backend, chatbot backend, and frontend locally.
- Manually test /pro, /tracker, chatbot, and blockchain verification paths.
```
