"""크롤러 공유 유틸리티.

match.py / main.py / byulbam_main.py / backfill_views.py 에서
동일하게 복사된 함수들을 단일 위치로 추출.
"""

import json
import os
from datetime import date
from pathlib import Path

_ROOT_DATA = Path(__file__).resolve().parent.parent / "data"
SONG_CACHE_PATH = _ROOT_DATA / "song_cache.json"


# ── 선곡 캐시 ─────────────────────────────────────────────────────────────────

def cache_key(title: str, artist: str) -> str:
    return f"{title.strip().upper()} — {artist.strip().upper()}"


def load_cache() -> dict[str, str]:
    if not SONG_CACHE_PATH.exists():
        return {}
    try:
        return json.loads(SONG_CACHE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print("[경고] song_cache.json 손상 — 빈 캐시로 시작")
        return {}


def save_cache(cache: dict[str, str]) -> None:
    _ROOT_DATA.mkdir(parents=True, exist_ok=True)
    tmp = SONG_CACHE_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    tmp.rename(SONG_CACHE_PATH)


# ── 날짜 ─────────────────────────────────────────────────────────────────────

def day_of_week_ko(d: date) -> str:
    return ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"][d.weekday()]


# ── YouTube 클라이언트 ─────────────────────────────────────────────────────────

def get_youtube_client():
    """환경에 맞는 YouTube OAuth 클라이언트 반환 (CI/로컬 자동 분기)."""
    if os.environ.get("GOOGLE_REFRESH_TOKEN"):
        from crawler.auth_ci import get_youtube_client_ci
        return get_youtube_client_ci()
    from crawler.auth import get_youtube_client
    return get_youtube_client(
        client_secret_path=str(Path(__file__).parent / "client_secret.json"),
        token_path=str(Path(__file__).parent / "token.pickle"),
    )
