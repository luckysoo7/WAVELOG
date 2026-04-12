import { loadLatest } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";
import { notFound } from "next/navigation";

export default function BcampHub() {
  const latest = loadLatest();

  if (!latest) {
    notFound();
  }

  return <PlaylistView data={latest} label="최신 방송" />;
}
