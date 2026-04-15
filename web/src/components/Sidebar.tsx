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
  basePath: string;
  officialUrl: string;
  dates: DateEntry[];
  accent: string;
  accentBg: string;
  newBadgeBg: string;
  newBadgeColor: string;
}

function formatSidebarDate(dateStr: string, dayOfWeek: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}/${+d} ${dayOfWeek.charAt(0)}`;
}

const PROGRAMS: Record<string, ProgramConfig> = {
  byulbam: {
    id: "byulbam",
    name: "김이나의 별이 빛나는 밤에",
    nameShort: "김이나의\n별이 빛나는 밤에",
    freq: "매일 밤 8시 · since 1969",
    basePath: "/byulbam",
    officialUrl: "https://www.imbc.com/broad/radio/fm4u/starnight/",
    accent: "#c4a84e",
    accentBg: "rgba(196,168,78,0.15)",
    newBadgeBg: "#c4a84e",
    newBadgeColor: "#1a1408",
    dates: [],
  },
  bcamp: {
    id: "bcamp",
    name: "배철수의 음악캠프",
    nameShort: "배철수의\n음악캠프",
    freq: "매일 저녁 6시 · since 1990",
    basePath: "/bcamp",
    officialUrl: "https://www.imbc.com/broad/radio/fm4u/musiccamp/",
    accent: "#e8704a",
    accentBg: "rgba(232,112,74,0.15)",
    newBadgeBg: "#e8704a",
    newBadgeColor: "#fff",
    dates: [],
  },
};

export default function Sidebar({ bcampDates, byulbamDates }: SidebarProps) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLLIElement>(null);

  const isByulbam = pathname.startsWith("/byulbam");
  const programId = isByulbam ? "byulbam" : "bcamp";
  const program = {
    ...PROGRAMS[programId],
    dates: isByulbam ? byulbamDates : bcampDates,
  };
  const { accent, accentBg, newBadgeBg, newBadgeColor } = program;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <nav className="flex flex-col h-full px-4 py-8">
      {/* 홈 링크 */}
      <div className="mb-5 px-2">
        <Link
          href="/"
          className="flex items-center gap-2 group"
          style={{ textDecoration: "none" }}
        >
          <span
            className="text-base transition-opacity group-hover:opacity-70"
            style={{ color: "var(--text-muted)", opacity: 0.6, lineHeight: 1 }}
          >
            ⌂
          </span>
          <span
            className="font-bold tracking-tight transition-opacity group-hover:opacity-100"
            style={{ color: "var(--text-primary)", opacity: 0.85, fontSize: "0.82rem", letterSpacing: "-0.01em" }}
          >
            Wavelog
          </span>
        </Link>
      </div>

      {/* 프로그램 스위처 탭 */}
      <div
        className="mb-5 p-1 flex gap-1 rounded-lg"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        {(["bcamp", "byulbam"] as const).map((id) => {
          const p = PROGRAMS[id];
          const isActive = programId === id;
          return (
            <Link
              key={id}
              href={p.basePath}
              className="flex-1 text-center rounded-md py-1.5 text-xs font-semibold transition-all"
              style={
                isActive
                  ? { background: `${p.accent}22`, color: p.accent }
                  : { color: "var(--text-muted)", opacity: 0.45 }
              }
            >
              {id === "bcamp" ? "배캠" : "별밤"}
            </Link>
          );
        })}
      </div>

      {/* 프로그램 정보 */}
      <div className="mb-4 px-2">
        <h2
          className="font-black leading-none mb-1 whitespace-pre-line"
          style={{ fontSize: "1.25rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
        >
          {program.nameShort}
        </h2>
        <p
          className="text-xs mt-1 mb-4"
          style={{ color: "var(--text-muted)", opacity: 0.45 }}
        >
          {program.freq}
        </p>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: "1rem" }} />

        <span
          className="inline-block text-xs px-2 py-0.5"
          style={{
            border: "1px solid rgba(138,155,176,0.2)",
            color: "var(--text-muted)",
            opacity: 0.45,
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
          const year = entry.date.slice(0, 4);
          const prevYear = i > 0 ? program.dates[i - 1].date.slice(0, 4) : null;
          const showYearDivider = year !== prevYear; // i===0 포함 (첫 항목도 연도 표시)

          return (
            <li key={entry.date} ref={isActive ? activeRef : null}>
              {showYearDivider && (
                <div
                  className="flex items-center gap-2 px-3 pt-3 pb-1"
                >
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: accent,
                      opacity: 0.55,
                    }}
                  >
                    {year}
                  </span>
                  <div style={{ flex: 1, height: "1px", background: `${accent}22` }} />
                </div>
              )}
              <Link
                href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all"
                style={
                  isActive
                    ? { background: accentBg, color: accent }
                    : { color: "var(--text-muted)" }
                }
              >
                <div className="flex items-center gap-2 min-w-0">
                  {i === 0 && (
                    <span
                      className="shrink-0 font-semibold rounded-full"
                      style={{
                        background: newBadgeBg,
                        color: newBadgeColor,
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
                    <span style={{ color: accent, fontSize: "9px" }}>▶</span>
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

      {/* 저작권 */}
      <div className="mt-6 px-2 space-y-1">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.45 }}>
          ⓒ MBC · {program.name}
          <br />
          방송 콘텐츠 저작권은 MBC에 있습니다
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.3 }}>
          unofficial fan site — not affiliated with MBC
        </p>
        <a
          href={program.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs block"
          style={{ color: "var(--text-muted)", opacity: 0.4, textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}
        >
          공식 홈페이지 ↗
        </a>
      </div>
    </nav>
  );
}
