# DESIGN.md — Wavelog

레퍼런스: Apple Music 방송국(Radio Station) × 레트로 라디오 아카이브
무드: "밤 라디오. 오래된 선곡표를 꺼내보는 느낌. 따뜻하고 깊은 다크."

---

## Color Palette

현재 토큰 (globals.css 기준, 변경 시 여기 먼저 업데이트):

```css
:root {
  /* 배경 레이어 */
  --deep-navy:    #0f1923;   /* 최하단 배경 */
  --card-bg:      #1a2535;   /* 카드/패널 */

  /* 텍스트 */
  --text-primary: #f0ebe3;   /* 본문 — 따뜻한 오프화이트 */
  --text-muted:   #8a9bb0;   /* 보조 — 쿨 그레이블루 */

  /* 액센트 — Apple Music Radio 감성 */
  --sunset-orange: #e8704a;  /* 주 액센트 (CTA, 활성 상태) */
  --sunset-gold:   #f5a623;  /* 보조 액센트 (날짜, 배지) */
}
```

**컬러 사용 규칙:**
- 액센트 2색은 동시에 한 화면에 쓰지 않는다. 오렌지 OR 골드 중 하나만.
- 배경은 항상 `--deep-navy` 계열. 순수 검정(#000) / 순수 흰색(#fff) 금지.
- 텍스트 대비: 4.5:1 이상 필수.

---

## Typography

```css
font-family: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
/* CDN: https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css */
```

| 역할 | Weight | Size (기준) |
|------|--------|------------|
| 날짜/에피소드 타이틀 | 700 | 1.25rem |
| 곡명 | 500 | 0.95rem |
| 아티스트/메타 | 400 | 0.8rem |
| 캡션/저작권 | 400 | 0.7rem |

**금지:** Inter, Noto Sans (시스템 기본폰트 fallback에만 허용)

---

## Spacing & Layout

- Grid unit: 8px
- 카드 내부 padding: 16px (2u)
- 섹션 간격: 24px (3u)
- 사이드바 너비: 220px fixed
- 콘텐츠 max-width: 760px

---

## 무드 레퍼런스 — Apple Music Radio 특징

Apple Music 방송국 UI에서 가져올 것:
- **에피소드 카드**: 날짜 + 방송 제목 + 트랙 수 — 심플하게
- **선곡 목록**: 번호 + 곡명 + 아티스트 — 줄 간격 넉넉히
- **배경 그라데이션**: 커버 이미지 색에서 추출한 ambient 배경 (Apple 특유의 블러 그라데이션)
- **타이포 위계**: 방송 날짜가 가장 크고 굵게, 곡명은 중간, 아티스트는 muted

---

## 금지 목록

- [ ] Tailwind `indigo-*`, `slate-*`, `gray-*` 기본값 직접 사용
- [ ] `bg-white`, `text-black` 직접 사용
- [ ] shadcn 컴포넌트 무수정 사용
- [ ] Inter 폰트
- [ ] 그림자(shadow) 과용 — Apple Music은 그림자 거의 없음, 레이어로 깊이 표현

---

## Paper MCP 루프 기준

스크린샷 체크 시 Wavelog 전용 추가 항목:
- 라디오/음악 감성이 느껴지는가? (기술 대시보드처럼 보이면 실패)
- 사이드바 날짜 목록이 읽기 편한가?
- 배너 → 콘텐츠 전환이 자연스러운가?
