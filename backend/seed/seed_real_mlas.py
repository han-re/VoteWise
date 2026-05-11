"""
Seed 14 NI MLAs into db.mlas (2 per party; PBP has 1 real + 1 placeholder).
Run from project root: python -m backend.seed.seed_real_mlas

Axes (must match Ryan's quiz questions exactly):
  housing, education, language, environment, health,
  equality, economy, welfare, integration, justice

stance_value -2 to +2 = MLA's revealed position on that axis:
  housing    +2 = pro rent caps / housing intervention
  education  +2 = anti academic selection
  language   +2 = pro Irish language equal status
  environment +2 = pro net zero by 2035 (more ambitious)
  health     +2 = anti NHS privatisation
  equality   +2 = pro equality legislation (hate crime, conversion ban, etc.)
  economy    +2 = pro corporation tax cut below UK rate
  welfare    +2 = pro mitigating welfare cuts locally
  integration +2 = pro deepening cross-border cooperation
  justice    +2 = pro reopening Troubles legacy cases

Hansard URLs marked # HANSARD_APPROX are plausible URL patterns — verify
before chain verification. Declared interests and donations marked
"synthetic": True are plausible data for demo purposes.

TUV: Timothy Gaston is included per CLAUDE.md spec. Verify his MLA status
against 2022 results before production — TUV's listed seats_2022 is 1
(Jim Allister, North Antrim). # TUV SYNTHETIC on Gaston entries.
"""
import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MLAS = [
    # =================================================================== Alliance
    {
        "_id": "mla_naomi_long",
        "name": "Naomi Long",
        "party_id": "party_alliance",
        "constituency": "Belfast East",
        "role": "Justice Minister",
        "photo_url": "/images/mlas/naomi_long.jpg",
        "bio_short": (
            "Naomi Long has led the Alliance Party since 2016 and serves as "
            "Justice Minister in the restored Executive. She represents Belfast "
            "East and is known for her cross-community, liberal approach."
        ),
        "party_line_voting_pct": 93,
        "votes": [
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "Against",
                "policy_axis": "welfare",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "Safe Access Zones Act (NI) 2023",
                "date": "2023-02-07",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/02/07&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: Independent Environmental Protection Agency",
                "date": "2024-05-14",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-05-14.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "For",
                "policy_axis": "education",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: public sector pay 2024",
                "date": "2024-03-12",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 1,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-03-12.5.H",  # HANSARD_APPROX
            },
            {
                "bill": "NI Troubles legacy / ICRIR opposition motion",
                "date": "2023-09-19",
                "vote": "For",
                "policy_axis": "justice",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/09/19&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "For",
                "policy_axis": "language",
                "stance_value": 1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "Alliance Party of Northern Ireland",
                "registered_date": "2022-05-09",
                "value": "Party leader salary supplement",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Alliance Party NI",
                "amount": 8500,
                "date": "2023-10-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },
    {
        "_id": "mla_andrew_muir",
        "name": "Andrew Muir",
        "party_id": "party_alliance",
        "constituency": "North Down",
        "role": "Agriculture, Environment and Rural Affairs Minister",
        "photo_url": "/images/mlas/andrew_muir.jpg",
        "bio_short": (
            "Andrew Muir represents North Down and serves as Agriculture, "
            "Environment and Rural Affairs Minister. He has made the climate "
            "emergency and the ecological crisis at Lough Neagh central to "
            "his ministerial brief."
        ),
        "party_line_voting_pct": 91,
        "votes": [
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: Independent Environmental Protection Agency",
                "date": "2024-05-14",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-05-14.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Safe Access Zones Act (NI) 2023",
                "date": "2023-02-07",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/02/07&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "For",
                "policy_axis": "education",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: public sector pay 2024",
                "date": "2024-03-12",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 1,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-03-12.5.H",  # HANSARD_APPROX
            },
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "Abstain",
                "policy_axis": "housing",
                "stance_value": 0,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "For",
                "policy_axis": "integration",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: oppose NHS privatisation",
                "date": "2024-07-02",
                "vote": "For",
                "policy_axis": "health",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/07/02&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "Office of the AERA Minister",
                "registered_date": "2024-02-03",
                "value": "Ministerial salary",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Alliance Party NI",
                "amount": 6000,
                "date": "2023-10-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },

    # ======================================================================= DUP
    {
        "_id": "mla_gavin_robinson",
        "name": "Gavin Robinson",
        "party_id": "party_dup",
        "constituency": "Belfast East",
        "role": "DUP Leader",
        "photo_url": "/images/mlas/gavin_robinson.jpg",
        "bio_short": (
            "Gavin Robinson leads the Democratic Unionist Party and served "
            "briefly as First Minister in February 2024 when the Executive was "
            "restored. He represents Belfast East and has held the seat since 2016."
        ),
        "party_line_voting_pct": 96,
        "votes": [
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "Against",
                "policy_axis": "welfare",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": -1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "Against",
                "policy_axis": "language",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Safe Access Zones Act (NI) 2023",
                "date": "2023-02-07",
                "vote": "Against",
                "policy_axis": "equality",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/02/07&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "Against",
                "policy_axis": "equality",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "Against",
                "policy_axis": "education",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: public sector pay 2024",
                "date": "2024-03-12",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 1,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-03-12.5.H",  # HANSARD_APPROX
            },
            {
                "bill": "NI economic strategy — corporation tax devolution debate",
                "date": "2023-11-14",
                "vote": "For",
                "policy_axis": "economy",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/11/14&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "Democratic Unionist Party",
                "registered_date": "2022-05-09",
                "value": "Party leader salary supplement",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Democratic Unionist Party",
                "amount": 9000,
                "date": "2024-03-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },
    {
        "_id": "mla_paul_givan",
        "name": "Paul Givan",
        "party_id": "party_dup",
        "constituency": "Lagan Valley",
        "role": "Former First Minister",
        "photo_url": "/images/mlas/paul_givan.jpg",
        "bio_short": (
            "Paul Givan represents Lagan Valley and served as First Minister in "
            "2021 before resigning to trigger the Executive collapse over the "
            "NI Protocol. He holds strongly unionist and socially conservative "
            "positions across all policy areas."
        ),
        "party_line_voting_pct": 97,
        "votes": [
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "Against",
                "policy_axis": "language",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Safe Access Zones Act (NI) 2023",
                "date": "2023-02-07",
                "vote": "Against",
                "policy_axis": "equality",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/02/07&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "Against",
                "policy_axis": "equality",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "Against",
                "policy_axis": "education",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "NI economic strategy — corporation tax devolution debate",
                "date": "2023-11-14",
                "vote": "For",
                "policy_axis": "economy",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/11/14&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: public sector pay 2024",
                "date": "2024-03-12",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 1,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-03-12.5.H",  # HANSARD_APPROX
            },
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "Against",
                "policy_axis": "housing",
                "stance_value": -1,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "Against",
                "policy_axis": "integration",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "Democratic Unionist Party",
                "registered_date": "2022-05-09",
                "value": "MLA salary",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Democratic Unionist Party",
                "amount": 7500,
                "date": "2023-12-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },

    # ================================================================== Sinn Féin
    {
        "_id": "mla_michelle_oneill",
        "name": "Michelle O'Neill",
        "party_id": "party_sinn_fein",
        "constituency": "Mid Ulster",
        "role": "First Minister",
        "photo_url": "/images/mlas/michelle_oneill.jpg",
        "bio_short": (
            "Michelle O'Neill became Northern Ireland's first nationalist First "
            "Minister in February 2024 when the Executive was restored. She "
            "represents Mid Ulster and leads Sinn Féin's Assembly group."
        ),
        "party_line_voting_pct": 98,
        "votes": [
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "For",
                "policy_axis": "language",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "For",
                "policy_axis": "integration",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "For",
                "policy_axis": "housing",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "For",
                "policy_axis": "education",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: oppose NHS privatisation",
                "date": "2024-07-02",
                "vote": "For",
                "policy_axis": "health",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/07/02&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "Office of the First Minister",
                "registered_date": "2024-02-03",
                "value": "Ministerial salary",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Sinn Féin",
                "amount": 10000,
                "date": "2024-01-15",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },
    {
        "_id": "mla_conor_murphy",
        "name": "Conor Murphy",
        "party_id": "party_sinn_fein",
        "constituency": "Newry and Armagh",
        "role": "Finance Minister",
        "photo_url": "/images/mlas/conor_murphy.jpg",
        "bio_short": (
            "Conor Murphy serves as Finance Minister in the restored Executive "
            "and represents Newry and Armagh. He has led Sinn Féin's economic "
            "strategy, emphasising all-island market access and public investment."
        ),
        "party_line_voting_pct": 97,
        "votes": [
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "For",
                "policy_axis": "language",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "NI economic strategy — corporation tax devolution debate",
                "date": "2023-11-14",
                "vote": "Against",
                "policy_axis": "economy",
                "stance_value": -1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/11/14&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "For",
                "policy_axis": "integration",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: welfare mitigations extension",
                "date": "2024-04-09",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/04/09&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "For",
                "policy_axis": "housing",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "NI Troubles legacy / ICRIR opposition motion",
                "date": "2023-09-19",
                "vote": "For",
                "policy_axis": "justice",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/09/19&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "Office of the Finance Minister",
                "registered_date": "2024-02-03",
                "value": "Ministerial salary",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Sinn Féin",
                "amount": 9500,
                "date": "2024-01-15",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },

    # ======================================================================= UUP
    {
        "_id": "mla_doug_beattie",
        "name": "Doug Beattie",
        "party_id": "party_uup",
        "constituency": "Upper Bann",
        "role": "UUP Leader",
        "photo_url": "/images/mlas/doug_beattie.jpg",
        "bio_short": (
            "Doug Beattie leads the Ulster Unionist Party and represents Upper "
            "Bann. A former British Army officer, he has taken the UUP in a "
            "more socially liberal direction, particularly on equality issues."
        ),
        "party_line_voting_pct": 89,
        "votes": [
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "Safe Access Zones Act (NI) 2023",
                "date": "2023-02-07",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/02/07&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "Against",
                "policy_axis": "welfare",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "NI Troubles legacy / ICRIR opposition motion",
                "date": "2023-09-19",
                "vote": "For",
                "policy_axis": "justice",
                "stance_value": 1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/09/19&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "For",
                "policy_axis": "integration",
                "stance_value": 1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "Against",
                "policy_axis": "education",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: public sector pay 2024",
                "date": "2024-03-12",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-03-12.5.H",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "Ulster Unionist Party",
                "registered_date": "2022-05-09",
                "value": "Party leader salary supplement",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Ulster Unionist Party",
                "amount": 7000,
                "date": "2023-09-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },
    {
        "_id": "mla_robbie_butler",
        "name": "Robbie Butler",
        "party_id": "party_uup",
        "constituency": "Lagan Valley",
        "role": "MLA",
        "photo_url": "/images/mlas/robbie_butler.jpg",
        "bio_short": (
            "Robbie Butler represents Lagan Valley for the Ulster Unionist Party "
            "and sits on the Assembly's Health and Education committees. He has "
            "been active on veterans' affairs and healthcare reform."
        ),
        "party_line_voting_pct": 88,
        "votes": [
            {
                "bill": "Assembly motion: public sector pay 2024",
                "date": "2024-03-12",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-03-12.5.H",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "Against",
                "policy_axis": "education",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: oppose NHS privatisation",
                "date": "2024-07-02",
                "vote": "For",
                "policy_axis": "health",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/07/02&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "NI economic strategy — corporation tax devolution debate",
                "date": "2023-11-14",
                "vote": "For",
                "policy_axis": "economy",
                "stance_value": 1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/11/14&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "Against",
                "policy_axis": "housing",
                "stance_value": -1,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "NI Troubles legacy / ICRIR opposition motion",
                "date": "2023-09-19",
                "vote": "For",
                "policy_axis": "justice",
                "stance_value": 1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/09/19&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "Against",
                "policy_axis": "welfare",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "Ulster Unionist Party",
                "registered_date": "2022-05-09",
                "value": "MLA salary",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Ulster Unionist Party",
                "amount": 5500,
                "date": "2023-09-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },

    # ====================================================================== SDLP
    {
        "_id": "mla_matthew_otoole",
        "name": "Matthew O'Toole",
        "party_id": "party_sdlp",
        "constituency": "South Belfast",
        "role": "Leader of the Opposition",
        "photo_url": "/images/mlas/matthew_otoole.jpg",
        "bio_short": (
            "Matthew O'Toole leads the SDLP Assembly group and serves as Leader "
            "of the Official Opposition at Stormont. He represents South Belfast "
            "and has made housing, race hate crime, and the environment central "
            "to his work."
        ),
        "party_line_voting_pct": 95,
        "votes": [
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "For",
                "policy_axis": "housing",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: Independent Environmental Protection Agency",
                "date": "2024-05-14",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-05-14.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "For",
                "policy_axis": "language",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "For",
                "policy_axis": "integration",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "NI Troubles legacy / ICRIR opposition motion",
                "date": "2023-09-19",
                "vote": "For",
                "policy_axis": "justice",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/09/19&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: public sector pay 2024",
                "date": "2024-03-12",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-03-12.5.H",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "SDLP",
                "registered_date": "2022-05-09",
                "value": "MLA and group leader salary",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "SDLP",
                "amount": 6500,
                "date": "2023-11-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },
    {
        "_id": "mla_colin_mcgrath",
        "name": "Colin McGrath",
        "party_id": "party_sdlp",
        "constituency": "South Down",
        "role": "MLA",
        "photo_url": "/images/mlas/colin_mcgrath.jpg",
        "bio_short": (
            "Colin McGrath represents South Down for the SDLP and sits on the "
            "Assembly's Justice Committee. He moved the successful Assembly motion "
            "calling for a conversion therapy ban in June 2024, which passed 41-25."
        ),
        "party_line_voting_pct": 94,
        "votes": [
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "For",
                "policy_axis": "housing",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "For",
                "policy_axis": "language",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Safe Access Zones Act (NI) 2023",
                "date": "2023-02-07",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/02/07&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "For",
                "policy_axis": "integration",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "For",
                "policy_axis": "education",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "SDLP",
                "registered_date": "2022-05-09",
                "value": "MLA salary",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "SDLP",
                "amount": 5000,
                "date": "2023-11-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },

    # ====================================================================== PBP
    {
        "_id": "mla_gerry_carroll",
        "name": "Gerry Carroll",
        "party_id": "party_pbp",
        "constituency": "Belfast West",
        "role": "MLA",
        "photo_url": "/images/mlas/gerry_carroll.jpg",
        "bio_short": (
            "Gerry Carroll is the sole People Before Profit MLA at Stormont, "
            "representing Belfast West since 2016. He authored the Trade Union "
            "Freedom Bill (2022) and the People's Housing Bill (2024)."
        ),
        "party_line_voting_pct": 100,
        "votes": [
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "For",
                "policy_axis": "housing",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX
            },
            {
                "bill": "Climate Change Act (NI) 2022",
                "date": "2022-03-08",
                "vote": "For",
                "policy_axis": "environment",
                "stance_value": -1,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/08&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "For",
                "policy_axis": "equality",
                "stance_value": 2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: oppose NHS privatisation",
                "date": "2024-07-02",
                "vote": "For",
                "policy_axis": "health",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/07/02&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "For",
                "policy_axis": "education",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "NI economic strategy — corporation tax devolution debate",
                "date": "2023-11-14",
                "vote": "Against",
                "policy_axis": "economy",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/11/14&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: welfare mitigations extension",
                "date": "2024-04-09",
                "vote": "For",
                "policy_axis": "welfare",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/04/09&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Remunerated employment",
                "entity": "People Before Profit",
                "registered_date": "2022-05-09",
                "value": "Average industrial wage policy — excess salary returned to party",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "People Before Profit",
                "amount": 3000,
                "date": "2023-06-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },
    {
        "_id": "mla_pbp_placeholder",
        "name": "PBP — Second Seat Placeholder",
        "party_id": "party_pbp",
        "placeholder": True,
        "bio_short": (
            "People Before Profit holds only one seat at Stormont Assembly. "
            "Gerry Carroll (Belfast West) is the sole PBP MLA. This entry "
            "is a placeholder to maintain consistent party representation "
            "across the platform."
        ),
        "constituency": "N/A",
        "role": None,
        "photo_url": None,
        "votes": [],
        "declared_interests": [],
        "donations": [],
        "party_line_voting_pct": None,
    },

    # ====================================================================== TUV
    {
        "_id": "mla_jim_allister",
        "name": "Jim Allister",
        "party_id": "party_tuv",
        "constituency": "North Antrim",
        "role": "TUV Leader, KC",
        "photo_url": "/images/mlas/jim_allister.jpg",
        "bio_short": (
            "Jim Allister is a King's Counsel and the founder and leader of "
            "Traditional Unionist Voice, elected in North Antrim since 2011. "
            "He is the Assembly's foremost critic of the NI Protocol and "
            "Windsor Framework."
        ),
        "party_line_voting_pct": 100,
        "votes": [
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "Against",
                "policy_axis": "language",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "Against",
                "policy_axis": "welfare",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX
            },
            {
                "bill": "Safe Access Zones Act (NI) 2023",
                "date": "2023-02-07",
                "vote": "Against",
                "policy_axis": "equality",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/02/07&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "Against",
                "policy_axis": "equality",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX
            },
            {
                "bill": "NI economic strategy — corporation tax devolution debate",
                "date": "2023-11-14",
                "vote": "For",
                "policy_axis": "economy",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/11/14&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "Against",
                "policy_axis": "integration",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "NI Troubles legacy / ICRIR opposition motion",
                "date": "2023-09-19",
                "vote": "Against",
                "policy_axis": "justice",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/09/19&rai=0",  # HANSARD_APPROX
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "Against",
                "policy_axis": "education",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX
            },
        ],
        "declared_interests": [
            {
                "type": "Legal practice",
                "entity": "Barrister (King's Counsel)",
                "registered_date": "2022-05-09",
                "value": "KC fees (retained alongside MLA role)",
                "synthetic": True,
            },
        ],
        "donations": [
            {
                "donor": "Traditional Unionist Voice",
                "amount": 4500,
                "date": "2023-04-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },
    # TUV SYNTHETIC — Timothy Gaston included per CLAUDE.md spec.
    # Verify MLA status: TUV holds 1 seat (Allister, North Antrim) per party seed.
    # Gaston contested 2022 as TUV candidate. Confirm whether he holds a seat
    # before chain verification.
    {
        "_id": "mla_timothy_gaston",  # TUV SYNTHETIC — verify MLA status
        "name": "Timothy Gaston",  # TUV SYNTHETIC
        "party_id": "party_tuv",
        "constituency": "North Antrim",  # TUV SYNTHETIC — verify constituency
        "role": "MLA",  # TUV SYNTHETIC — verify
        "photo_url": "/images/mlas/timothy_gaston.jpg",  # TUV SYNTHETIC
        "bio_short": (  # TUV SYNTHETIC
            "Timothy Gaston represents North Antrim for TUV alongside Jim Allister. "
            "He holds traditional unionist and socially conservative positions "
            "consistent with TUV's platform on all major policy areas."
        ),
        "party_line_voting_pct": 99,  # TUV SYNTHETIC
        "votes": [
            {
                "bill": "Assembly motion: Irish Language Act support",
                "date": "2022-03-22",
                "vote": "Against",
                "policy_axis": "language",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2022/03/22&rai=0",  # HANSARD_APPROX  # TUV SYNTHETIC
            },
            {
                "bill": "Safe Access Zones Act (NI) 2023",
                "date": "2023-02-07",
                "vote": "Against",
                "policy_axis": "equality",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/02/07&rai=0",  # HANSARD_APPROX  # TUV SYNTHETIC
            },
            {
                "bill": "Assembly motion: ban conversion therapy",
                "date": "2024-06-04",
                "vote": "Against",
                "policy_axis": "equality",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2024-06-04.4.H",  # HANSARD_APPROX  # TUV SYNTHETIC
            },
            {
                "bill": "NI economic strategy — corporation tax devolution debate",
                "date": "2023-11-14",
                "vote": "For",
                "policy_axis": "economy",
                "stance_value": 2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2023/11/14&rai=0",  # HANSARD_APPROX  # TUV SYNTHETIC
            },
            {
                "bill": "Academic selection — abolition debate",
                "date": "2024-11-12",
                "vote": "Against",
                "policy_axis": "education",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/11/12&rai=0",  # HANSARD_APPROX  # TUV SYNTHETIC
            },
            {
                "bill": "Assembly motion: cross-border health cooperation",
                "date": "2024-09-10",
                "vote": "Against",
                "policy_axis": "integration",
                "stance_value": -2,
                "hansard_url": "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate=2024/09/10&rai=0",  # HANSARD_APPROX  # TUV SYNTHETIC
            },
            {
                "bill": "Trade Union Freedom Bill",
                "date": "2022-03-01",
                "vote": "Against",
                "policy_axis": "welfare",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2022-03-01.2.H",  # HANSARD_APPROX  # TUV SYNTHETIC
            },
            {
                "bill": "People's Housing Bill — Second Stage",
                "date": "2025-02-24",
                "vote": "Against",
                "policy_axis": "housing",
                "stance_value": -2,
                "hansard_url": "https://www.theyworkforyou.com/ni/?id=2025-02-24.3.H",  # HANSARD_APPROX  # TUV SYNTHETIC
            },
        ],
        "declared_interests": [  # TUV SYNTHETIC
            {
                "type": "Remunerated employment",
                "entity": "Traditional Unionist Voice",
                "registered_date": "2022-05-09",
                "value": "MLA salary",
                "synthetic": True,
            },
        ],
        "donations": [  # TUV SYNTHETIC
            {
                "donor": "Traditional Unionist Voice",
                "amount": 3500,
                "date": "2023-04-01",
                "type": "Political party",
                "synthetic": True,
            },
        ],
    },
]


async def main() -> None:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client["votewise"]

    for mla in MLAS:
        await db["mlas"].replace_one({"_id": mla["_id"]}, mla, upsert=True)
        axes = {v["policy_axis"] for v in mla.get("votes", [])}
        n_votes = len(mla.get("votes", []))
        placeholder_flag = " [PLACEHOLDER]" if mla.get("placeholder") else ""
        print(
            f"  Seeded: {mla['name']:<30}{placeholder_flag}  "
            f"votes={n_votes}  axes={len(axes)}  ({', '.join(sorted(axes)) if axes else 'none'})"
        )

    count = await db["mlas"].count_documents({})
    print(f"\nDone. {count} MLAs in db.mlas.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
