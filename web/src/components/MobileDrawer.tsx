"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";
import type { DateEntry } from "@/lib/data";

interface MobileDrawerProps {
  bcampDates: DateEntry[];
  byulbamDates: DateEntry[];
}

export default function MobileDrawer({ bcampDates, byulbamDates }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 홈페이지에서는 모바일 헤더/드로어 불필요
  const isHome = pathname === "/";
  const isByulbam = pathname.startsWith("/byulbam");
  const programName = isByulbam ? "별이 빛나는 밤에" : "배철수의 음악캠프";

  // 페이지 이동 시 드로어 자동 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (isHome) return null;

  return (
    <>
      {/* 모바일 상단 헤더바 */}
      <header
        className="md:hidden flex items-center justify-between px-4 h-14 sticky top-0 z-10 shrink-0"
        style={{
          background: "rgba(15,25,35,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col justify-center gap-1.5 w-8 h-8"
          aria-label="메뉴 열기"
        >
          <span className="block h-px w-5" style={{ background: "var(--text-primary)" }} />
          <span className="block h-px w-5" style={{ background: "var(--text-primary)" }} />
          <span className="block h-px w-3" style={{ background: "var(--text-primary)" }} />
        </button>

        <Link href="/" className="flex flex-col items-center gap-0.5">
          <span
            className="text-xs tracking-[0.18em] uppercase font-semibold"
            style={{ color: "var(--sunset-orange)", opacity: 0.85 }}
          >
            K-Radio Archive
          </span>
          <span
            className="text-xs font-semibold tracking-tight"
            style={{ color: "var(--text-muted)" }}
          >
            {programName}
          </span>
        </Link>

        {/* 우측: 다른 프로그램으로 빠른 전환 */}
        <Link
          href={isByulbam ? "/bcamp" : "/byulbam"}
          className="flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-opacity hover:opacity-100"
          style={{
            color: isByulbam ? "#e8704a" : "#c4a84e",
            opacity: 0.65,
            fontSize: "9px",
            gap: "2px",
            letterSpacing: "0.05em",
            fontWeight: 700,
          }}
          aria-label={isByulbam ? "배철수의 음악캠프로 이동" : "별이 빛나는 밤에로 이동"}
        >
          <span style={{ fontSize: "13px", lineHeight: 1 }}>⇄</span>
          <span>{isByulbam ? "배캠" : "별밤"}</span>
        </Link>
      </header>

      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* 드로어 패널 */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-72 md:hidden flex flex-col transition-transform duration-300 ease-out overflow-y-auto"
        style={{
          background: "rgba(15, 25, 35, 0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* 닫기 버튼 */}
        <div className="flex justify-end px-4 pt-4 shrink-0">
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-sm"
            aria-label="메뉴 닫기"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        <Sidebar bcampDates={bcampDates} byulbamDates={byulbamDates} />
      </div>
    </>
  );
}
