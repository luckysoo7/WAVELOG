"""bcamp-daily 크롤러 엔트리포인트.

Usage:
    python -m crawler.main --date 2026-04-08
    python -m crawler.main               # 오늘/어제 자동 처리 + 백필
    python -m crawler.main --dry-run     # 크롤링만, YouTube API 호출 없음
    python -m crawler.main --date 2026-04-08 --mb-only   # DB 기존 곡에 MusicBrainz만
    python -m crawler.main --mb-only                     # 최근 30일 MB 백필
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
from crawler.db import DB_PATH, connect, init_db, insert_episode, get_episode, update_song_mb
from crawler.mbc_crawler import find_seq_id, fetch_songs, get_source_url
from crawler.youtube_client import search_videos, create_playlist, add_to_playlist, QuotaExceededError
from crawler.musicbrainz_client import lookup as mb_lookup

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
    if os.environ.get("GOOGLE_REFRESH_TOKEN"):
        from crawler.auth_ci import get_youtube_client_ci
        youtube = get_youtube_client_ci()
    else:
        youtube = get_youtube_client(
            client_secret_path=str(Path(__file__).parent / "client_secret.json"),
            token_path=str(Path(__file__).parent / "token.pickle"),
        )

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

    print(f"\n3.5/4 MusicBrainz 앨범 정보 조회...")
    mb_found = 0
    for song in songs:
        time.sleep(1)  # MusicBrainz 1 req/s 권장
        result = mb_lookup(song["title"], song["artist"])
        if result:
            song.update(result)
            mb_found += 1
            print(f"     ✓ {song['order']:2d}. {song['title']} → {result.get('albumName', '?')} ({result.get('releaseYear', '?')})")
        else:
            print(f"     ✗ {song['order']:2d}. {song['title']} — MB 없음")
    print(f"     MusicBrainz {mb_found}/{len(songs)}곡 매칭")

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


def run_mb_only(target_date: date) -> None:
    """DB에 이미 저장된 에피소드 곡들에 MusicBrainz 조회만 수행."""
    date_str = target_date.isoformat()
    init_db(_DB_PATH)  # mbid/album_name 등 컬럼 마이그레이션 보장
    conn = connect(_DB_PATH)
    ep = get_episode(conn, _PROGRAM_ID, date_str)
    conn.close()

    if ep is None:
        print(f"[오류] {date_str} 에피소드가 DB에 없습니다. 먼저 일반 크롤링을 실행하세요.")
        sys.exit(1)

    songs = ep["songs"]
    print(f"\n[MB-only] {date_str} — {len(songs)}곡 MusicBrainz 조회 시작\n")

    # episode_id는 get_episode가 반환하지 않으므로 직접 조회
    conn = connect(_DB_PATH)
    row = conn.execute(
        "SELECT id FROM episodes WHERE program_id=? AND date=?",
        (_PROGRAM_ID, date_str),
    ).fetchone()
    episode_id = row["id"]

    mb_found = 0
    for song in songs:
        time.sleep(1)
        result = mb_lookup(song["title"], song["artist"])
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
            mb_found += 1
            print(f"  ✓ {song['order']:2d}. {song['title']} → {result.get('albumName', '?')} ({result.get('releaseYear', '?')})")
        else:
            print(f"  ✗ {song['order']:2d}. {song['title']} — MB 없음")
    conn.close()
    print(f"\n완료: {mb_found}/{len(songs)}곡 매칭")


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
    parser.add_argument("--mb-only", action="store_true", help="DB 기존 곡에 MusicBrainz 조회만 (YouTube 불필요)")
    args = parser.parse_args()

    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")

    # --mb-only: YouTube 없이 MusicBrainz만
    if args.mb_only:
        if args.date:
            run_mb_only(_parse_date(args.date))
        else:
            # 최근 30일 중 DB에 있는 날짜 전체 MB 백필
            today = date.today()
            for offset in range(0, 31):
                candidate = today - timedelta(days=offset)
                conn = connect(_DB_PATH)
                ep = get_episode(conn, _PROGRAM_ID, candidate.isoformat())
                conn.close()
                if ep is not None:
                    run_mb_only(candidate)
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
