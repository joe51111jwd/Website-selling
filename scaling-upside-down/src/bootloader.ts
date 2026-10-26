// The bootloader is a Markdown file served from /bootloader.md, so Michael can
// replace it without touching the site. Every copy copies the whole file.
//
// Browsers only allow a clipboard write inside the click that asked for it, and Safari counts
// any wait before the write as leaving the click. So the file is fetched ahead of time, and
// copyNow() calls the clipboard first, synchronously, before anything else happens.
import type { AssistantId } from "./assistants";
import { markCopied, markError, setCopying, setFile, type CopySource } from "./copyStore";

const URL_ = `${import.meta.env.BASE_URL}bootloader.md`;
let text: string | null = null;
let inflight: Promise<string> | null = null;

// words, not Markdown: a table's pipes, rules and checkboxes don't count
export const wordCount = (t: string) => (t.match(/\S*[\p{L}\p{N}]\S*/gu) ?? []).length;

/** the file, if it has loaded */
export const peek = () => text;

/** fetch the file once; rejects on a failed or empty response, and the next call tries again */
export function ensureBootloader(priority: "low" | "high" = "low"): Promise<string> {
  if (text) return Promise.resolve(text);
  inflight ??= fetch(URL_, { priority } as RequestInit)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`bootloader ${r.status}`))))
    .then((t) => {
      if (!t.trim()) throw new Error("bootloader empty");
      text = t;
      setFile(wordCount(t), new Blob([t]).size);
      return t;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** load at start-up, at low priority (the story's frames matter more), retrying a few times */
export function preloadBootloader() {
  let n = 0;
  const run = () =>
    void ensureBootloader("low").catch(() => {
      if (++n <= 3) window.setTimeout(run, 1500 * n);
    });
  run();
}

/** the old selection copy; synchronous, so it finishes before a phone switches apps */
export function legacyCopy(t: string): boolean {
  const prev = document.activeElement as HTMLElement | null;
  const area = document.createElement("textarea");
  area.value = t;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.tabIndex = -1;
  // 16px stops iOS zooming in on the focused field; fixed at the top so nothing scrolls
  Object.assign(area.style, { position: "fixed", top: "0", left: "0", width: "1px", height: "1px", opacity: "0", fontSize: "16px", pointerEvents: "none" });
  // an open modal makes the rest of the page inert, so the field goes inside it
  (document.querySelector("dialog[open]") ?? document.body).appendChild(area);
  let ok = false;
  try {
    area.focus({ preventScroll: true });
    area.select();
    area.setSelectionRange(0, t.length);
    // execCommand reports success even with nothing selected; only trust it when the field has the text
    ok = document.activeElement === area && document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  prev?.focus?.({ preventScroll: true });
  return ok;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => (window.clearTimeout(t), resolve(v)),
      (e) => (window.clearTimeout(t), reject(e)),
    );
  });
}

/**
 * Copy the whole file. Call it first thing in a click handler: nothing is awaited and nothing
 * slow runs before the clipboard call. `sync` (phones, links that open another app) tries the
 * selection copy first, because it is done before the page goes to the background.
 */
export function copyNow(source: CopySource, o: { assistant?: AssistantId; sync?: boolean } = {}): Promise<number> {
  const t = text;
  const clip = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
  let p: Promise<unknown>;
  try {
    if (t) {
      if (o.sync || !clip?.writeText) p = legacyCopy(t) ? Promise.resolve() : clip?.writeText ? clip.writeText(t) : Promise.reject(new Error("refused"));
      else
        p = clip.writeText(t).catch(() => {
          if (!legacyCopy(t)) throw new Error("refused");
        });
    } else if (typeof ClipboardItem !== "undefined" && clip?.write) {
      // Safari keeps the click's permission while the item's text is still arriving
      p = clip.write([new ClipboardItem({ "text/plain": ensureBootloader("high").then((s) => new Blob([s], { type: "text/plain" })) })]);
    } else {
      p = ensureBootloader("high").then((s) => (clip?.writeText ? clip.writeText(s) : Promise.reject(new Error("refused"))));
    }
  } catch (e) {
    p = Promise.reject(e);
  }
  setCopying(source, o.assistant); // after the clipboard call
  return withTimeout(p, 6000).then(
    () => {
      const w = wordCount(text ?? "");
      markCopied(w, source, o.assistant);
      window.dispatchEvent(new CustomEvent("susd:copied", { detail: { source, assistant: o.assistant, words: w } }));
      return w;
    },
    (e) => {
      markError(source);
      throw e;
    },
  );
}
