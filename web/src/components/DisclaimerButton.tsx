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
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="저작권 안내"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          border: "1px solid rgba(138,155,176,0.3)",
          color: "var(--text-muted)",
          fontSize: "9px",
          fontWeight: 600,
          cursor: "pointer",
          background: "transparent",
          verticalAlign: "middle",
          marginLeft: "5px",
          opacity: 0.5,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
      >
        ?
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            width: "280px",
            background: "#1a2535",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "14px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 50,
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "8px",
              letterSpacing: "0.02em",
            }}
          >
            저작권 안내
          </p>
          <ul
            style={{
              fontSize: "10.5px",
              color: "var(--text-muted)",
              lineHeight: 1.65,
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <li>· 방송 콘텐츠(음원·영상) 저작권은 MBC 및 저작권자에게 있습니다.</li>
            <li>· 이 서비스는 곡명·아티스트 등 사실 정보만 수집하며, 음원을 저장하거나 재생하지 않습니다.</li>
            <li>· MBC robots.txt는 해당 선곡표 페이지의 접근을 허용하고 있습니다.</li>
            <li>· K-Radio Archive는 MBC와 무관한 비공식 팬 프로젝트이며, 비영리로 운영됩니다.</li>
          </ul>
          <p
            style={{
              fontSize: "9.5px",
              color: "var(--text-muted)",
              opacity: 0.45,
              marginTop: "10px",
            }}
          >
            문제가 있을 경우 GitHub Issues로 알려주세요.
          </p>
        </div>
      )}
    </div>
  );
}
