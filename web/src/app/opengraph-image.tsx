import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Wavelog — Korean Radio Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0f1923",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        {/* 배경 그라데이션 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(232,112,74,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(245,166,35,0.1) 0%, transparent 55%)",
          }}
        />

        {/* 레이블 */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#e8704a",
            marginBottom: 20,
            display: "flex",
          }}
        >
          Radio Station
        </div>

        {/* 프로그램명 */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            color: "#f0ebe3",
            marginBottom: 24,
            display: "flex",
          }}
        >
          배철수의 음악캠프
        </div>

        {/* 구분선 */}
        <div
          style={{
            width: 48,
            height: 2,
            background: "#e8704a",
            marginBottom: 24,
            display: "flex",
          }}
        />

        {/* 설명 */}
        <div
          style={{
            fontSize: 22,
            color: "#8a9bb0",
            lineHeight: 1.6,
            display: "flex",
          }}
        >
          1990년부터 이어진 라디오 선곡표 · 매일 YouTube 플레이리스트로
        </div>

        {/* 사이트명 — 우하단 */}
        <div
          style={{
            position: "absolute",
            bottom: 52,
            right: 72,
            fontSize: 15,
            color: "#8a9bb0",
            letterSpacing: "0.08em",
            opacity: 0.6,
            display: "flex",
          }}
        >
          Wavelog
        </div>
      </div>
    ),
    size
  );
}
