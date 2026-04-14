import Link from "next/link";
import { loadLatest, loadAllDates } from "@/lib/data";
import DisclaimerButton from "@/components/DisclaimerButton";

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
          style={{ color: "var(--text-primary)", opacity: 0.75, maxWidth: "32rem", lineHeight: "1.85" }}
        >
          알고리즘 추천에 질렸을 때.
          <br />
          대한민국에서 음악 가장 잘 아는 DJ들의 선곡표가 여기 있습니다.
          <br />
          <br />
          배철수의 음악캠프, 별이 빛나는 밤에 — 매일 방송된 선곡을 날짜별로 기록합니다.
          곡마다 YouTube 링크가 달려 있어서 바로 들을 수 있어요.
          오늘 방송부터 오래된 아카이브까지.
          <br />
          <br />
          <span style={{ opacity: 0.65 }}>
            라디오를 사랑하는 학생이 만들었습니다. 무료, 광고 없음.
          </span>
        </p>
      </header>

      {/* 구분선 */}
      <div style={{ borderTop: "1px solid rgba(232, 112, 74, 0.25)", marginBottom: "2rem" }} />

      {/* 프로그램 섹션 */}
      <section className="pb-16">
        <p
          className="text-xs tracking-[0.22em] uppercase font-medium mb-5"
          style={{ color: "var(--text-muted)", opacity: 0.7 }}
        >
          Programs
        </p>

        <div className="flex flex-col gap-4">
          {/* 배철수의 음악캠프 */}
          <Link
            href="/bcamp"
            className="group block transition-all overflow-hidden"
            style={{
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {/* 썸네일 영역 */}
            <div
              style={{
                position: "relative",
                height: "140px",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bcamp-hero.png"
                alt="배철수의 음악캠프"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  filter: "brightness(0.65) saturate(1.05)",
                  transition: "transform 0.4s ease, filter 0.4s ease",
                }}
                className="group-hover:scale-[1.03] group-hover:brightness-75"
              />
              {/* 하단 페이드 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "60%",
                  background: "linear-gradient(to bottom, transparent, rgba(26,37,53,0.95))",
                }}
              />
              {/* 방송국 라벨 */}
              <p
                style={{
                  position: "absolute",
                  bottom: "0.75rem",
                  left: "1rem",
                  fontSize: "0.6rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#e8704a",
                  opacity: 0.9,
                  fontWeight: 600,
                }}
              >
                MBC FM4U 91.9 · since 1990
              </p>
            </div>

            {/* 텍스트 영역 */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2
                    className="font-bold leading-tight mb-1.5"
                    style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}
                  >
                    배철수의 음악캠프
                  </h2>
                  <p
                    className="text-xs tabular-nums"
                    style={{ color: "var(--text-muted)", opacity: 0.65 }}
                  >
                    매일 저녁 6시
                    {allDates.length > 0 && ` · ${allDates.length}개 에피소드`}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                    선곡표 · YouTube 플레이리스트
                  </p>
                </div>
                <span
                  className="text-lg shrink-0 mt-0.5 transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: "#e8704a", opacity: 0.7 }}
                >
                  →
                </span>
              </div>

              {latest && (
                <div
                  className="flex items-center gap-2 mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span
                    className="inline-block font-semibold rounded-full shrink-0"
                    style={{
                      background: "#e8704a",
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
                      <span style={{ color: "#e8704a", marginLeft: "6px" }}>▶</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* 별이 빛나는 밤에 */}
          {byulbamLatest ? (
            <Link
              href="/byulbam"
              className="group block transition-all overflow-hidden"
              style={{
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {/* 썸네일 영역 */}
              <div
                style={{
                  position: "relative",
                  height: "140px",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/byulbam-hero.png"
                  alt="별이 빛나는 밤에"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    filter: "brightness(0.65) saturate(1.05)",
                    transition: "transform 0.4s ease",
                  }}
                  className="group-hover:scale-[1.03]"
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "60%",
                    background: "linear-gradient(to bottom, transparent, rgba(15,25,20,0.95))",
                  }}
                />
                <p
                  style={{
                    position: "absolute",
                    bottom: "0.75rem",
                    left: "1rem",
                    fontSize: "0.6rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#c4a84e",
                    opacity: 0.9,
                    fontWeight: 600,
                  }}
                >
                  MBC FM4U 91.9 · since 1969
                </p>
              </div>

              {/* 텍스트 영역 */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2
                      className="font-bold leading-tight mb-1.5"
                      style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}
                    >
                      별이 빛나는 밤에
                    </h2>
                    <p
                      className="text-xs tabular-nums"
                      style={{ color: "var(--text-muted)", opacity: 0.65 }}
                    >
                      매일 밤 10시
                      {byulbamDates.length > 0 && ` · ${byulbamDates.length}개 에피소드`}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                      선곡표 · YouTube 플레이리스트
                    </p>
                  </div>
                  <span
                    className="text-lg shrink-0 mt-0.5 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: "#c4a84e", opacity: 0.7 }}
                  >
                    →
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span
                    className="inline-block font-semibold rounded-full shrink-0"
                    style={{
                      background: "#c4a84e",
                      color: "#1a1408",
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
                      <span style={{ color: "#c4a84e", marginLeft: "6px" }}>▶</span>
                    )}
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            // 데이터 없을 때 COMING SOON
            <div
              className="overflow-hidden"
              style={{
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.04)",
                background: "rgba(255,255,255,0.01)",
                opacity: 0.4,
              }}
            >
              <div style={{ position: "relative", height: "140px", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/byulbam-hero.png"
                  alt="별이 빛나는 밤에"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    filter: "brightness(0.4) grayscale(0.4)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "60%",
                    background: "linear-gradient(to bottom, transparent, rgba(15,25,35,0.95))",
                  }}
                />
              </div>
              <div className="p-5">
                <h2
                  className="font-bold leading-tight mb-1.5"
                  style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}
                >
                  별이 빛나는 밤에
                </h2>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                  매일 밤 10시 · since 1969
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
            </div>
          )}
        </div>
      </section>

      {/* 저작권 */}
      <div
        className="pb-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.65 }}>
          ⓒ MBC — 방송 콘텐츠 저작권은 MBC에 있습니다
          <br />
          unofficial fan site · not affiliated with MBC
          <DisclaimerButton />
        </p>
      </div>
    </main>
  );
}
