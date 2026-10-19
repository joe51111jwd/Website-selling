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
// "bold" is the fourth (James, Oct 18: "not make it look like lovable and look better… keep that as a
// draft and fork it"; "less boring… not something appealing at all"; trial clicks are the one
// goal). A fork, not a layer: it builds on the classic page (no glass), and src/styles/bold.css with
// each section's bold.css (all scoped to html.look-bold) turn it into a dark job-site look: rendered
// terrain, big type, the orange button the one bright thing on screen.
//
// "optimized" is the fifth (James, Oct 19: "Just look at the numbers, make a optimized version and post it
// as optimized version"): the bold look with a trimmed first screen ("is it too much text at the start").
// It sets html.look-bold too, so it carries everything bold has (Katie's quote under the button, the
// sign-up form's answers, Watch it work and Try it), plus html.look-optimized for the first screen.
//
// ?look=glass, ?look=focus, ?look=bold, ?look=optimized and ?look=classic pick one; it sticks for the session, so the popup and
// /book keep the look the visitor arrived with. A build made with VITE_LOOK=glass or focus starts in it.

export type Look = "classic" | "glass" | "focus" | "bold" | "optimized";

const KEY = "sc-look";

const isLook = (v: unknown): v is Look => v === "classic" || v === "glass" || v === "focus" || v === "bold" || v === "optimized";

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
export const GLASS = LOOK === "glass" || LOOK === "focus";
/** The focus look: one point per screen. */
export const FOCUS = LOOK === "focus";
/** The bold look: dark job-site ground, the classic page underneath (and the optimized look built on it). */
export const BOLD = LOOK === "bold" || LOOK === "optimized";
/** The optimized look: bold with the trimmed first screen. */
export const OPTIMIZED = LOOK === "optimized";

if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("look-glass", GLASS);
  document.documentElement.classList.toggle("look-focus", FOCUS);
  document.documentElement.classList.toggle("look-bold", BOLD);
  document.documentElement.classList.toggle("look-optimized", OPTIMIZED);
  // the phone's browser bar matches the light glass ground (/book's own tag is dark)
  if (GLASS) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#f6f2ec");
  if (BOLD) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0f0d0b");
}
