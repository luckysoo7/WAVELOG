"""bcamp-daily 크롤러 엔트리포인트.

Usage:
    python -m crawler.main --date 2026-04-08
    python -m crawler.main               # 어제 날짜 자동 처리
    python -m crawler.main --dry-run     # 크롤링만, YouTube API 호출 없음
"""

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

from crawler.auth import get_youtube_client
from crawler.mbc_crawler import find_seq_id, fetch_songs, get_source_url
from crawler.youtube_client import search_videos, create_playlist, add_to_playlist, QuotaExceededError

# 프로젝트 루트 기준 data/ 디렉토리
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SONG_CACHE_PATH = DATA_DIR / "song_cache.json"


def _cache_key(title: str, artist: str) -> str:
    return f"{title.strip().upper()} — {artist.strip().upper()}"


def _load_cache() -> dict[str, str]:
    if SONG_CACHE_PATH.exists():
        with open(SONG_CACHE_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_cache(cache: dict[str, str]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(SONG_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2, sort_keys=True)


def _rebuild_index() -> None:
    """data/index.json 재생성 — 사이드바용 메타데이터만 담음."""
    files = sorted(
        [f for f in DATA_DIR.glob("????-??-??.json")],
        reverse=True,
    )
    index = []
    for f in files:
        with open(f, encoding="utf-8") as fp:
            d = json.load(fp)
        index.append({
            "date": d["date"],
            "dayOfWeek": d["dayOfWeek"],
            "songCount": len(d.get("songs", [])),
            "hasPlaylist": d.get("youtube") is not None,
        })
    with open(DATA_DIR / "index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def _parse_date(date_str: str) -> date:
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        print(f"[오류] 날짜 형식이 올바르지 않습니다: {date_str} (예: 2026-04-08)")
        sys.exit(1)


def _day_of_week_ko(d: date) -> str:
    return ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"][d.weekday()]


def run(target_date: date, dry_run: bool = False) -> Path:
    date_str = target_date.isoformat()
    print(f"\n[bcamp-daily] {date_str} ({_day_of_week_ko(target_date)}) 처리 시작\n")

    # 1. MBC 크롤링 — seqID 찾기
    print("1/4 MBC 선곡표 목록에서 seqID 탐색...")
    seq_id = find_seq_id(target_date)
    if seq_id is None:
        print(f"[오류] {date_str} 선곡표를 MBC에서 찾을 수 없습니다.")
        sys.exit(1)
    print(f"     seqID = {seq_id}")

    # 2. 곡 목록 파싱
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
        return _save_json(date_str, target_date, seq_id, songs, playlist_id=None)

    # 3. YouTube API
    import os
    print("\n3/4 YouTube 플레이리스트 생성...")
    if os.environ.get("GOOGLE_REFRESH_TOKEN"):
        # CI 환경 (GitHub Actions)
        from crawler.auth_ci import get_youtube_client_ci
        youtube = get_youtube_client_ci()
    else:
        # 로컬 환경 (OAuth 브라우저 플로우)
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
                video_id = cached_id
                song["videoId"] = video_id
                song["videoTitle"] = None
                song["channel"] = None
                song["matched"] = True
                add_to_playlist(youtube, playlist_id, video_id)
                matched += 1
                cache_hits += 1
                print(f"     ✓ {song['order']:2d}. {song['title']} → [캐시]")
            else:
                query = f"{song['title']} {song['artist']}"
                results = search_videos(youtube, query, max_results=1)
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
        # 쿼터 초과 시에도 진행된 만큼 저장 — 빈 플리 중복 생성 방지 + 캐시 보존
        _save_cache(cache)
        if playlist_id:
            print(f"\n[쿼터 초과] 부분 저장 ({matched}/{len(songs)}곡)")
            _save_json(date_str, target_date, seq_id, songs, playlist_id)
        raise

    print(f"\n4/4 JSON 저장...")
    output_path = _save_json(date_str, target_date, seq_id, songs, playlist_id)
    print(f"     {output_path}")
    print(f"\n완료! {matched}/{len(songs)}곡 매칭")
    print(f"YouTube: https://www.youtube.com/playlist?list={playlist_id}")
    return output_path


def _save_json(
    date_str: str,
    target_date: date,
    seq_id: int,
    songs: list[dict],
    playlist_id: str | None,
) -> Path:
    import datetime as dt

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DATA_DIR / f"{date_str}.json"

    playlist_data = None
    if playlist_id:
        playlist_data = {
            "playlistId": playlist_id,
            "url": f"https://www.youtube.com/playlist?list={playlist_id}",
            "musicUrl": f"https://music.youtube.com/playlist?list={playlist_id}",
        }

    matched_count = sum(1 for s in songs if s.get("matched", False))

    payload = {
        "date": date_str,
        "dayOfWeek": _day_of_week_ko(target_date),
        "seqID": seq_id,
        "source": get_source_url(seq_id),
        "youtube": playlist_data,
        "songs": songs,
        "createdAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "matchCount": matched_count,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return output_path




def _needs_processing(json_path: Path) -> bool:
    """JSON이 없거나, 있어도 youtube가 null이면 처리 대상."""
    if not json_path.exists():
        return True
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("youtube") is None


def _backfill(dry_run: bool) -> None:
    """최근 30일 중 미처리(JSON 없음 또는 youtube: null) 날짜를 최신순으로 처리.

    쿼터가 닿을 때까지 계속. 쿼터 초과 시 즉시 중단.
    """
    filled = 0
    today = date.today()
    for offset in range(1, 31):  # 어제 → 30일 전 순서 (최신 우선)
        candidate = today - timedelta(days=offset)
        if not _needs_processing(DATA_DIR / f"{candidate.isoformat()}.json"):
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
            continue  # seqID 없음 등 개별 오류 → 다음 날짜로

    if filled == 0:
        print("\n[백필] 처리할 날짜 없음.")
    else:
        print(f"\n[백필] {filled}개 완료.")


def main() -> None:
    parser = argparse.ArgumentParser(description="배철수의 음악캠프 선곡표 → YouTube 플레이리스트")
    parser.add_argument("--date", help="처리할 날짜 (YYYY-MM-DD). 기본값: 자동 감지")
    parser.add_argument("--dry-run", action="store_true", help="크롤링만, YouTube API 호출 없음")
    parser.add_argument("--no-backfill", action="store_true", help="백필 스킵")
    args = parser.parse_args()

    if args.date:
        # 날짜 직접 지정 시: 그냥 실행, 실패하면 exit(1)
        try:
            run(_parse_date(args.date), dry_run=args.dry_run)
        except QuotaExceededError as e:
            print(f"\n[오류] {e}")
            sys.exit(1)
        return

    # --date 없이 실행 시 (Actions 정기 실행):
    # 1. 오늘 것이 미완성이면 처리 시도
    # 2. 항상 백필 실행 (쿼터 남은 만큼 과거 누락분 처리)
    today = date.today()
    if _needs_processing(DATA_DIR / f"{today.isoformat()}.json"):
        seq_id = find_seq_id(today)
        if seq_id is not None:
            try:
                run(today, dry_run=args.dry_run)
            except QuotaExceededError as e:
                print(f"\n[오류] {e}")
                sys.exit(0)  # 쿼터 소진 → Actions 성공으로 기록, 백필 불필요
            except SystemExit:
                pass  # MBC 파싱 실패 등 → 백필로 이어서

    if not args.no_backfill:
        _backfill(dry_run=args.dry_run)

    _rebuild_index()


if __name__ == "__main__":
    main()
