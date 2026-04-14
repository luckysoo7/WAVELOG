import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPlaylist, getAllDateParams, loadAllDates } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";

export function generateStaticParams() {
  return getAllDateParams("byulbam");
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const data = loadPlaylist(date, "byulbam");
  if (!data) return {};

  const [, m, d] = date.split("-");
  const title = `별이 빛나는 밤에 ${+m}월 ${+d}일 — ${data.songs.length}곡`;
  const description = data.songs
    .slice(0, 5)
    .map((s) => `${s.title} — ${s.artist}`)
    .join(", ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/byulbam/${date}`,
    },
  };
}

export default async function ByulbamEpisodePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const data = loadPlaylist(date, "byulbam");
  const allDates = loadAllDates("byulbam");

  if (!data) {
    notFound();
  }

  return <PlaylistView data={data} allDates={allDates} programName="김이나의 별이 빛나는 밤에" />;
}
