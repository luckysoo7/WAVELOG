import type { Metadata } from "next";
import Link from "next/link";
import { loadLatest, loadAllDates } from "@/lib/data";
import DisclaimerButton from "@/components/DisclaimerButton";

export const metadata: Metadata = {
  title: "Wavelog — 한국 라디오 선곡표 아카이브",
  description: "배철수의 음악캠프, 김이나의 별이 빛나는 밤에 선곡표를 매일 YouTube 플레이리스트로 기록합니다.",
};

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

function FreqBars() {
  // 정적 주파수 바 장식 (라디오 신호 시각 모티프)
  const bars = [3, 7, 11, 8, 5, 13, 9, 15, 7, 4, 10, 6, 12, 5, 8];
  return (
    <svg width="66" height="14" viewBox="0 0 66 14" fill="none" aria-hidden="true" style={{ display: "block" }}>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 4.5}
          y={14 - h}
          width="2.5"
          height={h}
          fill="currentColor"
          opacity={0.3 + (h / 30)}
        />
      ))}
    </svg>
  );
}

export default function HomePage() {
  const latest = loadLatest("bcamp");
  const allDates = loadAllDates("bcamp");
  const byulbamLatest = loadLatest("byulbam");
  const byulbamDates = loadAllDates("byulbam");

  return (
    <>
      <style>{`
        @keyframes wl-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .wl-in { animation: wl-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .wl-d1 { animation-delay: 0.04s; }
        .wl-d2 { animation-delay: 0.14s; }
        .wl-d3 { animation-delay: 0.26s; }
        .wl-d4 { animation-delay: 0.40s; }
        .wl-d5 { animation-delay: 0.54s; }
        .wl-d6 { animation-delay: 0.68s; }

        .prog-tile {
          display: block;
          text-decoration: none;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease;
        }
        .prog-tile-bcamp:hover  { transform: translateY(-4px); border-color: rgba(232,112,74,0.4); }
        .prog-tile-byulbam:hover { transform: translateY(-4px); border-color: rgba(196,168,78,0.4); }

        .prog-tile-img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center top;
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.55s ease;
        }
        .prog-tile:hover .prog-tile-img {
          transform: scale(1.05);
          filter: brightness(0.72) saturate(1.15);
        }

        .prog-arrow {
          transition: transform 0.25s ease, opacity 0.25s ease;
        }
        .prog-tile:hover .prog-arrow { transform: translateX(5px); opacity: 1 !important; }

        @media (prefers-reduced-motion: reduce) {
          .wl-in { animation: none; opacity: 1; }
          .prog-tile { transition: none; }
          .prog-tile-img { transition: none; }
        }
      `}</style>

      <main style={{ padding: "0 1.5rem", maxWidth: "760px", margin: "0 auto" }}>

        {/* ── 히어로 헤더 ─────────────────────────────────────────── */}
        <header style={{ paddingTop: "3.75rem", paddingBottom: "3rem" }}>

          {/* 로고 + 식별자 라인 */}
          <div
            className="wl-in wl-d1"
            style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.75rem" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/wavelog-logo.svg"
              alt="Wavelog"
              style={{ width: "152px", height: "auto", opacity: 0.9, flexShrink: 0 }}
            />
            <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
            <div>
              <p style={{
                fontSize: "0.58rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--sunset-orange)",
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: "5px",
              }}>
                Korean Radio Archive
              </p>
              <div style={{ color: "var(--sunset-orange)" }}>
                <FreqBars />
              </div>
            </div>
          </div>

          {/* 메인 헤드라인 — 3단 스택, 불투명도 계단 */}
          <h1 className="wl-in wl-d2" style={{ marginBottom: "1.5rem" }}>
            <span style={{
              display: "block",
              fontSize: "clamp(2.8rem, 9.5vw, 6.25rem)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 0.9,
              color: "var(--text-primary)",
              opacity: 0.38,
            }}>
              No Algorithm.
            </span>
            <span style={{
              display: "block",
              fontSize: "clamp(2.8rem, 9.5vw, 6.25rem)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 0.9,
              color: "var(--text-primary)",
            }}>
              Just Radio.
            </span>
            <span style={{
              display: "inline-block",
              fontSize: "clamp(1rem, 3vw, 1.4rem)",
              fontWeight: 600,
              letterSpacing: "0.01em",
              lineHeight: 1,
              color: "var(--sunset-orange)",
              marginTop: "clamp(0.6rem, 1.5vw, 1rem)",
            }}>
              음악을 가장 잘 아는 사람들의 선곡을 기록합니다 →
            </span>
          </h1>

          {/* 구분 바 */}
          <div
            className="wl-in wl-d3"
            style={{
              width: "36px", height: "2px",
              background: "var(--sunset-orange)",
              opacity: 0.5,
              marginBottom: "1.5rem",
            }}
          />

          {/* 서브 카피 */}
          <p
            className="wl-in wl-d3"
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.85,
              color: "var(--text-primary)",
              opacity: 0.6,
              maxWidth: "29rem",
            }}
          >
            배철수의 음악캠프, 김이나의 별이 빛나는 밤에.
            <br />
            매일 방송된 선곡을 날짜별로 기록합니다. 곡마다 YouTube 링크.
            <br />
            <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
              라디오를 사랑하는 학생이 만들었습니다 · 비영리 · 광고 없음
            </span>
          </p>
        </header>

        {/* ── 프로그램 섹션 ────────────────────────────────────────── */}
        <section className="wl-in wl-d4" style={{ paddingBottom: "4.5rem" }}>
          <p style={{
            fontSize: "0.6rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontWeight: 700,
            opacity: 0.45,
            marginBottom: "1.25rem",
          }}>
            Programs on air
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* ── 배철수의 음악캠프 ── */}
            <Link href="/bcamp" className="prog-tile prog-tile-bcamp">
              {/* 히어로 이미지 영역 */}
              <div style={{ position: "relative", height: "185px", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="prog-tile-img"
                  src="/bcamp-hero.png"
                  alt="배철수의 음악캠프"
                  style={{ filter: "brightness(0.58) saturate(1.08)" }}
                />
                {/* 좌상단 오렌지 ambient */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(135deg, rgba(232,112,74,0.18) 0%, transparent 55%), linear-gradient(to bottom, transparent 25%, rgba(12,9,6,0.92) 100%)",
                }} />
                {/* 이미지 위 텍스트 */}
                <div style={{
                  position: "absolute", bottom: "1rem", left: "1.25rem", right: "1.25rem",
                  display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                }}>
                  <div>
                    <p style={{
                      fontSize: "0.55rem", letterSpacing: "0.28em",
                      textTransform: "uppercase", color: "#e8704a",
                      fontWeight: 700, marginBottom: "5px",
                    }}>
                      MBC FM4U · 91.9 MHz · since 1990
                    </p>
                    <h2 style={{
                      fontSize: "1.25rem", fontWeight: 800,
                      letterSpacing: "-0.025em", lineHeight: 1.1,
                      color: "var(--text-primary)",
                    }}>
                      배철수의 음악캠프
                    </h2>
                  </div>
                  <span
                    className="prog-arrow"
                    style={{ color: "#e8704a", fontSize: "1.25rem", opacity: 0.65 }}
                  >
                    →
                  </span>
                </div>
              </div>

              {/* 하단 메타 바 */}
              <div style={{
                padding: "0.8rem 1.25rem",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{
                    fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em",
                    padding: "3px 8px", borderRadius: "2px",
                    background: "#e8704a", color: "#fff",
                  }}>
                    매일 저녁 6시
                  </span>
                  {allDates.length > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", opacity: 0.55 }}>
                      {allDates.length}개 에피소드
                    </span>
                  )}
                </div>
                {latest && (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", opacity: 0.6 }}>
                    최신 {formatDate(latest.date)} · {latest.songs.length}곡
                    {latest.youtube && (
                      <span style={{ color: "#e8704a", marginLeft: "5px" }}>▶</span>
                    )}
                  </span>
                )}
              </div>
            </Link>

            {/* ── 별이 빛나는 밤에 ── */}
            {byulbamLatest ? (
              <Link href="/byulbam" className="prog-tile prog-tile-byulbam">
                <div style={{ position: "relative", height: "185px", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="prog-tile-img"
                    src="/byulbam-hero.png"
                    alt="김이나의 별이 빛나는 밤에"
                    style={{ filter: "brightness(0.58) saturate(1.05)" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(135deg, rgba(196,168,78,0.14) 0%, transparent 55%), linear-gradient(to bottom, transparent 25%, rgba(5,10,18,0.92) 100%)",
                  }} />
                  <div style={{
                    position: "absolute", bottom: "1rem", left: "1.25rem", right: "1.25rem",
                    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                  }}>
                    <div>
                      <p style={{
                        fontSize: "0.55rem", letterSpacing: "0.28em",
                        textTransform: "uppercase", color: "#c4a84e",
                        fontWeight: 700, marginBottom: "5px",
                      }}>
                        MBC FM4U · 91.9 MHz · since 1969
                      </p>
                      <h2 style={{
                        fontSize: "1.25rem", fontWeight: 800,
                        letterSpacing: "-0.025em", lineHeight: 1.1,
                        color: "var(--text-primary)",
                      }}>
                        김이나의 별이 빛나는 밤에
                      </h2>
                    </div>
                    <span
                      className="prog-arrow"
                      style={{ color: "#c4a84e", fontSize: "1.25rem", opacity: 0.65 }}
                    >
                      →
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: "0.8rem 1.25rem",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <span style={{
                      fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em",
                      padding: "3px 8px", borderRadius: "2px",
                      background: "#c4a84e", color: "#1a1408",
                    }}>
                      매일 밤 8시
                    </span>
                    {byulbamDates.length > 0 && (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", opacity: 0.55 }}>
                        {byulbamDates.length}개 에피소드
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", opacity: 0.6 }}>
                    최신 {formatDate(byulbamLatest.date)} · {byulbamLatest.songs.length}곡
                    {byulbamLatest.youtube && (
                      <span style={{ color: "#c4a84e", marginLeft: "5px" }}>▶</span>
                    )}
                  </span>
                </div>
              </Link>
            ) : (
              // 데이터 없을 때 COMING SOON
              <div className="prog-tile" style={{ opacity: 0.38, cursor: "default" }}>
                <div style={{ position: "relative", height: "185px", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/byulbam-hero.png"
                    alt="김이나의 별이 빛나는 밤에"
                    style={{
                      width: "100%", height: "100%",
                      objectFit: "cover", objectPosition: "center top",
                      filter: "brightness(0.4) grayscale(0.5)",
                    }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, transparent 35%, rgba(10,16,26,0.95) 100%)",
                  }} />
                  <div style={{ position: "absolute", bottom: "1rem", left: "1.25rem" }}>
                    <h2 style={{
                      fontSize: "1.25rem", fontWeight: 800,
                      letterSpacing: "-0.025em", lineHeight: 1.1,
                    }}>
                      김이나의 별이 빛나는 밤에
                    </h2>
                  </div>
                </div>
                <div style={{ padding: "0.8rem 1.25rem" }}>
                  <span style={{
                    fontSize: "0.58rem", letterSpacing: "0.14em",
                    padding: "3px 9px",
                    border: "1px solid rgba(138,155,176,0.2)",
                    color: "var(--text-muted)", borderRadius: "2px",
                  }}>
                    COMING SOON
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 저작권 ──────────────────────────────────────────────── */}
        <div
          className="wl-in wl-d6"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "1.5rem",
            paddingBottom: "2.5rem",
          }}
        >
          <p style={{
            fontSize: "0.7rem",
            lineHeight: 1.7,
            color: "var(--text-muted)",
            opacity: 0.45,
          }}>
            ⓒ MBC — 방송 콘텐츠 저작권은 MBC에 있습니다
            <br />
            unofficial fan site · not affiliated with MBC
            <DisclaimerButton />
          </p>
        </div>
      </main>
    </>
  );
}
