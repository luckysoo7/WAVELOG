"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { DateEntry } from "@/lib/data";

interface SidebarProps {
  bcampDates: DateEntry[];
  byulbamDates: DateEntry[];
}

interface ProgramConfig {
  id: string;
  name: string;
  nameShort: string;
  freq: string;
  schedule: string;
  basePath: string;
  dates: DateEntry[];
}

function formatSidebarDate(dateStr: string, dayOfWeek: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}/${+d} ${dayOfWeek.charAt(0)}`;
}

export default function Sidebar({ bcampDates, byulbamDates }: SidebarProps) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLLIElement>(null);

  const isByulbam = pathname.startsWith("/byulbam");

  const program: ProgramConfig = isByulbam
    ? {
        id: "byulbam",
        name: "별이 빛나는 밤에",
        nameShort: "별이 빛나는\n밤에",
        freq: "MBC FM4U 91.9 · 매일 밤 10시",
        schedule: "1969년~ · 매일 밤 10시",
        basePath: "/byulbam",
        dates: byulbamDates,
      }
    : {
        id: "bcamp",
        name: "배철수의 음악캠프",
        nameShort: "배철수의\n음악캠프",
        freq: "MBC FM4U 91.9 · 매일 저녁 6시",
        schedule: "1990년~ · 매일 저녁 6시",
        basePath: "/bcamp",
        dates: bcampDates,
      };

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <nav className="flex flex-col h-full px-4 py-8">
      {/* 대문 — 서비스 정체성 */}
      <div className="mb-6 px-2">
        {/* 홈 링크 */}
        <Link
          href="/"
          className="flex items-center gap-1.5 mb-5 group"
          style={{
            color: pathname === "/" ? "var(--sunset-orange)" : "var(--text-muted)",
            opacity: pathname === "/" ? 1 : 0.5,
          }}
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
          className="font-black leading-none mb-1 whitespace-pre-line"
          style={{ fontSize: "1.45rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
        >
          {program.nameShort}
        </h2>
        <p
          className="text-xs mt-1 mb-5 tracking-widest"
          style={{ color: "var(--text-muted)", opacity: 0.55 }}
        >
          {program.freq}
        </p>

        {/* 구분선 */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: "1.25rem" }} />

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
        {program.dates.map((entry, i) => {
          const href = i === 0 ? program.basePath : `${program.basePath}/${entry.date}`;
          const isActive =
            i === 0
              ? pathname === program.basePath
              : pathname === `${program.basePath}/${entry.date}`;

          return (
            <li key={entry.date} ref={isActive ? activeRef : null}>
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

        {program.dates.length === 0 && (
          <li className="px-3 py-4">
            <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
              아직 에피소드가 없습니다
            </p>
          </li>
        )}
      </ul>

      {/* 저작권 고지 */}
      <div className="mt-6 px-2 space-y-1">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.55 }}>
          ⓒ MBC · {program.name}
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
