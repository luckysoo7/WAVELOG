import Link from "next/link";
import { loadLatest, loadAllDates } from "@/lib/data";

const GRADIENTS: Record<string, string> = {
  // A — Twilight Violet: 보라/인디고 오로라 × 오렌지 사이드킥. 낮과 밤 경계의 드라마틱한 대비.
  a: `
    radial-gradient(ellipse 100% 65% at 75% -15%, rgba(130,60,210,0.22) 0%, transparent 55%),
    radial-gradient(ellipse 55%  50% at  0% 45%, rgba(232,112,74,0.14) 0%, transparent 50%),
    radial-gradient(ellipse 70%  40% at 50% 110%, rgba(70,10,100,0.45) 0%, transparent 55%),
    radial-gradient(ellipse 40%  30% at 85%  70%, rgba(180,80,240,0.08) 0%, transparent 45%),
    #09080f
  `,
  // B — Deep Ember (유지)
  b: `
    radial-gradient(ellipse 100% 60% at 50% 0%, rgba(200,100,40,0.12) 0%, transparent 55%),
    radial-gradient(ellipse 60% 80% at 50% 50%, rgba(120,60,20,0.08) 0%, transparent 70%),
    #0c0906
  `,
  // C — Crimson Archive: 다크 버건디 × 골드 글로우. 재즈클럽 온에어 무드.
  c: `
    radial-gradient(ellipse 110% 70% at 50% -25%, rgba(200,35,55,0.28) 0%, transparent 50%),
    radial-gradient(ellipse  45% 55% at 95%  55%, rgba(210,145,30,0.14) 0%, transparent 48%),
    radial-gradient(ellipse  90% 45% at  0% 100%, rgba(140,15,20,0.50) 0%, transparent 60%),
    radial-gradient(ellipse  60% 35% at 50%  50%, rgba(100,10,15,0.20) 0%, transparent 65%),
    #0e0506
  `,
};

// 카드 페이드 색상도 배경에 맞게 조정
const CARD_FADES: Record<string, { bcamp: string; byulbam: string }> = {
  a: {
    bcamp:   "linear-gradient(to bottom, transparent, rgba(9,8,15,0.95))",
    byulbam: "linear-gradient(to bottom, transparent, rgba(8,7,14,0.95))",
  },
  b: {
    bcamp:   "linear-gradient(to bottom, transparent, rgba(12,9,6,0.95))",
    byulbam: "linear-gradient(to bottom, transparent, rgba(10,8,5,0.95))",
  },
  c: {
    bcamp:   "linear-gradient(to bottom, transparent, rgba(14,5,6,0.95))",
    byulbam: "linear-gradient(to bottom, transparent, rgba(12,4,5,0.95))",
  },
};

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ bg?: string }>;
}) {
  const { bg } = await searchParams;
  const variant = (bg ?? "a") in GRADIENTS ? (bg ?? "a") : "a";
  const gradient = GRADIENTS[variant];
  const cardFade = CARD_FADES[variant];

  const latest = loadLatest("bcamp");
  const allDates = loadAllDates("bcamp");
  const byulbamLatest = loadLatest("byulbam");
  const byulbamDates = loadAllDates("byulbam");

  return (
    <>
      <style>{`body { background: ${gradient} !important; background-attachment: fixed !important; }`}</style>

      {/* 전환 탭 */}
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 16,
          zIndex: 9999,
          display: "flex",
          gap: 6,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {["a", "b", "c"].map((v) => (
          <Link
            key={v}
            href={`/preview?bg=${v}`}
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: 4,
              textDecoration: "none",
              background: variant === v ? "rgba(232,112,74,0.9)" : "rgba(255,255,255,0.08)",
              color: variant === v ? "#fff" : "rgba(255,255,255,0.5)",
              transition: "all 0.15s ease",
            }}
          >
            {v}
          </Link>
        ))}
        <Link
          href="/"
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 4,
            textDecoration: "none",
            color: "rgba(255,255,255,0.35)",
            marginLeft: 4,
          }}
        >
          ← 홈
        </Link>
      </div>

      <main className="px-8 max-w-[760px] mx-auto">
        <header className="pt-16 pb-10">
          <p
            className="text-xs tracking-[0.3em] uppercase font-semibold mb-8"
            style={{ color: "var(--sunset-orange)" }}
          >
            Korean Radio Archive
          </p>
          <h1
            className="font-black leading-none mb-5"
            style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)", letterSpacing: "-0.03em" }}
          >
            한국 라디오
            <br />
            음악 아카이브
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", maxWidth: "30rem" }}>
            배철수, DJ들이 직접 고른 곡들을 매일 기록합니다.
            <br />
            선곡표 + YouTube 링크 — 오늘 방송부터 1990년 아카이브까지.
          </p>
        </header>

        <div style={{ borderTop: "1px solid rgba(232, 112, 74, 0.25)", marginBottom: "2rem" }} />

        <section className="pb-16">
          <p
            className="text-xs tracking-[0.22em] uppercase font-medium mb-5"
            style={{ color: "var(--text-muted)", opacity: 0.5 }}
          >
            Programs
          </p>

          <div className="flex flex-col gap-4">
            {/* 배철수의 음악캠프 */}
            <Link
              href="/bcamp"
              className="group block transition-all overflow-hidden"
              style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
            >
              <div style={{ position: "relative", height: "140px", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bcamp-hero.png"
                  alt="배철수의 음악캠프"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: "brightness(0.65) saturate(1.05)" }}
                  className="group-hover:scale-[1.03] group-hover:brightness-75 transition-all duration-300"
                />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: cardFade.bcamp }} />
                <p style={{ position: "absolute", bottom: "0.75rem", left: "1rem", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8704a", opacity: 0.9, fontWeight: 600 }}>
                  MBC FM4U 91.9 · since 1990
                </p>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold leading-tight mb-1.5" style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}>배철수의 음악캠프</h2>
                    <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)", opacity: 0.65 }}>
                      매일 저녁 6시{allDates.length > 0 && ` · ${allDates.length}개 에피소드`}
                    </p>
                  </div>
                  <span className="text-lg shrink-0 mt-0.5 transition-transform duration-300 group-hover:translate-x-1" style={{ color: "#e8704a", opacity: 0.7 }}>→</span>
                </div>
                {latest && (
                  <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="inline-block font-semibold rounded-full shrink-0" style={{ background: "#e8704a", color: "#fff", fontSize: "9px", padding: "2px 7px" }}>NEW</span>
                    <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {formatDate(latest.date)} · {latest.songs.length}곡
                    </span>
                  </div>
                )}
              </div>
            </Link>

            {/* 별이 빛나는 밤에 */}
            {byulbamLatest && (
              <Link
                href="/byulbam"
                className="group block transition-all overflow-hidden"
                style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
              >
                <div style={{ position: "relative", height: "140px", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/byulbam-hero.png"
                    alt="별이 빛나는 밤에"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: "brightness(0.65) saturate(1.05)" }}
                    className="group-hover:scale-[1.03] transition-all duration-300"
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: cardFade.byulbam }} />
                  <p style={{ position: "absolute", bottom: "0.75rem", left: "1rem", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c4a84e", opacity: 0.9, fontWeight: 600 }}>
                    MBC FM4U 91.9 · since 1969
                  </p>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold leading-tight mb-1.5" style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}>별이 빛나는 밤에</h2>
                      <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)", opacity: 0.65 }}>
                        매일 밤 8시{byulbamDates.length > 0 && ` · ${byulbamDates.length}개 에피소드`}
                      </p>
                    </div>
                    <span className="text-lg shrink-0 mt-0.5 transition-transform duration-300 group-hover:translate-x-1" style={{ color: "#c4a84e", opacity: 0.7 }}>→</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="inline-block font-semibold rounded-full shrink-0" style={{ background: "#c4a84e", color: "#1a1408", fontSize: "9px", padding: "2px 7px" }}>NEW</span>
                    <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {formatDate(byulbamLatest.date)} · {byulbamLatest.songs.length}곡
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
