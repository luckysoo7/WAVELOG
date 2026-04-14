"use client";

import { useState, useRef, useEffect } from "react";

export default function DisclaimerButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="저작권 안내"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "15px",
          height: "15px",
          borderRadius: "50%",
          border: "1px solid rgba(138,155,176,0.6)",
          color: "var(--text-muted)",
          fontSize: "9px",
          fontWeight: 700,
          cursor: "pointer",
          background: "transparent",
          verticalAlign: "middle",
          marginLeft: "5px",
          opacity: 1,
          transition: "opacity 0.15s",
        }}
      >
        ?
      </button>

      {open && (
        <>
          {/* 배경 딤 */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 49,
            }}
          />
          {/* 팝업 — 화면 중앙 하단 고정 */}
          <div
            style={{
              position: "fixed",
              bottom: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(300px, calc(100vw - 2rem))",
              background: "#1e2d40",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              padding: "16px 18px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              zIndex: 50,
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "10px",
                letterSpacing: "0.02em",
              }}
            >
              저작권 안내
            </p>
            <ul
              style={{
                fontSize: "10.5px",
                color: "var(--text-primary)",
                lineHeight: 1.7,
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <li>· 방송 콘텐츠(음원·영상) 저작권은 MBC 및 저작권자에게 있습니다.</li>
              <li>· 곡명·아티스트 등 사실 정보만 수집하며, 음원을 저장하거나 재생하지 않습니다.</li>
              <li>· MBC robots.txt는 해당 선곡표 페이지의 접근을 허용하고 있습니다.</li>
              <li>· 비공식 팬 프로젝트이며 비영리로 운영됩니다.</li>
            </ul>
            <p
              style={{
                fontSize: "9.5px",
                color: "var(--text-muted)",
                marginTop: "10px",
              }}
            >
              문제가 있을 경우 GitHub Issues로 알려주세요.
            </p>
          </div>
        </>
      )}
    </span>
  );
}
