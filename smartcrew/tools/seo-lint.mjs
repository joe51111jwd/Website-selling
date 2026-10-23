// Checks SEO page files (src/seo/pages/**) for the writing rules in src/seo/WRITING.md that a
// machine can catch: words that read as AI filler, em dashes, "Founding Member", and missing
// sections. Usage: node tools/seo-lint.mjs [file…]  (no args: every page)
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const dir = resolve(import.meta.dirname, "../src/seo/pages");
const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => readdirSync(join(dir, d.name)).filter((f) => f.endsWith(".ts")).map((f) => join(dir, d.name, f)));

const BANNED = [
  "delve", "robust", "seamless", "seamlessly", "streamline", "game-changer", "game changer", "in today's", "in today’s", "landscape",
  "leverage", "unlock", "empower", "elevate", "comprehensive", "navigate", "navigating", "crucial", "moreover", "furthermore",
  "additionally", "in conclusion", "whether you're", "whether you’re", "look no further", "cutting-edge", "state-of-the-art",
  "revolutionize", "supercharge", "tailored", "holistic", "synergy", "paradigm", "ever-evolving", "fast-paced", "plethora",
  "myriad", "embark", "harness", "dive into", "let's dive", "it's worth noting", "it’s worth noting", "rest assured", "testament",
  "founding member", "best-in-class", "world-class", "one-stop shop", "hassle-free", "effortless",
];
let bad = 0;
const seen = { title: new Map(), description: new Map() };
let enDashFiles = 0;
const warn = [];
for (const f of files) {
  const s = readFileSync(f, "utf8");
  const low = s.toLowerCase();
  const problems = [];
  for (const w of BANNED) {
    const re = new RegExp(`\\b${w.replace(/[-’']/g, (c) => `\\${c}`)}\\b`, "g");
    const n = (low.match(re) || []).length;
    if (n) problems.push(`"${w}" ×${n}`);
  }
  const dashes = (s.match(/—/g) || []).length;
  if (dashes) problems.push(`em dash ×${dashes}`);
  for (const need of ["lede:", "faqs:", "summary:", "updated:"]) if (!s.includes(need)) problems.push(`missing ${need}`);
  if (!/t: "table"/.test(s)) problems.push("no table");
  if (!/t: "shots"|hero:/.test(s)) problems.push("no screens");
  const words = s.replace(/\/\/.*$/gm, "").match(/"[^"]{20,}"/g)?.join(" ").split(/\s+/).length ?? 0;
  if (words < 900) problems.push(`only ~${words} words of copy`);
  // Titles and descriptions must be unique across pages (duplicate or doorway pages read as spam).
  for (const k of ["title", "description"]) {
    const m = s.match(new RegExp(`\\n  ${k}:\\s*"([^"]+)"`));
    if (!m) continue;
    if (seen[k].has(m[1])) problems.push(`${k} duplicates ${seen[k].get(m[1]).replace(dir + "/", "")}`);
    else seen[k].set(m[1], f);
    if (k === "description" && (m[1].length < 70 || m[1].length > 170)) warn.push(`${f.replace(dir + "/", "")}: description is ${m[1].length} chars (aim 70 to 170)`);
    if (k === "title" && m[1].length > 70) warn.push(`${f.replace(dir + "/", "")}: title is ${m[1].length} chars (aim under 70)`);
  }
  if (s.includes("\u2013")) enDashFiles++;
  if (problems.length) {
    bad++;
    console.log(`${f.replace(dir + "/", "")}: ${problems.join(", ")}`);
  }
}
for (const w of warn) console.log(`note: ${w} (long snippets get cut, not penalized)`);
if (enDashFiles) console.log(`note: ${enDashFiles} file(s) use en dashes; new copy should write "5 to 100"`);
console.log(bad ? `${bad} file(s) to fix` : `${files.length} file(s) clean`);
process.exit(bad ? 1 : 0);
