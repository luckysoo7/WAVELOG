# K-Radio Archive — spec.md

> 유일한 기준 문서. 기획 변경 시 여기만 업데이트.
> 최종 수정: 2026-04-12

---

## 서비스 정의

**K-Radio Archive** — 한국 라디오 DJ들의 선곡표를 매일 기록하고 YouTube 플레이리스트로 제공하는 아카이브.

- 단순 플레이리스트 연결이 아니라 **음악 큐레이션 역사의 보존**이 목적
- 1990년대부터 이어진 배철수의 선곡 철학을 데이터로 남긴다

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 크롤러 | Python 3.12, YouTube Data API v3 (OAuth), GitHub Actions |
| DB | SQLite (`data/archive.db`) — git 커밋, 빌드 타임 읽기 |
| 웹 | Next.js 15 App Router + TypeScript + Tailwind, Vercel SSG |

---

## URL 구조

```
/                    홈페이지 랜딩 (프로그램 카드)
/bcamp               배철수의 음악캠프 허브 (최신 에피소드)
/bcamp/[date]        날짜별 에피소드
/byulbam             별이 빛나는 밤 허브          ← Phase 3
/byulbam/[date]      날짜별 에피소드              ← Phase 3
/discover            통계 / 추천                  ← Phase 4
/discover/artist/[name]  아티스트 선곡 이력       ← Phase 4
```

구 `/date/[date]` → `/bcamp/[date]` 301 redirect 영구 유지

---

## 데이터 구조

```
data/
  archive.db         SQLite (episodes, songs, programs 테이블)
  song_cache.json    YouTube videoId 캐시 (프로그램 공유)
```

SQLite 스키마 핵심:
- `programs`: id(bcamp/byulbam), name, slug, freq, start_year
- `episodes`: program_id, date, seq_id, youtube_playlist_id, match_count
- `songs`: episode_id, order_no, title, artist, video_id, matched, genre(nullable), year(nullable), play_count

---

## 추천/통계 범위 (확정)

- **선곡 빈도 통계** — 이번 달 많이 나온 곡 TOP N
- **아티스트 탐색** — 이 아티스트 몇 번, 언제 나왔나
- 크로스 프로그램 추천 — 범위 밖 (프로그램별 큐레이션 정체성 유지)
- 개인화 — 범위 밖 (DB + 로그인 필요)

---

## 브랜치 전략

- **main** — 라이브 배포, GitHub Actions 기준
- **feat/xxx** — Phase별 기능 브랜치. Phase 완료 시 main merge 후 삭제.

---

## Phase 현황

| Phase | 내용 | 상태 | 브랜치 |
|-------|------|------|--------|
| 1 | IA 개편 (URL + 홈페이지 + data/bcamp/) | ✅ main 배포 중 | — |
| 2 | SQLite 전환 | ✅ 완료, main merge 대기 | feat/sqlite |
| 3 | 별이 빛나는 밤 추가 | 🔲 미착수 | — |
| 4 | /discover 통계 페이지 | 🔲 미착수 | — |
