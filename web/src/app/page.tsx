import Link from "next/link";
import { loadLatest, loadAllDates } from "@/lib/data";

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

export default function HomePage() {
  const latest = loadLatest("bcamp");
  const allDates = loadAllDates("bcamp");
  const byulbamLatest = loadLatest("byulbam");
  const byulbamDates = loadAllDates("byulbam");

  return (
    <main className="px-8 max-w-[760px] mx-auto">
      {/* 에디토리얼 히어로 */}
      <header className="pt-16 pb-10">
        <p
          className="text-xs tracking-[0.3em] uppercase font-semibold mb-8"
          style={{ color: "var(--sunset-orange)" }}
        >
          Korean Radio Archive
        </p>
        <h1
          className="font-black leading-none mb-5"
          style={{
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
            letterSpacing: "-0.03em",
          }}
        >
          한국 라디오
          <br />
          음악 아카이브
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-muted)", maxWidth: "28rem" }}
        >
          배철수, DJ들이 직접 고른 곡들을 매일 기록합니다.
          <br />
          <span style={{ opacity: 0.55 }}>1990년부터 이어진 선곡표를 YouTube 플레이리스트로.</span>
        </p>
      </header>

      {/* 구분선 */}
      <div style={{ borderTop: "1px solid rgba(232, 112, 74, 0.25)", marginBottom: "2rem" }} />

      {/* 프로그램 섹션 */}
      <section className="pb-16">
        <p
          className="text-xs tracking-[0.22em] uppercase font-medium mb-5"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          Programs
        </p>

        <div className="flex flex-col gap-3">
          {/* 배철수의 음악캠프 — 활성 프로그램 */}
          <Link
            href="/bcamp"
            className="group block p-6 transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "6px",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs tracking-widest uppercase mb-2.5 font-medium"
                  style={{ color: "var(--sunset-orange)" }}
                >
                  Radio Station · MBC FM4U 91.9
                </p>
                <h2
                  className="font-bold leading-tight mb-2"
                  style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}
                >
                  배철수의 음악캠프
                </h2>
                <p
                  className="text-xs mb-4 tabular-nums"
                  style={{ color: "var(--text-muted)", opacity: 0.7 }}
                >
                  1990년~ · 매일 저녁 6시
                  {allDates.length > 0 && ` · ${allDates.length}개 에피소드`}
                </p>

                {latest && (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block font-semibold rounded-full"
                      style={{
                        background: "var(--sunset-orange)",
                        color: "#fff",
                        fontSize: "9px",
                        padding: "2px 7px",
                      }}
                    >
                      NEW
                    </span>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(latest.date)} · {latest.songs.length}곡
                      {latest.youtube && (
                        <span style={{ color: "var(--sunset-orange)", marginLeft: "6px" }}>▶</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <span
                className="text-xl shrink-0 mt-0.5 transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: "var(--sunset-orange)", opacity: 0.8 }}
              >
                →
              </span>
            </div>
          </Link>

          {/* 별이 빛나는 밤에 */}
          {byulbamLatest ? (
            <Link
              href="/byulbam"
              className="group block p-6 transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "6px",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs tracking-widest uppercase mb-2.5 font-medium"
                    style={{ color: "var(--sunset-orange)" }}
                  >
                    Radio Station · MBC FM4U 91.9
                  </p>
                  <h2
                    className="font-bold leading-tight mb-2"
                    style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}
                  >
                    별이 빛나는 밤에
                  </h2>
                  <p
                    className="text-xs mb-4 tabular-nums"
                    style={{ color: "var(--text-muted)", opacity: 0.7 }}
                  >
                    1969년~ · 매일 밤 10시
                    {byulbamDates.length > 0 && ` · ${byulbamDates.length}개 에피소드`}
                  </p>

                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block font-semibold rounded-full"
                      style={{
                        background: "var(--sunset-orange)",
                        color: "#fff",
                        fontSize: "9px",
                        padding: "2px 7px",
                      }}
                    >
                      NEW
                    </span>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(byulbamLatest.date)} · {byulbamLatest.songs.length}곡
                      {byulbamLatest.youtube && (
                        <span style={{ color: "var(--sunset-orange)", marginLeft: "6px" }}>▶</span>
                      )}
                    </span>
                  </div>
                </div>

                <span
                  className="text-xl shrink-0 mt-0.5 transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: "var(--sunset-orange)", opacity: 0.8 }}
                >
                  →
                </span>
              </div>
            </Link>
          ) : (
            <div
              className="p-6"
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "6px",
                opacity: 0.4,
              }}
            >
              <p
                className="text-xs tracking-widest uppercase mb-2.5 font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Radio Station · MBC FM4U 91.9
              </p>
              <h2
                className="font-bold leading-tight mb-2"
                style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}
              >
                별이 빛나는 밤에
              </h2>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                1969년~ · 매일 밤 10시
              </p>
              <span
                className="inline-block text-xs px-2 py-0.5"
                style={{
                  border: "1px solid rgba(138,155,176,0.2)",
                  color: "var(--text-muted)",
                  borderRadius: "2px",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                }}
              >
                COMING SOON
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 저작권 */}
      <div
        className="pb-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
          ⓒ MBC · 배철수의 음악캠프 — 방송 콘텐츠 저작권은 MBC에 있습니다
          <br />
          unofficial fan site · not affiliated with MBC
        </p>
      </div>
    </main>
  );
}
