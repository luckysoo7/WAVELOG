import type { Metadata } from "next";
import { loadLatest, loadAllDates } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "배철수의 음악캠프 선곡표",
  description: "배철수의 음악캠프 날짜별 선곡표 아카이브. 매일 저녁 6시 방송, 선곡을 YouTube 플레이리스트로 기록합니다.",
};

export default function BcampHub() {
  const latest = loadLatest();
  const allDates = loadAllDates("bcamp");

  if (!latest) {
    notFound();
  }

  return <PlaylistView data={latest} allDates={allDates} />;
}
