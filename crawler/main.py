"""bcamp-daily 크롤러 엔트리포인트.

Usage:
    python -m crawler.main --date 2026-04-08
    python -m crawler.main               # 오늘/어제 자동 처리 + 백필
    python -m crawler.main --dry-run     # 크롤링만, YouTube API 호출 없음
    python -m crawler.main --date 2026-04-08 --album-only   # DB 기존 곡에 Last.fm 앨범 정보만
    python -m crawler.main --album-only                     # 최근 30일 백필
    python -m crawler.main --match-only                     # 미매핑 에피소드 재시도 (기존 플리 재사용)
    python -m crawler.main --match-only --date 2026-04-12   # 특정 날짜만 재시도
"""

import argparse
import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import requests as req

from crawler.auth import get_youtube_client
from crawler.db import (
    DB_PATH, connect, init_db, insert_episode, get_episode, update_song_mb,
    get_incomplete_episodes, update_song_match, increment_match_count,
)
from crawler.mbc_crawler import find_seq_id, fetch_songs, get_source_url
from crawler.youtube_client import search_videos, create_playlist, add_to_playlist, QuotaExceededError

_ROOT_DATA = Path(__file__).resolve().parent.parent / "data"
_DB_PATH = _ROOT_DATA / "archive.db"
SONG_CACHE_PATH = _ROOT_DATA / "song_cache.json"  # 프로그램 공유 캐시
_PROGRAM_ID = "bcamp"


# ── 캐시 ────────────────────────────────────────────────────────────────────

def _cache_key(title: str, artist: str) -> str:
    return f"{title.strip().upper()} — {artist.strip().upper()}"


def _load_cache() -> dict[str, str]:
    if not SONG_CACHE_PATH.exists():
        return {}
    try:
        with open(SONG_CACHE_PATH, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print("[경고] song_cache.json 손상 — 빈 캐시로 시작")
        return {}


def _save_cache(cache: dict[str, str]) -> None:
    _ROOT_DATA.mkdir(parents=True, exist_ok=True)
    tmp = SONG_CACHE_PATH.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2, sort_keys=True)
    tmp.rename(SONG_CACHE_PATH)  # 원자적 교체


# ── Discord 알림 ─────────────────────────────────────────────────────────────

def _notify_discord(webhook_url: str, title: str, description: str, color: int) -> None:
    try:
        req.post(
            webhook_url,
            json={"embeds": [{"title": title, "description": description, "color": color}]},
            timeout=5,
        )
    except Exception:
        pass  # 알림 실패가 크롤러 동작을 막으면 안 됨


# ── 유틸 ─────────────────────────────────────────────────────────────────────

def _parse_date(date_str: str) -> date:
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        print(f"[오류] 날짜 형식이 올바르지 않습니다: {date_str} (예: 2026-04-08)")
        sys.exit(1)


def _day_of_week_ko(d: date) -> str:
    return ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"][d.weekday()]


def _needs_processing(target_date: date) -> bool:
    """DB에 없거나, youtube가 null이면 처리 대상."""
    try:
        conn = connect(_DB_PATH)
        ep = get_episode(conn, _PROGRAM_ID, target_date.isoformat())
        conn.close()
    except Exception:
        return True
    if ep is None:
        return True
    return ep.get("youtube") is None


# ── 핵심 로직 ────────────────────────────────────────────────────────────────

def _get_youtube_client():
    """환경에 맞는 YouTube API 클라이언트 반환 (CI/로컬 자동 분기)."""
    if os.environ.get("GOOGLE_REFRESH_TOKEN"):
        from crawler.auth_ci import get_youtube_client_ci
        return get_youtube_client_ci()
    return get_youtube_client(
        client_secret_path=str(Path(__file__).parent / "client_secret.json"),
        token_path=str(Path(__file__).parent / "token.pickle"),
    )


def run_match_only(target_date: date, program_id: str = _PROGRAM_ID) -> int:
    """DB의 기존 에피소드에서 미매핑 곡만 재시도 — 기존 플레이리스트에 추가.

    새 플레이리스트를 만들지 않고 기존 playlist_id를 재사용하므로
    YouTube API 쿼터를 최소한으로 소비한다.

    Returns: 새로 매칭된 곡 수 (변경 없으면 0)
    """
    date_str = target_date.isoformat()

    conn = connect(_DB_PATH)
    ep = get_episode(conn, program_id, date_str)
    conn.close()

    if ep is None:
        print(f"[{date_str}] DB에 없는 에피소드. 건너뜀.")
        return 0

    if ep.get("youtube") is None:
        print(f"[{date_str}] 플레이리스트 ID 없음 — 전체 재실행 필요. 건너뜀.")
        return 0

    unmatched = [s for s in ep["songs"] if not s.get("videoId")]
    if not unmatched:
        print(f"[{date_str}] 모든 곡 이미 매칭됨. 건너뜀.")
        return 0

    playlist_id = ep["youtube"]["playlistId"]
    print(f"\n[match-only] {date_str} — 미매핑 {len(unmatched)}/{len(ep['songs'])}곡 재시도")
    print(f"  플레이리스트 재사용: {playlist_id}")

    conn = connect(_DB_PATH)
    row = conn.execute(
        "SELECT id FROM episodes WHERE program_id=? AND date=?",
        (program_id, date_str),
    ).fetchone()
    episode_id = row["id"]
    conn.close()

    youtube = _get_youtube_client()
    cache = _load_cache()
    newly_matched = 0

    try:
        for song in unmatched:
            key = _cache_key(song["title"], song["artist"])
            cached_id = cache.get(key)

            if cached_id:
                video_id, video_title, channel = cached_id, None, None
                print(f"  ✓ {song['order']:2d}. {song['title']} → [캐시]")
            else:
                results = search_videos(youtube, f"{song['title']} {song['artist']}", max_results=1)
                if not results:
                    print(f"  ✗ {song['order']:2d}. {song['title']} — 검색 결과 없음")
                    continue
                v = results[0]
                video_id, video_title, channel = v["video_id"], v["title"], v["channel"]
                cache[key] = video_id
                print(f"  ✓ {song['order']:2d}. {song['title']} → {v['title'][:50]}")

            add_to_playlist(youtube, playlist_id, video_id)

            conn = connect(_DB_PATH)
            update_song_match(conn, episode_id, song["order"], video_id, video_title, channel)
            conn.close()

            newly_matched += 1

    except QuotaExceededError:
        _save_cache(cache)
        print(f"\n[쿼터 초과] 부분 완료 ({newly_matched}/{len(unmatched)}곡)")
        raise

    _save_cache(cache)

    if newly_matched > 0:
        conn = connect(_DB_PATH)
        increment_match_count(conn, episode_id, newly_matched)
        conn.close()

    print(f"  → {newly_matched}/{len(unmatched)}곡 새로 매칭 완료")
    return newly_matched


def backfill_unmatched(program_id: str = _PROGRAM_ID, max_days: int = 30) -> int:
    """최근 max_days일 내 미매핑 에피소드 전체 재시도.

    Returns: 총 새로 매칭된 곡 수
    """
    conn = connect(_DB_PATH)
    incomplete = get_incomplete_episodes(conn, program_id, max_days)
    conn.close()

    if not incomplete:
        print("[match-only] 재시도 대상 에피소드 없음.")
        return 0

    print(f"[match-only] 재시도 대상: {len(incomplete)}개 에피소드")
    total = 0
    for ep_info in incomplete:
        newly = run_match_only(date.fromisoformat(ep_info["date"]), program_id)
        total += newly

    print(f"\n[match-only] 완료 — 총 {total}곡 새로 매칭")
    return total


def run(target_date: date, dry_run: bool = False) -> None:
    date_str = target_date.isoformat()
    print(f"\n[bcamp-daily] {date_str} ({_day_of_week_ko(target_date)}) 처리 시작\n")

    print("1/4 MBC 선곡표 목록에서 seqID 탐색...")
    seq_id = find_seq_id(target_date)
    if seq_id is None:
        print(f"[오류] {date_str} 선곡표를 MBC에서 찾을 수 없습니다.")
        sys.exit(1)
    print(f"     seqID = {seq_id}")

    print("2/4 곡 목록 파싱...")
    songs = fetch_songs(seq_id)
    if not songs:
        print("[오류] 곡 목록을 파싱하지 못했습니다.")
        sys.exit(1)
    print(f"     {len(songs)}곡 파싱 완료")
    for s in songs:
        print(f"     {s['order']:2d}. {s['title']} — {s['artist']}")

    if dry_run:
        print("\n[dry-run] YouTube API 호출 없이 종료.")
        _save_to_db(date_str, target_date, seq_id, songs, playlist_id=None)
        return

    print("\n3/4 YouTube 플레이리스트 생성...")
    youtube = _get_youtube_client()

    playlist_id = None
    cache = _load_cache()
    matched = 0
    cache_hits = 0

    try:
        playlist_id = create_playlist(
            youtube,
            title=f"배철수의 음악캠프 {date_str}",
            description=f"출처: MBC 배철수의 음악캠프\n{get_source_url(seq_id)}",
        )
        print(f"     플레이리스트 생성: {playlist_id}")

        for song in songs:
            key = _cache_key(song["title"], song["artist"])
            cached_id = cache.get(key)

            if cached_id:
                song["videoId"] = cached_id
                song["videoTitle"] = None
                song["channel"] = None
                song["matched"] = True
                add_to_playlist(youtube, playlist_id, cached_id)
                matched += 1
                cache_hits += 1
                print(f"     ✓ {song['order']:2d}. {song['title']} → [캐시]")
            else:
                results = search_videos(youtube, f"{song['title']} {song['artist']}", max_results=1)
                if results:
                    video = results[0]
                    song["videoId"] = video["video_id"]
                    song["videoTitle"] = video["title"]
                    song["channel"] = video["channel"]
                    song["matched"] = True
                    cache[key] = video["video_id"]
                    add_to_playlist(youtube, playlist_id, video["video_id"])
                    matched += 1
                    print(f"     ✓ {song['order']:2d}. {song['title']} → {video['title'][:50]}")
                else:
                    song["videoId"] = None
                    song["videoTitle"] = None
                    song["channel"] = None
                    song["matched"] = False
                    print(f"     ✗ {song['order']:2d}. {song['title']} — 검색 결과 없음")

        _save_cache(cache)
        if cache_hits:
            print(f"     (캐시 적중 {cache_hits}곡 — search API 호출 절약)")

    except QuotaExceededError:
        _save_cache(cache)
        if playlist_id:
            print(f"\n[쿼터 초과] 부분 저장 ({matched}/{len(songs)}곡)")
            _save_to_db(date_str, target_date, seq_id, songs, playlist_id)
        raise

    print(f"\n4/4 DB 저장...")
    _save_to_db(date_str, target_date, seq_id, songs, playlist_id)
    print(f"\n완료! {matched}/{len(songs)}곡 매칭")
    print(f"YouTube: https://www.youtube.com/playlist?list={playlist_id}")


def _save_to_db(
    date_str: str,
    target_date: date,
    seq_id: int,
    songs: list[dict],
    playlist_id: str | None,
) -> None:
    import datetime as dt

    playlist_data = None
    if playlist_id:
        playlist_data = {
            "playlistId": playlist_id,
            "url": f"https://www.youtube.com/playlist?list={playlist_id}",
            "musicUrl": f"https://music.youtube.com/playlist?list={playlist_id}",
        }

    episode = {
        "date":       date_str,
        "dayOfWeek":  _day_of_week_ko(target_date),
        "seqID":      seq_id,
        "source":     get_source_url(seq_id),
        "youtube":    playlist_data,
        "createdAt":  dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "matchCount": sum(1 for s in songs if s.get("matched", False)),
    }

    init_db(_DB_PATH)
    conn = connect(_DB_PATH)
    insert_episode(conn, _PROGRAM_ID, episode, songs)
    conn.close()


def run_album_only(target_date: date) -> None:
    """DB에 이미 저장된 에피소드 곡들에 Last.fm 앨범 정보 조회만 수행."""
    date_str = target_date.isoformat()
    init_db(_DB_PATH)
    conn = connect(_DB_PATH)
    ep = get_episode(conn, _PROGRAM_ID, date_str)
    conn.close()

    if ep is None:
        print(f"[오류] {date_str} 에피소드가 DB에 없습니다. 먼저 일반 크롤링을 실행하세요.")
        sys.exit(1)

    songs = ep["songs"]
    print(f"\n[album-only] {date_str} — {len(songs)}곡 Last.fm 조회 시작\n")

    conn = connect(_DB_PATH)
    row = conn.execute(
        "SELECT id FROM episodes WHERE program_id=? AND date=?",
        (_PROGRAM_ID, date_str),
    ).fetchone()
    episode_id = row["id"]

    found = 0
    for song in songs:
        time.sleep(0.25)
        result = lastfm_lookup(song["title"], song["artist"])
        if result:
            update_song_mb(
                conn,
                episode_id,
                song["order"],
                result.get("mbid"),
                result.get("albumName"),
                result.get("albumArtUrl"),
                result.get("releaseYear"),
            )
            found += 1
            print(f"  ✓ {song['order']:2d}. {song['title']} → {result.get('albumName', '?')}")
        else:
            print(f"  ✗ {song['order']:2d}. {song['title']} — 미매칭")
    conn.close()
    print(f"\n완료: {found}/{len(songs)}곡 매칭")


def _backfill(dry_run: bool) -> None:
    """최근 30일 중 미처리 날짜를 최신순으로 처리. 쿼터 초과 시 즉시 중단."""
    filled = 0
    today = date.today()
    for offset in range(1, 31):
        candidate = today - timedelta(days=offset)
        if not _needs_processing(candidate):
            continue
        seq_id = find_seq_id(candidate)
        if seq_id is None:
            continue
        print(f"\n[백필] {candidate.isoformat()} 처리 중...")
        try:
            run(candidate, dry_run=dry_run)
            filled += 1
        except QuotaExceededError as e:
            print(f"\n[백필] 쿼터 초과 — 중단. ({e})")
            break
        except SystemExit:
            continue

    if filled == 0:
        print("\n[백필] 처리할 날짜 없음.")
    else:
        print(f"\n[백필] {filled}개 완료.")


def main() -> None:
    parser = argparse.ArgumentParser(description="배철수의 음악캠프 선곡표 → YouTube 플레이리스트")
    parser.add_argument("--date", help="처리할 날짜 (YYYY-MM-DD). 기본값: 자동 감지")
    parser.add_argument("--dry-run", action="store_true", help="크롤링만, YouTube API 호출 없음")
    parser.add_argument("--no-backfill", action="store_true", help="백필 스킵")
    parser.add_argument("--album-only", action="store_true", help="DB 기존 곡에 Last.fm 앨범 정보만 (YouTube 불필요)")
    parser.add_argument("--match-only", action="store_true", help="미매핑 에피소드 재시도 — 기존 플레이리스트에 곡 채워넣기")
    args = parser.parse_args()

    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")

    # --match-only: 미매핑 에피소드 재시도 (기존 플리 재사용)
    if args.match_only:
        init_db(_DB_PATH)
        try:
            if args.date:
                run_match_only(_parse_date(args.date))
            else:
                backfill_unmatched()
        except QuotaExceededError as e:
            print(f"\n[오류] {e}")
            sys.exit(1)
        return

    # --album-only: YouTube 없이 Last.fm 앨범 정보만
    if args.album_only:
        init_db(_DB_PATH)
        if args.date:
            run_album_only(_parse_date(args.date))
        else:
            today = date.today()
            for offset in range(0, 31):
                candidate = today - timedelta(days=offset)
                conn = connect(_DB_PATH)
                ep = get_episode(conn, _PROGRAM_ID, candidate.isoformat())
                conn.close()
                if ep is not None:
                    run_album_only(candidate)
        return

    if args.date:
        try:
            run(_parse_date(args.date), dry_run=args.dry_run)
        except QuotaExceededError as e:
            print(f"\n[오류] {e}")
            sys.exit(1)
        return

    # 정기 실행: 오늘 처리 → 백필
    today = date.today()
    if _needs_processing(today):
        seq_id = find_seq_id(today)
        if seq_id is not None:
            try:
                run(today, dry_run=args.dry_run)
            except QuotaExceededError as e:
                print(f"\n[오류] {e}")
                if webhook_url:
                    _notify_discord(
                        webhook_url,
                        title="⏸️ YouTube API 쿼터 소진",
                        description=(
                            "오늘 일일 쿼터(10,000 units)를 모두 사용했습니다.\n"
                            "오후 4시 KST 리셋 후 자동으로 재개됩니다."
                        ),
                        color=3447003,  # 파란색
                    )
                sys.exit(0)
            except SystemExit:
                pass

    if not args.no_backfill:
        _backfill(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
