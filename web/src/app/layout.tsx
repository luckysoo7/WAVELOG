import type { Metadata, Viewport } from "next";
import "./globals.css";
import ConditionalAside from "@/components/ConditionalAside";
import MobileDrawer from "@/components/MobileDrawer";
import ConditionalFooter from "@/components/ConditionalFooter";
import { loadAllDates } from "@/lib/data";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  themeColor: "#0f1923",
};

export const metadata: Metadata = {
  title: {
    default: "Wavelog — Korean Radio Archive",
    template: "%s | Wavelog",
  },
  description: "배철수의 음악캠프 등 한국 라디오 선곡표를 매일 YouTube 플레이리스트로 기록합니다. 1990년부터 이어진 라디오 음악 아카이브.",
  openGraph: {
    siteName: "Wavelog",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const bcampDates = loadAllDates("bcamp");
  const byulbamDates = loadAllDates("byulbam");

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
          {/* 좌측 사이드바 — 프로그램 페이지에서만 표시 (/ 홈에서는 숨김) */}
          <ConditionalAside bcampDates={bcampDates} byulbamDates={byulbamDates} />

          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0 flex flex-col">
            <MobileDrawer bcampDates={bcampDates} byulbamDates={byulbamDates} />
            <div className="flex-1">{children}</div>

            <ConditionalFooter />
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
