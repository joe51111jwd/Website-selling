// The pain picker's "type your own": which feature a typed headache is about, by keywords
// (src/content/features.ts FEATURES.keywords), in the browser only. Nothing typed leaves the page
// or is kept.
//
// Text and keywords go through the same light stemmer (lower case, plurals and -ing / -ed / -es
// endings off, a doubled last consonant undone, a final e dropped), so "timecards", "hauling",
// "scheduled" and "breaking down" all meet their keyword. A phrase scores 3, a strong word 2, a
// weak word 1; the best score wins, a tie goes to the feature named last in the text ("truck
// tickets" is about the tickets).

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

type Key = { k: string[]; w: number };
const KEYS: { id: FeatureId; keys: Key[] }[] = (Object.keys(FEATURES.keywords) as FeatureId[]).map((id) => {
  const { strong, weak } = FEATURES.keywords[id];
  const keys: Key[] = [];
  for (const [list, w] of [
    [strong, 2],
    [weak, 1],
  ] as const)
    for (const raw of list) {
      const k = words(raw);
      if (k.length) keys.push({ k, w: k.length > 1 ? 3 : w });
    }
  return { id, keys };
});

/** Where the phrase `k` starts in `t`, or -1 (the last place it does). */
function findLast(t: string[], k: string[]) {
  for (let i = t.length - k.length; i >= 0; i--) {
    let ok = true;
    for (let j = 0; j < k.length && ok; j++) ok = t[i + j] === k[j];
    if (ok) return i;
  }
  return -1;
}

/** The feature a typed pain is about, or null. */
export function matchPain(text: string): FeatureId | null {
  const t = words(text);
  if (!t.length) return null;
  let best: { id: FeatureId; score: number; at: number } | null = null;
  for (const { id, keys } of KEYS) {
    let score = 0;
    let at = -1;
    for (const { k, w } of keys) {
      const i = findLast(t, k);
      if (i < 0) continue;
      score += w;
      at = Math.max(at, i + k.length - 1);
    }
    if (score > 0 && (!best || score > best.score || (score === best.score && at > best.at))) best = { id, score, at };
  }
  return best?.id ?? null;
}
