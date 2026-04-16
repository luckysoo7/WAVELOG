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
  const [headerVisible, setHeaderVisible] = useState(true);
  const pathname = usePathname();

  // 홈페이지에서는 모바일 헤더/드로어 불필요
  const isHome = pathname === "/";
  const isByulbam = pathname.startsWith("/byulbam");

  // 페이지 이동 시 드로어 자동 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 외부(PlaylistView 등)에서 드로어 열기 요청
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-drawer", handler);
    return () => window.removeEventListener("open-drawer", handler);
  }, []);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 스크롤 방향에 따라 헤더 자동 숨김/복귀
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      // 최상단 근처이거나 위로 스크롤하면 복귀
      if (currentY < 60 || currentY < lastY) {
        setHeaderVisible(true);
      } else {
        setHeaderVisible(false);
      }
      lastY = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isHome) return null;

  return (
    <>
      {/* 모바일 상단 헤더바 */}
      <header
        className="md:hidden flex items-center justify-between px-4 h-14 sticky top-0 z-10 shrink-0"
        style={{
          background: isByulbam ? "rgba(4,12,8,0.92)" : "rgba(12,10,5,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderBottom: `1px solid ${isByulbam ? "rgba(196,168,78,0.18)" : "rgba(232,112,74,0.18)"}`,
          transform: (headerVisible || isOpen) ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
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

        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wavelog-logo.svg"
            alt="Wavelog"
            style={{ height: "56px", width: "auto", opacity: 0.9 }}
          />
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
          aria-label={isByulbam ? "배철수의 음악캠프로 이동" : "김이나의 별이 빛나는 밤에로 이동"}
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
          background: "rgba(14, 11, 7, 0.98)",
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
