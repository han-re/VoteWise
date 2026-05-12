"""
Resolve the best verified source URL for every party promise in
backend/seed/seed_real_parties.py.

This is a one-shot curation helper, not an algorithm: the network research
(legislation.gov.uk lookups, NI Assembly Official Report date matching,
department publication / news pages, the For Women Scotland Supreme Court
case) was done while authoring the RESOLUTIONS dict below, and the result is
captured here so it can be reviewed and re-applied. The script makes no
network calls and does not touch the database.

Run from the project root:
    python -m backend.seed.resolve_party_sources

It prints a per-party report and writes
backend/data/party_source_reconciliation.json (one record per promise,
sorted by party_id then promise_id).

Resolution tiers (D2):
  legislation            - a real legislation.gov.uk deep link to the Act/bill
  hansard                - a real NI Assembly Official Report sitting deep link
  department_publication - a real department publication / strategy page
  department_news        - a real department news release
  court                  - a real court judgment page
  electoral_commission   - a real Electoral Commission record
  other                  - a real, specific page on another body's site
  unresolved             - no specific document could be verified; the URL is a
                           topic/section-level page on the correct host (never
                           the bare host root) so the reader is told it is a
                           site rather than a document
"""
import json
import os
from collections import Counter

from backend.seed.seed_real_parties import PARTIES

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUT_PATH = os.path.join(DATA_DIR, "party_source_reconciliation.json")

# Section-level fallback pages (all confirmed to return HTTP 200), used when no
# specific document could be pinned for a promise. Never the bare host root.
FALLBACK = {
    "hansard": "https://aims.niassembly.gov.uk/officialreport/reports.aspx",
    "ni_legislation_section": "https://www.niassembly.gov.uk/assembly-business/legislation/2017-2022-mandate/",
    "education": "https://www.education-ni.gov.uk/topics",
    "health": "https://www.health-ni.gov.uk/topics",
    "economy": "https://www.economy-ni.gov.uk/topics",
    "communities_housing": "https://www.communities-ni.gov.uk/topics/housing",
    "communities_benefits": "https://www.communities-ni.gov.uk/topics/benefits-and-pensions",
    "executive_office": "https://www.executiveoffice-ni.gov.uk/topics/programme-government",
    "justice": "https://www.justice-ni.gov.uk/topics/policing-and-community-safety",
    "nihe": "https://www.nihe.gov.uk/about-us",
    "transport": "https://www.infrastructure-ni.gov.uk/topics/public-transport",
    "finance_rating": "https://www.finance-ni.gov.uk/topics/property-rating",
    "higher_education": "https://www.economy-ni.gov.uk/topics/higher-education",
    "nsmc": "https://www.northsouthministerialcouncil.org/",
}

# promise_id -> (resolved_url, resolution_type, confidence, note)
RESOLUTIONS = {
    # --------------------------------------------------------------- Alliance
    "all_001": (
        "https://www.legislation.gov.uk/nia/2022/15/contents",
        "legislation", "high",
        "Integrated Education Act (Northern Ireland) 2022. Replaces the old link "
        "to ukpga/2022/15, which is the Building Safety Act 2022.",
    ),
    "all_002": (
        FALLBACK["justice"], "unresolved", "low",
        "The Hate Crime Bill was dropped during the mandate, so there is no Act "
        "to link; pointed at the Department of Justice policing and community "
        "safety section.",
    ),
    "all_003": (
        FALLBACK["education"], "unresolved", "low",
        "The Single Transfer Test (November 2024) is run by SEAG; no canonical "
        "Department of Education publication URL could be confirmed.",
    ),
    "all_004": (
        FALLBACK["ni_legislation_section"], "unresolved", "low",
        "Evidence references a 'Tennyson Equality Bill' and a 'Victims and "
        "Witnesses Bill'; neither could be verified to exist under those names. "
        "Flagged for review.",
    ),
    "all_005": (
        "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/06/04&docID=403413",
        "hansard", "high",
        "Conversion practices motion debated 4 June 2024, passed 41-25.",
    ),
    "all_006": (
        "https://www.health-ni.gov.uk/publications/health-and-wellbeing-2026-delivering-together",
        "department_publication", "high",
        "Bengoa-driven 'Health and Wellbeing 2026: Delivering Together' framework.",
    ),
    "all_007": (
        "https://www.communities-ni.gov.uk/publications/housing-supply-strategy-2024-2039",
        "department_publication", "high",
        "Housing Supply Strategy 2024-2039 (includes retrofitting / energy "
        "efficiency commitments).",
    ),
    "all_008": (
        "https://www.economy-ni.gov.uk/articles/skills-strategy",
        "department_publication", "medium",
        "Department for the Economy Skills Strategy ('Skills for a 10x Economy').",
    ),
    # ------------------------------------------------------------------- DUP
    "dup_001": (
        "https://www.education-ni.gov.uk/news/childcare-subsidy-scheme-reduces-costs-working-families-across-northern-ireland",
        "department_news", "high",
        "Northern Ireland Childcare Subsidy Scheme savings for working families.",
    ),
    "dup_002": (
        FALLBACK["education"], "unresolved", "low",
        "The '28 new schools' announcement could not be pinned to a single "
        "Department of Education news URL.",
    ),
    "dup_003": (
        FALLBACK["education"], "unresolved", "low",
        "Retention of academic selection via the Single Transfer Test; no "
        "canonical Department of Education publication URL confirmed.",
    ),
    "dup_004": (
        "https://www.economy-ni.gov.uk/articles/project-stratum",
        "department_publication", "high",
        "Project Stratum full-fibre / NGA broadband rollout.",
    ),
    "dup_005": (
        FALLBACK["education"], "unresolved", "low",
        "The fair-funding-formula discussion has no settled publication to link.",
    ),
    "dup_006": (
        "https://www.communities-ni.gov.uk/publications/housing-supply-strategy-2024-2039",
        "department_publication", "medium",
        "Housing Supply Strategy 2024-2039 (energy efficiency / Decent Homes "
        "commitments sit within it).",
    ),
    "dup_007": (
        FALLBACK["economy"], "unresolved", "low",
        "The 20,000-jobs / apprenticeships pledge has no single document; "
        "Department for the Economy topics section.",
    ),
    "dup_008": (
        "https://www.gov.uk/government/publications/the-windsor-framework",
        "other", "high",
        "The Windsor Framework. Already a correct deep link; left unchanged.",
    ),
    # ------------------------------------------------------------- Sinn Féin
    "sf_001": (
        "https://www.economy-ni.gov.uk/news/statement-minister-murphy-economic-vision",
        "department_news", "high",
        "Economy Minister's economic vision / Economic Mission (four priorities).",
    ),
    "sf_002": (
        "https://www.legislation.gov.uk/ukpga/2022/45/contents",
        "legislation", "high",
        "Identity and Language (Northern Ireland) Act 2022 (c. 45) - establishes "
        "the Irish Language Commissioner. This chapter number is correct; the "
        "task brief's claim that ukpga/2022/45 is the Energy Prices Act 2022 is "
        "mistaken (that Act is c. 44). Left unchanged.",
    ),
    "sf_003": (
        "https://www.gov.uk/government/news/secretary-of-state-for-northern-ireland-instructs-the-department-of-health-to-commission-abortion-services",
        "department_news", "high",
        "Secretary of State's December 2022 instruction to commission abortion "
        "services in Northern Ireland.",
    ),
    "sf_004": (
        "https://www.executiveoffice-ni.gov.uk/topics/ending-violence-against-women-and-girls",
        "department_publication", "high",
        "Ending Violence Against Women and Girls strategic framework and "
        "delivery plans (The Executive Office).",
    ),
    "sf_005": (
        "https://www.communities-ni.gov.uk/publications/housing-supply-strategy-2024-2039",
        "department_publication", "high",
        "Housing Supply Strategy 2024-2039 - the Executive's 100,000-homes "
        "target adopted December 2024.",
    ),
    "sf_006": (
        FALLBACK["health"], "unresolved", "low",
        "The '£1bn over three years' health pledge has no single document.",
    ),
    "sf_007": (
        FALLBACK["health"], "unresolved", "low",
        "Waiting-list reduction; no canonical Elective Care Framework URL could "
        "be confirmed (the obvious slug 404s).",
    ),
    "sf_008": (
        "https://www.economy-ni.gov.uk/news/economy-minister-launches-ulster-university-magee-taskforce",
        "department_news", "high",
        "Ulster University Magee Taskforce launch (March 2024).",
    ),
    "sf_009": (
        FALLBACK["education"], "unresolved", "low",
        "Academic selection entrenched via the Single Transfer Test; no "
        "canonical Department of Education publication URL confirmed.",
    ),
    "sf_010": (
        "https://www.health-ni.gov.uk/publications/mental-health-strategy-2021-2031",
        "department_publication", "high",
        "Mental Health Strategy 2021-2031.",
    ),
    "sf_011": (
        "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/06/04&docID=403413",
        "hansard", "high",
        "Conversion practices motion debated 4 June 2024 (Communities Minister "
        "declined to legislate).",
    ),
    "sf_012": (
        FALLBACK["ni_legislation_section"], "unresolved", "low",
        "No Bill of Rights was introduced; Assembly legislation section.",
    ),
    # ------------------------------------------------------------------- UUP
    "uup_001": (
        "https://www.health-ni.gov.uk/publications/cancer-strategy-northern-ireland-2022-2032",
        "department_publication", "high",
        "A Cancer Strategy for Northern Ireland 2022-2032. The evidence string "
        "names a 'Cancer Research Strategic Framework', which is a separate, "
        "smaller document; flagged as a minor mismatch.",
    ),
    "uup_002": (
        "https://www.legislation.gov.uk/nia/2022/10/contents",
        "legislation", "high",
        "Organ and Tissue Donation (Deemed Consent) Act (Northern Ireland) 2022 "
        "- 'Dáithí's Law'.",
    ),
    "uup_003": (
        "https://www.northernireland.gov.uk/articles/programme-government-2024-2027-our-plan-doing-what-matters-most",
        "department_publication", "high",
        "Programme for Government 2024-2027 'Our Plan: Doing What Matters Most' "
        "- housing as a standalone priority.",
    ),
    "uup_004": (
        "https://www.economy-ni.gov.uk/articles/city-and-growth-deals",
        "department_publication", "high",
        "City and Growth Deals (Department for the Economy).",
    ),
    "uup_005": (
        FALLBACK["health"], "unresolved", "low",
        "Waiting-list reduction; no canonical Elective Care Framework URL "
        "confirmed.",
    ),
    "uup_006": (
        FALLBACK["health"], "unresolved", "low",
        "Healthcare workforce stabilisation; no single document.",
    ),
    "uup_007": (
        "https://www.health-ni.gov.uk/publications/mental-health-strategy-2021-2031",
        "department_publication", "medium",
        "Mental Health Strategy 2021-2031 (CAMHS / mental health funding sits "
        "within it).",
    ),
    "uup_008": (
        FALLBACK["communities_housing"], "unresolved", "low",
        "NIHE borrowing reform - no legislative change made; Communities housing "
        "section.",
    ),
    "uup_009": (
        FALLBACK["education"], "unresolved", "low",
        "No move toward a single multi-denominational system; education topics.",
    ),
    "uup_010": (
        "https://www.economy-ni.gov.uk/topics/economic-strategy",
        "unresolved", "low",
        "Corporation tax devolution was not secured; economy strategy section.",
    ),
    # ------------------------------------------------------------------ SDLP
    "sdlp_001": (
        "https://www.communities-ni.gov.uk/publications/housing-supply-strategy-2024-2039",
        "department_publication", "medium",
        "Housing Supply Strategy 2024-2039 - social-housing supply target.",
    ),
    "sdlp_002": (
        FALLBACK["hansard"], "unresolved", "low",
        "Mark H. Durkan's January 2026 rent-controls motion - exact sitting date "
        "not pinned.",
    ),
    "sdlp_003": (
        FALLBACK["communities_housing"], "unresolved", "low",
        "Mortgage Rescue Scheme / Empty Homes Strategy - no Assembly action "
        "identified; Communities housing section.",
    ),
    "sdlp_004": (
        "https://www.economy-ni.gov.uk/news/economy-minister-launches-ulster-university-magee-taskforce",
        "department_news", "high",
        "Ulster University Magee Taskforce launch (March 2024).",
    ),
    "sdlp_005": (
        "https://www.education-ni.gov.uk/news/childcare-subsidy-scheme-reduces-costs-working-families-across-northern-ireland",
        "department_news", "medium",
        "Northern Ireland Childcare Subsidy Scheme - the SDLP-backed childcare "
        "cost reduction.",
    ),
    "sdlp_006": (
        FALLBACK["education"], "unresolved", "low",
        "No Assembly bill tabled to abolish the transfer test; education topics.",
    ),
    "sdlp_007": (
        FALLBACK["hansard"], "unresolved", "low",
        "March 2024 public-sector pay motion - exact sitting date not pinned.",
    ),
    "sdlp_008": (
        "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/06/04&docID=403413",
        "hansard", "high",
        "Conversion practices motion debated 4 June 2024, passed 41-25.",
    ),
    "sdlp_009": (
        "https://www.legislation.gov.uk/ukpga/2022/45/contents",
        "legislation", "high",
        "Identity and Language (Northern Ireland) Act 2022 (c. 45). Already a "
        "correct deep link; left unchanged.",
    ),
    "sdlp_010": (
        "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/05/13&docID=400576",
        "hansard", "high",
        "Independent Environmental Protection Agency / Lough Neagh ecological "
        "crisis debate, 13 May 2024.",
    ),
    # ------------------------------------------------------------------- PBP
    "pbp_001": (
        "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2025/02/24&docID=428904",
        "hansard", "medium",
        "'New deal for private renters' debate, 24 February 2025 - the sitting "
        "around the People's Housing Bill Second Stage debate.",
    ),
    "pbp_002": (
        FALLBACK["nihe"], "unresolved", "low",
        "NIHE remains in public ownership; NIHE corporate page.",
    ),
    "pbp_003": (
        FALLBACK["communities_housing"], "unresolved", "low",
        "NIHE borrowing restrictions not lifted; Communities housing section.",
    ),
    "pbp_004": (
        FALLBACK["ni_legislation_section"], "unresolved", "low",
        "Trade Union Freedom Bill voted down March 2022 - exact sitting not "
        "pinned.",
    ),
    "pbp_005": (
        FALLBACK["hansard"], "unresolved", "low",
        "Public-sector pay / strike action across the mandate - no single "
        "sitting; Official Report index.",
    ),
    "pbp_006": (
        "https://www.gov.uk/government/news/secretary-of-state-for-northern-ireland-instructs-the-department-of-health-to-commission-abortion-services",
        "department_news", "high",
        "Secretary of State's December 2022 instruction to commission abortion "
        "services.",
    ),
    "pbp_007": (
        FALLBACK["transport"], "unresolved", "low",
        "Translink not privatised; Department for Infrastructure public "
        "transport section.",
    ),
    "pbp_008": (
        FALLBACK["higher_education"], "unresolved", "low",
        "Tuition fees not abolished; Department for the Economy higher education "
        "section.",
    ),
    "pbp_009": (
        "https://www.legislation.gov.uk/nia/2022/31/contents",
        "legislation", "high",
        "Climate Change Act (Northern Ireland) 2022 - net zero by 2050, not 2035.",
    ),
    "pbp_010": (
        FALLBACK["communities_benefits"], "unresolved", "low",
        "£1,000 hardship payment not delivered; Communities benefits section.",
    ),
    # ------------------------------------------------------------------- TUV
    "tuv_001": (
        "https://www.gov.uk/government/publications/the-windsor-framework",
        "other", "high",
        "The Windsor Framework. Already a correct deep link; left unchanged.",
    ),
    "tuv_002": (
        "https://www.gov.uk/government/publications/the-windsor-framework",
        "other", "high",
        "The Windsor Framework. Already a correct deep link; left unchanged.",
    ),
    "tuv_003": (
        FALLBACK["education"], "unresolved", "low",
        "Academic selection retained via the Single Transfer Test; education "
        "topics section.",
    ),
    "tuv_004": (
        "https://www.gov.uk/government/news/secretary-of-state-for-northern-ireland-instructs-the-department-of-health-to-commission-abortion-services",
        "department_news", "high",
        "Secretary of State's December 2022 instruction to commission abortion "
        "services.",
    ),
    "tuv_005": (
        "https://supremecourt.uk/cases/uksc-2024-0042",
        "court", "high",
        "For Women Scotland Ltd v The Scottish Ministers [2025] UKSC 16 - "
        "'sex' in the Equality Act 2010 means biological sex.",
    ),
    "tuv_006": (
        FALLBACK["justice"], "unresolved", "low",
        "Law and order / sentencing - no TUV legislation; Department of Justice "
        "policing and community safety section.",
    ),
    "tuv_007": (
        FALLBACK["finance_rating"], "unresolved", "low",
        "Business rates relief - no TUV legislation; Department of Finance "
        "property rating section.",
    ),
    "tuv_008": (
        FALLBACK["nsmc"], "unresolved", "low",
        "Cross-border cooperation deepened; North/South Ministerial Council site.",
    ),
}


def build_records():
    records = []
    for party in PARTIES:
        for promise in party["promises"]:
            pid = promise["id"]
            if pid not in RESOLUTIONS:
                raise SystemExit(f"No resolution defined for promise {pid!r}")
            resolved_url, resolution_type, confidence, note = RESOLUTIONS[pid]
            records.append(
                {
                    "party_id": party["_id"],
                    "promise_id": pid,
                    "title": promise["title"],
                    "category": promise["category"],
                    "status": promise["status"],
                    "evidence": promise["evidence"],
                    "existing_url": promise["source_url"],
                    "resolved_url": resolved_url,
                    "resolution_type": resolution_type,
                    "confidence": confidence,
                    "note": note,
                }
            )
    records.sort(key=lambda r: (r["party_id"], r["promise_id"]))
    return records


def main():
    records = build_records()

    current_party = None
    for r in records:
        if r["party_id"] != current_party:
            current_party = r["party_id"]
            print(f"\n=== {current_party} ===")
        print(
            f"  [{r['resolution_type']:<22}] {r['promise_id']:<10} "
            f"{r['title'][:48]:<48} -> {r['resolved_url']}"
        )

    counts = Counter(r["resolution_type"] for r in records)
    print("\nResolution-type counts:")
    for t in sorted(counts):
        print(f"  {t:<24} {counts[t]}")
    unresolved = [r["promise_id"] for r in records if r["resolution_type"] == "unresolved"]
    print(f"\nUnresolved ({len(unresolved)}): {', '.join(unresolved)}")

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\nWrote {OUT_PATH} ({len(records)} records).")


if __name__ == "__main__":
    main()
