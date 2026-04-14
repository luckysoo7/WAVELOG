# K-Radio Archive — 백로그

> 세션 시작 시 "오늘은 [항목] 할게" → 바로 진행.
> ⚠️ = DB/스키마 변경 수반

---

## ✅ 완료

**2026-04-15 세션 1**
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

**2026-04-15 세션 2**
- [x] MBC 공식 URL 수정 (/camp/→/musiccamp/, /byulnight/→/starnight/)
- [x] 프로그램명 업데이트 — "김이나의 별이 빛나는 밤에" 전체 반영
- [x] 히어로 헤딩 구조 개편 — 프로그램명(대) / 날짜+연도(소) / 방송정보
- [x] 날짜 칩 UX — 모바일 전용 5개 + 전체› 버튼 (CustomEvent 드로어 연동)
- [x] 방송정보 + 진행바 한 줄 레이아웃 (flex:1 가변)
- [x] 날짜 칩 backdrop blur + 가독성 개선
- [x] 글자수 비례 vw 분리 (배캠 9.2vw/별밤 6.8vw, 데스크톱 동일 수렴)
- [x] crawl 스케줄 일시 중지, match.yml 만 운영
- [x] DisclaimerButton — 저작권 팝업 (fixed 중앙 정렬, 법적 고지)
- [x] ConditionalFooter — 홈페이지 저작권 중복 제거
- [x] 다음 방송 실시간 카운트다운 (LiveCountdown, KST, LIVE NOW 배지)
- [x] MBC favicon 하단 바 버튼
- [x] KBS 라디오 3개 프로그램 backlog 등록 (가요광장, 볼륨높여요, 출발FM)

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

### 라디오 프로그램 확장

- [ ] **가요광장 (KBS Cool FM 89.1MHz)** — 이수지 DJ, 1981년~, 가요 중심. 배캠 직후 슬롯(저녁 8~10시). KBS 선곡표 URL 구조 확인 필요. 기존 크롤러 재사용 가능성 높음.
- [ ] **볼륨을 높여요 (KBS Cool FM 89.1MHz)** — 수현 DJ, 아침 슬롯. 팝/록 중심으로 음악 비중 높음. 시간대 다양화 (아침/저녁/밤 분할).
- [ ] **출발 FM과 함께 (KBS Classic FM 93.1MHz)** — 1991년~, 아침 6~9시. 클래식 장르 진입. YouTube 매칭 로직 별도 분기 필요 (작곡가/지휘자/오케스트라 구조). 퍼블릭 도메인 곡 많아 매칭 영상은 풍부함.

- [ ] Apple Music MusicKit 연동 — "내 Apple Music에 추가" 버튼. $99/년 Developer Program 필요, API 호출은 무료. 사용자 수요 확인 후 진행.

- [ ] `/discover` TOP 30 선곡 (3개월 데이터 후)
- [ ] `/discover/artist/[name]` 아티스트 이력
- [ ] 검색 기능 (빌드 타임 static index)
- [ ] RSS 피드 `/feed.xml`
- [ ] 배철수 선곡 스타일 연도별 장르 분석
- [ ] "이 날과 비슷한 에피소드" 추천
