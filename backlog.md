# K-Radio Archive — backlog.md

> 다음에 할 것들. 우선순위 순.
> 완료 항목은 spec.md Phase 현황 참조.

---

## 지금 당장 — feat/sqlite → main merge

feat/sqlite 브랜치 Vercel 프리뷰 확인 완료됨.
main 머지 전 체크리스트:

- [x] npm run build 성공 (37페이지)
- [x] 4월 11일 YouTube 플리 복구
- [x] insert_episode COALESCE 버그 수정
- [ ] GitHub Actions 수동 실행 1회 확인 (새 에피소드가 DB에 잘 들어가는지)
- [ ] Vercel 프리뷰에서 최종 확인

---

## Phase 3 — 별이 빛나는 밤 추가

**착수 조건:** main이 SQLite 기반으로 안정적으로 운영 중일 때

- [ ] MBC 별밤 선곡표 URL 구조 조사 (bcamp와 같은 MBC 시스템 사용 여부)
- [ ] `crawler/byulbam_crawler.py` 작성
- [ ] `data/programs.json` 프로그램 레지스트리 (→ DB programs 테이블)
- [ ] GitHub Actions: 별밤 크롤링 스케줄 추가
- [ ] `/byulbam` + `/byulbam/[date]` 라우트
- [ ] 홈페이지 별밤 카드 활성화

---

## Phase 4 — /discover 통계 페이지

**착수 조건:** 배캠 데이터 3개월 이상 + SQLite 쿼리 검증 완료

- [ ] `/discover` 페이지 — 이번 달 TOP 30 선곡
- [ ] `/discover/artist/[name]` — 아티스트별 선곡 이력 + 날짜 목록
- [ ] 크롤러 실행 시 통계 사전 계산 (play_count 갱신)
- [ ] 검색 기능 (정적 index 기반, 빌드 타임 생성)

---

## 기술 부채 / 소소한 개선

- [ ] **레포 이름 변경** `bcamp-daily` → `k-radio-archive`
  (GitHub Settings → Rename. redirect 자동 처리)
- [ ] GitHub Actions 수동 트리거로 누락 에피소드 일괄 복구
  (4/6, 4/5, 4/4 등 YouTube 플리 없는 날짜들)
- [ ] og:image 실제 이미지 생성 (현재 텍스트 메타만)
- [ ] `not-found.tsx` 커스텀 404 페이지
- [ ] 사이드바 활성 날짜 자동 스크롤 (긴 목록에서 현재 날짜가 안 보임)

---

## 아이디어 보관함 (미결정)

- RSS 피드 `/feed.xml` — 팟캐스트 앱 연동
- 배철수 선곡 스타일 연도별 장르 변화 분석
- "이 날과 비슷한 에피소드" 추천
