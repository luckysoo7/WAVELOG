"use client";

import { useState } from "react";
import type { PlaylistData } from "@/lib/data";

interface Props {
  data: PlaylistData;
  label?: string;
  programName?: string;
}

const THEMES = {
  byulbam: {
    accent: "#c4a84e",
    heroImage: "/byulbam-hero.png",
    label: "MBC FM4U 91.9",
    ambientClass: "ambient-byulbam",
    heroBg: "#050e0a",
    spectrumLine: "linear-gradient(to right, transparent, #4a7a5a 8%, #c4a84e 35%, #e8d878 52%, #c4a84e 68%, #4a7a5a 88%, transparent)",
    trackRowClass: "track-row-byulbam",
    // hero 하단 오버레이 — 페이지 배경색으로 디졸브
    heroFade: "linear-gradient(to bottom, transparent 30%, rgba(5,10,8,0.7) 65%, #050c0a 100%)",
    // 콘텐츠 영역 배경
    pageBg: "#050c0a",
  },
  bcamp: {
    accent: "#e8704a",
    heroImage: "/bcamp-hero.png",
    label: "MBC FM4U 91.9",
    ambientClass: "ambient-bcamp",
    heroBg: "#120a03",
    spectrumLine: "linear-gradient(to right, transparent, #ff4444 8%, #ff8800 22%, #ffee00 38%, #44cc00 52%, #00aaff 66%, #6644ff 82%, transparent)",
    trackRowClass: "track-row-bcamp",
    heroFade: "linear-gradient(to bottom, transparent 30%, rgba(18,10,3,0.7) 65%, #0d1720 100%)",
    pageBg: "#0d1720",
  },
} as const;

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

function spectrumColor(order: number, total: number, accent: string): string {
  if (accent === THEMES.byulbam.accent) {
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
    <article
      className={`relative min-h-screen ${theme.ambientClass}`}
      style={{ background: theme.pageBg }}
    >
      {/* ── HERO SECTION — fixed height, image absolute inside ──── */}
      <div
        className="hero-fixed"
        style={{ background: theme.heroBg }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.heroImage}
          alt={programName}
          className="hero-fixed-img"
        />
        {/* 상단→하단 gradient overlay — 이미지를 페이지 배경으로 디졸브 */}
        <div
          className="hero-fixed-fade"
          style={{ background: theme.heroFade }}
        />

      </div>

      {/* ── 날짜 헤딩 — hero 하단 안으로 파고듦 ────────────────── */}
      <div
        className="date-overlap"
        style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem" }}
      >
        {/* 프로그램 라벨 — 날짜 위 자연스러운 순서 */}
        <p
          className="program-label-badge mb-4"
          style={{
            color: accent,
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
          }}
        >
          <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: accent }} />
          {theme.label}
        </p>

        <h1
          className="font-black leading-none"
          data-testid="date-heading"
          style={{
            fontSize: "clamp(5rem, 18vw, 11rem)",
            letterSpacing: "-0.045em",
            color: "#f0ebe3",
            lineHeight: 0.86,
            textShadow: `0 4px 80px rgba(0,0,0,0.9), 0 0 120px ${accent}22`,
          }}
        >
          {formatDate(data.date)}
        </h1>

        <p
          className="mt-4 text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {programName} · {data.dayOfWeek} · {data.songs.length}곡
          {matchedCount > 0 && (
            <span style={{ marginLeft: "0.5rem", color: accent, opacity: 0.9 }}>
              ({matchedCount}곡 청취 가능)
            </span>
          )}
        </p>
      </div>

      {/* ── 트랙 리스트 ────────────────────────────────────────── */}
      <main
        className="tracklist-glass px-8 max-w-[760px] mx-auto"
        style={{ paddingTop: "2rem" }}
      >
        <header className="pb-8">
          <div
            style={{
              height: "1px",
              marginBottom: "1.5rem",
              background: theme.spectrumLine,
              opacity: 0.5,
            }}
          />

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
        </header>

        <ol data-testid="song-list" className="pb-16">
          {data.songs.map((song) => {
            const isExpanded = expandedId === song.order;
            const color = spectrumColor(song.order, total, accent);

            return (
              <li
                key={song.order}
                className={`track-row ${theme.trackRowClass}`}
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
