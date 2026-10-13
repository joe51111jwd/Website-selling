// PHONE MODE: the single source of truth for "is this a phone?" (BRIEF ROUND 3). Phone mode is a
// viewport ≤ 760 px wide. On phones the page is a different, lighter build of the same story:
// no WebGL (the R3F Stage and the GLB models are never imported), no Lenis, no custom cursor, no
// per-frame scroll trackers, no backdrop-filter; devices are 2D (src/site/phone/PhoneFrame.tsx)
// and pre-rendered stills (public/renders/phone-*.webp); scenes animate once on arrival
// (src/site/phone/useArrive.ts). Rules: scratchpad design/v2/phone/PHONE.md.
//
//   import { usePhone, isPhone } from "../phone";
//   const phone = usePhone();          // React: re-renders when the viewport crosses 760 px
//   if (isPhone()) …                   // anywhere else: the current answer
//
// `phoneAtLoad` is what the page started as. The 3D Stage only ever loads on a page that started
// wide (`stageAllowed`): a page opened on a phone never downloads three.js, even if the window is
// later widened (the desktop layout then shows its poster stills, as it does without WebGL).
// The Stage's pose code reads `phone` from src/three/stage (= phoneAtLoad, from here).

import { useSyncExternalStore } from "react";

export const PHONE_QUERY = "(max-width: 760px)";

const mq = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(PHONE_QUERY) : null;
let current = !!mq?.matches;

/** The viewport the page was opened at was a phone's. */
export const phoneAtLoad = current;

/**
 * Whether the 3D Stage may load on this page at all. Dev only: `?stage3d` forces it on a phone
 * viewport (to render the phone stills from the real models; see PHONE.md).
 */
export const forceStage3d = import.meta.env.DEV && typeof location !== "undefined" && new URLSearchParams(location.search).has("stage3d");
export const stageAllowed = !phoneAtLoad || forceStage3d;

/** The light 2D phone build is on (phone layout, and not the dev ?stage3d still-rendering mode). */
export const isPhoneLite = () => current && !forceStage3d;

/** The phone layout is on right now. */
export const isPhone = () => current;

const subs = new Set<() => void>();
function sync() {
  const next = !!mq?.matches;
  if (typeof document !== "undefined") document.documentElement.classList.toggle("is-phone", next);
  if (next === current) return;
  current = next;
  subs.forEach((f) => f());
}
if (mq) {
  mq.addEventListener?.("change", sync);
  sync();
}

/** Subscribe to phone ↔ desktop changes. Returns the unsubscribe. */
export function onPhoneChange(fn: () => void) {
  subs.add(fn);
  return () => void subs.delete(fn);
}

/** React: true while the phone layout is on (re-renders when the viewport crosses 760 px). */
export function usePhone() {
  return useSyncExternalStore(onPhoneChange, isPhone, () => false);
}

/** React: true while the light 2D phone build is on (scenes pick their phone version with this). */
export function usePhoneLite() {
  return useSyncExternalStore(onPhoneChange, isPhoneLite, () => false);
}
