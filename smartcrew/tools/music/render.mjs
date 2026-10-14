#!/usr/bin/env node
// Renders the ride's placeholder beat (./beat.js) in a headless browser and writes
// public/audio/ride.mp3 (loudness-normalised with ffmpeg). Keep a WAV copy with --wav=<path>.
//
//   node tools/music/render.mjs [--wav=/tmp/ride.wav]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = require("/opt/node22/lib/node_modules/playwright"));
}
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const wavArg = process.argv.find((a) => a.startsWith("--wav="))?.slice(6);
const wav = wavArg ?? join(tmpdir(), `ride-beat-${process.pid}.wav`);

const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", (e) => console.error(String(e)));
await p.setContent("<!doctype html><title>beat</title>");
await p.addScriptTag({ content: readFileSync(new URL("./beat.js", import.meta.url), "utf8") });
const t0 = Date.now();
const b64 = await p.evaluate(() => window.renderBeat());
await b.close();
writeFileSync(wav, Buffer.from(b64, "base64"));
console.log(`rendered in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${wav}`);

mkdirSync(join(ROOT, "public/audio"), { recursive: true });
const out = join(ROOT, "public/audio/ride.mp3");
// a straight gain to -1 dB peak (no dynamic processing: the drops keep their size)
const probe = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${wav}" -af astats=metadata=0 -f null - 2>&1 | grep "Peak level dB" | tail -1`], { encoding: "utf8" });
const peak = parseFloat(probe.split(":").pop());
const gain = (-1 - peak).toFixed(2);
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", wav, "-af", `volume=${gain}dB`, "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "160k", out]);
console.log(`peak ${peak} dB → gain ${gain} dB`);
console.log(`→ ${out}`);
