/**
 * visual-check.mjs — CSS 레이아웃 변경 후 반드시 실행
 * 사용: node scripts/visual-check.mjs
 * 결과: /tmp/vc_*.png — Read 툴로 직접 확인 가능
 */
import { chromium } from './node_modules/playwright/index.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ROUTES = ['/bcamp', '/byulbam'];
const VIEWPORTS = [
  { width: 390,  height: 844,  name: 'mobile_390' },
  { width: 768,  height: 1024, name: 'md_boundary_768' },
  { width: 884,  height: 1024, name: 'zfold4_884' },
  { width: 1280, height: 900,  name: 'desktop_1280' },
];

const browser = await chromium.launch();
const saved = [];

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
    const name = `${route.replace('/', '')}_${vp.name}`;
    const path = `/tmp/vc_${name}.png`;
    await page.screenshot({ path, fullPage: false });
    saved.push(path);
    await page.close();
  }
}

await browser.close();
console.log('=== SAVED ===');
saved.forEach(p => console.log(p));
