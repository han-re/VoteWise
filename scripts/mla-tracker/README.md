# MLA Tracker — Data Pipeline

Scripts that collect, validate, and merge public NI Assembly data into
`data/mla-tracker/`. All scripts use only the Python standard library.

## Data sources

| Script | Source | Cadence | Output |
|--------|--------|---------|--------|
| `scrape_hansard.py` | AIMS Speeches API | Weekly | `raw/hansard_contributions.json` |
| `scrape_voting.py` | AIMS Divisions API | Weekly | `raw/voting_records.json` |
| `scrape_register.py` | Register of Members' Interests (HTML) | Monthly | `raw/declared_interests.json` |
| `scrape_committees.py` | Committee minutes (HTML) | Monthly | `raw/committee_attendance.json` |
| `process_pledges.py` | Merges all raw outputs | After each scrape | `mlas.json` |

## Quick start

Run from the **repo root** (not from inside this directory):

```bash
# 1. Fetch new data
python -m scripts.mla-tracker.scrape_hansard
python -m scripts.mla-tracker.scrape_voting
python -m scripts.mla-tracker.scrape_register
python -m scripts.mla-tracker.scrape_committees

# 2. Merge into canonical JSON
python -m scripts.mla-tracker.process_pledges
```

Use `--dry-run` on any script to simulate without making HTTP requests or
writing files:

```bash
python -m scripts.mla-tracker.scrape_hansard --dry-run
python -m scripts.mla-tracker.process_pledges --dry-run
```

## Architecture decisions

### Atomic writes

Every output file is written to a `.tmp` sibling first, then renamed with
`os.rename()`. This prevents the frontend from ever reading a half-written
file if a script is interrupted.

### Caching

HTTP responses are cached in `data/mla-tracker/cache/` keyed by SHA-256 of
the URL. Hansard/voting cache expires after one calendar week; HTML pages
(Register, committee minutes) cache for 28 days. Pass `--force-refresh` to
bypass the cache on any scraper.

### Rate limiting

- AIMS API (JSON): 1 request per 2 seconds
- Public HTML pages: 1 request per 3 seconds

All scrapers use exponential backoff (2 s, 4 s, 8 s) on failure with a
maximum of 3 attempts.

### Robots.txt compliance

- `aims.niassembly.gov.uk` — no restrictions on `/officialreport/` or
  `/voting/`. The AIMS API is the intended machine interface.
- `niassembly.gov.uk` — no `/disallow` on `/your-mlas/` or
  `/assembly-business/committees/` as of May 2026.

The `User-Agent` sent with every request identifies this tool:
`MLA-Tracker/1.0 (accountability research)`.

### Editorial vs computed fields

`process_pledges.py` only overwrites fields it can recompute from raw data:

- `chamber_contributions_total.value`
- `committee_attendance_pct.value`
- `snapshots` (monthly contribution counts)
- `contributions`, `votes`, `interests` arrays

It never overwrites:

- `pledge_delivery_score` (editorial, requires human review)
- `bio_short`, `photo_url`, `role` (editorial)
- `pledges` (editorial)

This means you can re-run the pipeline at any time without losing editorial
judgements.

## Adding a new MLA

1. Add their display name and AIMS member ID to `TRACKED_MLAS` in
   `scrape_hansard.py` and `scrape_voting.py`.
2. Add their slug and display name to `TRACKED_MLA_SLUGS` in
   `scrape_register.py`.
3. Add their committee assignments to `MLA_COMMITTEES` in
   `scrape_committees.py`.
4. Add a seed entry to `data/mla-tracker/mlas.json` with all required
   editorial fields.
5. Run the full pipeline.

## Directory structure

```
data/mla-tracker/
├── mlas.json                    # Canonical MLA profiles (source of truth)
├── parties.json                 # Party pledge scorecards
├── reports.json                 # Report index
├── reports/
│   └── *.json                   # Individual report bodies
├── raw/
│   ├── hansard_contributions.json
│   ├── voting_records.json
│   ├── declared_interests.json
│   └── committee_attendance.json
└── cache/
    └── *.json                   # HTTP response cache (gitignored)
```

Add `data/mla-tracker/cache/` and `data/mla-tracker/raw/` to `.gitignore`
unless you want to commit raw scraper outputs to the repo.
