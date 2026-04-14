import { loadLatest, loadAllDates } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";
import { notFound } from "next/navigation";

export default function ByulbamHub() {
  const latest = loadLatest("byulbam");
  const allDates = loadAllDates("byulbam");

  if (!latest) {
    notFound();
  }

  return <PlaylistView data={latest} allDates={allDates} programName="김이나의 별이 빛나는 밤에" />;
}
