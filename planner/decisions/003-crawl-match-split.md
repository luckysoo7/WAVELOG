# ADR 003 — 크롤/매핑 분리 + 쿼터 인터리브

날짜: 2026-04-15

## 결정

MBC 크롤링(crawl.py)과 YouTube 매핑(match.py)을 완전히 분리.
배캠/별밤 백필을 1:1 인터리브로 동일 비율 처리.

## 배경

- 기존: main.py 단일 진입점 — 크롤 실패 시 YouTube API 쿼터 낭비
- byulbam 에피소드 30개가 dry-run으로만 DB에 저장됨 (YouTube 매핑 0%)
- 하루 쿼터 10,000 units로 배캠/별밤 백필을 동시에 처리해야 함

## 선택한 구조

| 워크플로우 | 시간 | budget | 역할 |
|-----------|------|--------|------|
| crawl-bcamp.yml | 22:20 KST | 2,500 | 배캠 크롤 + 당일 매핑 |
| crawl-byulbam.yml | 00:20 KST | 3,000 | 별밤 크롤 + 당일 매핑 |
| match.yml | 17:15 KST | 4,500 | 전체 백필 (90일, 1:1 인터리브) |

- 세 워크플로우 모두 `concurrency: group: youtube-api` — 동시 실행 방지
- match.yml 타이밍: 08:15 UTC — PDT(07:00) + PST(08:00) 양쪽 리셋 이후 안전

## 결과

- crawl 실패가 YouTube 쿼터에 영향 없음
- playlist_id를 DB에 먼저 저장 후 곡 매핑 → 재실행 시 중복 플리 생성 방지
- 배캠/별밤 백필이 동일 비율로 처리됨
