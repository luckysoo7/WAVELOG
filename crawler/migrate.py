"""data/bcamp/*.json → archive.db 마이그레이션.

Usage:
    python -m crawler.migrate

idempotent: 이미 DB에 있는 날짜는 건너뜀 (누락분만 INSERT).
"""

import json
import sys
from pathlib import Path

from crawler.db import DB_PATH, connect, init_db, insert_episode

_BCAMP_DIR = Path(__file__).resolve().parent.parent / "data" / "bcamp"
_PROGRAM_ID = "bcamp"


def _load_json(path: Path) -> dict | None:
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"  [경고] {path.name} 손상 — 건너뜀")
        return None


def main() -> None:
    json_files = sorted(_BCAMP_DIR.glob("????-??-??.json"))
    if not json_files:
        print(f"[migrate] {_BCAMP_DIR} 에 JSON 파일 없음 — 종료")
        sys.exit(0)

    print(f"[migrate] DB 초기화: {DB_PATH}")
    init_db(DB_PATH)

    conn = connect(DB_PATH)
    inserted = 0
    skipped = 0
    total_songs = 0

    # 이미 DB에 있는 날짜 목록을 미리 수집해 루프에서 확인
    existing = {
        row[0]
        for row in conn.execute(
            "SELECT date FROM episodes WHERE program_id=?", (_PROGRAM_ID,)
        )
    }

    for path in json_files:
        data = _load_json(path)
        if data is None:
            skipped += 1
            continue

        date_str = data.get("date", path.stem)

        if date_str in existing:
            skipped += 1
            continue

        songs = data.get("songs", [])
        insert_episode(conn, _PROGRAM_ID, data, songs)
        inserted += 1
        total_songs += len(songs)
        print(f"  ✓ {date_str}  ({len(songs)}곡)")

    conn.close()

    print(
        f"\n[migrate] 완료 — "
        f"{inserted}개 에피소드, {total_songs}개 곡 마이그레이션 완료 "
        f"(건너뜀: {skipped})"
    )


if __name__ == "__main__":
    main()
