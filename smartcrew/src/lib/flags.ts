// ⚑ markers: copy Andrew (or counsel) still has to approve. They are for his review, not for the
// people the ads send: on the production/ad build every marker is hidden, and lines that are
// only an unapproved proposal (flagged extra tools, …) are left
// out. Review builds show them: the dev server, a build made with VITE_SHOW_FLAGS=1, or any page
// opened with ?review (it sticks for the session, so the popup and /book keep showing them).
//
//   import { SHOW_FLAGS } from "../lib/flags";   // React: {SHOW_FLAGS && <Proposal/>}
//   CSS: html.show-flags is set while they show; base.css hides .flag / .sc-flag otherwise.

function read(): boolean {
  if (import.meta.env.DEV || import.meta.env.VITE_SHOW_FLAGS === "1") return true;
  if (typeof window === "undefined") return false;
  try {
    if (/[?&]review\b/.test(location.search)) {
      sessionStorage.setItem("sc-review", "1");
      return true;
    }
    return sessionStorage.getItem("sc-review") === "1";
  } catch {
    return /[?&]review\b/.test(location.search);
  }
}

export const SHOW_FLAGS = read();

if (typeof document !== "undefined") document.documentElement.classList.toggle("show-flags", SHOW_FLAGS);
