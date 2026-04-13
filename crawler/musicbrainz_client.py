"""MusicBrainz + Cover Art Archive 클라이언트.

Recording 검색 → 앨범명/발매연도/MBID 조회,
Cover Art Archive에서 앨범아트 URL 반환.

Rate limit: MusicBrainz 공식 권장 1 req/s.
호출자는 time.sleep(1) 책임.
"""

import time
import requests

_MB_BASE = "https://musicbrainz.org/ws/2"
_CAA_BASE = "https://coverartarchive.org"
_USER_AGENT = "k-radio-archive/1.0 (github.com/luckysoo7/k-radio-archive)"
_TIMEOUT = 8


def _mb_get(path: str, params: dict) -> dict | None:
    try:
        r = requests.get(
            f"{_MB_BASE}/{path}",
            params={**params, "fmt": "json"},
            headers={"User-Agent": _USER_AGENT},
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def _caa_get(release_mbid: str) -> str | None:
    """Cover Art Archive에서 250px 썸네일 URL 반환. 없으면 None."""
    try:
        r = requests.get(
            f"{_CAA_BASE}/release/{release_mbid}",
            headers={"User-Agent": _USER_AGENT},
            timeout=_TIMEOUT,
            allow_redirects=True,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        images = data.get("images", [])
        if not images:
            return None
        thumbnails = images[0].get("thumbnails", {})
        return (
            thumbnails.get("250")
            or thumbnails.get("small")
            or images[0].get("image")
        )
    except Exception:
        return None


def lookup(title: str, artist: str) -> dict | None:
    """MusicBrainz에서 곡 검색 → 앨범 정보 반환.

    Returns:
        {
            "mbid": str,            # recording MBID
            "albumName": str,
            "albumArtUrl": str | None,
            "releaseYear": int | None,
        }
        또는 None (매칭 실패 시)
    """
    # 1) Recording 검색
    query = f'recording:"{title}" AND artist:"{artist}"'
    data = _mb_get("recording", {"query": query, "limit": 1})
    if not data:
        return None

    recordings = data.get("recordings", [])
    if not recordings:
        return None

    rec = recordings[0]
    rec_mbid = rec.get("id")

    # 2) 첫 번째 release에서 앨범 정보 추출
    releases = rec.get("releases", [])
    if not releases:
        return None

    release = releases[0]
    release_mbid = release.get("id")
    album_name = release.get("title")
    release_date = release.get("date", "")
    release_year = int(release_date[:4]) if release_date and release_date[:4].isdigit() else None

    # 3) Cover Art Archive 조회 (별도 요청 — 1 req/s 준수 위해 sleep은 호출자 책임)
    time.sleep(1)
    album_art_url = _caa_get(release_mbid) if release_mbid else None

    return {
        "mbid":        rec_mbid,
        "albumName":   album_name,
        "albumArtUrl": album_art_url,
        "releaseYear": release_year,
    }
