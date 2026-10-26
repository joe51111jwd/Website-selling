// The share card (public/og.jpg) is a screenshot of the real hero, live fire and all.
//
//   npm run dev -- --port 5190    (in another terminal)
//   node scripts/og.cjs [http://localhost:5190/]
//
// Needs Playwright with Chromium (npx playwright install chromium if it isn't already there).
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const url = process.argv[2] || "http://localhost:5190/";
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 690 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "load" });
  await page.addStyleTag({ content: ".nav, .hero-pick { display: none !important; }" });
  await page.waitForSelector(".hero.in");
  await page.waitForTimeout(2600); // letters down, fire up
  const out = path.join(__dirname, "..", "public", "og.jpg");
  await page.screenshot({ path: out, type: "jpeg", quality: 86, clip: { x: 0, y: 40, width: 1200, height: 630 } });
  await browser.close();
  console.log("wrote", out);
})();
