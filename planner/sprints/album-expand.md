# Sprint Contract — 트랙 확장 패널 + 앨범아트

## 구현 범위

hover(PC) / 클릭(모바일) 시 트랙 아래로 슬라이드다운 패널 표시.
MusicBrainz + Cover Art Archive에서 앨범아트·앨범명·발매연도를 크롤러 단에서 DB에 저장.

## 변경 파일

| 파일 | 변경 내용 |
|------|---------|
| `crawler/db.py` | songs 테이블 컬럼 추가 (ALTER TABLE 마이그레이션), insert/get에 새 필드 |
| `crawler/musicbrainz_client.py` | 신규 — MusicBrainz 검색 + CAA 이미지 조회 |
| `crawler/main.py` | YouTube 매칭 후 MB 조회 단계 추가 (3.5/4) |
| `web/src/lib/data.ts` | Song 인터페이스 + 쿼리에 새 필드 |
| `web/src/components/PlaylistView.tsx` | "use client" + 확장 패널 UI |

## 성공 기준

- [ ] songs 테이블에 `mbid`, `album_name`, `album_art_url`, `release_year` 컬럼 존재
- [ ] 기존 DB 데이터 손상 없음 (ALTER TABLE idempotent)
- [ ] MusicBrainz 검색 → CAA 이미지 URL 정상 반환
- [ ] PC: 트랙 hover 시 패널 슬라이드다운, 마우스 떠나면 닫힘
- [ ] 모바일: 트랙 탭 시 패널 토글, YouTube 버튼으로 이동
- [ ] 앨범아트 없는 곡: 패널에 텍스트 정보 + YouTube 버튼만 표시
- [ ] `npm run build` 성공
