import { animate } from "motion/react";
import { findProject, heroMedia, type Media } from "../content/work";
import { site } from "../content/site";
import { refreshCursor } from "./cursor";
import { stage, type Rect } from "./gl/stage";
import { commit, here, parse, type Route } from "./router";
import { createStore, useStore } from "./store";
import { easeCurtain, lenis, reducedMotion, resetScroll } from "./ticker";

/**
 * Page transitions. Two kinds:
 * - curtain: an ink panel sweeps up over the page carrying the next page's
 *   name, the page swaps underneath, and the panel carries on off the top.
 * - expand: the picture you clicked lifts out of the page and grows to fill
 *   the screen, becoming the hero of the case study you're opening.
 */

export type Phase = "boot" | "leaving" | "entering" | "idle";
export const phase = createStore<Phase>("boot");
export const curtainLabel = createStore("");

/** True once the page may play its entrance. */
export const usePageReady = () => {
  const p = useStore(phase);
  return p === "entering" || p === "idle";
};

/** How the current page was reached, so its hero knows whether to animate in. */
export const arrival = { via: "load" as "load" | "curtain" | "expand" };

let curtainEl: HTMLElement | null = null;
export const attachCurtain = (el: HTMLElement | null) => {
  curtainEl = el;
};

let busy = false;
/** A back/forward press that arrived mid-transition, played once it ends. */
let pending: string | null = null;
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function titleFor(route: Route) {
  switch (route.name) {
    case "home":
      return `${site.name}, ${site.role}`;
    case "work":
      return `Work, ${site.name}`;
    case "project":
      return `${findProject(route.slug)?.name}, ${site.name}`;
    default:
      return `Not found, ${site.name}`;
  }
}

function labelFor(route: Route) {
  if (route.name === "home") return "Index";
  if (route.name === "work") return "Work";
  if (route.name === "project") return findProject(route.slug)?.name ?? "";
  return "404";
}

export function scrollToHash(hash: string, immediate = false) {
  const el = hash ? document.getElementById(hash.replace(/^#/, "")) : null;
  if (!el) return;
  lenis.scrollTo(el, { immediate: immediate || reducedMotion, force: true, duration: 1.6 });
}

/** What to fly into the case study: an element's rect, or a rect you already have. */
export type ExpandFrom = { el?: HTMLElement; rect?: Rect; media: Media; zoom?: number };

/** Navigate inside the site. */
export async function go(to: string, opts: { from?: ExpandFrom; mode?: "push" | "none" } = {}) {
  const url = new URL(to, window.location.origin);
  const mode = opts.mode ?? "push";
  if (busy) return;
  if (url.pathname === here.get().path) {
    if (url.hash) scrollToHash(url.hash);
    else lenis.scrollTo(0, { duration: 1.4 });
    return;
  }
  busy = true;
  lenis.stop();
  try {
    if (opts.from && stage.enabled && !reducedMotion) await expand(url, opts.from, mode);
    else await curtain(url, mode);
  } finally {
    busy = false;
    lenis.start();
  }
  if (pending) {
    const next = pending;
    pending = null;
    go(next, { mode: "none" });
  }
}

async function swap(url: URL, mode: "push" | "none") {
  commit(url.pathname + url.hash, mode === "push" ? "push" : "none");
  document.title = titleFor(parse(url.pathname));
  await frame();
  await frame();
  resetScroll();
  if (url.hash) scrollToHash(url.hash, true);
}

async function curtain(url: URL, mode: "push" | "none") {
  arrival.via = "curtain";
  curtainLabel.set(labelFor(parse(url.pathname)));
  phase.set("leaving");
  const el = curtainEl;
  if (el) {
    el.style.visibility = "visible";
    await animate(el, { clipPath: ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] }, { duration: reducedMotion ? 0.2 : 0.8, ease: easeCurtain });
  }
  await swap(url, mode);
  phase.set("entering");
  if (el) {
    await animate(el, { clipPath: ["inset(0% 0% 0% 0%)", "inset(0% 0% 100% 0%)"] }, { duration: reducedMotion ? 0.2 : 0.85, ease: easeCurtain, delay: 0.1 });
    el.style.visibility = "hidden";
  }
  phase.set("idle");
  refreshCursor();
}

async function expand(url: URL, from: ExpandFrom, mode: "push" | "none") {
  arrival.via = "expand";
  phase.set("leaving");
  const r = from.el?.getBoundingClientRect();
  const rect = from.rect ?? (r ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
  const flight = stage.fly(from.media, rect, from.zoom ?? 1);
  const next = parse(url.pathname);
  const project = next.name === "project" ? findProject(next.slug) : undefined;
  const dest = project ? heroMedia(project) : from.media;
  stage.preload([dest]);
  document.documentElement.classList.add("is-leaving");
  animate(1, 0, { duration: 0.45, onUpdate: (v) => stage.setPage(v) });
  await flight.to({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight }, 1150, 1.12);
  await swap(url, mode);
  stage.setPage(1);
  document.documentElement.classList.remove("is-leaving");
  phase.set("entering");
  // keep the flying picture until the case study's own hero has taken over
  for (let i = 0; i < 90 && !stage.isReady(dest); i++) await frame();
  await frame();
  await frame();
  flight.done();
  phase.set("idle");
  refreshCursor();
}

window.addEventListener("popstate", () => {
  const to = window.location.pathname + window.location.hash;
  if (busy) pending = to;
  else go(to, { mode: "none" });
});
