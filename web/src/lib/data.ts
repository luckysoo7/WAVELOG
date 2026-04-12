import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "..", "data", "archive.db");

function openDb(): Database.Database {
  return new Database(DB_PATH, { readonly: true });
}

export interface Song {
  order: number;
  title: string;
  artist: string;
  videoId: string | null;
  videoTitle: string | null;
  channel: string | null;
  matched: boolean;
}

export interface PlaylistData {
  date: string;
  dayOfWeek: string;
  seqID: number;
  source: string;
  youtube: {
    playlistId: string;
    url: string;
    musicUrl: string;
  } | null;
  songs: Song[];
  createdAt: string;
  matchCount: number;
}

export interface DateEntry {
  date: string;
  dayOfWeek: string;
  songCount: number;
  hasPlaylist: boolean;
}

export function loadPlaylist(dateStr: string): PlaylistData | null {
  const db = openDb();
  try {
    const ep = db
      .prepare("SELECT * FROM episodes WHERE program_id = ? AND date = ?")
      .get("bcamp", dateStr) as Record<string, unknown> | undefined;

    if (!ep) return null;

    const songs = db
      .prepare(
        "SELECT * FROM songs WHERE episode_id = ? ORDER BY order_no"
      )
      .all(ep.id as number) as Record<string, unknown>[];

    const youtube =
      ep.youtube_playlist_id
        ? {
            playlistId: ep.youtube_playlist_id as string,
            url: ep.youtube_url as string,
            musicUrl: ep.youtube_music_url as string,
          }
        : null;

    return {
      date: ep.date as string,
      dayOfWeek: ep.day_of_week as string,
      seqID: ep.seq_id as number,
      source: ep.source as string,
      youtube,
      songs: songs.map((s) => ({
        order: s.order_no as number,
        title: s.title as string,
        artist: s.artist as string,
        videoId: (s.video_id as string | null) ?? null,
        videoTitle: (s.video_title as string | null) ?? null,
        channel: (s.channel as string | null) ?? null,
        matched: Boolean(s.matched),
      })),
      createdAt: ep.created_at as string,
      matchCount: ep.match_count as number,
    };
  } finally {
    db.close();
  }
}

export function loadLatest(): PlaylistData | null {
  const db = openDb();
  try {
    const ep = db
      .prepare(
        "SELECT date FROM episodes WHERE program_id = ? ORDER BY date DESC LIMIT 1"
      )
      .get("bcamp") as { date: string } | undefined;

    if (!ep) return null;
    db.close();
    return loadPlaylist(ep.date);
  } catch {
    db.close();
    return null;
  }
}

export function loadAllDates(): DateEntry[] {
  const db = openDb();
  try {
    const rows = db
      .prepare(
        `SELECT
           e.date,
           e.day_of_week,
           COUNT(s.id)                          AS song_count,
           (e.youtube_playlist_id IS NOT NULL)  AS has_playlist
         FROM episodes e
         LEFT JOIN songs s ON s.episode_id = e.id
         WHERE e.program_id = ?
         GROUP BY e.id
         ORDER BY e.date DESC`
      )
      .all("bcamp") as Record<string, unknown>[];

    return rows.map((r) => ({
      date: r.date as string,
      dayOfWeek: r.day_of_week as string,
      songCount: r.song_count as number,
      hasPlaylist: Boolean(r.has_playlist),
    }));
  } finally {
    db.close();
  }
}

export function getAllDateParams(): { date: string }[] {
  const db = openDb();
  try {
    const rows = db
      .prepare(
        "SELECT date FROM episodes WHERE program_id = ? ORDER BY date DESC"
      )
      .all("bcamp") as { date: string }[];
    return rows.map((r) => ({ date: r.date }));
  } finally {
    db.close();
  }
}
