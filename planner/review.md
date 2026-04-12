# K-Radio Archive — 오케스트레이션 리뷰

**리뷰 일자**: 2026-04-13

---

## 플래그 요약

| 심각도 | 항목 | 요약 |
|--------|------|------|
| 🔴 | — | 없음 |
| 🟡 | 레포 이름 변경 상태 불일치 | backlog `[x]` 체크됐지만 GitHub 레포명 여전히 `bcamp-daily` |
| 🟡 | sitemap.ts 도메인 하드코딩 | `bcamp-daily.vercel.app` 하드코딩 (환경변수 처리 미완) |
| 🟡 | migrate.py / get_token.py 용도 주석 없음 | 일회성 스크립트임이 코드 내에 표시 안 됨 |
| 🟢 | 레거시 코드 | JSON 구 파일 완전 제거, 죽은 코드 없음 |
| 🟢 | 코드 중복 | 의도적 분산만 존재 (Sidebar vs PlaylistView 날짜 포맷) |
| 🟢 | 계획 충돌 | spec.md Now 항목 실제 완료됨, 코드와 일치 |
| 🟢 | URL 라우팅 | 301 redirect, 모든 라우트 spec 일치 |
| 🟢 | GitHub Actions | SQLite 전환 이후 워크플로우 완전 동기화 |
| 🟢 | TypeScript | strict mode, any 없음, null 처리 명시 |
| 🟢 | DB 스키마 | 정규화 우수, UNIQUE 제약, 향후 /discover 컬럼 미리 예약 |

---

## 권고 액션

1. **backlog.md L21 수정** — 레포 이름 변경 항목을 `[ ]`로 되돌리거나, 실제 GitHub 레포명 변경
2. **sitemap.ts** — `NEXT_PUBLIC_SITE_URL` 환경변수로 도메인 관리
3. **migrate.py / get_token.py** — 파일 상단에 일회성 스크립트임을 명시하는 docstring 추가

---

## 종합 평가

**A 등급 — Production Ready**

즉시 수정이 필요한 항목 없음. 크롤러-DB-SSG 파이프라인 안정 운영 중.
개선사항 3건 모두 문서화/환경변수 레벨이며 기능에 영향 없음.
