# K-Radio Archive — spec.md

> 이 파일이 유일한 기준 문서. 구 플랜 파일 (modular-munching-sedgewick.md, feedback_1_*.md)은 폐기.

---

## 서비스 정의

**K-Radio Archive** — 한국 라디오 DJ들의 선곡표를 매일 기록하고 YouTube 플레이리스트로 제공하는 아카이브 서비스.

- 단순 플레이리스트 연결이 아니라 **음악 큐레이션 역사의 보존**이 목적
- 1990년대부터 이어진 배철수의 선곡 철학을 데이터로 남긴다

---

## 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 크롤러 | Python 3.12, YouTube Data API v3 | GitHub Actions 자동 실행 |
| 데이터 | JSON → **SQLite** (Phase 2에서 전환) | `data/archive.db` |
| 웹 | Next.js 15 App Router, TypeScript, Tailwind | Vercel SSG 배포 |
| 인프라 | GitHub Actions (크롤), Vercel (웹) | |

---

## URL 구조 (확정)

```
/                        홈페이지 랜딩 (프로그램 카드)
/bcamp                   배철수의 음악캠프 허브 (최신 에피소드)
/bcamp/[date]            날짜별 에피소드
/byulbam                 별이 빛나는 밤 허브 (Phase 2)
/byulbam/[date]          날짜별 에피소드 (Phase 2)
/discover                통계/추천 페이지 (Phase 3)
/discover/artist/[name]  아티스트 선곡 이력 (Phase 3)
/sitemap.xml             자동 생성
```

구 `/date/[date]` → `/bcamp/[date]` 301 redirect 영구 유지

---

## 데이터 디렉토리 구조 (확정)

```
data/
  bcamp/                 배캠 에피소드 JSON + index.json  ← 현재 운영 중
  byulbam/               별밤 에피소드 JSON + index.json  (Phase 2에서 생성)
  song_cache.json        YouTube videoId 캐시 (프로그램 공유)
  archive.db             SQLite DB (Phase 2에서 추가)
  programs.json          프로그램 레지스트리 (Phase 2에서 추가)
```

---

## 추천/통계 기능 범위 (확정)

- **A. 선곡 빈도 통계** — "이번 달 배캠에서 많이 나온 곡 TOP N"
- **C. 아티스트 탐색** — "이 아티스트 배캠에서 몇 번 나왔나, 언제 나왔나"
- 크로스 프로그램 추천(B)은 범위 밖 — 프로그램마다 큐레이션 정체성이 다름
- 개인화(D)는 현재 범위 밖 — DB + 로그인 필요

---

## 브랜치 전략

```
main                     라이브 배포 (Vercel), GitHub Actions 기준
feat/k-radio-archive     현재 개발 브랜치 (IA 개편 + 구조 세팅)
```

- Phase 완료 시마다 feat → main merge
- Phase 2 착수 전 새 브랜치 생성

---

## 제약 조건

- Vercel SSG: 모든 데이터 읽기는 빌드 타임. 런타임 DB 쿼리 불가.
- SQLite는 `data/archive.db`를 git에 커밋해 빌드 타임 읽기로 해결
- YouTube API 쿼터: 10,000 units/day. 1곡 검색 = 100 units.
- GitHub Actions: main 브랜치 기준 실행

---

## Phase별 범위

### Phase 1 — 완료 ✅
- [x] `/bcamp/[date]` URL 구조 + redirect
- [x] 홈페이지 랜딩 (프로그램 카드)
- [x] `data/bcamp/` 디렉토리 분리
- [x] og:metadata + sitemap.xml
- [x] K-Radio Archive 브랜딩

### Phase 2 — SQLite 전환 + 두 번째 프로그램
- [ ] `data/archive.db` SQLite 스키마 설계
- [ ] 크롤러 → SQLite 쓰기 전환 (JSON 병행 유지 기간 결정)
- [ ] 웹 → SQLite 읽기 전환 (better-sqlite3)
- [ ] `data/programs.json` 프로그램 레지스트리
- [ ] 별이 빛나는 밤 크롤러 추가
- [ ] `/byulbam/[date]` 라우트

### Phase 3 — 통계 + 아카이브 UX
- [ ] 월별 선곡 빈도 통계 계산 (크롤러 실행 시 갱신)
- [ ] `/discover` 통계 페이지
- [ ] `/discover/artist/[name]` 아티스트 페이지
- [ ] 검색 기능 (정적 index.json 기반)
