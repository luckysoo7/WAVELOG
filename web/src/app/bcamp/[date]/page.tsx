import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPlaylist, getAllDateParams, loadAllDates } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";

export function generateStaticParams() {
  return getAllDateParams();
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const data = loadPlaylist(date);
  if (!data) return {};

  const [, m, d] = date.split("-");
  const title = `배철수의 음악캠프 ${+m}월 ${+d}일 — ${data.songs.length}곡`;
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
      url: `/bcamp/${date}`,
    },
  };
}

export default async function BcampEpisodePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const data = loadPlaylist(date);
  const allDates = loadAllDates("bcamp");

  if (!data) {
    notFound();
  }

  return <PlaylistView data={data} allDates={allDates} />;
}
