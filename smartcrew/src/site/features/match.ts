// The pain picker's "type your own": which feature a typed headache is about, by keywords
// (src/content/features.ts FEATURES.keywords), in the browser, instantly. James typed a headache
// SmartCrew plainly covers in his own words and got "Good one to bring to the call", so the lists
// carry the owner's everyday wording, and a typo still lands. When this isn't sure, the picker asks
// our server function (api/match-pain.ts, ./ask.ts) and falls back to this answer if that can't
// help; nothing typed is kept here.
//
// Text and keywords go through the same light stemmer (lower case, plurals and -ing / -ed / -es
// endings off, a doubled last consonant undone, a final e dropped), so "timecards", "hauling",
// "scheduled" and "breaking down" all meet their keyword. A phrase scores 3, a strong word 2, a
// weak word 1; a word that only matches with a typo ("excavater", "timecrads": one slip in a word of
// 5+ letters, two in 8+, same first letter, never a short word) scores half a point less. The best
// score wins, a tie goes to the feature named last in the text ("truck tickets" is about the
// tickets). Under 1.5 (one weak word) is no answer; it's sure at 2 or more, clear of the runner-up.

import { FEATURES, type FeatureId } from "../../content/features";

function stem(w: string) {
  let t = w;
  if (t.length > 4 && t.endsWith("ies")) t = t.slice(0, -3) + "y";
  else if (t.length > 5 && t.endsWith("ing")) t = t.slice(0, -3);
  else if (t.length > 4 && t.endsWith("ed")) t = t.slice(0, -2);
  else if (t.length > 4 && /(ches|shes|xes|sses|zes)$/.test(t)) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
  // "planning" → "plann" → "plan", "bidding" → "bid"
  if (t !== w && /([b-df-hj-np-tv-z])\1$/.test(t) && !/(ll|ss|zz)$/.test(t)) t = t.slice(0, -1);
  if (t.length > 4 && t.endsWith("e")) t = t.slice(0, -1);
  return t;
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(stem);

type Key = { k: string[]; w: number; fuzzy: boolean };
const KEYS: { id: FeatureId; keys: Key[] }[] = (Object.keys(FEATURES.keywords) as FeatureId[]).map((id) => {
  const { strong, weak } = FEATURES.keywords[id];
  const keys: Key[] = [];
  for (const [list, w] of [
    [strong, 2],
    [weak, 1],
  ] as const)
    for (const raw of list) {
      const k = words(raw);
      // weak words are too common to stretch to a typo; phrases and strong words aren't
      if (k.length) keys.push({ k, w: k.length > 1 ? 3 : w, fuzzy: k.length > 1 || w > 1 });
    }
  return { id, keys };
});

/** Every word some keyword spells exactly: those are read as written, never as a typo of another. */
const EXACT = new Set(KEYS.flatMap(({ keys }) => keys.flatMap(({ k }) => k)));

/**
 * Everyday words one slip from a keyword that mean something else ("keep track" isn't a truck,
 * "a lot" of anything isn't a load): never read as a typo. (From a check of the commonest English
 * words against the lists; see tools/match-test.mjs.)
 */
const NOT_TYPOS = new Set(
  words(
    "track trick trunk money monkey honey hours house horse while white write wrote whole where there these those three thing think thank" +
      " month mouth south sound round found point print paint plant place plane plate state stage shape share sharp short shirt shift" +
      " their other order older under offer after again agent sales scale stone store story score sport spare space spice price prize" +
      " rider wider water later layer laser lower power tower cover cower coder codes notes votes voted noted dated rated rates rated" +
      " rocks socks locks looks books hooks cooks loads roads reads leads lends lands hands bands bands bonds funds fonds clock click" +
      " block black blank plans plays clays class glass grass brass cross gross dross drops crops props prompt profit pivot" +
      " fully filly filed filled field fiend friend trend tread bread break bleak cheap cheat chest crest guest quest" +
      " still steel stall small smell spell spill skill shell sheet sheep shoot short sport spurt",
  ),
);

const allowed = (a: string, b: string) => {
  const n = Math.min(a.length, b.length);
  return n >= 8 ? 2 : n >= 5 ? 1 : 0;
};

/** Damerau-Levenshtein distance (adjacent swaps count as one slip), or max + 1 once it's past max. */
function slips(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      low = Math.min(low, v);
    }
    if (low > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** Does the typed word `t` read as the keyword word `k`: exactly (2), with a typo (1), or not (0). */
function reads(t: string, k: string, fuzzy: boolean) {
  if (t === k) return 2;
  if (!fuzzy || t[0] !== k[0] || EXACT.has(t) || NOT_TYPOS.has(t)) return 0;
  const max = allowed(t, k);
  return max && slips(t, k, max) <= max ? 1 : 0;
}

/** The last place the phrase `k` reads in `t`, exactly if it does anywhere, else with a typo. */
function findLast(t: string[], { k, fuzzy }: Key) {
  let typo = -1;
  for (let i = t.length - k.length; i >= 0; i--) {
    let worst = 2;
    for (let j = 0; j < k.length && worst; j++) worst = Math.min(worst, reads(t[i + j], k[j], fuzzy));
    if (worst === 2) return { at: i + k.length - 1, typo: false };
    if (worst === 1 && typo < 0) typo = i + k.length - 1;
  }
  return typo < 0 ? null : { at: typo, typo: true };
}

export type PainMatch = { id: FeatureId | null; sure: boolean };

/** The feature a typed pain is about (or null), and whether that's sure enough not to ask. */
export function painMatch(text: string): PainMatch {
  const t = words(text);
  if (!t.length) return { id: null, sure: false };
  const scored: { id: FeatureId; score: number; at: number }[] = [];
  for (const { id, keys } of KEYS) {
    let score = 0;
    let at = -1;
    for (const key of keys) {
      const hit = findLast(t, key);
      if (!hit) continue;
      score += hit.typo ? key.w - 0.5 : key.w;
      at = Math.max(at, hit.at);
    }
    if (score > 0) scored.push({ id, score, at });
  }
  scored.sort((a, b) => b.score - a.score || b.at - a.at);
  const [best, next] = scored;
  if (!best || best.score < 1.5) return { id: null, sure: false };
  return { id: best.id, sure: best.score >= 2 && (!next || best.score > next.score) };
}

/** The feature a typed pain is about, or null. */
export function matchPain(text: string): FeatureId | null {
  return painMatch(text).id;
}
