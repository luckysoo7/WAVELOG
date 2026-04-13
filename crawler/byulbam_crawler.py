"""MBC 별이 빛나는 밤에 선곡표 크롤러.

mbc_crawler와 동일한 HTML 구조, PROG_CODE만 다름.
"""

import html
from datetime import date
from urllib.parse import urlencode, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://miniweb.imbc.com"
LIST_URL = f"{BASE_URL}/Music"
VIEW_URL = f"{BASE_URL}/Music/View"
PROG_CODE = "RASFM210"


def _get(url: str, params: dict | None = None) -> BeautifulSoup:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }
    resp = requests.get(url, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding
    return BeautifulSoup(resp.text, "html.parser")


def find_seq_id(target_date: date) -> int | None:
    """선곡표 목록에서 target_date의 seqID 반환. 최대 5페이지 탐색."""
    date_str = target_date.strftime("%Y-%m-%d")

    for page in range(1, 6):
        soup = _get(LIST_URL, params={"progCode": PROG_CODE, "page": page})

        for row in soup.select("table tr"):
            cells = row.find_all("td")
            if len(cells) < 2:
                continue

            row_date = cells[0].get_text(strip=True)
            if row_date != date_str:
                continue

            link = row.find("a", href=True)
            if not link:
                continue

            qs = parse_qs(urlparse(link["href"]).query)
            seq_ids = qs.get("seqID") or qs.get("seqId")
            if seq_ids:
                return int(seq_ids[0])

    return None


def fetch_songs(seq_id: int) -> list[dict]:
    """특정 seqID 선곡표 페이지에서 곡 목록 파싱."""
    soup = _get(VIEW_URL, params={"seqID": seq_id, "progCode": PROG_CODE})

    songs: list[dict] = []

    for row in soup.select("table tr"):
        cells = row.find_all("td")
        if len(cells) < 3:
            continue

        order_text = cells[0].get_text(strip=True)
        if not order_text.isdigit():
            continue

        title = html.unescape(cells[1].get_text(strip=True))
        artist = html.unescape(cells[2].get_text(strip=True))

        if not title:
            continue

        songs.append({"order": int(order_text), "title": title, "artist": artist})

    return songs


def get_source_url(seq_id: int) -> str:
    params = urlencode({"seqID": seq_id, "progCode": PROG_CODE})
    return f"{VIEW_URL}?{params}"
