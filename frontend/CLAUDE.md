@AGENTS.md

# VoteWise — HackBelfast 2026

## What this project is
Belfast politician accountability platform. Aggregates public data 
(voting records, Companies House directorships, Electoral Commission 
donations, LPS planning decisions), cross-references with Claude AI 
to surface conflicts of interest, logs every data state on Solana 
devnet so records can't be quietly altered.

## The stack — do not deviate from this
- Frontend: Next.js 15 (App Router) + Tailwind + shadcn/ui → Vercel
- Backend: FastAPI (Python 3.11) → Railway
- Database: MongoDB Atlas M0 (eu-west-1)
- AI: Anthropic Claude API (claude-opus-4-5)
- Blockchain: Solana web3.js (devnet only — no mainnet, no real funds)


## Repo structure
```
/frontend    → Next.js app (deploys to Vercel)
/backend     → FastAPI app (deploys to Railway)
  /services  → claude_service.py, solana_service.py
  /scripts   → seed_politicians.py, seed_companies.py, seed_donations.py
  /data      → donations.csv and any raw data files
.env.example → lists all required env var keys (no values)
CLAUDE.md    → this file
```

## Environment variables
- ANTHROPIC_API_KEY → Railway (backend)
- MONGODB_URI → Railway (backend) + local .env
- SOLANA_PRIVATE_KEY → Railway (backend) + local .env
- NEXT_PUBLIC_API_URL → Vercel (frontend) — must be set before build

## Critical deployment rules
- Always `git push` to trigger Vercel deploy — never click Redeploy for code changes
- NEXT_PUBLIC_ vars are baked at build time — set before pushing
- Hard refresh browser after every Vercel deploy
- Railway: Root Directory = /backend, not repo root
- MongoDB: eu-west-1, network access 0.0.0.0/0

## MongoDB collections
```
politicians     → _id, name, party, constituency, type, photo_url, source
votes           → politician_id, motion, date, decision, source_url
interests       → politician_id, type, description, date, source
companies       → politician_id, company_name, company_number, role, 
                  appointed_on, resigned_on, status, source, source_url
donations       → politician_id, donor_name, amount, date, donor_type, 
                  source, source_url
conflicts       → politician_id, type, summary, description, evidence[], 
                  confidence, generated_at
chain_state     → politician_id, tx_signature, profile_hash, explorer_url,
                  verified_at, network
```

## FastAPI endpoints (all in /backend/main.py)
```
GET  /health
GET  /db-test
GET  /politician/search?q={name}
GET  /politician/{id}
GET  /politician/{id}/votes
GET  /politician/{id}/interests
GET  /politician/{id}/companies
GET  /politician/{id}/donations
GET  /politician/{id}/conflicts
GET  /politician/{id}/chain
POST /conflict/generate/{id}
POST /chain/verify/{id}
```

## Claude integration (Ryan owns — /backend/services/claude_service.py)
Three tasks:
1. PDF extraction from Register of Members Interests
2. Conflict detection — cross-references votes + companies + donations
3. Vote summary — plain English by topic area

Model: claude-opus-4-5
Always return JSON only. Strip markdown fences before parsing.
Store conflict results in MongoDB conflicts collection.
Never let Claude errors crash the pipeline — catch and log.

## Solana integration (Das owns — /backend/services/solana_service.py)
Network: devnet only
Three functions:
1. Profile state hashing — sha256 of full politician data → memo tx
2. Verified timestamp display — chain_state record with explorer URL
3. Community flag co-signing — memo tx with politician_id + conflict_id

CRITICAL: Solana errors must never break the demo.
Always have a fallback mock record in the except block.

## Frontend screens (Conor owns — /frontend/app/)
```
/                        → Home: search bar
/politician/[id]         → Profile: tabbed layout
  tabs: overview, votes, companies, donations, conflicts, chain
```

## The demo politicians (fill in Saturday morning)
These 3 are pre-seeded with rich data regardless of pipeline status:
1. NAME: [TBD] ID: [TBD]
2. NAME: [TBD] ID: [TBD]  
3. NAME: [TBD] ID: [TBD]

## Current build phase
UPDATE THIS as phases complete:
- [ ] Phase 1 — Backend foundation (MongoDB connected)
- [ ] Phase 2 — Data pipeline (politicians, companies, donations seeded)
- [ ] Phase 3 — FastAPI endpoints (all returning real data)
- [ ] Phase 4 — Claude integration (conflicts generated for demo politicians)
- [ ] Phase 5 — Solana integration (chain verify working, fallback tested)
- [ ] Phase 6 — Frontend (home + profile screens live on Vercel)
- [ ] Phase 7 — Integration (full loop tested, demo rehearsed)

## Legal boundary — never violate this
Every data point displayed must have a source link.
VoteWise aggregates public record only — zero independent claims.
Claude output must describe correlations, never make accusations.
No personal addresses, family info, or non-public data ever.

## What winning looks like
Search a politician → profile loads → Conflicts tab → HIGH confidence 
conflict with evidence sources → Chain tab → Solana Explorer link works.
That loop, working flawlessly, wins Grand Prize.
