"""MBC 선곡표 크롤러 — YouTube API 없이 DB에만 저장.

bcamp / byulbam 두 프로그램을 하나의 엔트리포인트로 통합.
YouTube 매핑은 match.py 가 별도 담당 → 크롤 실패와 매핑 실패를 완전 분리.

Usage:
    python -m crawler.crawl --program bcamp
    python -m crawler.crawl --program byulbam
    python -m crawler.crawl --program all          # 두 프로그램 동시
    python -m crawler.crawl --program bcamp --date 2026-04-12
    python -m crawler.crawl --program bcamp --backfill-days 30
"""

import argparse
import datetime as dt
import sys
from datetime import date, timedelta
from pathlib import Path

from crawler.db import DB_PATH, connect, init_db, insert_episode, episode_exists
import crawler.mbc_crawler as _bcamp
import crawler.byulbam_crawler as _byulbam

_PROGRAMS = {
    "bcamp": {
        "id":             "bcamp",
        "find_seq_id":    _bcamp.find_seq_id,
        "fetch_songs":    _bcamp.fetch_songs,
        "get_source_url": _bcamp.get_source_url,
    },
    "byulbam": {
        "id":             "byulbam",
        "find_seq_id":    _byulbam.find_seq_id,
        "fetch_songs":    _byulbam.fetch_songs,
        "get_source_url": _byulbam.get_source_url,
    },
}


from crawler.utils import day_of_week_ko as _day_of_week_ko


def crawl_one(program_id: str, target_date: date) -> bool:
    """단일 에피소드 MBC 크롤 → DB 저장 (이미 존재하면 스킵).

    Returns: True = 새로 저장, False = 스킵 or 실패
    """
    date_str = target_date.isoformat()
    prog = _PROGRAMS[program_id]

    conn = connect(DB_PATH)
    exists = episode_exists(conn, program_id, date_str)
    conn.close()

    if exists:
        print(f"[{program_id}] {date_str} — 이미 존재, 스킵")
        return False

    print(f"[{program_id}] {date_str} — 크롤 시작")

    seq_id = prog["find_seq_id"](target_date)
    if seq_id is None:
        print(f"[{program_id}] {date_str} — MBC에서 seqID 없음, 아직 업로드 전")
        return False

    songs = prog["fetch_songs"](seq_id)
    if not songs:
        print(f"[{program_id}] {date_str} — 곡 목록 파싱 실패")
        return False

    print(f"[{program_id}] {date_str} — {len(songs)}곡 파싱 완료")

    episode = {
        "date":       date_str,
        "dayOfWeek":  _day_of_week_ko(target_date),
        "seqID":      seq_id,
        "source":     prog["get_source_url"](seq_id),
        "youtube":    None,  # match.py 가 채움
        "createdAt":  dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "matchCount": 0,
    }

    init_db(DB_PATH)
    conn = connect(DB_PATH)
    insert_episode(conn, program_id, episode, songs)
    conn.close()
    print(f"[{program_id}] {date_str} — DB 저장 완료 ({len(songs)}곡)")
    return True


def crawl_program(program_id: str, target_date: date | None, backfill_days: int) -> None:
    """단일 프로그램 크롤: 지정 날짜 or 오늘 + backfill."""
    if target_date:
        crawl_one(program_id, target_date)
        return

    today = date.today()
    saved = crawl_one(program_id, today)

    # 어제도 시도 (방송 직후 실행 시 오늘 날짜가 아직 안 올라온 경우 대비)
    if not saved:
        crawl_one(program_id, today - timedelta(days=1))

    # 백필: DB에 없는 날짜만
    for offset in range(2, backfill_days + 1):
        candidate = today - timedelta(days=offset)
        crawl_one(program_id, candidate)
        # 주의: crawl_one은 이미 존재하면 False — 오래된 날짜 많으면 빠르게 스킵


def main() -> None:
    parser = argparse.ArgumentParser(description="MBC 선곡표 크롤러 (YouTube 없음)")
    parser.add_argument(
        "--program", choices=["bcamp", "byulbam", "all"], default="all",
        help="크롤할 프로그램 (기본: all)",
    )
    parser.add_argument("--date", help="특정 날짜만 크롤 (YYYY-MM-DD)")
    parser.add_argument(
        "--backfill-days", type=int, default=30,
        help="백필 범위 (기본: 30일)",
    )
    args = parser.parse_args()

    target_date = None
    if args.date:
        try:
            target_date = date.fromisoformat(args.date)
        except ValueError:
            print(f"[오류] 날짜 형식이 올바르지 않습니다: {args.date}")
            sys.exit(1)

    programs = ["bcamp", "byulbam"] if args.program == "all" else [args.program]
    for prog in programs:
        crawl_program(prog, target_date, args.backfill_days)


if __name__ == "__main__":
    main()
