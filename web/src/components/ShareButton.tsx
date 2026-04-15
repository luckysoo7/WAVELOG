"use client";

interface Props {
  title: string;   // 예: "배철수의 음악캠프 2026년 4월 15일"
  url?: string;    // 기본값: 현재 URL
}

export default function ShareButton({ title, url }: Props) {
  if (typeof navigator === "undefined" || !navigator.share) return null;

  const handleShare = async () => {
    try {
      await navigator.share({ title, url: url ?? window.location.href });
    } catch {
      // 사용자가 취소한 경우 등 — 무시
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label="에피소드 공유"
      className="shrink-0"
      style={{
        background: "rgba(255,255,255,0.1)",
        border: "none",
        borderRadius: "4px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: "0.75rem",
        color: "#f0ebe3",
        opacity: 0.75,
        lineHeight: 1,
      }}
    >
      공유 ↗
    </button>
  );
}
