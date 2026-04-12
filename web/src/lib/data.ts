import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "..", "data", "bcamp");

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

function listJsonFiles(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort()
    .reverse();
}

export function loadPlaylist(dateStr: string): PlaylistData | null {
  const filePath = path.join(DATA_DIR, `${dateStr}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as PlaylistData;
}

export function loadLatest(): PlaylistData | null {
  const files = listJsonFiles();
  if (files.length === 0) return null;
  return loadPlaylist(files[0].replace(".json", ""));
}

export function loadAllDates(): DateEntry[] {
  const indexPath = path.join(DATA_DIR, "index.json");
  if (fs.existsSync(indexPath)) {
    return JSON.parse(fs.readFileSync(indexPath, "utf-8")) as DateEntry[];
  }
  // index.json 없으면 개별 파일 폴백 (초기 구동 시)
  return listJsonFiles().map((f) => {
    const data = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, f), "utf-8")
    ) as PlaylistData;
    return {
      date: data.date,
      dayOfWeek: data.dayOfWeek,
      songCount: data.songs.length,
      hasPlaylist: !!data.youtube,
    };
  });
}

export function getAllDateParams(): { date: string }[] {
  return listJsonFiles().map((f) => ({ date: f.replace(".json", "") }));
}
