# K-Radio Archive — 스펙 (MASTER)

최종 업데이트: 2026-04-12

> 이 파일이 단일 진실 공급원(SSOT).
> 구조적 결정은 `decisions/`에 ADR로 기록.
> 세부 작업은 `backlog.md`에.

---

## 제품 비전

한국 라디오 DJ들의 선곡표를 매일 기록하고 YouTube 플레이리스트로 제공하는 아카이브.
단순 플레이리스트 연결이 아니라 **음악 큐레이션 역사의 보존**이 목적.
1990년대부터 이어진 배철수의 선곡 철학을 데이터로 남긴다.

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
/byulbam             별이 빛나는 밤 허브          ← Next
/byulbam/[date]      날짜별 에피소드              ← Next
/discover            통계 / 추천                  ← Later
/discover/artist/[name]  아티스트 선곡 이력       ← Later
```

구 `/date/[date]` → `/bcamp/[date]` 301 redirect 영구 유지

---

## 로드맵 — Now / Next / Later

### 🟢 Now

**DSOTM 디자인 — 배캠 페이지 비주얼 아이덴티티**
- PlaylistView 스펙트럼 테마 적용 (구분선, 트랙 번호 컬러링, 앰비언트 글로우)
- Pink Floyd DSOTM 앨범 컨셉: DJ = 프리즘, 선곡 = 스펙트럼

### 🔵 Next

**별이 빛나는 밤 추가** — MBC 별밤 크롤러 + `/byulbam` 라우트
- 전제: feat/sqlite merge 후 2주 이상 안정 운영 확인

**기술 부채 처리** — merge 완료 후 바로 가능
- 레포 이름 변경 (`bcamp-daily` → `k-radio-archive`)
- 누락 에피소드 복구 (4/4, 4/5, 4/6 등)
- 사이드바 활성 날짜 자동 스크롤

### 🟡 Later

**/discover 통계 페이지**
- 전제: 배캠 데이터 3개월 이상 + SQLite 쿼리 검증 완료
- TOP 30 선곡, 아티스트 탐색, 검색

**아이디어 보관함**
- RSS 피드 `/feed.xml`
- 배철수 선곡 스타일 연도별 장르 분석
- "이 날과 비슷한 에피소드" 추천

### ⏸ Parked

- 개인화 추천 — DB + 로그인 필요, 범위 밖
- 크로스 프로그램 추천 — 프로그램별 큐레이션 정체성 유지 원칙으로 제외

---

## 아키텍처 결정 로그

| # | 결정 | 상태 | 파일 |
|---|------|------|------|
| 001 | SQLite DB 전환 (JSON → DB) | ✅ 확정 | `decisions/001-sqlite-db.md` |
| 002 | SSG 전략 (빌드 타임 DB 읽기) | ✅ 확정 | `decisions/002-ssg-strategy.md` |

---

## 현재 상태 (2026-04-12)

| 컴포넌트 | 상태 | 비고 |
|---------|------|------|
| 홈페이지 + IA 개편 | ✅ main 배포 중 | Phase 1 완료 |
| SQLite 전환 | ✅ main 배포 중 | Phase 2 완료, Actions 검증 완료 |
| GitHub Actions 크롤러 | ✅ 매일 22:00 KST | SQLite 기반으로 정상 운영 중 |
| 별이 빛나는 밤 | ❌ 미착수 | Next 단계 |
| /discover 통계 | ❌ 미착수 | 3개월 데이터 필요 |
