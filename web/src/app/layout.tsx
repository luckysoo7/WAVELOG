import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { loadAllDates } from "@/lib/data";

export const metadata: Metadata = {
  title: "배철수의 음악캠프 플레이리스트",
  description: "매일 방송되는 배철수의 음악캠프 선곡표를 YouTube 플레이리스트로.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const dates = loadAllDates();

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="flex min-h-screen">
          {/* 좌측 사이드바 — glassmorphism, 데스크톱 전용 */}
          <aside
            className="hidden md:flex flex-col w-72 shrink-0 sticky top-0 h-screen overflow-y-auto"
            style={{
              background: "rgba(255, 255, 255, 0.025)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRight: "1px solid rgba(255, 255, 255, 0.07)",
            }}
          >
            <Sidebar dates={dates} />
          </aside>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1">{children}</div>

            {/* 모바일 저작권 (사이드바 없을 때) */}
            <footer
              className="md:hidden px-6 py-4 border-t text-xs leading-relaxed"
              style={{
                borderColor: "rgba(138,155,176,0.08)",
                color: "var(--text-muted)",
                opacity: 0.45,
              }}
            >
              ⓒ MBC · 배철수의 음악캠프 — 방송 콘텐츠 저작권은 MBC에 있습니다
              <br />
              unofficial fan site · not affiliated with MBC
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
