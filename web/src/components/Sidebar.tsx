"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DateEntry } from "@/lib/data";

interface SidebarProps {
  dates: DateEntry[];
}

function formatSidebarDate(dateStr: string, dayOfWeek: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}/${+d} ${dayOfWeek.charAt(0)}`;
}

export default function Sidebar({ dates }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full px-4 py-8">
      {/* 대문 — 서비스 정체성 */}
      <div className="mb-6 px-2">
        {/* 홈 링크 */}
        <Link
          href="/"
          className="flex items-center gap-1.5 mb-5 group"
          style={{ color: pathname === "/" ? "var(--sunset-orange)" : "var(--text-muted)", opacity: pathname === "/" ? 1 : 0.5 }}
        >
          <span className="text-xs">←</span>
          <span className="text-xs tracking-[0.18em] uppercase font-semibold transition-opacity group-hover:opacity-100">
            Korean Radio Archive
          </span>
        </Link>

        {/* 라디오 레이블 */}
        <p
          className="text-xs tracking-[0.22em] uppercase font-semibold mb-4"
          style={{ color: "var(--sunset-orange)" }}
        >
          Radio Station
        </p>

        {/* 프로그램 타이틀 */}
        <h2
          className="font-black leading-none mb-1"
          style={{ fontSize: "1.45rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
        >
          배철수의
          <br />
          음악캠프
        </h2>
        <p className="text-xs mt-1 mb-5 tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.55 }}>
          MBC FM4U 91.9 · 매일 저녁 6시
        </p>

        {/* 구분선 */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: "1.25rem" }} />

        {/* 서비스 소개 */}
        <p
          className="text-xs leading-relaxed mb-4"
          style={{ color: "var(--text-muted)", lineHeight: "1.7" }}
        >
          1990년부터 이어진 라디오 선곡표를
          <br />
          매일 YouTube 플레이리스트로.
          <br />
          <span style={{ opacity: 0.55 }}>배철수가 고른 오늘의 음악들.</span>
        </p>

        {/* unofficial 배지 */}
        <span
          className="inline-block text-xs px-2 py-0.5"
          style={{
            border: "1px solid rgba(138,155,176,0.2)",
            color: "var(--text-muted)",
            opacity: 0.55,
            borderRadius: "2px",
            fontSize: "0.65rem",
            letterSpacing: "0.08em",
          }}
        >
          unofficial fan site
        </span>
      </div>

      {/* 날짜 목록 */}
      <ul className="space-y-1 flex-1 overflow-y-auto">
        {dates.map((entry, i) => {
          const href = i === 0 ? "/bcamp" : `/bcamp/${entry.date}`;
          const isActive =
            i === 0
              ? pathname === "/bcamp"
              : pathname === `/bcamp/${entry.date}`;

          return (
            <li key={entry.date}>
              <Link
                href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all"
                style={
                  isActive
                    ? {
                        background: "rgba(232, 112, 74, 0.15)",
                        color: "var(--sunset-orange)",
                      }
                    : {
                        color: "var(--text-muted)",
                      }
                }
              >
                <div className="flex items-center gap-2 min-w-0">
                  {i === 0 && (
                    <span
                      className="shrink-0 font-semibold rounded-full"
                      style={{
                        background: "var(--sunset-orange)",
                        color: "#fff",
                        fontSize: "9px",
                        padding: "1px 6px",
                      }}
                    >
                      NEW
                    </span>
                  )}
                  <span className="truncate font-medium tabular-nums">
                    {formatSidebarDate(entry.date, entry.dayOfWeek)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {entry.songCount}
                  </span>
                  {entry.hasPlaylist && (
                    <span style={{ color: "var(--sunset-orange)", fontSize: "9px" }}>▶</span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* 저작권 고지 */}
      <div className="mt-6 px-2 space-y-1">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.55 }}>
          ⓒ MBC · 배철수의 음악캠프
          <br />
          방송 콘텐츠 저작권은 MBC에 있습니다
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.35 }}>
          unofficial fan site — not affiliated with MBC
        </p>
      </div>
    </nav>
  );
}
