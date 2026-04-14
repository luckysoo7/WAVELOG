/**
 * visual.spec.ts — 반응형 레이아웃 회귀 테스트
 *
 * 과거에 실제로 발생한 버그 3종을 자동으로 잡는다:
 *   1. hero letterbox (object-fit: contain → 바닥에 빈 공간)
 *   2. hero/date stacking context 깨짐 (date가 hero 하단과 분리되어 gap 발생)
 *   3. 날짜 타이포 두 줄 깨짐 (vw 단위가 사이드바 고려 안 함)
 */
import { test, expect } from "@playwright/test";

// 항상 존재하는 날짜를 직접 지정 (latest redirect가 dev에서 불안정한 경우 대비)
const ROUTES = [
  { path: "/bcamp/2026-04-12", label: "bcamp" },
  { path: "/byulbam",          label: "byulbam" },
];

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 900 },
];

for (const route of ROUTES) {
  test.describe(`[${route.label}] 반응형 레이아웃`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
    });

    // ── 1. hero letterbox 없음 ────────────────────────────────
    test("hero 이미지가 컨테이너를 완전히 채운다 (cover)", async ({ page }) => {
      const objectFit = await page
        .locator(".hero-fixed-img")
        .evaluate((el) => getComputedStyle(el).objectFit);

      expect(objectFit, "object-fit이 cover여야 함 — contain이면 letterbox 발생").toBe("cover");
    });

    // ── 2. date-overlap이 hero 하단과 분리되지 않음 ───────────
    for (const viewport of VIEWPORTS) {
      test(`hero와 날짜 제목 사이에 gap이 없다 (${viewport.name})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path, { waitUntil: "networkidle" });

        const geometry = await page.evaluate(() => {
          const hero = document.querySelector(".hero-fixed");
          const date = document.querySelector(".date-overlap");
          const heading = document.querySelector('[data-testid="date-heading"]');

          if (!hero || !date || !heading) {
            return null;
          }

          const heroRect = hero.getBoundingClientRect();
          const dateRect = date.getBoundingClientRect();
          const headingRect = heading.getBoundingClientRect();

          return {
            heroBottom: heroRect.bottom,
            dateTop: dateRect.top,
            headingTop: headingRect.top,
          };
        });

        expect(geometry, "hero/date 요소가 렌더링되어야 함").not.toBeNull();
        expect(
          geometry!.dateTop,
          `date-overlap top(${geometry!.dateTop}px)이 hero bottom(${geometry!.heroBottom}px)보다 아래로 떨어지면 gap 발생`
        ).toBeLessThanOrEqual(geometry!.heroBottom + 2);
        expect(
          geometry!.headingTop,
          `date heading top(${geometry!.headingTop}px)이 hero bottom(${geometry!.heroBottom}px)보다 아래로 떨어지면 gap 발생`
        ).toBeLessThanOrEqual(geometry!.heroBottom + 2);
      });
    }

    test("date-overlap이 음수 margin 대신 hero stacking context에 놓인다", async ({ page }) => {
      const styles = await page.locator(".date-overlap").evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          gridArea: computed.gridArea,
          marginTop: parseFloat(computed.marginTop),
          transform: computed.transform,
        };
      });

      expect(styles.marginTop, "독립적인 음수 margin-top overlap을 사용하지 않아야 함").toBeGreaterThanOrEqual(0);
      expect(styles.gridArea, "hero와 같은 grid area에서 overlap되어야 함").toContain("stack");
      expect(styles.transform, "hero 기준 translate로 아래쪽 protrusion을 만들어야 함").not.toBe("none");
    });

    // ── 3. 날짜 타이포 한 줄 ─────────────────────────────────
    test("날짜 제목이 한 줄로 렌더링된다", async ({ page }) => {
      const heading = page.getByTestId("date-heading");
      const fontSize = await heading.evaluate(
        (el) => parseFloat(getComputedStyle(el).fontSize)
      );
      const box = await heading.boundingBox();

      expect(box, "date-heading 요소가 화면에 있어야 함").not.toBeNull();
      expect(
        box!.height,
        `높이(${box!.height}px)가 font-size(${fontSize}px)의 2배 미만이어야 한 줄`
      ).toBeLessThan(fontSize * 2);
    });

    // ── 4. 스크린샷 (artifact로 업로드됨) ────────────────────
    test("스크린샷 캡처", async ({ page }, testInfo) => {
      await page.screenshot({
        path: `test-results/screenshots/${route.label}_${testInfo.project.name}.png`,
        fullPage: false,
      });
    });
  });
}
