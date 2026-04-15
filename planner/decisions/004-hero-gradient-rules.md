# ADR 004 — 히어로 그라데이션 레이어 규칙

**날짜:** 2026-04-15  
**상태:** 확정

## 배경

bcamp heroFade가 두 개의 레이어(수직 + 수평 vignette)를 썼고,
`transparent` 키워드와 pageBg와 다른 RGB를 혼용하여
데스크톱에서 두 개의 가시적 끊김(밴드)이 발생.

byulbam은 의도치 않게 일관된 색 패밀리를 써서 자연스럽게 보였음.

## 진단된 구조적 원인 3가지

### 1. CSS transparent 보간 버그
```css
/* ❌ transparent = rgba(0,0,0,0) — RGB가 0으로 수렴하며 회색 밴드 생성 */
rgba(13,11,6,0.97) 72%, transparent 100%

/* ✅ 동일 RGB, alpha만 0 */
rgba(24,20,16,0.97) 70%, rgba(24,20,16,0) 100%
```

### 2. pageBg 베이스 색과 heroFade 색 불일치
heroFade의 가장 어두운 색이 pageBg base와 RGB가 다르면,
fade가 투명해지는 순간 눈에 보이는 색 점프 발생.

**규칙:** heroFade에 사용하는 RGB = pageBg base color의 RGB여야 한다.

| 프로그램 | pageBg base | heroFade RGB |
|---------|-------------|--------------|
| bcamp   | `#181410` = rgba(24,20,16) | `rgba(24,20,16,X)` |
| byulbam | `#0a1a12` = rgba(10,26,18) | `rgba(5,16,10,X)` ← 근사값, 개선 여지 있음 |

### 3. 비단조(non-monotonic) 그라데이션
heroFade가 `어둠 → 투명 → 어둠` 패턴을 만들면 두 번의 경계가 생김.

```
❌ 비단조: 0.35 → 0 → 0 → 0.75 → 0.97 → 0  (밝아졌다 어두워짐)
✅ 단조:   0 → 0 → 0.62 → 0.95 → 0          (한 방향으로만)
```

상단 어둠 처리는 별도의 `heroBg` 레이어가 담당.
`heroFade`는 하단 디졸브 전용.

## 확정된 레이어 아키텍처

```
[heroBg]    — 이미지 상단 어둠 (top-to-transparent, 독립 레이어)
[image]     — brightness(0.48) 필터로 베이스 어둠
[heroFade]  — 하단 디졸브 전용, 단조증가, 동일 RGB 패밀리
[pageBg]    — 전체 페이지 컬러 스토리 (ambient blobs + base)
```

## 규칙 (신규 프로그램 추가 시 체크리스트)

- [ ] `heroFade`의 모든 색 stop이 `pageBg` base RGB와 동일한 RGB를 사용하는가?
- [ ] `heroFade`가 `transparent` 키워드를 쓰지 않는가? (`rgba(R,G,B,0)` 형태만 허용)
- [ ] `heroFade`의 opacity가 상단→하단으로 단조증가하는가? (중간에 올라갔다 내려오는 구간 없음)
- [ ] `heroBg`와 `heroFade`가 역할 분리되어 있는가? (상단=heroBg, 하단=heroFade)

## 수평 vignette 레이어 금지

```css
/* ❌ 금지: 좌우 dark edge를 별도 레이어로 추가하면 색 스토리 분열 */
linear-gradient(to right, rgba(13,11,6,0.7) 0%, transparent 25%, ...)

/* ✅ 좌우 어둠이 필요하면 pageBg ambient blob으로 처리 */
radial-gradient(ellipse 60% 80% at 30% 50%, rgba(R,G,B,0.09) ...)
```
