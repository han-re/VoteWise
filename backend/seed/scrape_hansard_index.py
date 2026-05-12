"""
One-shot scraper for the NI Assembly Official Reports index.

Run from project root:  python -m backend.seed.scrape_hansard_index

Walks every session in the dropdown on
https://aims.niassembly.gov.uk/officialreport/reports.aspx and, for every
report row, records eveDate, docID, venue, time, session and the fully built
report.aspx deep link. Writes backend/data/hansard_index.json (committed).

Why this exists: the MLA seed used approximate Hansard URLs (report.aspx with
&rai=0, or pattern-built TheyWorkForYou GIDs) that resolve to an empty Table of
Contents or a 404. A real report.aspx link needs both eveDate AND a valid docID.
This scraper harvests the docID values; reconcile_hansard_urls.py then matches
them against the vote dates in seed_real_mlas.py.

The frontend never calls this. It reads only the committed JSON. Polite scrape:
500ms between fetches, one descriptive User-Agent, no parallel requests. The
session dropdown is an ASP.NET WebForms control, so each non-default session is
reached by a fresh GET (to obtain clean viewstate) followed by one postback that
sets the SessionDropDownList field; pagination is a postback that targets the
GridView with __EVENTARGUMENT=Page$N.
"""
import json
import re
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT_DIR = Path(__file__).resolve().parents[2]
OUT_PATH = ROOT_DIR / "backend" / "data" / "hansard_index.json"

REPORTS_URL = "https://aims.niassembly.gov.uk/officialreport/reports.aspx"
# Live HTML emits the leading "&" right after "?"; preserve it so our links
# match exactly what the site itself produces.
REPORT_URL_TEMPLATE = "https://aims.niassembly.gov.uk/officialreport/report.aspx?&eveDate={eve_date}&docID={doc_id}"

SESSION_FIELD = "ctl00$MainContentPlaceHolder$SessionDropDownList"
GRID_TARGET = "ctl00$MainContentPlaceHolder$OfficialReportsGridView"
GRID_TABLE_ID = "ctl00_MainContentPlaceHolder_OfficialReportsGridView"

USER_AGENT = "VoteWise/1.0 (HackBelfast 2026; one-shot NI Assembly Hansard index harvest)"
PAGE_SLEEP_SECONDS = 0.5
REQUEST_TIMEOUT = 30


def _soup(text: str) -> BeautifulSoup:
    return BeautifulSoup(text, "html.parser")


def _hidden_fields(soup: BeautifulSoup) -> dict:
    """Every <input type=hidden> on the page (__VIEWSTATE, __EVENTVALIDATION, ...)."""
    fields = {}
    for el in soup.select("input[type=hidden]"):
        name = el.get("name")
        if name:
            fields[name] = el.get("value", "")
    return fields


def _sessions(soup: BeautifulSoup) -> list:
    """List of (option_value, label) from the session dropdown, e.g. ("25", "2022-2023")."""
    select = soup.find("select", attrs={"name": SESSION_FIELD})
    if select is None:
        return []
    out = []
    for opt in select.find_all("option"):
        value = opt.get("value")
        label = opt.get_text(strip=True)
        if value is not None:
            out.append((value, label))
    return out


def _selected_session(soup: BeautifulSoup):
    select = soup.find("select", attrs={"name": SESSION_FIELD})
    if select is None:
        return None
    opt = select.find("option", selected=True)
    return opt.get("value") if opt else None


def _grid_table(soup: BeautifulSoup):
    return soup.find("table", id=GRID_TABLE_ID)


def _max_page(soup: BeautifulSoup) -> int:
    """Highest Page$N referenced in the GridView paging row; 1 if there is no paging."""
    table = _grid_table(soup)
    if table is None:
        return 1
    pages = {1}
    for a in table.select("tr.paging a[href]"):
        m = re.search(r"Page\$(\d+)", a["href"])
        if m:
            pages.add(int(m.group(1)))
    for span in table.select("tr.paging span"):
        txt = span.get_text(strip=True)
        if txt.isdigit():
            pages.add(int(txt))
    return max(pages)


_REPORT_LINK_RE = re.compile(r"report\.aspx\?&eveDate=(\d{4})/(\d{2})/(\d{2})&docID=(\d+)", re.I)


def _parse_rows(soup: BeautifulSoup, session_label: str) -> list:
    """Extract one dict per report row in the GridView."""
    table = _grid_table(soup)
    if table is None:
        return []
    rows = []
    for tr in table.find_all("tr"):
        cls = tr.get("class") or []
        if "paging" in cls:
            continue
        link = None
        for a in tr.find_all("a", href=True):
            if _REPORT_LINK_RE.search(a["href"]):
                link = a["href"]
                break
        if not link:
            continue
        year, month, day, doc_id = _REPORT_LINK_RE.search(link).groups()
        eve_date_slash = f"{year}/{month}/{day}"
        eve_date_iso = f"{year}-{month}-{day}"
        tds = tr.find_all("td", recursive=False)
        if len(tds) < 3:
            tds = tr.find_all("td")
        venue = tds[1].get_text(strip=True) if len(tds) > 1 else ""
        time_text = tds[2].get_text(strip=True) if len(tds) > 2 else ""
        rows.append({
            "eveDate": eve_date_iso,
            "docID": doc_id,
            "venue": venue,
            "time": time_text,
            "session": session_label,
            "url": REPORT_URL_TEMPLATE.format(eve_date=eve_date_slash, doc_id=doc_id),
        })
    return rows


def _get(session: requests.Session) -> BeautifulSoup:
    resp = session.get(REPORTS_URL, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    return _soup(resp.text)


def _post(session: requests.Session, soup: BeautifulSoup, overrides: dict) -> BeautifulSoup:
    """WebForms postback: take the current page's hidden fields, apply overrides, POST."""
    form = _hidden_fields(soup)
    form.update(overrides)
    resp = session.post(
        REPORTS_URL,
        data=form,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Referer": REPORTS_URL},
        timeout=REQUEST_TIMEOUT,
    )
    resp.raise_for_status()
    return _soup(resp.text)


def _collect_session(session: requests.Session, soup: BeautifulSoup, option_value: str, label: str) -> list:
    """Return every report row for one session, paginating through each GridView page."""
    rows = list(_parse_rows(soup, label))
    last_page = _max_page(soup)
    current = soup
    for page in range(2, last_page + 1):
        time.sleep(PAGE_SLEEP_SECONDS)
        current = _post(session, current, {
            "__EVENTTARGET": GRID_TARGET,
            "__EVENTARGUMENT": f"Page${page}",
            SESSION_FIELD: option_value,
        })
        rows.extend(_parse_rows(current, label))
        # account for "..." pagers that only reveal the next ten page numbers
        last_page = max(last_page, _max_page(current))
        if page > 60:  # safety valve - no real session is anywhere near this
            break
    return rows


def scrape() -> list:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "text/html"})

    landing = _get(session)
    session_options = _sessions(landing)
    if not session_options:
        raise RuntimeError("Could not find the session dropdown on reports.aspx")
    selected_now = _selected_session(landing)

    print(f"Found {len(session_options)} sessions: " + ", ".join(label for _v, label in session_options))
    print(f"Currently selected: {selected_now}\n")

    all_rows = []
    per_session = {}
    skipped = []

    for option_value, label in session_options:
        try:
            if option_value == selected_now:
                soup = landing
            else:
                time.sleep(PAGE_SLEEP_SECONDS)
                fresh = _get(session)
                time.sleep(PAGE_SLEEP_SECONDS)
                soup = _post(session, fresh, {
                    "__EVENTTARGET": SESSION_FIELD,
                    "__EVENTARGUMENT": "",
                    SESSION_FIELD: option_value,
                })
                got = _selected_session(soup)
                if got != option_value:
                    skipped.append((label, f"session switch did not stick (wanted {option_value}, got {got})"))
                    print(f"  {label:<12}  WARNING: session switch did not stick (got {got})")
                    continue
            rows = _collect_session(session, soup, option_value, label)
        except Exception as exc:  # noqa: BLE001 - one bad session must not abort the rest
            skipped.append((label, repr(exc)))
            print(f"  {label:<12}  ERROR: {exc}")
            continue
        per_session[label] = len(rows)
        all_rows.extend(rows)
        print(f"  {label:<12}  {len(rows):>4} rows")

    seen = set()
    deduped = []
    for r in all_rows:
        key = (r["eveDate"], r["docID"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)
    deduped.sort(key=lambda r: (r["eveDate"], r["docID"]))

    print()
    print(f"Total rows after de-dupe: {len(deduped)}  (raw {len(all_rows)})")
    if skipped:
        print("Sessions skipped / errored:")
        for label, why in skipped:
            print(f"  - {label}: {why}")
    else:
        print("No sessions skipped.")
    return deduped


def main() -> None:
    rows = scrape()
    if not rows:
        sys.exit("No rows scraped - refusing to write an empty index")
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nWrote {len(rows)} entries to {OUT_PATH.relative_to(ROOT_DIR)}")


if __name__ == "__main__":
    main()
