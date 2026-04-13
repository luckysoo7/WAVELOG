"""MusicBrainz + Cover Art Archive 클라이언트.

Recording 검색 → 앨범명/발매연도/MBID 조회,
Cover Art Archive에서 앨범아트 URL 반환.

Rate limit: MusicBrainz 공식 권장 1 req/s.
호출자는 time.sleep(1) 책임.
"""

import re
import sys
import time

import requests

_LIVE_DATE_RE = re.compile(r"^\d{4}[\-\u2010\u2011\u2012\u2013]\d{2}[\-\u2010\u2011\u2012\u2013]\d{2}[\s:]")
_LIVE_TITLE_RE = re.compile(r"^live[\s\-:]|[\(\[]live[\)\]]|\blive at\b|\blive,?\s+\d{4}", re.IGNORECASE)

_MB_BASE = "https://musicbrainz.org/ws/2"
_CAA_BASE = "https://coverartarchive.org"
_USER_AGENT = "k-radio-archive/1.0 (github.com/luckysoo7/k-radio-archive)"
_TIMEOUT = 15


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
    except Exception as e:
        print(f"[MB] warning: {e}", file=sys.stderr)
        return None


def _caa_get(release_mbid: str, rg_mbid: str | None = None) -> str | None:
    """Cover Art Archive에서 250px 썸네일 URL 반환. 없으면 None."""
    try:
        r = requests.get(
            f"{_CAA_BASE}/release/{release_mbid}",
            headers={"User-Agent": _USER_AGENT},
            timeout=_TIMEOUT,
            allow_redirects=True,
        )

        if r.status_code != 200 and rg_mbid:
            r = requests.get(
                f"{_CAA_BASE}/release-group/{rg_mbid}",
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
    except Exception as e:
        print(f"[MB] warning: {e}", file=sys.stderr)
        return None


_BAD_SECONDARY = {"Live", "Compilation", "DJ-mix", "Interview", "Mixtape/Street", "Remix"}


def _is_live_title(title: str) -> bool:
    """라이브 날짜 / 라이브 타이틀 감지."""
    t = title or ""
    return bool(_LIVE_DATE_RE.match(t)) or bool(_LIVE_TITLE_RE.search(t))


def _is_studio_album(release: dict) -> bool:
    """Official 스튜디오 앨범 판별 — Live/Compilation secondary type 및 라이브 날짜 제목 제외."""
    if release.get("status") != "Official":
        return False
    if _is_live_title(release.get("title", "")):
        return False
    rg = release.get("release-group", {})
    if rg.get("primary-type") != "Album":
        return False
    secondary = set(rg.get("secondary-types", []))
    return not (secondary & _BAD_SECONDARY)


def _is_official_any(release: dict) -> bool:
    rg = release.get("release-group", {})
    secondary = set(rg.get("secondary-types", []))
    return (
        release.get("status") == "Official"
        and not _is_live_title(release.get("title", ""))
        and not (secondary & _BAD_SECONDARY)
    )


def _choose_release(releases: list[dict]) -> dict | None:
    # 1순위: Official 스튜디오 앨범
    for r in releases:
        if _is_studio_album(r):
            return r
    # 2순위: Official (Live/Compilation 제외)
    for r in releases:
        if _is_official_any(r):
            return r
    # 3순위: 라이브 날짜 제목만 제외 — 나머지는 컴필, 부틀렉 무관 허용
    for r in releases:
        if not _is_live_title(r.get("title", "")):
            return r
    # 전부 라이브 날짜 쓰레기 → None
    return None


def _fetch_releases_for_recording(rec_mbid: str) -> list[dict]:
    """recording MBID로 릴리즈 목록 조회 — status 필터 없이 전부 받아 코드로 분류."""
    data = _mb_get("release", {
        "recording": rec_mbid,
        "inc":       "release-groups",
        "limit":     15,
    })
    if not data:
        return []
    return data.get("releases", [])


def _normalize(s: str) -> str:
    """MBC 전송 텍스트는 전부 대문자 — MB 검색 정확도를 위해 title case 변환."""
    # 이미 mixed case면 그대로 (예: 'Night Fever')
    if not s.isupper():
        return s
    return s.title()


def lookup(title: str, artist: str) -> dict | None:
    """MusicBrainz에서 곡 검색 → 앨범 정보 반환.

    전략:
    1) recording 검색 (최대 5개)
    2) 각 recording에 대해 /release 조회 → 스튜디오 앨범 우선 선택
    3) 첫 번째 recording에서 스튜디오 앨범을 못 찾으면 다음 recording 시도
    4) 찾으면 CAA에서 아트 URL 가져옴

    Returns:
        {"mbid", "albumName", "albumArtUrl", "releaseYear"} 또는 None
    """
    try:
        t = _normalize(title)
        a = _normalize(artist)
        query = f'recording:"{t}" AND artist:"{a}"'
        data = _mb_get("recording", {"query": query, "limit": 5})
        if not data:
            return None

        recordings = data.get("recordings", [])
        if not recordings:
            return None

        best_rec_mbid = recordings[0].get("id")
        best_release: dict | None = None

        for rec in recordings:
            rec_mbid = rec.get("id")
            if not rec_mbid:
                continue

            time.sleep(1)  # MB 1 req/s
            releases = _fetch_releases_for_recording(rec_mbid)
            if not releases:
                releases = rec.get("releases", [])

            release = _choose_release(releases)
            if not release:
                continue

            if _is_studio_album(release):
                # 스튜디오 앨범 발견 — 바로 확정
                best_rec_mbid = rec_mbid
                best_release = release
                break

            # 스튜디오 앨범은 아니지만 일단 저장 (더 좋은 것 못 찾으면 사용)
            if best_release is None:
                best_rec_mbid = rec_mbid
                best_release = release

        if not best_release:
            return None

        release_mbid = best_release.get("id")
        release_group = best_release.get("release-group", {})
        rg_mbid = release_group.get("id")
        album_name = best_release.get("title")
        release_date = best_release.get("date", "")
        release_year = (
            int(release_date[:4])
            if release_date and release_date[:4].isdigit()
            else None
        )

        album_art_url = _caa_get(release_mbid, rg_mbid) if release_mbid else None

        return {
            "mbid":        best_rec_mbid,
            "albumName":   album_name,
            "albumArtUrl": album_art_url,
            "releaseYear": release_year,
        }
    except Exception as e:
        print(f"[MB] warning: {e}", file=sys.stderr)
        return None
