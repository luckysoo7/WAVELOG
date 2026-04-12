# ADR-001: SQLite DB 전환 (JSON 파일 → DB)

날짜: 2026-04-12
상태: 확정 (feat/sqlite 브랜치, merge 대기)

## 배경

초기에는 날짜별 JSON 파일(`data/YYYY-MM-DD.json`)로 에피소드 데이터를 저장했음.
서비스가 커지면서 아티스트 탐색, 통계, 중복 체크 등의 쿼리가 필요해짐.
JSON 파일 구조로는 크로스 에피소드 쿼리가 불가능.

## 결정

**SQLite(`data/archive.db`)로 전환.** git 커밋 포함, Vercel 빌드 타임에 읽기.

## 이유

- 크로스 에피소드 쿼리 가능 (아티스트 탐색, TOP N 통계 등 Phase 4 전제)
- 별밤 추가 시 프로그램 구분이 DB에서 자연스럽게 처리됨
- Vercel SSG + SQLite = 빌드 타임에 DB 읽어서 정적 HTML 생성 → 런타임 DB 불필요

## 스키마 핵심

- `programs`: id, name, slug, freq, start_year
- `episodes`: program_id, date, seq_id, youtube_playlist_id, match_count
- `songs`: episode_id, order_no, title, artist, video_id, matched

## 결과

Phase 4(/discover 통계)와 별밤 추가(Phase 3) 모두 이 DB 구조 위에서 동작.
SQLite → 향후 PostgreSQL 전환 시 `db.py` 추상화만 교체하면 됨.
