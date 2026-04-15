# Wavelog — 스펙 (MASTER)

최종 업데이트: 2026-04-15 (세션 3)

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
/byulbam             별이 빛나는 밤 허브
/byulbam/[date]      날짜별 에피소드
/discover            통계 / 추천                  ← Later
/discover/artist/[name]  아티스트 선곡 이력       ← Later
```

구 `/date/[date]` → `/bcamp/[date]` 301 redirect 영구 유지

---

## 로드맵 — Now / Next / Later

### 🟢 Now

**YouTube 주간 영상 — Sprint 1 (로컬 생성)**
- `crawler/weekly_video.py` 작성
- DB에서 프로그램별 지난 7일 상위 곡 추출 + 다양성 필터
- yt-dlp 오디오 다운로드 → FFmpeg MP4 합성 (정적 배경 + 곡명 자막 + 챕터 메타)
- 업로드는 Sprint 1에서 수동, 파일 생성까지만 자동화
- 전제: `crawler/weekly_video_sprint1.md` 완료

### 🔵 Next

- **YouTube 주간 영상 — Sprint 2 (자동 업로드)**: YouTube Data API `videos.insert` + GitHub Actions 주간 스케줄. 쿼터 계산: 업로드 2회(3200) + match.yml(4500) = 7700/일 → 한도 10,000 이내 OK. 업로드일 = 별도 스케줄 (일요일 오후).
- 레포 이름 변경 (`bcamp-daily` → `k-radio-archive`)

### 🟡 Later

**/discover 통계 페이지**
- 전제: 배캠 데이터 3개월 이상
- TOP 30 선곡, 아티스트 탐색, 검색

**아이디어 보관함**
- RSS 피드 `/feed.xml`
- 배철수 선곡 스타일 연도별 장르 분석
- "이 날과 비슷한 에피소드" 추천

### ⏸ Parked

- 개인화 추천 — DB + 로그인 필요, 범위 밖
- 크로스 프로그램 추천 — 프로그램별 큐레이션 정체성 유지 원칙으로 제외
- 트랙 앨범 메타데이터 (MB/Last.fm) — 데이터 품질 문제로 보류

---

## 아키텍처 결정 로그

| # | 결정 | 상태 | 파일 |
|---|------|------|------|
| 001 | SQLite DB 전환 (JSON → DB) | ✅ 확정 | `decisions/001-sqlite-db.md` |
| 002 | SSG 전략 (빌드 타임 DB 읽기) | ✅ 확정 | `decisions/002-ssg-strategy.md` |
| 003 | 크롤/매핑 분리 + 쿼터 인터리브 | ✅ 확정 | `decisions/003-crawl-match-split.md` |
| 004 | 히어로 그라데이션 레이어 아키텍처 | ✅ 확정 | `decisions/004-hero-gradient-rules.md` |
| 005 | YouTube 주간 영상 자동화 방향 | ✅ 확정 | `decisions/005-youtube-weekly-video.md` |

---

## 현재 상태 (2026-04-15 세션 3)

| 컴포넌트 | 상태 | 비고 |
|---------|------|------|
| 홈페이지 + IA 개편 | ✅ 배포 중 | 사이드바 홈에서 숨김, 카피 개선 |
| SQLite 전환 | ✅ 배포 중 | Actions 검증 완료 |
| GitHub Actions 크롤러 | ✅ 배포 중 | match.yml 만 실행 (crawl 스케줄 일시 중지) |
| 크롤/매핑 분리 아키텍처 | ✅ 배포 중 | crawl.py + match.py 완전 분리 |
| byulbam YouTube 매핑 | ✅ 배포 중 | match.yml 백필 인터리브 진행 중 |
| DSOTM 디자인 테마 | ✅ 배포 중 | 스펙트럼 컬러, 앰비언트 글로우 |
| 트랙 tap → YouTube 버튼 | ✅ 배포 중 | 매칭/미매칭 구분 없이 동일 토글 동작 |
| YouTube 조회수 배지 | ✅ 배포 중 | top-5 금색/은색, 매일 backfill_views 갱신 |
| 별이 빛나는 밤 (김이나) | ✅ 배포 중 | 방송시각 밤 8시 반영, 프로그램명 풀네임 |
| 프로그램별 히어로 이미지 | ✅ 배포 중 | CSS Grid stacking, hero-fixed 오버랩 |
| 크로스 프로그램 네비게이션 | ✅ 배포 중 | Sidebar 탭 스위처, MobileDrawer, 하단 바 |
| Sidebar 연도 구분선 | ✅ 배포 중 | 연도 경계마다 액센트 색상 헤더 |
| 히어로 헤딩 구조 개편 | ✅ 배포 중 | 프로그램명(대) → 날짜+연도(소), 글자수 비례 vw |
| 날짜 칩 UX | ✅ 배포 중 | 모바일 전용 5개 + 전체› 버튼, backdrop blur |
| 다음 방송 카운트다운 | ✅ 배포 중 | KST 기준 실시간, LIVE NOW 펄스 배지 |
| 저작권 DisclaimerButton | ✅ 배포 중 | 팝업, 법적 고지 4개 항목 |
| 크롤러 유틸 통합 | ✅ 완료 | crawler/utils.py 추출, 5개 파일 중복 제거 |
| validate.py 개선 | ✅ 완료 | byulbam 커버리지 추가, 실패 시 sys.exit(1) |
| /discover 통계 | ❌ 미착수 | Later |
| YouTube 주간 영상 생성 | 🔄 Sprint 1 진행 중 | `sprints/weekly_video_sprint1.md` |
