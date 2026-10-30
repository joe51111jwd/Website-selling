// Checks that every sentence on a site is word for word from Michael's text.
// node copycheck.mjs <file> [more files...]
// Scans string literals (and JSX text) in the files; any with 4+ words must appear in
// source/public_bootloader.md or source/src_copy.ts after normalizing quotes, dashes, Markdown
// emphasis and whitespace. Put `// label` on a line to exempt UI labels and buttons on it.
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const norm = (s) => s.replace(/\\n/g, ' ').replace(/[‘’‛]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/\*\*|__|`/g, '').replace(/(^|\s)\*(\S)/g, '$1$2').replace(/(\S)\*(\s|$|[.,;:!?])/g, '$1$2').replace(/\s+/g, ' ').trim();
const src = norm(['public_bootloader.md', 'src_copy.ts'].map((f) => fs.readFileSync(path.join(here, '../source', f), 'utf8')).join('\n'));
let bad = 0, checked = 0;
for (const file of process.argv.slice(2)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/\/\/\s*label|\{\/\*\s*label|import |from ['"]|className=|console\./.test(line)) return;
    const found = [...line.matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`([^`$]*)`|>([^<>{}]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4]);
    for (const raw of found) {
      const t = norm(raw.replace(/\\'/g, "'").replace(/\\"/g, '"'));
      if (t.split(' ').filter((w) => /[A-Za-z]/.test(w)).length < 4) continue;
      if (/^[a-z0-9-]+( [a-z0-9-]+)*$/.test(t) && !/[.!?]$/.test(t)) { if (/^[a-z]/.test(t) && !/\s[A-Z]/.test(t)) continue; } // css-ish / identifiers
      checked++;
      if (!src.includes(t)) { bad++; console.log(`NOT FOUND  ${file}:${i + 1}  ${JSON.stringify(t).slice(0, 160)}`); }
    }
  });
}
console.log(`${checked} sentences checked, ${bad} not found in Michael's text`);
process.exit(bad ? 1 : 0);
