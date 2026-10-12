// Shoots every recreated app screen (src/screens) to an image for the 3D device screens.
// Needs the dev server running: npm run dev -- --port 5310, then:
//   node tools/render-screens.mjs [baseUrl=http://127.0.0.1:5310] [ids...]
// Web screens are shot at 2x (2880×1800), phone screens at 3x (1206×2622), saved as WebP in
// public/screens/.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = process.argv[2] ?? "http://127.0.0.1:5310";
const only = process.argv.slice(3);
const out = fileURLToPath(new URL("../public/screens/", import.meta.url));
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const list = await (async () => {
  const page = await browser.newPage();
  await page.goto(`${base}/?screens`, { waitUntil: "networkidle" });
  const ids = await page.$$eval("figcaption a", (as) => as.map((a) => new URL(a.href).searchParams.get("screen")));
  await page.close();
  return ids.filter((id) => id && (!only.length || only.includes(id)));
})();

for (const id of list) {
  const phone = id.startsWith("phone");
  const page = await browser.newPage({
    viewport: phone ? { width: 402, height: 874 } : { width: 1440, height: 900 },
    deviceScaleFactor: phone ? 3 : 2,
  });
  await page.goto(`${base}/?screen=${id}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const png = await page.locator("#screen").screenshot({ type: "png" });
  await sharp(png).webp({ quality: 90 }).toFile(`${out}${id}.webp`);
  console.log("✓", id);
  await page.close();
}
await browser.close();
