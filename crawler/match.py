"""YouTube 매핑 전용 — 쿼터 예산 관리 + 두 프로그램 우선순위 처리.

크롤(crawl.py)과 완전히 분리. DB에 곡 데이터가 있는 에피소드를 대상으로
YouTube 플레이리스트를 생성하거나 기존 플리에 곡을 채워넣는다.

처리 우선순위:
  1. 최근 2일 — bcamp + byulbam (당일 방송, 가장 먼저)
  2. 최근 7일 — 누락 에피소드 (date DESC)
  3. 백필    — 7일 이상 오래된 것, bcamp/byulbam 1:1 인터리브 (equal ratio)

쿼터 단위 (YouTube Data API v3):
  search.list:            100 units
  playlists.insert:        50 units
  playlistItems.insert:    50 units

Usage:
    python -m crawler.match                          # 전체 (budget=4500)
    python -m crawler.match --program bcamp          # bcamp만 (budget=2500)
    python -m crawler.match --program byulbam        # byulbam만 (budget=3000)
    python -m crawler.match --budget 9000            # 예산 직접 지정
    python -m crawler.match --date 2026-04-12 --program bcamp  # 특정 날짜
    python -m crawler.match --days 7                 # 최근 7일만
"""

import argparse
import json
import os
import sys
from datetime import date, timedelta
from itertools import zip_longest
from pathlib import Path

from crawler.db import (
    DB_PATH, connect, init_db,
    get_unmatched_episodes,
    update_song_match, increment_match_count,
)
from crawler.youtube_client import search_videos, create_playlist, add_to_playlist, QuotaExceededError

_ROOT_DATA = Path(__file__).resolve().parent.parent / "data"
SONG_CACHE_PATH = _ROOT_DATA / "song_cache.json"

# ── 쿼터 상수 ─────────────────────────────────────────────────────────────────

UNITS_SEARCH  = 100   # search.list (1 call)
UNITS_CREATE  = 50    # playlists.insert
UNITS_ADD     = 50    # playlistItems.insert (1 song)

# ── 프로그램 메타 ──────────────────────────────────────────────────────────────

_PROGRAM_TITLE = {
    "bcamp":   "배철수의 음악캠프",
    "byulbam": "별이 빛나는 밤에",
}

_PROGRAM_SOURCE = {
    "bcamp":   "https://www.imbc.com/broad/radio/fm4u/musiccamp/",
    "byulbam": "https://www.imbc.com/broad/radio/fm4u/starnight/",
}


# ── 캐시 ──────────────────────────────────────────────────────────────────────

def _cache_key(title: str, artist: str) -> str:
    return f"{title.strip().upper()} — {artist.strip().upper()}"


def _load_cache() -> dict[str, str]:
    if not SONG_CACHE_PATH.exists():
        return {}
    try:
        return json.loads(SONG_CACHE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print("[경고] song_cache.json 손상 — 빈 캐시로 시작")
        return {}


def _save_cache(cache: dict[str, str]) -> None:
    _ROOT_DATA.mkdir(parents=True, exist_ok=True)
    tmp = SONG_CACHE_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    tmp.rename(SONG_CACHE_PATH)


# ── 쿼터 추정 ─────────────────────────────────────────────────────────────────

def estimate_units(songs: list[dict], cache: dict, has_playlist: bool) -> int:
    """에피소드 처리에 필요한 쿼터 추정.

    캐시 적중 곡은 add_to_playlist(50)만, 미적중은 search(100)+add(50)=150.
    """
    total = 0 if has_playlist else UNITS_CREATE
    for s in songs:
        key = _cache_key(s["title"], s["artist"])
        total += UNITS_ADD + (0 if key in cache else UNITS_SEARCH)
    return total


# ── YouTube 클라이언트 ─────────────────────────────────────────────────────────

def _get_youtube_client():
    if os.environ.get("GOOGLE_REFRESH_TOKEN"):
        from crawler.auth_ci import get_youtube_client_ci
        return get_youtube_client_ci()
    from crawler.auth import get_youtube_client
    return get_youtube_client(
        client_secret_path=str(Path(__file__).parent / "client_secret.json"),
        token_path=str(Path(__file__).parent / "token.pickle"),
    )


# ── 에피소드 처리 ─────────────────────────────────────────────────────────────

def process_episode(
    episode_info: dict,
    youtube,
    cache: dict,
    budget_remaining: int,
) -> tuple[int, int]:
    """단일 에피소드 YouTube 매핑.

    - playlist_id가 없으면 새로 생성
    - playlist_id가 있으면 기존 플리 재사용 (match-only)
    - 매핑 결과를 DB에 실시간 반영

    Returns: (newly_matched, units_used)
    Raises: QuotaExceededError (호출부가 처리)
    """
    program_id = episode_info["program_id"]
    date_str   = episode_info["date"]
    episode_id = episode_info["id"]
    playlist_id = episode_info["playlist_id"]

    conn = connect(DB_PATH)
    unmatched = conn.execute(
        "SELECT order_no, title, artist FROM songs WHERE episode_id=? AND video_id IS NULL ORDER BY order_no",
        (episode_id,),
    ).fetchall()
    conn.close()

    unmatched = [{"order": r["order_no"], "title": r["title"], "artist": r["artist"]} for r in unmatched]

    if not unmatched:
        print(f"  [{program_id}] {date_str} — 모든 곡 이미 매핑, 스킵")
        return 0, 0

    estimated = estimate_units(unmatched, cache, has_playlist=playlist_id is not None)
    if estimated > budget_remaining:
        print(f"  [{program_id}] {date_str} — 예산 부족 (필요 {estimated}, 잔여 {budget_remaining}), 스킵")
        return 0, 0

    print(f"\n  [{program_id}] {date_str} — {len(unmatched)}곡 매핑 시작 (예상 {estimated} units)")

    units_used = 0

    # 플레이리스트 생성 (없을 때만)
    if playlist_id is None:
        prog_title = _PROGRAM_TITLE.get(program_id, program_id)
        playlist_id = create_playlist(
            youtube,
            title=f"{prog_title} {date_str}",
            description=(
                "알고리즘이 아닌, DJ가 직접 고른 음악들입니다.\n"
                "\n"
                "K-Radio Archive는 DJ들의 멋진 선곡표를 매일 기록하는 아카이브예요.\n"
                "채널을 구독하고 매일 올라오는 재생목록을 확인해보세요.\n"
                "https://bcamp-daily.vercel.app에서도 확인 가능합니다.\n"
                f"\n{prog_title} {date_str} 방송분"
            ),
        )
        units_used += UNITS_CREATE
        print(f"  플레이리스트 생성: {playlist_id}")

        # DB에 playlist_id 바로 기록 (이후 오류 나도 재생성 방지)
        conn = connect(DB_PATH)
        with conn:
            conn.execute(
                """UPDATE episodes SET
                     youtube_playlist_id = ?,
                     youtube_url = ?,
                     youtube_music_url = ?
                   WHERE id = ?""",
                (
                    playlist_id,
                    f"https://www.youtube.com/playlist?list={playlist_id}",
                    f"https://music.youtube.com/playlist?list={playlist_id}",
                    episode_id,
                ),
            )
        conn.close()

    newly_matched = 0

    for song in unmatched:
        key = _cache_key(song["title"], song["artist"])
        cached_id = cache.get(key)

        try:
            if cached_id:
                video_id, video_title, channel = cached_id, None, None
                print(f"    ✓ {song['order']:2d}. {song['title']} → [캐시]")
            else:
                results = search_videos(youtube, f"{song['title']} {song['artist']}", max_results=1)
                units_used += UNITS_SEARCH
                if not results:
                    print(f"    ✗ {song['order']:2d}. {song['title']} — 검색 결과 없음")
                    continue
                v = results[0]
                video_id, video_title, channel = v["video_id"], v["title"], v["channel"]
                cache[key] = video_id
                print(f"    ✓ {song['order']:2d}. {song['title']} → {v['title'][:50]}")

            add_to_playlist(youtube, playlist_id, video_id)
            units_used += UNITS_ADD

            conn = connect(DB_PATH)
            update_song_match(conn, episode_id, song["order"], video_id, video_title, channel)
            conn.close()

            newly_matched += 1

        except QuotaExceededError:
            raise  # 쿼터 초과는 상위로 전파 (루프 중단)
        except Exception as e:
            # DB 오류 등 개별 곡 실패 — 로그 후 계속 진행
            # (YouTube에 이미 추가됐을 수 있지만 다음 실행에서 video_id IS NULL 체크로 감지 불가)
            print(f"    [경고] {song['order']:2d}. {song['title']} — 처리 실패, 스킵: {e}")

    if newly_matched > 0:
        conn = connect(DB_PATH)
        increment_match_count(conn, episode_id, newly_matched)
        conn.close()

    print(f"  [{program_id}] {date_str} — {newly_matched}/{len(unmatched)}곡 완료 ({units_used} units 사용)")
    return newly_matched, units_used


# ── 우선순위 큐 구성 ──────────────────────────────────────────────────────────

def build_queue(
    program_id: str | None,
    max_days: int,
    cache: dict,
) -> list[dict]:
    """처리 우선순위 순으로 정렬된 에피소드 목록.

    우선순위:
      1. 최근 2일 (당일 방송) — date DESC
      2. 3~7일 — date DESC
      3. 8일 이상 (백필) — bcamp/byulbam 1:1 인터리브, date DESC

    """
    conn = connect(DB_PATH)

    def fetch(prog, min_d, max_d):
        return get_unmatched_episodes(conn, prog, min_days=min_d, max_days=max_d)

    if program_id:
        # 단일 프로그램: 단순 date DESC
        queue = fetch(program_id, 0, max_days)
    else:
        # 전체: 우선순위 + 인터리브
        urgent  = fetch(None, 0, 2)   # 최근 2일 (양 프로그램 함께, date DESC)
        recent  = fetch(None, 3, 7)   # 3~7일
        bc_back = fetch("bcamp",   8, max_days)
        bb_back = fetch("byulbam", 8, max_days)

        # 백필은 1:1 인터리브
        backfill = []
        for bc, bb in zip_longest(bc_back, bb_back):
            if bc: backfill.append(bc)
            if bb: backfill.append(bb)

        queue = urgent + recent + backfill

    conn.close()
    return queue


# ── 메인 실행 ─────────────────────────────────────────────────────────────────

def run(
    program_id: str | None,
    budget: int,
    max_days: int,
    target_date: date | None = None,
) -> int:
    """YouTube 매핑 실행.

    Returns: 총 새로 매핑된 곡 수
    """
    init_db(DB_PATH)
    cache = _load_cache()
    youtube = _get_youtube_client()

    remaining = budget
    total_matched = 0
    total_units = 0

    if target_date:
        # 특정 날짜 1개만
        conn = connect(DB_PATH)
        eps = get_unmatched_episodes(conn, program_id, min_days=0, max_days=3650)
        eps = [e for e in eps if e["date"] == target_date.isoformat()]
        conn.close()
        queue = eps
    else:
        queue = build_queue(program_id, max_days, cache)

    if not queue:
        print("[match] 처리할 에피소드 없음.")
        return 0

    print(f"[match] 대상 {len(queue)}개 에피소드 | 예산 {budget} units")

    try:
        for ep in queue:
            matched, used = process_episode(ep, youtube, cache, remaining)
            total_matched += matched
            total_units   += used
            remaining     -= used

            if remaining <= 0:
                print(f"\n[match] 예산 소진 ({budget} units 사용). 종료.")
                break

    except QuotaExceededError:
        _save_cache(cache)
        print(f"\n[match] 쿼터 초과. 오늘 작업 종료. (매핑 완료: {total_matched}곡, 사용: {total_units} units)")
        return total_matched

    _save_cache(cache)
    print(f"\n[match] 완료 — 총 {total_matched}곡 새로 매핑 | {total_units}/{budget} units 사용")
    return total_matched


def main() -> None:
    parser = argparse.ArgumentParser(description="YouTube 매핑 전용 (쿼터 예산 관리)")
    parser.add_argument("--program", choices=["bcamp", "byulbam"], default=None,
                        help="특정 프로그램만 처리 (기본: 두 프로그램 모두)")
    parser.add_argument("--budget", type=int, default=4500,
                        help="사용 가능한 쿼터 예산 (기본: 4500 units)")
    parser.add_argument("--days", type=int, default=90,
                        help="처리 범위 최대 일수 (기본: 90일)")
    parser.add_argument("--date", help="특정 날짜만 처리 (YYYY-MM-DD)")
    args = parser.parse_args()

    target_date = None
    if args.date:
        try:
            target_date = date.fromisoformat(args.date)
        except ValueError:
            print(f"[오류] 날짜 형식이 올바르지 않습니다: {args.date}")
            sys.exit(1)

    run(
        program_id=args.program,
        budget=args.budget,
        max_days=args.days,
        target_date=target_date,
    )


if __name__ == "__main__":
    main()
