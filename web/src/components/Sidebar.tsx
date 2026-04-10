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
      {/* 브랜드 */}
      <div className="mb-8 px-2">
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          Bae Chulsoo
        </p>
        <p className="font-bold text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>
          음악캠프
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

      {/* 푸터 */}
      <div className="mt-6 px-2">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
          비공식 팬 서비스
          <br />
          MBC와 무관합니다
        </p>
      </div>
    </nav>
  );
}
