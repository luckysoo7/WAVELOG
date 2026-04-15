# Wavelog — Korean Radio Archive

한국 라디오 DJ 선곡표를 매일 자동 크롤링해 YouTube 플레이리스트로 만들고 Next.js 웹으로 표시하는 서비스.

## 기술 스택
- Python 크롤러 (YouTube Data API v3, OAuth 2.0)
- Next.js 15 App Router + TypeScript + Tailwind CSS
- Vercel 배포, GitHub Actions (매일 22:00 KST 자동 실행)

## 디렉토리
- `crawler/` — Python 크롤러
- `web/` — Next.js 앱 (Vercel root directory)
- `data/` — YYYY-MM-DD.json 저장

## Design System
@DESIGN.md
