// Renders the bold look's terrain (public/bold/) from terrain.html in headless Chromium.
//   node shoot.mjs <query> <out.png> <w> <h>
// terrain.html must be served on 127.0.0.1:5399 from a folder that also holds a `three` link to
// node_modules/three. The shipped art: "p=desk" at 3840x2160 and "p=phone" at 1560x1560, each
// downsampled by half and saved as webp (quality 80, method 6) to public/bold/terrain.webp and
// terrain-phone.webp.
import { createRequire } from "module";
const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");
const [qs, out, w, h] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`http://127.0.0.1:5399/terrain.html?w=${w}&h=${h}&${qs}`);
await p.waitForFunction(() => window.__done === true, null, { timeout: 120000 }).catch(() => {});
if (errs.length) console.log(errs.join("\n").slice(0, 2000));
await p.screenshot({ path: out });
await b.close();
