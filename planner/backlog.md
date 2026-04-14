# K-Radio Archive — 백로그

> 세션 시작 시 "오늘은 [항목] 할게" → 바로 진행.
> ⚠️ = DB/스키마 변경 수반

---

## ✅ 완료

**2026-04-15 세션**
- [x] crawl/match 분리 아키텍처 재설계 (crawl.py + match.py)
- [x] byulbam YouTube 매핑 통합 (match.yml 백필, 1:1 인터리브)
- [x] PST 타이밍 버그 수정 (07:10→08:15 UTC)
- [x] 곡 단위 오류 격리 (add_to_playlist + DB 원자성)
- [x] has_playlist 빈 플리 UI 버그 수정 (match_count > 0 조건)
- [x] 홈페이지 사이드바 숨김 (ConditionalAside, pathname="/")
- [x] 홈페이지 카피 개선 ("알고리즘 추천에 질렸을 때" 훅)
- [x] 하단 네비바 데스크톱 확장 (md:hidden 제거, left: 18rem 오프셋)
- [x] 크로스 프로그램 네비게이션 — Sidebar [배캠|별밤] 탭, MobileDrawer ⇄ 버튼, 하단 바 중앙 전환
- [x] 하단/상단 바 색상 현대화 (프로그램별 색감 + 액센트 테두리)
- [x] YouTube/Music 버튼 라벨 명확화 ("▶ YouTube로 전체 듣기" / "♪ Music으로 전체 듣기")

**이전 세션**
- [x] MBC 별밤 선곡표 URL 구조 조사
- [x] `crawler/byulbam_crawler.py` 작성
- [x] programs 테이블 `byulbam` 레지스트리 추가 ⚠️
- [x] GitHub Actions: 별밤 크롤링 스케줄 추가
- [x] `/byulbam` + `/byulbam/[date]` 라우트
- [x] 홈페이지 별밤 카드 활성화
- [x] 프로그램별 히어로 이미지 + ambient 컬러 테마
- [x] hero-fixed 오버랩 디자인
- [x] UX 구조 개선 — 매핑 상태 칩, 날짜 칩(A)+하단 바(B)
- [x] DSOTM 디자인 (스펙트럼 구분선, 트랙 번호 컬러링, 앰비언트 글로우)
- [x] 트랙 hover/tap → YouTube 버튼 슬라이드 패널
- [x] feat/sqlite → main merge (Actions 검증, 409 버그 수정)
- [x] 사이드바 활성 날짜 자동 스크롤
- [x] not-found.tsx 커스텀 404
- [x] og:image 소셜 썸네일

---

## 🔵 Next

- [ ] 레포 이름 변경 `bcamp-daily` → `k-radio-archive`

---

## 🟡 Later

- [ ] `/discover` TOP 30 선곡 (3개월 데이터 후)
- [ ] `/discover/artist/[name]` 아티스트 이력
- [ ] 검색 기능 (빌드 타임 static index)
- [ ] RSS 피드 `/feed.xml`
- [ ] 배철수 선곡 스타일 연도별 장르 분석
- [ ] "이 날과 비슷한 에피소드" 추천
