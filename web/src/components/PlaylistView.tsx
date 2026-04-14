"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlaylistData, DateEntry } from "@/lib/data";

interface Props {
  data: PlaylistData;
  label?: string;
  programName?: string;
  allDates?: DateEntry[];
}

const THEMES = {
  byulbam: {
    accent: "#c4a84e",
    heroImage: "/byulbam-hero.png",
    label: "MBC FM4U 91.9",
    ambientClass: "ambient-byulbam",
    heroBg: "linear-gradient(to bottom, #050e0a 0%, #050c0a 100%)",
    spectrumLine: "linear-gradient(to right, transparent, #4a7a5a 8%, #c4a84e 35%, #e8d878 52%, #c4a84e 68%, #4a7a5a 88%, transparent)",
    trackRowClass: "track-row-byulbam",
    heroFade: "linear-gradient(to bottom, transparent 50%, rgba(5,10,8,0.7) 80%, #050c0a 100%)",
    pageBg: "#050c0a",
    basePath: "/byulbam",
  },
  bcamp: {
    accent: "#e8704a",
    heroImage: "/bcamp-hero.png",
    label: "MBC FM4U 91.9",
    ambientClass: "ambient-bcamp",
    heroBg: "linear-gradient(to bottom, #120a03 0%, #0d1720 100%)",
    spectrumLine: "linear-gradient(to right, transparent, #ff4444 8%, #ff8800 22%, #ffee00 38%, #44cc00 52%, #00aaff 66%, #6644ff 82%, transparent)",
    trackRowClass: "track-row-bcamp",
    heroFade: "linear-gradient(to bottom, transparent 50%, rgba(18,10,3,0.7) 80%, #0d1720 100%)",
    pageBg: "#0d1720",
    basePath: "/bcamp",
  },
} as const;

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

function formatChipDate(dateStr: string, dayOfWeek: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}/${+d} ${dayOfWeek.charAt(0)}`;
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

export default function PlaylistView({
  data,
  programName = "배철수의 음악캠프",
  allDates = [],
}: Props) {
  const total = data.songs.length;
  const matchedCount = data.songs.filter((s) => s.videoId).length;
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isbyulbam = programName === "별이 빛나는 밤에";
  const theme = isbyulbam ? THEMES.byulbam : THEMES.bcamp;
  const accent = theme.accent;

  // 날짜 네비게이션 계산
  const currentIdx = allDates.findIndex((d) => d.date === data.date);
  // allDates는 DESC 순 (최신→오래된). 이전(더 최신) = idx-1, 다음(더 오래된) = idx+1
  const prevEntry = currentIdx > 0 ? allDates[currentIdx - 1] : null;
  const nextEntry = currentIdx >= 0 && currentIdx < allDates.length - 1 ? allDates[currentIdx + 1] : null;

  // 날짜 칩: 현재 ±3일 (최대 7개)
  const chipStart = Math.max(0, currentIdx - 3);
  const chipEnd = Math.min(allDates.length - 1, currentIdx + 3);
  const nearbyDates = allDates.slice(chipStart, chipEnd + 1);

  function dateHref(entry: DateEntry): string {
    // allDates[0]이 최신 → basePath로 이동
    return allDates.indexOf(entry) === 0 ? theme.basePath : `${theme.basePath}/${entry.date}`;
  }

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

  const mappingPct = total > 0 ? Math.round((matchedCount / total) * 100) : 0;

  return (
    <article
      className={`relative min-h-screen ${theme.ambientClass}`}
      style={{ background: theme.pageBg, paddingBottom: "80px" }}
    >
      <section className="hero-date-stack" aria-label={`${programName} 날짜 헤더`}>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="hero-fixed" style={{ background: theme.heroBg }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.heroImage} alt={programName} className="hero-fixed-img" />
          <div className="hero-fixed-fade" style={{ background: theme.heroFade }} />
        </div>

        {/* ── 날짜 오버랩 ────────────────────────────────────── */}
        <div className="date-overlap" style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto", paddingLeft: "2rem", paddingRight: "2rem" }}>

          {/* 프로그램 라벨 + 상태 칩 */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <p
              className="program-label-badge"
              style={{
                color: accent,
                background: `${accent}18`,
                border: `1px solid ${accent}30`,
              }}
            >
              <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: accent }} />
              {theme.label}
            </p>
            {/* 상태 칩 */}
            {matchedCount > 0 && (
              <span
                className="program-label-badge"
                style={{
                  color: matchedCount === total ? accent : `${accent}aa`,
                  background: `${accent}12`,
                  border: `1px solid ${accent}25`,
                }}
              >
                ▶ {matchedCount === total ? `${matchedCount}곡 전부 청취 가능` : `${matchedCount}/${total} 청취 가능`}
              </span>
            )}
            {matchedCount === 0 && total > 0 && (
              <span
                className="program-label-badge"
                style={{ color: "var(--text-muted)", background: "rgba(138,155,176,0.08)", border: "1px solid rgba(138,155,176,0.15)" }}
              >
                YouTube 매핑 준비 중
              </span>
            )}
          </div>

          {/* 날짜 타이포 */}
          <h1
            className="font-black leading-none date-title"
            data-testid="date-heading"
            style={{
              letterSpacing: "-0.045em",
              color: "#f0ebe3",
              lineHeight: 0.86,
              textShadow: `0 4px 80px rgba(0,0,0,0.9), 0 0 120px ${accent}22`,
            }}
          >
            {formatDate(data.date)}
          </h1>

          {/* 메타 + 매핑 진행 바 */}
          <div className="mt-4">
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {programName} · {data.dayOfWeek} · {total}곡
            </p>
            {total > 0 && (
              <div className="mt-2 flex items-center gap-2">
                {/* 진행 바 */}
                <div
                  style={{
                    flex: "0 0 120px",
                    height: "3px",
                    borderRadius: "2px",
                    background: "rgba(138,155,176,0.15)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${mappingPct}%`,
                      height: "100%",
                      background: accent,
                      opacity: 0.75,
                      borderRadius: "2px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)", opacity: 0.55 }}>
                  {matchedCount}/{total} YouTube
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 날짜 칩 스트립 (A안) ─────────────────────────── */}
      {nearbyDates.length > 1 && (
        <div
          className="date-chip-strip"
          style={{ maxWidth: "760px", margin: "0 auto" }}
        >
          <div className="date-chip-scroll">
            {nearbyDates.map((entry) => {
              const isCurrent = entry.date === data.date;
              return (
                <Link
                  key={entry.date}
                  href={dateHref(entry)}
                  className="date-chip"
                  style={
                    isCurrent
                      ? { color: accent, background: `${accent}20`, border: `1px solid ${accent}50` }
                      : { color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {formatChipDate(entry.date, entry.dayOfWeek)}
                  {entry.hasPlaylist && (
                    <span style={{ marginLeft: "3px", fontSize: "8px", opacity: 0.7 }}>▶</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 트랙 리스트 ────────────────────────────────────── */}
      <main className="tracklist-glass px-8 max-w-[760px] mx-auto" style={{ paddingTop: "2rem" }}>
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
                style={{ color: accent, border: `1px solid ${accent}55`, borderRadius: "3px" }}
              >
                Music
              </a>
            </div>
          )}
        </header>

        <ol data-testid="song-list" className="pb-8">
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
                    <span className="text-right text-xs tabular-nums font-mono" style={{ color, opacity: 0.85 }}>
                      {song.order}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug truncate">{song.title}</p>
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
                        style={{ background: color, color: "#000", borderRadius: "3px" }}
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

      {/* ── 하단 고정 날짜 바 (B안) — 모바일 전용 ──────────── */}
      {allDates.length > 0 && (
        <nav className="date-nav-bar md:hidden" aria-label="날짜 탐색">
          {/* 이전 (더 최신) */}
          <div className="date-nav-side">
            {prevEntry ? (
              <Link href={dateHref(prevEntry)} className="date-nav-btn">
                <span className="date-nav-arrow">←</span>
                <span className="date-nav-label">{formatChipDate(prevEntry.date, prevEntry.dayOfWeek)}</span>
              </Link>
            ) : (
              <span className="date-nav-btn date-nav-disabled">
                <span className="date-nav-arrow">←</span>
                <span className="date-nav-label">최신</span>
              </span>
            )}
          </div>

          {/* 중앙 — 날짜 목록 열기 (사이드바 드로어 트리거는 MobileDrawer에 있으므로 홈 링크 대체) */}
          <Link
            href={theme.basePath}
            className="date-nav-center"
            style={{ color: accent }}
          >
            <span style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              전체 목록
            </span>
          </Link>

          {/* 다음 (더 오래된) */}
          <div className="date-nav-side" style={{ justifyContent: "flex-end" }}>
            {nextEntry ? (
              <Link href={dateHref(nextEntry)} className="date-nav-btn">
                <span className="date-nav-label">{formatChipDate(nextEntry.date, nextEntry.dayOfWeek)}</span>
                <span className="date-nav-arrow">→</span>
              </Link>
            ) : (
              <span className="date-nav-btn date-nav-disabled">
                <span className="date-nav-label">끝</span>
                <span className="date-nav-arrow">→</span>
              </span>
            )}
          </div>
        </nav>
      )}
    </article>
  );
}
