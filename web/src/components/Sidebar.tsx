"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DateEntry } from "@/lib/data";

interface SidebarProps {
  dates: DateEntry[];
}

export default function Sidebar({ dates }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full px-4 py-8">
      {/* 브랜드 로고 */}
      <div className="mb-8 px-2">
        <img
          src="/logo.png"
          alt="배철수의 음악캠프"
          className="w-28 mb-1 opacity-90"
          style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.4))" }}
        />
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          playlist archive
        </p>
      </div>

      {/* 날짜 목록 */}
      <ul className="space-y-1 flex-1 overflow-y-auto">
        {dates.map((entry, i) => {
          const href = i === 0 ? "/" : `/date/${entry.date}`;
          const isActive = i === 0 ? pathname === "/" : pathname === `/date/${entry.date}`;

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
                      className="shrink-0 text-xs px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        background: "var(--sunset-orange)",
                        color: "#fff",
                        fontSize: "10px",
                      }}
                    >
                      NEW
                    </span>
                  )}
                  <span className="truncate font-medium">{entry.date}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {entry.songCount}곡
                  </span>
                  {entry.hasPlaylist && (
                    <span style={{ color: "var(--sunset-orange)", fontSize: "10px" }}>▶</span>
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
