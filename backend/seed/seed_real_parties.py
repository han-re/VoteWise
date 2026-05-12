"""
Seed 7 real NI parties into db.parties.
Run from project root: python -m backend.seed.seed_real_parties

Sources:
  Alliance, DUP, Sinn Féin, UUP  — four-party Stormont delivery scorecard
  SDLP                            — SDLP 2022 Promises Tracker
  PBP                             — PBP 2022 NI Assembly delivery review
  TUV                             — Plausible synthetic data from TUV 2022
                                    public manifesto positions.
                                    Every TUV-specific value is marked
                                    # TUV SYNTHETIC — review before commit.

Migration note: if db.Parties (capital P) contains documents from the old
seed script, this script copies them to db.parties then drops the old
collection before writing the real data.

Source links: each promise's source_url is a verified deep link (an Act on
legislation.gov.uk, an NI Assembly Official Report sitting, a department
publication or news release, or a court judgment), reconciled via
backend/seed/resolve_party_sources.py and recorded in
backend/data/party_source_reconciliation.json. A handful that could not be
pinned to a specific document point at a topic/section-level page on the
correct host instead, flagged with a trailing comment on the line.
"""
import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

PARTIES = [
    # ------------------------------------------------------------------ Alliance
    {
        "_id": "party_alliance",
        "name": "Alliance Party",
        "short_name": "Alliance",
        "leader": "Naomi Long",
        "seats_2022": 17,
        "ideology": "Liberal, non-sectarian, pro-EU",
        "logo_url": "/images/alliance.png",
        "primary_color": "#F6CB2F",
        "manifesto_summary": (
            "Alliance stood on ending division, reforming public services, and "
            "leading on climate and equality. They hold Justice and Agriculture "
            "in the Executive and secured a landmark Integrated Education Act, "
            "though their own Justice Minister dropped the promised Hate Crime Bill."
        ),
        "promises": [
            {
                "id": "all_001",
                "title": "Integrated Education Act",
                "category": "Education",
                "status": "kept",
                "evidence": (
                    "Integrated Education Act 2022 passed, placing a statutory duty "
                    "on the Department of Education to encourage and facilitate "
                    "integrated education."
                ),
                "source_url": "https://www.legislation.gov.uk/nia/2022/15/contents",
            },
            {
                "id": "all_002",
                "title": "Standalone Hate Crime Bill",
                "category": "Equality",
                "status": "broken",
                "evidence": (
                    "Alliance Justice Minister Naomi Long dropped the Hate Crime Bill "
                    "during the mandate — a self-inflicted miss on their own manifesto pledge."
                ),
                "source_url": "https://www.justice-ni.gov.uk/topics/policing-and-community-safety",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "all_003",
                "title": "End academic selection at age 11",
                "category": "Education",
                "status": "broken",
                "evidence": (
                    "A Single Transfer Test was introduced in November 2024, "
                    "entrenching rather than ending academic selection."
                ),
                "source_url": "https://www.education-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "all_004",
                "title": "Single Equality Act",
                "category": "Equality",
                "status": "in_progress",
                "evidence": (
                    "Progressing via the Tennyson Equality Bill and the Victims and "
                    "Witnesses Bill; not yet enacted as of 2026."
                ),
                "source_url": "https://www.niassembly.gov.uk/assembly-business/legislation/2017-2022-mandate/",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "all_005",
                "title": "Ban conversion therapy",
                "category": "Equality",
                "status": "in_progress",
                "evidence": (
                    "Alliance progressing a Private Member's Bill after the DUP "
                    "Communities Minister stalled on legislation; a successful "
                    "Assembly motion passed in June 2024."
                ),
                "source_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/06/04&docID=403413",
            },
            {
                "id": "all_006",
                "title": "Implement Bengoa health service reforms",
                "category": "Healthcare",
                "status": "in_progress",
                "evidence": (
                    "Bengoa framework being implemented across HSC Trusts; reforms "
                    "are ongoing but incomplete and not Alliance-led legislation."
                ),
                "source_url": "https://www.health-ni.gov.uk/publications/health-and-wellbeing-2026-delivering-together",
            },
            {
                "id": "all_007",
                "title": "Social housing retrofitting programme",
                "category": "Housing",
                "status": "in_progress",
                "evidence": (
                    "Alliance supported the Programme for Government housing strategy "
                    "including energy-efficiency retrofitting; not a standalone "
                    "Alliance-led bill."
                ),
                "source_url": "https://www.communities-ni.gov.uk/publications/housing-supply-strategy-2024-2039",
            },
            {
                "id": "all_008",
                "title": "Skills Strategy and Lifelong Learning Guarantee",
                "category": "Economy",
                "status": "in_progress",
                "evidence": (
                    "Skills Strategy overlaps with the Economy Department's plans "
                    "and is progressing; not an Alliance-originated piece of "
                    "legislation."
                ),
                "source_url": "https://www.economy-ni.gov.uk/articles/skills-strategy",
            },
        ],
        "scorecard_summary": {"kept": 1, "in_progress": 5, "broken": 2},
    },
    # ---------------------------------------------------------------------- DUP
    {
        "_id": "party_dup",
        "name": "Democratic Unionist Party",
        "short_name": "DUP",
        "leader": "Gavin Robinson",
        "seats_2022": 25,
        "ideology": "Democratic unionism, socially conservative, pro-Union",
        "logo_url": "/images/dup.png",
        "primary_color": "#CC2027",
        "manifesto_summary": (
            "The DUP stood primarily on opposing the NI Protocol, retaining "
            "academic selection, and delivering for families through childcare and "
            "schools investment. They boycotted the Executive from May 2022 to "
            "February 2024 over the Protocol, limiting their legislative output."
        ),
        "promises": [
            {
                "id": "dup_001",
                "title": "Childcare Subsidy Scheme",
                "category": "Education",
                "status": "kept",
                "evidence": (
                    "The NI Childcare Subsidy Scheme delivered approximately £8 million "
                    "in savings for families while the DUP held the Education ministry."
                ),
                "source_url": "https://www.education-ni.gov.uk/news/childcare-subsidy-scheme-reduces-costs-working-families-across-northern-ireland",
            },
            {
                "id": "dup_002",
                "title": "28 new schools announced",
                "category": "Education",
                "status": "kept",
                "evidence": (
                    "DUP Education Minister announced 28 new school build projects "
                    "during their period in office."
                ),
                "source_url": "https://www.education-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "dup_003",
                "title": "Retain academic selection",
                "category": "Education",
                "status": "kept",
                "evidence": (
                    "Academic selection was retained and formalised through the "
                    "Single Transfer Test introduced in November 2024."
                ),
                "source_url": "https://www.education-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "dup_004",
                "title": "100% full-fibre broadband rollout",
                "category": "Economy",
                "status": "kept",
                "evidence": (
                    "Northern Ireland is ahead of the rest of the UK in full-fibre "
                    "broadband coverage, meeting the DUP's connectivity target."
                ),
                "source_url": "https://www.economy-ni.gov.uk/articles/project-stratum",
            },
            {
                "id": "dup_005",
                "title": "Fair funding formula for schools",
                "category": "Education",
                "status": "in_progress",
                "evidence": (
                    "The fair funding formula for schools is under ongoing discussion; "
                    "no final settlement has been reached."
                ),
                "source_url": "https://www.education-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "dup_006",
                "title": "Energy efficiency retrofitting and Decent Homes standard",
                "category": "Housing",
                "status": "in_progress",
                "evidence": (
                    "A Decent Homes consultation was launched, but social home starts "
                    "collapsed to approximately 400 per year during the mandate."
                ),
                "source_url": "https://www.communities-ni.gov.uk/publications/housing-supply-strategy-2024-2039",
            },
            {
                "id": "dup_007",
                "title": "Create 20,000 new jobs and expand apprenticeships",
                "category": "Economy",
                "status": "in_progress",
                "evidence": (
                    "Economic development plans progressing under the Economy "
                    "Department; this is no longer a DUP-held ministerial brief."
                ),
                "source_url": "https://www.economy-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "dup_008",
                "title": "Full removal of the NI Protocol",
                "category": "Constitutional",
                "status": "broken",
                "evidence": (
                    "The Windsor Framework (February 2023) eased Irish Sea border "
                    "arrangements but did not remove them; the Protocol's fundamental "
                    "structure remains in place."
                ),
                "source_url": "https://www.gov.uk/government/publications/the-windsor-framework",
            },
        ],
        "scorecard_summary": {"kept": 4, "in_progress": 3, "broken": 1},
    },
    # ---------------------------------------------------------------- Sinn Féin
    {
        "_id": "party_sinn_fein",
        "name": "Sinn Féin",
        "short_name": "SF",
        "leader": "Michelle O'Neill",
        "seats_2022": 27,
        "ideology": "Irish republicanism, left-leaning nationalism, pro-Irish unity",
        "logo_url": "/images/sinn_fein.png",
        "primary_color": "#326760",
        "manifesto_summary": (
            "As the largest party, Sinn Féin led on the economy, Irish language "
            "rights, and housing targets. Michelle O'Neill became First Minister in "
            "February 2024 when the Executive was restored after a two-year DUP "
            "boycott. Delivery has been mixed: clear wins on Irish language and "
            "economic strategy, but academic selection and mental health remain unresolved."
        ),
        "promises": [
            {
                "id": "sf_001",
                "title": "New economic strategy maximising EU and GB market access",
                "category": "Economy",
                "status": "kept",
                "evidence": (
                    "The economic strategy was delivered and adopted by the Executive "
                    "as a core framework for the mandate, with four priorities "
                    "(good jobs, regional balance, productivity, decarbonisation)."
                ),
                "source_url": "https://www.economy-ni.gov.uk/news/statement-minister-murphy-economic-vision",
            },
            {
                "id": "sf_002",
                "title": "Irish Language Commissioner appointment",
                "category": "Equality",
                "status": "kept",
                "evidence": (
                    "Identity and Language (NI) Act 2022 in force; the first Irish "
                    "Language Commissioner was appointed in November 2025."
                ),
                "source_url": "https://www.legislation.gov.uk/ukpga/2022/45/contents",
            },
            {
                "id": "sf_003",
                "title": "Commission reproductive healthcare services locally",
                "category": "Healthcare",
                "status": "kept",
                "evidence": (
                    "Abortion services rolled out across all five HSC Trusts during "
                    "2023 following Westminster direction on 2 December 2022; "
                    "2,899 procedures were performed in 2024-25."
                ),
                "source_url": "https://www.gov.uk/government/news/secretary-of-state-for-northern-ireland-instructs-the-department-of-health-to-commission-abortion-services",
            },
            {
                "id": "sf_004",
                "title": "Violence Against Women and Girls Strategy",
                "category": "Equality",
                "status": "kept",
                "evidence": (
                    "A VAWG Strategy was embedded in the Programme for Government "
                    "as a core priority of the restored Executive."
                ),
                "source_url": "https://www.executiveoffice-ni.gov.uk/topics/ending-violence-against-women-and-girls",
            },
            {
                "id": "sf_005",
                "title": "Deliver 100,000 new homes over 15 years",
                "category": "Housing",
                "status": "in_progress",
                "evidence": (
                    "The Executive adopted a matching target in December 2024, but "
                    "delivery is behind schedule with a £128m social housing shortfall."
                ),
                "source_url": "https://www.communities-ni.gov.uk/publications/housing-supply-strategy-2024-2039",
            },
            {
                "id": "sf_006",
                "title": "£1 billion health funding increase over three years",
                "category": "Healthcare",
                "status": "in_progress",
                "evidence": (
                    "£215m has been ringfenced for waiting lists; the commitment is "
                    "partially honoured but the full £1bn has not been allocated."
                ),
                "source_url": "https://www.health-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "sf_007",
                "title": "Tackle NHS waiting lists",
                "category": "Healthcare",
                "status": "in_progress",
                "evidence": (
                    "The PfG waiting-list target was exceeded threefold on some "
                    "measures, but over one in four of the NI population remain on "
                    "a waiting list."
                ),
                "source_url": "https://www.health-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "sf_008",
                "title": "Magee University expansion",
                "category": "Economy",
                "status": "in_progress",
                "evidence": (
                    "The Magee Taskforce was established; student numbers are up 22% "
                    "to over 6,500, but the 10,000-student target remains distant."
                ),
                "source_url": "https://www.economy-ni.gov.uk/news/economy-minister-launches-ulster-university-magee-taskforce",
            },
            {
                "id": "sf_009",
                "title": "End academic selection at age 11",
                "category": "Education",
                "status": "broken",
                "evidence": (
                    "The Single Transfer Test was introduced in November 2024, "
                    "entrenching rather than ending academic selection — the opposite "
                    "of the manifesto pledge."
                ),
                "source_url": "https://www.education-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "sf_010",
                "title": "Fully funded Mental Health Strategy",
                "category": "Healthcare",
                "status": "broken",
                "evidence": (
                    "Only 19 of 35 Mental Health Strategy actions have been started; "
                    "the strategy remains chronically underfunded."
                ),
                "source_url": "https://www.health-ni.gov.uk/publications/mental-health-strategy-2021-2031",
            },
            {
                "id": "sf_011",
                "title": "Ban conversion therapy",
                "category": "Equality",
                "status": "broken",
                "evidence": (
                    "No legislation has passed; the DUP Communities Minister has "
                    "blocked progress throughout the mandate."
                ),
                "source_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/06/04&docID=403413",
            },
            {
                "id": "sf_012",
                "title": "Bill of Rights for Northern Ireland",
                "category": "Equality",
                "status": "broken",
                "evidence": (
                    "No bill was introduced during the mandate; no cross-party "
                    "consensus was achieved."
                ),
                "source_url": "https://www.niassembly.gov.uk/assembly-business/legislation/2017-2022-mandate/",  # section-level fallback; specific evidence URL not yet pinned
            },
        ],
        "scorecard_summary": {"kept": 4, "in_progress": 4, "broken": 4},
    },
    # ---------------------------------------------------------------------- UUP
    {
        "_id": "party_uup",
        "name": "Ulster Unionist Party",
        "short_name": "UUP",
        "leader": "Doug Beattie",
        "seats_2022": 9,
        "ideology": "Liberal unionism, pro-Union, moderate",
        "logo_url": "/images/uup.png",
        "primary_color": "#48A5EE",
        "manifesto_summary": (
            "The UUP held the Health ministry and concentrated on rebuilding the "
            "NHS, cancer services, and organ donation. They achieved measurable "
            "progress on waiting lists, but fell short on education reform and "
            "economic targets outside their ministerial brief."
        ),
        "promises": [
            {
                "id": "uup_001",
                "title": "Cancer services strategy and rapid diagnostic centres",
                "category": "Healthcare",
                "status": "kept",
                "evidence": (
                    "The first NI Cancer Research Strategic Framework was published "
                    "and rapid diagnostic centres became operational."
                ),
                "source_url": "https://www.health-ni.gov.uk/publications/cancer-strategy-northern-ireland-2022-2032",
            },
            {
                "id": "uup_002",
                "title": "Dáithí's Law — opt-out organ donation",
                "category": "Healthcare",
                "status": "kept",
                "evidence": (
                    "Dáithí's Law passed, introducing an opt-out system for organ "
                    "donation in Northern Ireland."
                ),
                "source_url": "https://www.legislation.gov.uk/nia/2022/10/contents",
            },
            {
                "id": "uup_003",
                "title": "Housing as a standalone Programme for Government priority",
                "category": "Housing",
                "status": "kept",
                "evidence": (
                    "Housing was established as a standalone PfG priority, securing "
                    "dedicated focus and ringfenced funding discussions."
                ),
                "source_url": "https://www.northernireland.gov.uk/articles/programme-government-2024-2027-our-plan-doing-what-matters-most",
            },
            {
                "id": "uup_004",
                "title": "City Deals and regional Growth Deals",
                "category": "Economy",
                "status": "kept",
                "evidence": (
                    "All City Deals progressing with cross-party support; significant "
                    "investment secured across NI regions."
                ),
                "source_url": "https://www.economy-ni.gov.uk/articles/city-and-growth-deals",
            },
            {
                "id": "uup_005",
                "title": "Reduce NHS waiting lists",
                "category": "Healthcare",
                "status": "in_progress",
                "evidence": (
                    "A 24% drop in four-year-plus waits and a 58% drop in endoscopy "
                    "waits, but 35% of NI patients still wait over two years versus "
                    "single digits in England."
                ),
                "source_url": "https://www.health-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "uup_006",
                "title": "Stabilise the healthcare workforce",
                "category": "Healthcare",
                "status": "in_progress",
                "evidence": (
                    "February 2024 pay deal delivered and agency spend reduced, "
                    "but staffing pressures continue into 2025-26."
                ),
                "source_url": "https://www.health-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "uup_007",
                "title": "Mental health funding and CAMHS investment",
                "category": "Healthcare",
                "status": "in_progress",
                "evidence": (
                    "A Mental Health Delivery Plan was published but the strategy "
                    "remains underfunded relative to need."
                ),
                "source_url": "https://www.health-ni.gov.uk/publications/mental-health-strategy-2021-2031",
            },
            {
                "id": "uup_008",
                "title": "Reform NIHE to raise private finance for housing",
                "category": "Housing",
                "status": "in_progress",
                "evidence": (
                    "Reform discussions are ongoing; no legislative change has been "
                    "made to NIHE's borrowing powers."
                ),
                "source_url": "https://www.communities-ni.gov.uk/topics/housing",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "uup_009",
                "title": "Single multi-denominational education system",
                "category": "Education",
                "status": "broken",
                "evidence": (
                    "No movement toward a single system; denominational schooling "
                    "remains the norm and no legislation was introduced."
                ),
                "source_url": "https://www.education-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "uup_010",
                "title": "Reduce corporation tax to 15%",
                "category": "Economy",
                "status": "broken",
                "evidence": (
                    "Corporation tax devolution has not been secured; the power "
                    "remains with Westminster and no formal transfer was agreed."
                ),
                "source_url": "https://www.economy-ni.gov.uk/topics/economic-strategy",  # section-level fallback; specific evidence URL not yet pinned
            },
        ],
        "scorecard_summary": {"kept": 4, "in_progress": 4, "broken": 2},
    },
    # --------------------------------------------------------------------- SDLP
    {
        "_id": "party_sdlp",
        "name": "SDLP",
        "short_name": "SDLP",
        "leader": "Colum Eastwood",
        "seats_2022": 8,
        "ideology": "Irish nationalism, social democracy, pro-EU",
        "logo_url": "/images/sdlp.png",
        "primary_color": "#006B54",
        "manifesto_summary": (
            "The SDLP suffered their worst Assembly result since 1998, falling to "
            "8 seats. As Official Opposition under Matthew O'Toole, they have "
            "tabled motions on housing, environment, and equality, but cannot "
            "legislate alone and have had no ministerial power since 2022."
        ),
        "promises": [
            {
                "id": "sdlp_001",
                "title": "Double social housing investment",
                "category": "Housing",
                "status": "in_progress",
                "evidence": (
                    "Pushed through the 2024 Plan for Change targeting 13,000 new "
                    "social homes by 2030, but the Executive is missing its own "
                    "2,500-homes-a-year target."
                ),
                "source_url": "https://www.communities-ni.gov.uk/publications/housing-supply-strategy-2024-2039",
            },
            {
                "id": "sdlp_002",
                "title": "Rent controls in the private sector",
                "category": "Housing",
                "status": "in_progress",
                "evidence": (
                    "Mark H. Durkan tabled an Assembly motion in January 2026 calling "
                    "for rent controls and a pause on the right-to-buy scheme."
                ),
                "source_url": "https://aims.niassembly.gov.uk/officialreport/reports.aspx",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "sdlp_003",
                "title": "Mortgage Rescue Scheme and Empty Homes Strategy",
                "category": "Housing",
                "status": "broken",
                "evidence": (
                    "No significant Assembly action has been identified on either "
                    "policy during the mandate."
                ),
                "source_url": "https://www.communities-ni.gov.uk/topics/housing",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "sdlp_004",
                "title": "Magee University expansion to 10,000 students",
                "category": "Economy",
                "status": "in_progress",
                "evidence": (
                    "SDLP MPs helped secure Westminster funding; the Magee Taskforce "
                    "was launched in March 2024 and student numbers rose 22% to over "
                    "6,500."
                ),
                "source_url": "https://www.economy-ni.gov.uk/news/economy-minister-launches-ulster-university-magee-taskforce",
            },
            {
                "id": "sdlp_005",
                "title": "30 hours free pre-school childcare",
                "category": "Education",
                "status": "in_progress",
                "evidence": (
                    "Goal softened to halving childcare costs by 2030; SDLP helped "
                    "secure the NI Childcare Subsidy Scheme and pushed for a draft "
                    "Childcare Strategy in January 2025."
                ),
                "source_url": "https://www.education-ni.gov.uk/news/childcare-subsidy-scheme-reduces-costs-working-families-across-northern-ireland",
            },
            {
                "id": "sdlp_006",
                "title": "Phase out academic selection at age 11",
                "category": "Education",
                "status": "in_progress",
                "evidence": (
                    "Position maintained in opposition, but no Assembly bill was "
                    "tabled to abolish the transfer test during the mandate."
                ),
                "source_url": "https://www.education-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "sdlp_007",
                "title": "6% pay rise for nursing staff",
                "category": "Healthcare",
                "status": "in_progress",
                "evidence": (
                    "SDLP passed a public-sector pay Assembly motion in March 2024; "
                    "nurses were offered 5.5% for 2024-25, close to but short of the "
                    "6% target."
                ),
                "source_url": "https://aims.niassembly.gov.uk/officialreport/reports.aspx",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "sdlp_008",
                "title": "Ban conversion therapy",
                "category": "Equality",
                "status": "in_progress",
                "evidence": (
                    "Colin McGrath moved a successful Assembly motion in June 2024, "
                    "passed 41-25; legislation stalled by the DUP Communities "
                    "Minister."
                ),
                "source_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/06/04&docID=403413",
            },
            {
                "id": "sdlp_009",
                "title": "Irish Language Act",
                "category": "Equality",
                "status": "kept",
                "evidence": (
                    "Identity and Language (NI) Act 2022 passed at Westminster in "
                    "December 2022; SDLP MPs threatened amendments to force the "
                    "issue through."
                ),
                "source_url": "https://www.legislation.gov.uk/ukpga/2022/45/contents",
            },
            {
                "id": "sdlp_010",
                "title": "Independent Environmental Protection Agency for NI",
                "category": "Environment",
                "status": "in_progress",
                "evidence": (
                    "Patsy McGlone tabled a successful Assembly motion in May 2024 "
                    "declaring an ecological crisis at Lough Neagh; NI remains the "
                    "only part of the UK or Ireland without an independent EPA."
                ),
                "source_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/05/13&docID=400576",
            },
        ],
        "scorecard_summary": {"kept": 1, "in_progress": 8, "broken": 1},
    },
    # ---------------------------------------------------------------------- PBP
    {
        "_id": "party_pbp",
        "name": "People Before Profit",
        "short_name": "PBP",
        "leader": "Gerry Carroll",
        "seats_2022": 1,
        "ideology": "Socialist, anti-austerity, pro-Irish unity, environmentalist",
        "logo_url": "/images/pbp.png",
        "primary_color": "#E41E20",
        "manifesto_summary": (
            "PBP won a single seat in Belfast West in 2022. Gerry Carroll has "
            "focused on housing, workers' rights, and cost of living from "
            "opposition, tabling the People's Housing Bill and backing strike "
            "action across the public sector throughout the mandate."
        ),
        "promises": [
            {
                "id": "pbp_001",
                "title": "Rent controls, Rental Board and ban on no-fault evictions",
                "category": "Housing",
                "status": "in_progress",
                "evidence": (
                    "Carroll's People's Housing Bill launched for public consultation "
                    "in October 2024 and debated at Second Stage in February 2025; "
                    "a 10% rent reduction amendment was tabled before the 2022 "
                    "election but voted down."
                ),
                "source_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2025/02/24&docID=428904",
            },
            {
                "id": "pbp_002",
                "title": "Retain the NI Housing Executive in public ownership",
                "category": "Housing",
                "status": "kept",
                "evidence": (
                    "NIHE remains a public body; no reclassification or privatisation "
                    "was pursued during the mandate."
                ),
                "source_url": "https://www.nihe.gov.uk/about-us",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "pbp_003",
                "title": "Mass expansion of public housing on public land",
                "category": "Housing",
                "status": "broken",
                "evidence": (
                    "NIHE borrowing restrictions have not been lifted; Carroll notes "
                    "at current build rates it would take over 50 years to clear the "
                    "47,936-household waiting list."
                ),
                "source_url": "https://www.communities-ni.gov.uk/topics/housing",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "pbp_004",
                "title": "Trade Union Freedom Bill",
                "category": "Economy",
                "status": "in_progress",
                "evidence": (
                    "Carroll's bill was voted down 43-38 in March 2022 (DUP, UUP "
                    "and Alliance opposed; Sinn Féin and SDLP supported); it has not "
                    "been re-introduced in the current mandate."
                ),
                "source_url": "https://www.niassembly.gov.uk/assembly-business/legislation/2017-2022-mandate/",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "pbp_005",
                "title": "Inflation-busting pay rises for all public sector workers",
                "category": "Economy",
                "status": "in_progress",
                "evidence": (
                    "Carroll backed strike action across health, education and civil "
                    "service; the February 2024 Executive deal delivered pay parity "
                    "with England (5% plus £1,505) but fell short of inflation-busting."
                ),
                "source_url": "https://aims.niassembly.gov.uk/officialreport/reports.aspx",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "pbp_006",
                "title": "Local commissioning of abortion services",
                "category": "Healthcare",
                "status": "kept",
                "evidence": (
                    "The Secretary of State commissioned services on 2 December 2022; "
                    "services rolled out across all five HSC Trusts during 2023, with "
                    "2,899 procedures performed in 2024-25."
                ),
                "source_url": "https://www.gov.uk/government/news/secretary-of-state-for-northern-ireland-instructs-the-department-of-health-to-commission-abortion-services",
            },
            {
                "id": "pbp_007",
                "title": "Oppose Translink privatisation",
                "category": "Economy",
                "status": "kept",
                "evidence": (
                    "Translink remains fully in public ownership; no privatisation "
                    "was proposed or pursued during the mandate."
                ),
                "source_url": "https://www.infrastructure-ni.gov.uk/topics/public-transport",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "pbp_008",
                "title": "Abolish tuition fees",
                "category": "Education",
                "status": "broken",
                "evidence": (
                    "Tuition fees in NI remain approximately £4,750 per year for "
                    "2025-26; no bill was tabled to abolish them at Stormont."
                ),
                "source_url": "https://www.economy-ni.gov.uk/topics/higher-education",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "pbp_009",
                "title": "Carbon neutrality for NI by 2035",
                "category": "Environment",
                "status": "broken",
                "evidence": (
                    "The Climate Change Act (NI) 2022 sets net zero by 2050, not "
                    "2035; PBP's stronger amendments did not succeed."
                ),
                "source_url": "https://www.legislation.gov.uk/nia/2022/31/contents",
            },
            {
                "id": "pbp_010",
                "title": "£1,000 emergency hardship payment for lower-income households",
                "category": "Economy",
                "status": "broken",
                "evidence": (
                    "Stormont delivered a one-off £200 payment for benefit recipients; "
                    "the universal £1,000 demand was not met."
                ),
                "source_url": "https://www.communities-ni.gov.uk/topics/benefits-and-pensions",  # section-level fallback; specific evidence URL not yet pinned
            },
        ],
        "scorecard_summary": {"kept": 3, "in_progress": 2, "broken": 5},
    },
    # ---------------------------------------------------------------------- TUV
    # TUV SYNTHETIC — all fields below are plausible data derived from the TUV
    # 2022 public manifesto and post-election positions. Review every value
    # marked # TUV SYNTHETIC before committing to production.
    {
        "_id": "party_tuv",  # TUV SYNTHETIC
        "name": "Traditional Unionist Voice",  # TUV SYNTHETIC
        "short_name": "TUV",  # TUV SYNTHETIC
        "leader": "Jim Allister",  # TUV SYNTHETIC — verify current title
        "seats_2022": 1,  # TUV SYNTHETIC — verify (Allister, North Antrim)
        "ideology": "Traditional unionism, anti-Protocol, socially conservative",  # TUV SYNTHETIC
        "logo_url": "/images/tuv.png",  # TUV SYNTHETIC
        "primary_color": "#0C3B6E",  # TUV SYNTHETIC — verify brand hex
        "manifesto_summary": (  # TUV SYNTHETIC
            "TUV won one seat in 2022, with Jim Allister elected in North Antrim. "
            "The party's primary platform was the complete removal of the NI "
            "Protocol and restoration of Northern Ireland's full constitutional "
            "place within the UK internal market."
        ),
        "promises": [
            {
                "id": "tuv_001",  # TUV SYNTHETIC
                "title": "Full removal of the NI Protocol and Windsor Framework",
                "category": "Constitutional",
                "status": "broken",
                "evidence": (  # TUV SYNTHETIC
                    "The Windsor Framework (February 2023) eased Irish Sea border "
                    "checks but did not remove the Protocol's fundamental structure; "
                    "TUV's primary electoral demand was not delivered."
                ),
                "source_url": "https://www.gov.uk/government/publications/the-windsor-framework",
            },
            {
                "id": "tuv_002",  # TUV SYNTHETIC
                "title": "Restore NI's full place in the UK internal market",
                "category": "Constitutional",
                "status": "broken",
                "evidence": (  # TUV SYNTHETIC
                    "Northern Ireland continues to follow EU single-market rules in "
                    "goods under the Windsor Framework; TUV's demand for full UK "
                    "internal market access was not met."
                ),
                "source_url": "https://www.gov.uk/government/publications/the-windsor-framework",
            },
            {
                "id": "tuv_003",  # TUV SYNTHETIC
                "title": "Retain academic selection and the grammar school system",
                "category": "Education",
                "status": "kept",
                "evidence": (  # TUV SYNTHETIC
                    "Academic selection was retained; the Single Transfer Test "
                    "introduced in November 2024 entrenches the selective system "
                    "TUV supports."
                ),
                "source_url": "https://www.education-ni.gov.uk/topics",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "tuv_004",  # TUV SYNTHETIC
                "title": "Oppose expansion of abortion services in NI",
                "category": "Healthcare",
                "status": "broken",
                "evidence": (  # TUV SYNTHETIC
                    "The Secretary of State commissioned services on 2 December 2022; "
                    "services are fully operational across all five HSC Trusts, "
                    "contrary to TUV's position."
                ),
                "source_url": "https://www.gov.uk/government/news/secretary-of-state-for-northern-ireland-instructs-the-department-of-health-to-commission-abortion-services",
            },
            {
                "id": "tuv_005",  # TUV SYNTHETIC
                "title": "Oppose gender self-identification legislation",
                "category": "Equality",
                "status": "kept",
                "evidence": (  # TUV SYNTHETIC
                    "No self-identification legislation for gender identity has passed "
                    "in NI; the UK Supreme Court's April 2025 ruling reinforced the "
                    "biological definition under the Equality Act."
                ),
                "source_url": "https://supremecourt.uk/cases/uksc-2024-0042",
            },
            {
                "id": "tuv_006",  # TUV SYNTHETIC
                "title": "Strengthen law and order and oppose lenient sentencing",
                "category": "Justice",
                "status": "in_progress",
                "evidence": (  # TUV SYNTHETIC
                    "Justice system reforms progressing under the Alliance Justice "
                    "Minister; sentencing guidelines under periodic review, though "
                    "not driven by TUV legislation."
                ),
                "source_url": "https://www.justice-ni.gov.uk/topics/policing-and-community-safety",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "tuv_007",  # TUV SYNTHETIC
                "title": "Reduce the rates burden on small businesses",
                "category": "Economy",
                "status": "in_progress",
                "evidence": (  # TUV SYNTHETIC
                    "Rates relief extensions have been secured with cross-party "
                    "support during the mandate; no TUV-specific legislation passed."
                ),
                "source_url": "https://www.finance-ni.gov.uk/topics/property-rating",  # section-level fallback; specific evidence URL not yet pinned
            },
            {
                "id": "tuv_008",  # TUV SYNTHETIC
                "title": "Oppose deepening of cross-border bodies and all-island integration",
                "category": "Constitutional",
                "status": "broken",
                "evidence": (  # TUV SYNTHETIC
                    "Cross-border cooperation has continued and deepened under the "
                    "restored Executive; all-island health and economic frameworks "
                    "have progressed."
                ),
                "source_url": "https://www.northsouthministerialcouncil.org/",  # section-level fallback; specific evidence URL not yet pinned
            },
        ],
        "scorecard_summary": {"kept": 2, "in_progress": 2, "broken": 4},  # TUV SYNTHETIC
    },
]


async def main() -> None:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client["votewise"]

    # Migrate any existing data from capital-P collection before seeding.
    old_count = await db["Parties"].count_documents({})
    if old_count > 0:
        print(f"  Migrating {old_count} doc(s) from db.Parties → db.parties ...")
        for doc in await db["Parties"].find({}).to_list(None):
            await db["parties"].replace_one({"_id": doc["_id"]}, doc, upsert=True)
        await db["Parties"].drop()
        print("  db.Parties dropped.\n")
    else:
        print("  db.Parties empty or absent — no migration needed.\n")

    for party in PARTIES:
        await db["parties"].replace_one({"_id": party["_id"]}, party, upsert=True)
        sc = party["scorecard_summary"]
        print(
            f"  Seeded: {party['name']:<34} "
            f"kept={sc['kept']}  in_progress={sc['in_progress']}  broken={sc['broken']}"
        )

    count = await db["parties"].count_documents({})
    print(f"\nDone. {count} parties in db.parties.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
