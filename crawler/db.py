"""SQLite 데이터베이스 접근 레이어.

archive.db 스키마 초기화, 에피소드/곡 CRUD, 조회 함수 제공.
모든 연산은 context manager (with conn:) 로 트랜잭션 보장.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "archive.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS programs (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  freq       TEXT,
  start_year INTEGER,
  active     INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS episodes (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id           TEXT    NOT NULL REFERENCES programs(id),
  date                 TEXT    NOT NULL,
  day_of_week          TEXT    NOT NULL,
  seq_id               INTEGER,
  source               TEXT,
  youtube_playlist_id  TEXT,
  youtube_url          TEXT,
  youtube_music_url    TEXT,
  match_count          INTEGER DEFAULT 0,
  created_at           TEXT,
  UNIQUE(program_id, date)
);

CREATE TABLE IF NOT EXISTS songs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id  INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  order_no    INTEGER NOT NULL,
  title       TEXT    NOT NULL,
  artist      TEXT    NOT NULL,
  video_id    TEXT,
  video_title TEXT,
  channel     TEXT,
  matched     INTEGER DEFAULT 0,
  genre       TEXT,
  year        INTEGER,
  play_count  INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_episodes_date    ON episodes(date);
CREATE INDEX IF NOT EXISTS idx_episodes_program ON episodes(program_id);
CREATE INDEX IF NOT EXISTS idx_songs_episode    ON songs(episode_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist     ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_title      ON songs(title);
"""

_BCAMP_SEED = {
    "id": "bcamp",
    "name": "배철수의 음악캠프",
    "slug": "bcamp",
    "freq": "FM 95.9MHz",
    "start_year": 1990,
    "active": 1,
}


def connect(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """WAL 모드 활성화된 커넥션 반환."""
    try:
        conn = sqlite3.connect(db_path)
    except sqlite3.OperationalError as e:
        raise RuntimeError(f"[DB] 연결 실패: {db_path}\n원인: {e}") from e
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db(db_path: Path = DB_PATH) -> None:
    """스키마 생성 + bcamp 초기 레코드 upsert."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = connect(db_path)
    with conn:
        conn.executescript(_SCHEMA)
        conn.execute(
            """
            INSERT INTO programs (id, name, slug, freq, start_year, active)
            VALUES (:id, :name, :slug, :freq, :start_year, :active)
            ON CONFLICT(id) DO UPDATE SET
                name       = excluded.name,
                slug       = excluded.slug,
                freq       = excluded.freq,
                start_year = excluded.start_year,
                active     = excluded.active
            """,
            _BCAMP_SEED,
        )
    conn.close()


def insert_episode(
    conn: sqlite3.Connection,
    program_id: str,
    episode: dict,
    songs: list[dict],
) -> None:
    """에피소드 + 곡 목록 INSERT.

    이미 존재하는 날짜면 youtube 정보와 match_count만 UPDATE.
    songs는 episode가 youtube 없는 상태로 먼저 저장됐다가 나중에
    youtube가 채워지는 경우를 위해 항상 교체(DELETE + INSERT).
    """
    yt = episode.get("youtube") or {}
    with conn:
        conn.execute(
            """
            INSERT INTO episodes
              (program_id, date, day_of_week, seq_id, source,
               youtube_playlist_id, youtube_url, youtube_music_url,
               match_count, created_at)
            VALUES
              (:program_id, :date, :day_of_week, :seq_id, :source,
               :yt_playlist_id, :yt_url, :yt_music_url,
               :match_count, :created_at)
            ON CONFLICT(program_id, date) DO UPDATE SET
                youtube_playlist_id = excluded.youtube_playlist_id,
                youtube_url         = excluded.youtube_url,
                youtube_music_url   = excluded.youtube_music_url,
                match_count         = excluded.match_count
            """,
            {
                "program_id":    program_id,
                "date":          episode["date"],
                "day_of_week":   episode["dayOfWeek"],
                "seq_id":        episode.get("seqID"),
                "source":        episode.get("source"),
                "yt_playlist_id": yt.get("playlistId"),
                "yt_url":        yt.get("url"),
                "yt_music_url":  yt.get("musicUrl"),
                "match_count":   episode.get("matchCount", 0),
                "created_at":    episode.get("createdAt"),
            },
        )
        row = conn.execute(
            "SELECT id FROM episodes WHERE program_id=? AND date=?",
            (program_id, episode["date"]),
        ).fetchone()
        episode_id = row["id"]

        # 곡 목록 교체 — 매번 재매칭 결과를 덮어쓸 수 있도록
        conn.execute("DELETE FROM songs WHERE episode_id=?", (episode_id,))
        conn.executemany(
            """
            INSERT INTO songs
              (episode_id, order_no, title, artist,
               video_id, video_title, channel, matched)
            VALUES
              (:episode_id, :order_no, :title, :artist,
               :video_id, :video_title, :channel, :matched)
            """,
            [
                {
                    "episode_id":  episode_id,
                    "order_no":    s["order"],
                    "title":       s["title"],
                    "artist":      s["artist"],
                    "video_id":    s.get("videoId"),
                    "video_title": s.get("videoTitle"),
                    "channel":     s.get("channel"),
                    "matched":     1 if s.get("matched") else 0,
                }
                for s in songs
            ],
        )


def get_episode(
    conn: sqlite3.Connection,
    program_id: str,
    date: str,
) -> dict | None:
    """에피소드 + 곡 목록을 기존 PlaylistData JSON 구조와 동일하게 반환."""
    ep = conn.execute(
        "SELECT * FROM episodes WHERE program_id=? AND date=?",
        (program_id, date),
    ).fetchone()
    if ep is None:
        return None

    rows = conn.execute(
        "SELECT * FROM songs WHERE episode_id=? ORDER BY order_no",
        (ep["id"],),
    ).fetchall()

    yt = None
    if ep["youtube_playlist_id"]:
        yt = {
            "playlistId": ep["youtube_playlist_id"],
            "url":        ep["youtube_url"],
            "musicUrl":   ep["youtube_music_url"],
        }

    return {
        "date":       ep["date"],
        "dayOfWeek":  ep["day_of_week"],
        "seqID":      ep["seq_id"],
        "source":     ep["source"],
        "youtube":    yt,
        "matchCount": ep["match_count"],
        "createdAt":  ep["created_at"],
        "songs": [
            {
                "order":      r["order_no"],
                "title":      r["title"],
                "artist":     r["artist"],
                "videoId":    r["video_id"],
                "videoTitle": r["video_title"],
                "channel":    r["channel"],
                "matched":    bool(r["matched"]),
            }
            for r in rows
        ],
    }


def get_all_dates(conn: sqlite3.Connection, program_id: str) -> list[dict]:
    """index.json 대체: [{date, dayOfWeek, songCount, hasPlaylist}] 반환."""
    rows = conn.execute(
        """
        SELECT
            e.date,
            e.day_of_week,
            COUNT(s.id)                       AS song_count,
            (e.youtube_playlist_id IS NOT NULL) AS has_playlist
        FROM episodes e
        LEFT JOIN songs s ON s.episode_id = e.id
        WHERE e.program_id = ?
        GROUP BY e.id
        ORDER BY e.date DESC
        """,
        (program_id,),
    ).fetchall()
    return [
        {
            "date":        r["date"],
            "dayOfWeek":   r["day_of_week"],
            "songCount":   r["song_count"],
            "hasPlaylist": bool(r["has_playlist"]),
        }
        for r in rows
    ]


def get_latest_date(conn: sqlite3.Connection, program_id: str) -> str | None:
    """가장 최신 date 반환. 에피소드 없으면 None."""
    row = conn.execute(
        "SELECT date FROM episodes WHERE program_id=? ORDER BY date DESC LIMIT 1",
        (program_id,),
    ).fetchone()
    return row["date"] if row else None


def get_playlist_ids(
    conn: sqlite3.Connection,
    program_id: str,
) -> list[tuple[str, str]]:
    """validate.py용: [(date, playlist_id)] 반환. playlist 없는 날짜 제외."""
    rows = conn.execute(
        """
        SELECT date, youtube_playlist_id
        FROM episodes
        WHERE program_id=? AND youtube_playlist_id IS NOT NULL
        ORDER BY date DESC
        """,
        (program_id,),
    ).fetchall()
    return [(r["date"], r["youtube_playlist_id"]) for r in rows]
