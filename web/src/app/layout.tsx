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
          {/* 좌측 사이드바 — 데스크톱 전용 */}
          <aside
            className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen overflow-y-auto"
            style={{ borderRight: "1px solid rgba(138, 155, 176, 0.12)" }}
          >
            <Sidebar dates={dates} />
          </aside>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
