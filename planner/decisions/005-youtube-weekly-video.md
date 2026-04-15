# ADR 005 — YouTube 주간 영상 자동화 방향

**날짜:** 2026-04-15  
**상태:** ✅ 확정  
**결정자:** 영수 (`feedback_1_youtube_video.md` 답변 기반)

---

## 배경

K-Radio Archive가 라디오 선곡표를 DB로 보관 중.
YouTube 재생목록 자동 생성은 이미 동작하지만, 영상(MP4) 형태로 유튜브 채널에
올리면 알고리즘 노출 + 팬 커뮤니티 유입 채널 추가 가능.
"라디오 DJ가 고른 주간 베스트"라는 큐레이션 신뢰도가 일반 알고리즘 플리와 차별화 포인트.

---

## 결정 요약

| 항목 | 결정 | 대안 | 선택 이유 |
|------|------|------|-----------|
| 저작권 접근 | yt-dlp 실용주의 | 화면 녹화, 쇼츠만 제작 | 수천 채널의 선례. Content ID 클레임 시 수익화로 전환 가능. |
| 영상 포맷 | 정적 배경 + 곡명 자막 | 앨범아트 슬라이드 | 앨범아트 매칭률이 낮아 실제로 쓸 수 없음. |
| 편성 | bcamp 1개 + byulbam 1개 = 주 2개 | 합본 1개 | 각 프로그램 팬층이 다름. 채널 정체성 별도 유지. |
| 선곡 알고리즘 | 조회수 상위 + 다양성 필터 | 순수 조회수, 편집장 큐레이션 | 완전 자동화 가능하면서 아티스트 편중 방지. |
| 채널 | 기존 OAuth 계정 | YouTube Brand Account 신규 개설 | 즉시 시작. 리스크 발생 시 추후 분리 검토. |
| 인프라 | GitHub Actions | VPS, Cloudflare Workers | 기존 인프라 재활용. 추가 비용 없음. |
| MVP 방식 | Sprint 1 반자동 → Sprint 2 완전 자동 | 처음부터 완전 자동화 | 저작권 클레임 패턴 파악 4주 필요. |

---

## 쿼터 분석

- YouTube Data API 일일 한도: 10,000 units
- `videos.insert` 비용: 1,600 units/호출
- 주 2회 업로드 (bcamp + byulbam): 3,200 units
- match.yml 일일 소비: 최대 4,500 units (backfill 활발한 날)
- 업로드일 합계: 최대 7,700 units → **한도 이내** ✅
- 여유: 2,300 units (재시도 1회 가능)

업로드 스케줄을 match.yml 백필이 가벼운 날(일요일)로 고정하면 안전.

---

## 리스크

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| yt-dlp YouTube 서버 차단 | 중간 | 재시도 로직 + 실패 시 해당 곡 skip |
| Content ID Block (채널 스트라이크) | 낮음-중간 | 비공개 테스트 → 48시간 대기 → 패턴 확인 후 공개 |
| 한국 레이블 Monetize 대신 Block 선택 | 낮음 | 해당 곡 제거 후 재업로드. 3회 이상이면 곡 블랙리스트 |
| yt-dlp GitHub 리포 삭제 | 낮음 | fork 유지 또는 mirror 사용 |

---

## 관련 파일

- `crawler/weekly_video.py` — 구현 대상
- `planner/sprints/weekly_video_sprint1.md` — Sprint 1 계약
- `data/used_video_ids.json` — 이전 주 사용 video_id 추적 (생성 예정)
