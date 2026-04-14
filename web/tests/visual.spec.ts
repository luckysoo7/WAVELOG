/**
 * visual.spec.ts — 반응형 레이아웃 회귀 테스트
 *
 * 과거에 실제로 발생한 버그 3종을 자동으로 잡는다:
 *   1. hero letterbox (object-fit: contain → 바닥에 빈 공간)
 *   2. date-overlap 미적용 (margin shorthand이 margin-top 덮어쓰기)
 *   3. 날짜 타이포 두 줄 깨짐 (vw 단위가 사이드바 고려 안 함)
 *
 * 뷰포트는 playwright.config.ts의 projects에서 주입됨.
 */
import { test, expect, Page } from "@playwright/test";

// 항상 존재하는 날짜를 직접 지정 (latest redirect가 dev에서 불안정한 경우 대비)
const ROUTES = [
  { path: "/bcamp/2026-04-12", label: "bcamp" },
  { path: "/byulbam",          label: "byulbam" },
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

    // ── 2. date-overlap이 hero 안으로 파고듦 ─────────────────
    test("date-overlap이 hero 하단 안으로 겹친다 (음수 margin-top)", async ({ page }) => {
      const marginTop = await page
        .locator(".date-overlap")
        .evaluate((el) => parseFloat(getComputedStyle(el).marginTop));

      expect(marginTop, "margin-top이 음수여야 hero와 overlap").toBeLessThan(0);
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
