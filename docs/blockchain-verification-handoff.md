# VoteWise Blockchain Verification Handoff

## Current branch state

- Working branch: `AI-Summary-Report-Generation-notfinished`
- Base branch integrated: `origin/main`
- Local safety branch: `backup/blockchain-verification-before-main-update`
- Checkpoint commit before merging main: `f0b32ad` (`Checkpoint blockchain verification integration`)
- Merge commit from `origin/main`: `ad2ed05`
- After merge: branch is up to date with `origin/main` and ahead by local feature commits.

Rollback point:

```powershell
git switch backup/blockchain-verification-before-main-update
```

Or return current branch to that checkpoint only if intentionally discarding later merge work:

```powershell
git switch AI-Summary-Report-Generation-notfinished
git reset --hard backup/blockchain-verification-before-main-update
```

Only run the reset command if the team explicitly decides to abandon the main merge.

## What was built

### Real Solana devnet stamping

`backend/services/solana_service.py` now refuses to create demo/fallback blockchain records.

Previous behavior:

- If Solana failed, the backend saved fake records such as `DEVNET_MLA_NAOM`.
- If a fallback row already existed with the same hash, rerunning verification returned that fallback row and never upgraded it.

Current behavior:

- A real Solana memo transaction is required.
- If `SOLANA_PRIVATE_KEY` is missing or Solana RPC fails, the operation raises an error.
- Existing fallback rows are upgraded to real devnet transactions.
- Changed records archive the old hash into `changelog`.
- If an old fallback hash is being replaced, that previous hash is first stamped on devnet so the changelog can point to a real transaction.

### Backend verification routes

`backend/main.py` includes:

- `GET /chain/status/{politician_id}`
- `POST /chain/verify/{politician_id}`
- `POST /admin/verify-all-mlas`
- `GET /tracker/mla/{mla_id}`
- `GET /tracker/session/{slug}`

Important behavior:

- `/chain/verify/{politician_id}` now verifies real MLA data from `votewise.mlas`.
- It no longer verifies a stub profile or writes in-memory fallback chain state.
- Errors return `502` if real Solana stamping fails.

### Main-site MLA verification

`frontend/app/components/ChainPanel.tsx` now includes:

- Current verification card.
- Browser-side hash verification.
- Blockchain log containing:
  - `Current`
  - `Previous 1`, `Previous 2`, etc. from `changelog`
- Per-entry explorer links using stored `explorer_url`, so links open actual Solana transaction URLs.

`frontend/app/components/VerifiedBadge.tsx` uses stored `state.explorer_url`, not a fixed wallet address.

### Tracker MLA/session verification

Added shared tracker verification component:

- `frontend/app/components/tracker/TrackerVerificationPanel.tsx`

Used by:

- `frontend/app/tracker/mla/[mla-slug]/page.tsx`
- `frontend/app/tracker/sessions/[slug]/SessionVerificationDropdown.tsx`

Tracker behavior:

- MLAs have a `Verification` section.
- Sessions keep their original long-form page layout.
- Session verification opens from a subtle `Verify` dropdown beside topic tags.
- Hashes are computed client-side and compared against `/chain/status/{recordId}`.
- Blockchain history is shown in a scrollable log with hidden scrollbar styling.

Added tracker batch stamping script:

- `backend/seed/verify_tracker_records.py`

It stamps:

- Tracker MLAs from `data/mla-tracker/mlas.json`
- Tracker sessions from `data/mla-tracker/sessions/*/summary.json`

### Styling changes

`frontend/app/globals.css` adds:

```css
.tracker-hidden-scrollbar
```

This hides scrollbars while preserving scroll behavior in verification dropdown/log panels.

Verification UI polish:

- Green verification text.
- White hash pills.
- Green ping animation.
- Real green check icon for matching data.
- More premium typography in the tracker verification panel.

## Data already stamped

Real devnet stamping was run after fallback removal.

Commands executed:

```powershell
python -m backend.seed.run_chain_verify_all
python -m backend.seed.verify_tracker_records
```

Observed result:

- 14 main-site MLA records stamped as real devnet transactions.
- 8 tracker records stamped as real devnet transactions.
- MongoDB `votewise.chain_state` check:
  - total: `23`
  - real: `23`
  - fallback: `0`

## Future update workflow

When MLA data or tracker JSON changes, hashes do not update automatically.

For main-site MLAs:

```powershell
python -m backend.seed.run_chain_verify_all
```

Or one MLA:

```powershell
Invoke-RestMethod -Method Post http://localhost:8000/chain/verify/<mla_id>
```

For tracker MLAs/sessions:

```powershell
python -m backend.seed.verify_tracker_records
```

Expected behavior after one update:

- New hash becomes `profile_hash`.
- Old hash moves into `changelog`.
- UI shows two hashes in the blockchain log.

## Validation performed

Passed:

```powershell
npx tsc --noEmit
```

Passed backend syntax parse for:

- `backend/services/solana_service.py`
- `backend/main.py`
- `backend/seed/run_chain_verify_all.py`
- `backend/seed/verify_tracker_records.py`

Lint status:

```powershell
npm run lint
```

Still fails on existing issues not introduced by the blockchain work:

- `BeeSwarm.tsx` set-state-in-effect
- `FloatingChatbot.tsx` set-state-in-effect
- `frontend/app/mla/[id]/page.tsx` set-state-in-effect
- `tracker/methodology/page.tsx` unescaped apostrophes
- A few pre-existing warnings

## Merge process used

1. Checked current branch and dirty files.
2. Created checkpoint commit:

```powershell
git commit -m "Checkpoint blockchain verification integration"
```

3. Created local backup branch:

```powershell
git branch backup/blockchain-verification-before-main-update
```

4. Fetched latest GitHub refs:

```powershell
git fetch origin
```

5. Confirmed divergence:

```powershell
git rev-list --left-right --count HEAD...origin/main
```

6. Merged main into this branch:

```powershell
git merge origin/main
```

7. Resolved the only conflict in `backend/main.py`.
8. Re-ran validation.
9. Created merge commit.

## Recommended next steps with Rehan's branch

Rehan branch: `feature/pro-tier`

Recommended safe integration plan:

1. Make sure both branches are pushed.
2. Create a new integration branch instead of merging directly into either person's feature branch:

```powershell
git fetch origin
git switch -c integration/blockchain-plus-pro-tier origin/feature/pro-tier
git merge origin/AI-Summary-Report-Generation-notfinished
```

3. Resolve conflicts deliberately, especially in frontend design files.
4. Run:

```powershell
cd frontend
npx tsc --noEmit
npm run lint
```

5. Start backend and frontend, then manually test:

- Main MLA profile verification tab.
- Tracker MLA verification section.
- Tracker session `Verify` dropdown.
- Blockchain log current/previous hashes.
- Solana Explorer links.
- Ryan's session summary and chatbot flow.
- Rehan's pro-tier design changes.

6. Only merge to `main` after both sides approve the integrated UI choices.

## Prompt for another Codex/LLM

Use this prompt if handing off to another coding agent:

```text
You are working in the VoteWise / HackBelfast repo. The current branch is AI-Summary-Report-Generation-notfinished. This branch contains Ryan's AI summary/session chatbot work plus blockchain verification work. It has already been updated with origin/main via a merge commit.

Primary goal:
Review and continue the integration of real Solana devnet blockchain verification with the main-site MLA profiles, tracker MLA pages, and tracker session pages. Preserve Ryan's original session-summary/chatbot frontend structure and do not merge to main directly.

Important blockchain changes already made:
- backend/services/solana_service.py no longer writes fallback/demo DEVNET_* records. Real Solana devnet transactions are required.
- Existing fallback rows are upgraded to real devnet transactions.
- Changed profile hashes archive old hashes into chain_state.changelog.
- backend/seed/run_chain_verify_all.py stamps all main-site MLAs in votewise.
- backend/seed/verify_tracker_records.py stamps tracker MLAs and tracker sessions.
- frontend/app/components/ChainPanel.tsx shows a Blockchain log in the main MLA Verification tab.
- frontend/app/components/tracker/TrackerVerificationPanel.tsx provides shared tracker verification UI.
- frontend/app/tracker/sessions/[slug]/SessionVerificationDropdown.tsx adds a subtle Verify dropdown beside session topic tags.
- Verification links should use stored explorer_url values so they open exact Solana transaction pages.

Validation already performed:
- npx tsc --noEmit passes.
- Backend syntax parse passes for main blockchain files.
- npm run lint currently fails on existing lint issues in BeeSwarm, FloatingChatbot, main MLA page, and methodology apostrophes. Do not treat those as new blockchain regressions unless you choose to fix them separately.

Safety:
- Backup branch exists locally: backup/blockchain-verification-before-main-update.
- Do not reset, force-push, or delete branches unless explicitly approved.

Next intended team workflow:
- Push AI-Summary-Report-Generation-notfinished to GitHub.
- Rehan's branch is feature/pro-tier and is up to date with main.
- Prefer creating integration/blockchain-plus-pro-tier from origin/feature/pro-tier, then merge origin/AI-Summary-Report-Generation-notfinished into it.
- Resolve UI conflicts by comparing design quality and preserving working blockchain/session chatbot behavior.
- Run TypeScript, lint, backend smoke checks, and manual QA before main.
```
