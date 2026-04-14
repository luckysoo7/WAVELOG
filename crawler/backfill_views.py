"""조회수 백필 — DB에 video_id가 있는 모든 곡의 view_count를 채운다.

YouTube videos.list?part=statistics 를 50개씩 배치 호출.
50곡당 1 unit → 286곡 기준 약 6 unit 소모.

Usage:
    python -m crawler.backfill_views
"""

from crawler.db import DB_PATH, connect, init_db
from crawler.utils import get_youtube_client as _get_youtube_client
from crawler.youtube_client import get_video_stats


def main() -> None:
    init_db(DB_PATH)
    conn = connect(DB_PATH)

    # video_id가 있는 모든 고유 video_id 수집
    rows = conn.execute(
        "SELECT DISTINCT video_id FROM songs WHERE video_id IS NOT NULL"
    ).fetchall()
    video_ids = [r["video_id"] for r in rows]
    conn.close()

    if not video_ids:
        print("[backfill_views] 처리할 곡 없음.")
        return

    print(f"[backfill_views] {len(video_ids)}개 video_id 조회수 fetch 시작...")
    youtube = _get_youtube_client()

    stats = get_video_stats(youtube, video_ids)
    print(f"[backfill_views] {len(stats)}개 응답 수신.")

    if not stats:
        print("[backfill_views] 조회수 데이터 없음. 종료.")
        return

    # video_id 기준으로 모든 songs 행 업데이트
    conn = connect(DB_PATH)
    updated = 0
    with conn:
        for vid, vc in stats.items():
            result = conn.execute(
                "UPDATE songs SET view_count = ? WHERE video_id = ?",
                (vc, vid),
            )
            updated += result.rowcount
    conn.close()

    print(f"[backfill_views] 완료 — {updated}행 업데이트됨.")


if __name__ == "__main__":
    main()
