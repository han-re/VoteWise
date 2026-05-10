# Engagement score methodology

VoteWise Pro reports a single per-MLA engagement score on a 0–100 scale,
recomputed for every plenary sitting in the dataset.

## Signals counted

- **Speech count** — distinct contributions an MLA makes in the chamber
  during a plenary sitting, sourced from Hansard speaker logs.
- **Division votes** — formal divisions the MLA voted in (For, Against,
  or No Vote), as a count out of the total divisions held that sitting.
- **Written questions** — written questions submitted by the MLA in the
  week of the sitting, attributed to the sitting for normalisation.

## Normalisation

For each sitting we calculate, within the cohort of MLAs who attended:

- `speech_count_percentile` — percentile rank of the MLA's speech count.
- `division_participation_pct = (division_votes ÷ total_divisions) × 100`.
- `written_questions_percentile` — percentile rank of the MLA's written-question count.

Percentile rank is computed within the attending cohort only, so a
sitting where one MLA gives twelve speeches does not penalise the
other twelve.

## Formula

```
engagement_score = 0.5 × speech_count_percentile
                 + 0.3 × division_participation_pct
                 + 0.2 × written_questions_percentile
```

The score is rounded to one decimal place. MLAs marked as not attending
the sitting receive a score of 0 for that sitting and are excluded from
the percentile cohort.

## Limitations

- The current dataset covers six recent plenary sittings of the Northern
  Ireland Assembly. A production deployment would ingest every sitting
  in the mandate.
- All speech, division, and written-question counts in the seed file are
  flagged as illustrative pending live Hansard ingestion. The seed
  comments mark them `# SYNTHETIC`.
- The score does not capture committee work, constituency casework, or
  written ministerial statements. An MLA who is a frontbench minister
  may legitimately speak less in the chamber while doing more elsewhere.
- Engagement is not a measure of effectiveness or quality. A single
  forensic intervention can outweigh ten short ones; the score weighs
  them equally.
- The dataset's `last_seeded_at` timestamp is exposed via `/pro/health`
  and surfaced in the Pro topbar so users always see how fresh the
  underlying data is.
