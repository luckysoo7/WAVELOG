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
          <div className="flex-1 min-w-0 flex flex-col">
            {/* 프로그램 배너 — MBC 서버 직접 참조 (hotlink) */}
            <div className="relative w-full overflow-hidden" style={{ height: "180px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="//img.imbc.com/broad/radio/fm4u/musiccamp/v2/setting/homepage/__icsFiles/afieldfile/2020/06/18/b9_640_360_1.JPG"
                alt="배철수의 음악캠프"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "brightness(0.45)" }}
              />
              {/* 배너 위 로고 + 프로그램명 */}
              <div className="relative z-10 flex items-end h-full px-6 pb-5">
                <div>
                  <img
                    src="/logo.png"
                    alt="배철수의 음악캠프 로고"
                    className="h-10 mb-1 opacity-95"
                    style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}
                  />
                  <p className="text-xs tracking-widest" style={{ color: "rgba(240,235,227,0.55)" }}>
                    MBC FM4U · 매일 저녁 6시
                  </p>
                </div>
              </div>
              {/* 하단 페이드 */}
              <div
                className="absolute bottom-0 left-0 right-0 h-12"
                style={{ background: "linear-gradient(to bottom, transparent, var(--deep-navy))" }}
              />
            </div>

            {/* 페이지 본문 */}
            <div className="flex-1">{children}</div>

            {/* 모바일 저작권 (사이드바 없을 때) */}
            <footer
              className="md:hidden px-6 py-4 border-t text-xs leading-relaxed"
              style={{
                borderColor: "rgba(138,155,176,0.12)",
                color: "var(--text-muted)",
                opacity: 0.5,
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
