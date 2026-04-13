"use client";

import { useState } from "react";
import type { PlaylistData } from "@/lib/data";

interface Props {
  data: PlaylistData;
  label?: string;
  programName?: string;
}

// 프로그램별 테마
const THEMES = {
  byulbam: {
    accent: "#c4a84e",
    heroImage: "/byulbam-hero.png",
    heroPosition: "center top",
    label: "Radio Station · MBC FM4U 91.9",
    gradientFrom: "rgba(196, 168, 78, 0.18)",
    gradientTo: "rgba(10, 28, 20, 0.0)",
  },
  bcamp: {
    accent: "#e8704a",
    heroImage: "/bcamp-hero.png",
    heroPosition: "center top",
    label: "Radio Station · MBC FM4U 91.9",
    gradientFrom: "rgba(232, 112, 74, 0.18)",
    gradientTo: "rgba(15, 25, 35, 0.0)",
  },
} as const;

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

function spectrumColor(order: number, total: number, accent: string): string {
  // 별밤은 골드~크림, 배캠은 기존 스펙트럼
  if (accent === THEMES.byulbam.accent) {
    // 딥 블루-그린 → 골드 → 크림 앰버 (밤하늘 스펙트럼)
    const hue = Math.round(195 - ((order - 1) / Math.max(total - 1, 1)) * 155);
    return `hsl(${hue}, 60%, 62%)`;
  }
  const hue = Math.round(((order - 1) / Math.max(total - 1, 1)) * 220);
  return `hsl(${hue}, 75%, 62%)`;
}

function isTouchDevice(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
}

export default function PlaylistView({ data, programName = "배철수의 음악캠프" }: Props) {
  const total = data.songs.length;
  const matchedCount = data.songs.filter((s) => s.videoId).length;
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isbyulbam = programName === "별이 빛나는 밤에";
  const theme = isbyulbam ? THEMES.byulbam : THEMES.bcamp;
  const accent = theme.accent;

  const handleMouseEnter = (order: number) => {
    if (!isTouchDevice()) setExpandedId(order);
  };
  const handleMouseLeave = () => {
    if (!isTouchDevice()) setExpandedId(null);
  };
  const handleClick = (order: number) => {
    if (isTouchDevice()) {
      setExpandedId((prev) => (prev === order ? null : order));
    }
  };

  return (
    <article>
      {/* ── 히어로 배너 ──────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(160px, 28vw, 280px)",
          overflow: "hidden",
        }}
      >
        {/* 배경 이미지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.heroImage}
          alt={programName}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: theme.heroPosition,
            filter: "brightness(0.72) saturate(1.1)",
          }}
        />

        {/* 좌우 vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(15,25,35,0.55) 0%, transparent 30%, transparent 70%, rgba(15,25,35,0.55) 100%)",
          }}
        />

        {/* 상단 fade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(15,25,35,0.3) 0%, transparent 40%)",
          }}
        />

        {/* 하단 fade — 배경색으로 자연스럽게 이어짐 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "65%",
            background: "linear-gradient(to bottom, transparent 0%, var(--deep-navy) 100%)",
          }}
        />

        {/* 이미지 위 프로그램 라벨 (우하단) */}
        <div
          style={{
            position: "absolute",
            bottom: "1.5rem",
            right: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: accent,
              opacity: 0.9,
              fontWeight: 600,
            }}
          >
            {theme.label}
          </p>
        </div>
      </div>

      {/* ── 에디토리얼 헤더 ──────────────────────────────────────── */}
      <main className="px-8 max-w-[760px] mx-auto">
        <header className="pt-2 pb-8">
          <p
            className="text-sm font-medium mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            {programName}
          </p>

          <h1
            className="font-bold leading-none tracking-tight mb-6"
            data-testid="date-heading"
            style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)", letterSpacing: "-0.02em" }}
          >
            {formatDate(data.date)}
          </h1>

          {/* 스펙트럼 구분선 — 프로그램별 컬러 */}
          <div
            style={{
              height: "1px",
              marginBottom: "1.25rem",
              background: isbyulbam
                ? "linear-gradient(to right, transparent, #6a8a6a 8%, #c4a84e 35%, #e8d878 52%, #c4a84e 68%, #6a8a6a 88%, transparent)"
                : "linear-gradient(to right, transparent, #ff4444 8%, #ff8800 22%, #ffee00 38%, #44cc00 52%, #00aaff 66%, #6644ff 82%, transparent)",
              opacity: 0.55,
            }}
          />

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {data.dayOfWeek} · {data.songs.length}곡 선곡
              </p>
              {matchedCount > 0 && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                  이 중{" "}
                  <span style={{ color: accent, opacity: 1 }}>
                    {matchedCount}곡
                  </span>
                  을 지금 들을 수 있어요
                </p>
              )}
            </div>
            {data.youtube && (
              <div className="flex gap-2">
                <a
                  href={data.youtube.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-85"
                  style={{ background: accent, color: isbyulbam ? "#1a1408" : "#fff", borderRadius: "3px" }}
                >
                  YouTube
                </a>
                <a
                  href={data.youtube.musicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{
                    color: accent,
                    border: `1px solid ${accent}55`,
                    borderRadius: "3px",
                  }}
                >
                  Music
                </a>
              </div>
            )}
          </div>
        </header>

        {/* ── 선곡 목록 ────────────────────────────────────────── */}
        <ol data-testid="song-list" className="pb-16">
          {data.songs.map((song) => {
            const isExpanded = expandedId === song.order;
            const color = spectrumColor(song.order, total, accent);

            return (
              <li
                key={song.order}
                className="track-row"
                style={{
                  borderBottom: isExpanded ? "none" : "1px solid var(--track-border)",
                  cursor: song.videoId ? "pointer" : "default",
                }}
                onMouseEnter={() => song.videoId && handleMouseEnter(song.order)}
                onMouseLeave={handleMouseLeave}
                onClick={() => song.videoId && handleClick(song.order)}
              >
                <div className="flex items-center gap-4 py-3.5 group">
                  <div className="shrink-0 flex items-center justify-end gap-1.5 w-8">
                    {song.videoId && (
                      <span
                        className="spectrum-dot"
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          background: color,
                          opacity: 0.65,
                          transition: "transform 0.15s, opacity 0.15s",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      className="text-right text-xs tabular-nums font-mono"
                      style={{ color, opacity: 0.85 }}
                    >
                      {song.order}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug truncate">
                      {song.title}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                      {song.artist}
                    </p>
                  </div>

                  {song.videoId && (
                    <span
                      className="shrink-0 text-xs transition-all duration-200"
                      aria-hidden
                      style={{
                        color,
                        opacity: isExpanded ? 0.9 : 0.35,
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    >
                      ▶
                    </span>
                  )}
                </div>

                {song.videoId && (
                  <div
                    style={{
                      maxHeight: isExpanded ? "60px" : "0px",
                      overflow: "hidden",
                      transition: "max-height 0.25s ease",
                      borderBottom: isExpanded ? "1px solid var(--track-border)" : "none",
                    }}
                  >
                    <div
                      className="pl-10 pr-2 pb-3"
                      style={{ opacity: isExpanded ? 1 : 0, transition: "opacity 0.2s ease 0.05s" }}
                    >
                      <a
                        href={`https://www.youtube.com/watch?v=${song.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-85"
                        style={{
                          background: color,
                          color: "#000",
                          borderRadius: "3px",
                        }}
                      >
                        ▶ YouTube에서 듣기
                      </a>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </main>
    </article>
  );
}
