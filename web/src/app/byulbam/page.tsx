import type { Metadata } from "next";
import { loadLatest, loadAllDates } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "김이나의 별이 빛나는 밤에 선곡표",
  description: "김이나의 별이 빛나는 밤에 날짜별 선곡표 아카이브. 매일 밤 8시 방송, 선곡을 YouTube 플레이리스트로 기록합니다.",
};

export default function ByulbamHub() {
  const latest = loadLatest("byulbam");
  const allDates = loadAllDates("byulbam");

  if (!latest) {
    notFound();
  }

  return <PlaylistView data={latest} allDates={allDates} programName="김이나의 별이 빛나는 밤에" />;
}
