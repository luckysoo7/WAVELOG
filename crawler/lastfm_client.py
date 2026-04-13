"""Last.fm API 클라이언트.

track.getInfo → 앨범명 + 앨범아트 URL 반환.
API key는 환경변수 LASTFM_API_KEY에서 읽음.

Rate limit: 5 req/s (무료 플랜). 호출자는 time.sleep(0.25) 이상 책임.
"""

import os
import sys

import requests

_BASE = "http://ws.audioscrobbler.com/2.0/"
_USER_AGENT = "k-radio-archive/1.0"
_TIMEOUT = 10


def _api_key() -> str:
    key = os.environ.get("LASTFM_API_KEY", "")
    if not key:
        print("[LastFM] 경고: LASTFM_API_KEY 환경변수가 없습니다.", file=sys.stderr)
    return key


def lookup(title: str, artist: str) -> dict | None:
    """Last.fm track.getInfo → 앨범 정보 반환.

    Returns:
        {
            "albumName": str,
            "albumArtUrl": str | None,   # extralarge (300x300) 우선
            "releaseYear": None,         # Last.fm track.getInfo에서 미제공
            "mbid": str | None,
        }
        또는 None (매칭 실패 시)
    """
    key = _api_key()
    if not key:
        return None

    try:
        r = requests.get(
            _BASE,
            params={
                "method":      "track.getInfo",
                "api_key":     key,
                "artist":      artist,
                "track":       title,
                "autocorrect": 1,
                "format":      "json",
            },
            headers={"User-Agent": _USER_AGENT},
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        print(f"[LastFM] 오류: {e}", file=sys.stderr)
        return None

    if "error" in data:
        # error 6 = Track not found — 정상적인 미매칭
        if data.get("error") != 6:
            print(f"[LastFM] API 오류 {data.get('error')}: {data.get('message')}", file=sys.stderr)
        return None

    track = data.get("track", {})
    album = track.get("album", {})
    album_name: str | None = album.get("title") or None

    # 앨범아트: extralarge(300px) → large → medium 순
    images: list[dict] = album.get("image", [])
    art_url: str | None = None
    for size in ("extralarge", "large", "medium"):
        for img in images:
            if img.get("size") == size and img.get("#text"):
                art_url = img["#text"]
                break
        if art_url:
            break

    # Last.fm이 빈 앨범 정보를 돌려주는 경우
    if not album_name and not art_url:
        return None

    mbid: str | None = track.get("mbid") or None

    return {
        "albumName":    album_name,
        "albumArtUrl":  art_url,
        "releaseYear":  None,   # track.getInfo에서 발매연도 미제공
        "mbid":         mbid,
    }
