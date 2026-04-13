import { loadLatest, loadAllDates } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";
import { notFound } from "next/navigation";

export default function BcampHub() {
  const latest = loadLatest();
  const allDates = loadAllDates("bcamp");

  if (!latest) {
    notFound();
  }

  return <PlaylistView data={latest} allDates={allDates} />;
}
