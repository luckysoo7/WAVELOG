import { loadLatest } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";
import { notFound } from "next/navigation";

export default function ByulbamHub() {
  const latest = loadLatest("byulbam");

  if (!latest) {
    notFound();
  }

  return <PlaylistView data={latest} label="최신 방송" programName="별이 빛나는 밤에" />;
}
