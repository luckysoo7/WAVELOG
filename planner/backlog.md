# K-Radio Archive — 백로그

> 세션 시작 시 "오늘은 [항목] 할게" → 바로 진행.
> 완료된 것은 ~~취소선~~ 처리.
> ⚠️ = DB/스키마 변경 수반 (SQLite merge 후 또는 Later로)

---

## Now — feat/sqlite → main merge

- [ ] GitHub Actions 수동 실행 1회 확인 (새 에피소드 DB 입력 확인)
- [ ] Vercel 프리뷰 최종 확인
- [x] npm run build 성공 (37페이지)
- [x] 4월 11일 YouTube 플리 복구
- [x] insert_episode COALESCE 버그 수정

---

## Next — 기술 부채 (merge 완료 후 바로 가능)

- [ ] 레포 이름 변경 `bcamp-daily` → `k-radio-archive`
- [ ] GitHub Actions 수동 트리거로 누락 에피소드 복구 (4/4, 4/5, 4/6)
- [x] 사이드바 활성 날짜 자동 스크롤
- [x] `not-found.tsx` 커스텀 404 페이지
- [ ] og:image 실제 이미지 생성

---

## Next — 별이 빛나는 밤 (SQLite 안정 후)

- [ ] MBC 별밤 선곡표 URL 구조 조사
- [ ] `crawler/byulbam_crawler.py` 작성
- [ ] programs 테이블 레지스트리 추가 ⚠️
- [ ] GitHub Actions: 별밤 크롤링 스케줄 추가
- [ ] `/byulbam` + `/byulbam/[date]` 라우트
- [ ] 홈페이지 별밤 카드 활성화

---

## Later — /discover 통계 (3개월 데이터 후)

- [ ] `/discover` — 이번 달 TOP 30 선곡
- [ ] `/discover/artist/[name]` — 아티스트별 이력
- [ ] play_count 집계 로직 ⚠️
- [ ] 검색 기능 (빌드 타임 static index)

---

## 아이디어 보관함

- [ ] RSS 피드 `/feed.xml`
- [ ] 배철수 선곡 스타일 연도별 장르 변화 분석
- [ ] "이 날과 비슷한 에피소드" 추천
