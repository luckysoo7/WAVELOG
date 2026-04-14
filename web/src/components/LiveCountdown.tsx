"use client";

import { useEffect, useState } from "react";

interface Props {
  broadcastHour: number;  // KST 시작 시각 (18 or 20)
  durationHours: number;  // 방송 길이 (2)
  accent: string;
}

function getKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const total = kst.getUTCHours() * 3600 + kst.getUTCMinutes() * 60 + kst.getUTCSeconds();
  return { h: kst.getUTCHours(), total };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function LiveCountdown({ broadcastHour, durationHours, accent }: Props) {
  const [tick, setTick] = useState<ReturnType<typeof getKST> | null>(null);
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    setTick(getKST());
    const id = setInterval(() => {
      setTick(getKST());
      setColonVisible((v) => !v);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!tick) return null;

  const start = broadcastHour * 3600;
  const end = (broadcastHour + durationHours) * 3600; // 별밤은 86400 초과 → % 처리
  const isLive = tick.total >= start && tick.total < Math.min(end, 86400);

  let remaining: number;
  if (isLive) {
    remaining = Math.min(end, 86400) - tick.total;
  } else {
    remaining = start - tick.total;
    if (remaining < 0) remaining += 86400;
  }

  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);
  const ss = remaining % 60;

  const nextLabel = broadcastHour === 18 ? "오늘 저녁 6시" : "오늘 밤 8시";
  const progressPct = isLive
    ? ((tick.total - start) / (durationHours * 3600)) * 100
    : ((86400 - remaining) / 86400) * 100;

  return (
    <div
      style={{
        marginTop: "4rem",
        paddingTop: "2.5rem",
        paddingBottom: "1rem",
        borderTop: `1px solid ${accent}18`,
        textAlign: "center",
        position: "relative",
      }}
    >
      {isLive ? (
        /* ── 방송 중 ── */
        <>
          {/* 라이브 배지 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: `${accent}18`,
              border: `1px solid ${accent}40`,
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: accent,
                display: "inline-block",
                boxShadow: `0 0 8px ${accent}`,
                animation: "live-pulse 1.4s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.22em",
                color: accent,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              LIVE NOW
            </span>
          </div>

          {/* 종료까지 */}
          <p
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              color: "var(--text-muted)",
              opacity: 0.5,
              textTransform: "uppercase",
              marginBottom: "0.6rem",
            }}
          >
            방송 종료까지
          </p>

          <div
            style={{
              fontFamily: "'Pretendard Variable', monospace",
              fontSize: "clamp(2.2rem, 9vw, 3.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#f0ebe3",
              lineHeight: 1,
              marginBottom: "1.5rem",
            }}
          >
            {pad(hh)}
            <span style={{ opacity: colonVisible ? 0.35 : 0.1, margin: "0 2px" }}>:</span>
            {pad(mm)}
            <span style={{ opacity: colonVisible ? 0.35 : 0.1, margin: "0 2px" }}>:</span>
            {pad(ss)}
          </div>

          {/* 진행 바 */}
          <div
            style={{
              margin: "0 auto 0.75rem",
              maxWidth: "200px",
              height: "2px",
              borderRadius: "2px",
              background: "rgba(138,155,176,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: accent,
                opacity: 0.7,
                borderRadius: "2px",
                transition: "width 1s linear",
              }}
            />
          </div>

          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", opacity: 0.4 }}>
            MBC FM4U 91.9MHz
          </p>
        </>
      ) : (
        /* ── 방송 전 ── */
        <>
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              color: "var(--text-primary)",
              opacity: 0.85,
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            다음 방송까지
          </p>

          <div
            style={{
              fontFamily: "'Pretendard Variable', monospace",
              fontSize: "clamp(2.6rem, 10vw, 4.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#f0ebe3",
              lineHeight: 1,
              marginBottom: "1.25rem",
              textShadow: `0 0 80px ${accent}20`,
            }}
          >
            {pad(hh)}
            <span style={{ opacity: colonVisible ? 0.6 : 0.2, margin: "0 1px" }}>:</span>
            {pad(mm)}
            <span style={{ opacity: colonVisible ? 0.6 : 0.2, margin: "0 1px" }}>:</span>
            <span style={{ opacity: 0.85 }}>{pad(ss)}</span>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 14px",
              borderRadius: "4px",
              border: "1px solid rgba(138,155,176,0.35)",
              marginBottom: "0.75rem",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "rgba(138,155,176,0.7)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                opacity: 0.85,
              }}
            >
              {nextLabel} · MBC FM4U 91.9
            </span>
          </div>
        </>
      )}
    </div>
  );
}
