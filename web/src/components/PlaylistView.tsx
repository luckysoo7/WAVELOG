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
    label: "Radio Station · MBC FM4U 91.9",
    ambientClass: "ambient-byulbam",
    heroBgClass: "hero-bg-byulbam",
    trackRowClass: "track-row-byulbam",
    // 이미지 하단 페이드 — 별밤 배경색으로
    fadeBg: "linear-gradient(to bottom, transparent 0%, rgba(5, 12, 10, 0.7) 45%, #0d1720 100%)",
    // 날짜 헤딩 아래 스펙트럼 라인
    spectrumLine: "linear-gradient(to right, transparent, #4a7a5a 8%, #c4a84e 35%, #e8d878 52%, #c4a84e 68%, #4a7a5a 88%, transparent)",
  },
  bcamp: {
    accent: "#e8704a",
    heroImage: "/bcamp-hero.png",
    label: "Radio Station · MBC FM4U 91.9",
    ambientClass: "ambient-bcamp",
    heroBgClass: "hero-bg-bcamp",
    trackRowClass: "track-row-bcamp",
    // 이미지 하단 페이드 — 배캠 배경색으로
    fadeBg: "linear-gradient(to bottom, transparent 0%, rgba(20, 12, 5, 0.65) 40%, #0d1720 100%)",
    spectrumLine: "linear-gradient(to right, transparent, #ff4444 8%, #ff8800 22%, #ffee00 38%, #44cc00 52%, #00aaff 66%, #6644ff 82%, transparent)",
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
    /* article에 ambient glow 주입 — 프로그램 컬러가 페이지 전체를 물들임 */
    <article className={`relative min-h-screen ${theme.ambientClass}`}>

      {/* ── 히어로: 페이지 상단 전체 배경으로 확장 ────────────────── */}
      <div className={`hero-bg-image ${theme.heroBgClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.heroImage}
          alt={programName}
        />
        {/* 좌우 vignette */}
        <div className="hero-bg-vignette" />
        {/* 하단 페이드 — 프로그램 컬러로 자연스럽게 흡수 */}
        <div
          className="hero-bg-fade"
          style={{ background: theme.fadeBg }}
        />
      </div>

      {/* ── 히어로 위 오버레이 콘텐츠 — 드라마틱 타이포그래피 ──── */}
      <div
        className="hero-content-layer"
        style={{
          /* 이미지 높이(65vh)의 약 60% 지점까지 채움 */
          paddingTop: "clamp(140px, 30vh, 360px)",
          paddingBottom: "clamp(32px, 5vh, 60px)",
          paddingLeft: "2rem",
          paddingRight: "2rem",
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        {/* 프로그램 라벨 */}
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

        {/* 날짜 — 이미지 위에 직접 레이어링, 텍스트 섀도로 가독성 */}
        <h1
          className="font-bold leading-none tracking-tight"
          data-testid="date-heading"
          style={{
            fontSize: "clamp(3.5rem, 12vw, 8rem)",
            letterSpacing: "-0.03em",
            color: "#f0ebe3",
            textShadow: isbyulbam
              ? "0 2px 40px rgba(5, 20, 14, 0.8), 0 0 80px rgba(10, 30, 20, 0.6)"
              : "0 2px 40px rgba(30, 15, 5, 0.85), 0 0 80px rgba(61, 40, 16, 0.5)",
            lineHeight: 0.92,
          }}
        >
          {formatDate(data.date)}
        </h1>

        {/* 요일 + 메타 */}
        <p
          className="mt-4 text-sm font-medium"
          style={{
            color: "var(--text-muted)",
            textShadow: "0 1px 12px rgba(0,0,0,0.8)",
          }}
        >
          {programName} · {data.dayOfWeek} · {data.songs.length}곡
          {matchedCount > 0 && (
            <span style={{ marginLeft: "0.5rem", color: accent, opacity: 0.9 }}>
              ({matchedCount}곡 청취 가능)
            </span>
          )}
        </p>
      </div>

      {/* ── 에디토리얼 헤더 (스펙트럼 + YouTube 버튼) ──────────── */}
      <main
        className="tracklist-glass px-8 max-w-[760px] mx-auto"
        style={{ paddingTop: "0.5rem" }}
      >
        <header className="pb-8">
          {/* 스펙트럼 구분선 */}
          <div
            style={{
              height: "1px",
              marginBottom: "1.5rem",
              background: theme.spectrumLine,
              opacity: 0.5,
            }}
          />

          {/* YouTube 링크 */}
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

        {/* ── 선곡 목록 ────────────────────────────────────────── */}
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
