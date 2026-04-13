# K-Radio Archive — 백로그

> 세션 시작 시 "오늘은 [항목] 할게" → 바로 진행.
> ⚠️ = DB/스키마 변경 수반

---

## ✅ 완료

- [x] MBC 별밤 선곡표 URL 구조 조사
- [x] `crawler/byulbam_crawler.py` 작성
- [x] programs 테이블 `byulbam` 레지스트리 추가 ⚠️
- [x] GitHub Actions: 별밤 크롤링 스케줄 추가 (`byulbam.yml`, 00:00/01:30 KST)
- [x] `/byulbam` + `/byulbam/[date]` 라우트
- [x] 홈페이지 별밤 카드 활성화 (데이터 있으면 활성, 없으면 COMING SOON)
- [x] 프로그램별 히어로 이미지 + ambient 컬러 테마 (배캠 오렌지·골드 / 별밤 딥 틸)
- [x] hero-fixed 오버랩 디자인 — 날짜가 이미지 하단 안으로 파고들어 경계 제거
- [x] DSOTM 디자인 (스펙트럼 구분선, 트랙 번호 컬러링, 앰비언트 글로우)
- [x] 트랙 hover/tap → YouTube 버튼 슬라이드 패널
- [x] feat/sqlite → main merge (Actions 검증, 409 버그 수정)
- [x] 사이드바 활성 날짜 자동 스크롤
- [x] not-found.tsx 커스텀 404
- [x] og:image 소셜 썸네일

---

## 🔵 Next — 기술 부채

- [ ] 레포 이름 변경 `bcamp-daily` → `k-radio-archive`

---

## 🟡 Later

- [ ] `/discover` TOP 30 선곡 (3개월 데이터 후)
- [ ] `/discover/artist/[name]` 아티스트 이력
- [ ] 검색 기능 (빌드 타임 static index)
- [ ] RSS 피드 `/feed.xml`
- [ ] 배철수 선곡 스타일 연도별 장르 분석
- [ ] "이 날과 비슷한 에피소드" 추천
