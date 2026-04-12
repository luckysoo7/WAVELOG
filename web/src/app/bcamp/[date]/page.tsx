import { notFound } from "next/navigation";
import { loadPlaylist, getAllDateParams } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";

export function generateStaticParams() {
  return getAllDateParams();
}

export default async function BcampEpisodePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const data = loadPlaylist(date);

  if (!data) {
    notFound();
  }

  return <PlaylistView data={data} />;
}
