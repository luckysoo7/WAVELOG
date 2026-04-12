import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-start justify-center min-h-screen px-10 md:px-16"
      style={{ maxWidth: "480px" }}
    >
      <p
        className="text-xs tracking-[0.22em] uppercase font-semibold mb-6"
        style={{ color: "var(--sunset-orange)" }}
      >
        404
      </p>
      <h1
        className="font-black leading-none mb-4"
        style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
      >
        선곡표를
        <br />
        찾을 수 없어요
      </h1>
      <p
        className="text-sm leading-relaxed mb-10"
        style={{ color: "var(--text-muted)", lineHeight: "1.8" }}
      >
        방송이 없었던 날이거나
        <br />
        잘못된 주소일 수 있습니다.
      </p>
      <Link
        href="/bcamp"
        className="text-sm font-semibold transition-opacity hover:opacity-70"
        style={{ color: "var(--sunset-orange)" }}
      >
        ← 최신 에피소드로
      </Link>
    </div>
  );
}
