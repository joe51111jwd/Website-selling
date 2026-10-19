// The pain picker's second opinion: when ./match.ts isn't sure, ask our own function
// (api/match-pain.ts, a small model on OpenRouter) which feature a typed headache is about.
//
// Only builds that have the function ask (VITE_PAIN_AI, set in vite.config.ts: a Vercel build with
// OPENROUTER_API_KEY in its environment). Anywhere else (vite dev, vite preview, a static host)
// the call would only 404, so the picker keeps to its own match and the page never shows a failed
// request. Any trouble on the way (no key, a timeout, an upstream error) is undefined: the picker
// then uses its own guess. The text goes to our function and the model, and is kept by neither.

import { FEATURES, type FeatureId } from "../../content/features";

export const askOn = import.meta.env.VITE_PAIN_AI === "1";

/** past the function's own 6 s on the model, plus a cold start */
const TIMEOUT = 7500;

const IDS = new Set<string>(FEATURES.cards.map((c) => c.id));

/** The feature the model picked, null if it said none fits, undefined if it couldn't help. */
export async function askPain(text: string): Promise<FeatureId | null | undefined> {
  if (!askOn) return undefined;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT);
  try {
    const res = await fetch("/api/match-pain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 200) }),
      signal: abort.signal,
    });
    if (!res.ok) return undefined;
    const { id, reason } = (await res.json()) as { id?: unknown; reason?: unknown };
    // a reason is the function saying it couldn't ask (no key, the model timed out), not "none"
    if (reason) return undefined;
    if (id === null) return null;
    return typeof id === "string" && IDS.has(id) ? (id as FeatureId) : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
