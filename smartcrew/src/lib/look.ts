// The page's look. "classic" is the build Andrew reviews; "glass" is James's Oct 17 direction:
// "relatively clean… too many edges… all in on a liquid glass and making it like super minimal in
// a good way so that you can just have the main focus points". Same page, same copy, same funnel;
// only the styling changes (src/styles/glass.css and each section's glass.css, all scoped to
// html.look-glass).
//
// ?look=glass turns it on and ?look=classic off; either sticks for the session, so the popup and
// /book keep the look the visitor arrived with. A build made with VITE_LOOK=glass starts in it.

export type Look = "classic" | "glass";

const KEY = "sc-look";

function read(): Look {
  const fallback: Look = import.meta.env.VITE_LOOK === "glass" ? "glass" : "classic";
  if (typeof window === "undefined") return fallback;
  const asked = new URLSearchParams(location.search).get("look");
  try {
    if (asked === "glass" || asked === "classic") {
      sessionStorage.setItem(KEY, asked);
      return asked;
    }
    const kept = sessionStorage.getItem(KEY);
    return kept === "glass" || kept === "classic" ? kept : fallback;
  } catch {
    return asked === "glass" || asked === "classic" ? asked : fallback;
  }
}

export const LOOK = read();
export const GLASS = LOOK === "glass";

if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("look-glass", GLASS);
  // the phone's browser bar matches the light glass ground (/book's own tag is dark)
  if (GLASS) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#f6f2ec");
}
