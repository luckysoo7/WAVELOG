# K-Radio Archive — backlog.md

> Phase 2+ 예정 항목. 우선순위 순서로 정렬.
> 완료된 항목은 spec.md Phase 1 체크리스트 참조.

---

## Sprint 2 — SQLite 전환 (Phase 2 준비)

**목표:** JSON 기반에서 SQLite로 전환. 크롤러 + 웹 동시 리팩터링.

### 스키마 설계 (먼저 확정)
```sql
programs (id TEXT PK, name TEXT, slug TEXT, freq TEXT, ...)
episodes (id INTEGER PK, program_id, date TEXT, day_of_week, seq_id, source, youtube_playlist_id, created_at)
songs (id INTEGER PK, episode_id FK, order_no, title, artist, video_id, matched)
```

### 크롤러 작업
- [ ] `crawler/db.py` — SQLite 읽기/쓰기 모듈
- [ ] `crawler/main.py` — JSON 대신 SQLite 쓰기
- [ ] 기존 JSON → SQLite 마이그레이션 스크립트
- [ ] JSON 병행 출력 유지 여부 결정 (전환 기간)

### 웹 작업
- [ ] `web/src/lib/data.ts` — better-sqlite3 기반 재작성
- [ ] 빌드 타임 SQLite 읽기 검증 (Vercel)

---

## Sprint 3 — 별이 빛나는 밤 추가 (Phase 2 본체)

- [ ] MBC 별밤 선곡표 크롤러 (`crawler/byulbam_crawler.py`)
- [ ] `data/programs.json` 프로그램 레지스트리 추가
- [ ] `/byulbam` + `/byulbam/[date]` 라우트
- [ ] 홈페이지 별밤 카드 활성화
- [ ] GitHub Actions: 별밤 크롤링 스케줄 추가

---

## Sprint 4 — 통계 + 디스커버 (Phase 3)

- [ ] 크롤러 실행 시 `data/stats/` 사전 계산 갱신
  - 월별 TOP 30 선곡
  - 아티스트별 출현 횟수
- [ ] `/discover` 페이지 (이번 달 인기 선곡)
- [ ] `/discover/artist/[name]` 아티스트 선곡 이력

---

## 기술 부채 / 개선

- [ ] GitHub Actions: `data/bcamp/` 경로 변경 후 Actions 로그 확인
- [ ] Vercel 도메인 커스텀 설정 (서비스 안정화 후)
- [ ] GitHub 레포 이름 변경 `bcamp-daily` → `k-radio-archive`
  - GitHub에서 직접: Settings → Rename repository
  - redirect 자동 처리됨
- [ ] og:image 실제 이미지 생성 (현재 텍스트만)
- [ ] 에러 페이지 (`not-found.tsx`) 디자인

---

## 아이디어 / 미결

- 배철수 선곡 스타일 분석 (연도별 장르 변화)
- "이 날 방송과 비슷한 에피소드" 추천
- RSS 피드 (`/feed.xml`) — 팟캐스트 앱 연동 가능성
