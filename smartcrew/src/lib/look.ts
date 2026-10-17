// The page's look. "classic" is the build Andrew reviews; "glass" is James's Oct 17 direction:
// "relatively clean… too many edges… all in on a liquid glass and making it like super minimal in
// a good way so that you can just have the main focus points". Same page, same copy, same funnel;
// only the styling changes (src/styles/glass.css and each section's glass.css, all scoped to
// html.look-glass).
//
// "focus" is the third look (James, Oct 17: "minimalistic focus on one thing at a time", after
// angelo.so): the glass look taken further, one point per screen. It builds on glass, so it also sets
// html.look-glass, and adds html.look-focus (src/styles/focus.css, src/site/focus.ts).
//
// ?look=glass, ?look=focus and ?look=classic pick one; it sticks for the session, so the popup and
// /book keep the look the visitor arrived with. A build made with VITE_LOOK=glass or focus starts in it.

export type Look = "classic" | "glass" | "focus";

const KEY = "sc-look";

const isLook = (v: unknown): v is Look => v === "classic" || v === "glass" || v === "focus";

function read(): Look {
  const env = import.meta.env.VITE_LOOK;
  const fallback: Look = isLook(env) ? env : "classic";
  if (typeof window === "undefined") return fallback;
  const asked = new URLSearchParams(location.search).get("look");
  try {
    if (isLook(asked)) {
      sessionStorage.setItem(KEY, asked);
      return asked;
    }
    const kept = sessionStorage.getItem(KEY);
    return isLook(kept) ? kept : fallback;
  } catch {
    return isLook(asked) ? asked : fallback;
  }
}

export const LOOK = read();
/** The glass styling is on (the glass look, and the focus look built on it). */
export const GLASS = LOOK !== "classic";
/** The focus look: one point per screen. */
export const FOCUS = LOOK === "focus";

if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("look-glass", GLASS);
  document.documentElement.classList.toggle("look-focus", FOCUS);
  // the phone's browser bar matches the light glass ground (/book's own tag is dark)
  if (GLASS) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#f6f2ec");
}
