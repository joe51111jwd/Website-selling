// Render cover HTML files to print PNGs and PDFs with the pre-installed Chromium (Playwright).
//   node src/render.cjs src/covers/a-stack.html out/flat/a-stack         -> a-stack.png (+ .pdf)
//   node src/render.cjs src/covers/wrap.html out/wrap/wrap --spine 0.9   -> any query args are passed on
// The page's size is read from its .page element, so the same script renders fronts and full wraps.
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const [src, outBase, ...rest] = process.argv.slice(2);
  const q = new URLSearchParams();
  for (let i = 0; i < rest.length; i += 2) q.set(rest[i].replace(/^--/, ""), rest[i + 1]);
  const url = "file://" + path.resolve(src) + (q.toString() ? "?" + q : "");
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--disable-web-security"] }); // the wrap reads its laid-in front and spine (local files only)
  const page = await browser.newPage({ viewport: { width: 4000, height: 3000 }, deviceScaleFactor: 1 });
  page.on("console", (m) => console.log("[page]", m.text()));
  page.on("pageerror", (e) => console.log("[page error]", e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const box = await page.$eval(".page", (el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
  await page.setViewportSize({ width: box.w, height: box.h });
  await page.addStyleTag({ content: "html,body{background:transparent!important}" });
  await page.locator(".page").screenshot({ path: outBase + ".png" });
  if (!q.get("guides")) {
    // vector PDF at the exact print size, fonts embedded (RGB: the printer converts to CMYK)
    // the page size is set in CSS (@page) so Chromium never swaps a wide wrap to portrait
    await page.addStyleTag({ content: `@page { size: ${box.w / 300}in ${box.h / 300}in; margin: 0 }` });
    await page.pdf({ path: outBase + ".pdf", preferCSSPageSize: true, printBackground: true, pageRanges: "1", scale: 96 / 300 }); // CSS px are 1/96 in; ours are 1/300 in
  }
  console.log("wrote", outBase, box);
  await browser.close();
})();
