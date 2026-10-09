import { findProject } from "../content/work";
import { createStore, useStore } from "./store";

export type Route = { name: "home" } | { name: "work" } | { name: "project"; slug: string } | { name: "notfound" };

export function parse(pathname: string): Route {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return { name: "home" };
  if (path === "/work") return { name: "work" };
  const m = path.match(/^\/work\/([\w-]+)$/);
  if (m && findProject(m[1])) return { name: "project", slug: m[1] };
  return { name: "notfound" };
}

export type Location = { path: string; route: Route };

export const here = createStore<Location>({ path: window.location.pathname, route: parse(window.location.pathname) });
export const useLocation = () => useStore(here);

/** Swap the page. Transitions call this while the screen is covered. */
export function commit(path: string, mode: "push" | "replace" | "none") {
  const url = new URL(path, window.location.origin);
  if (mode === "push") history.pushState(null, "", url.pathname + url.hash);
  if (mode === "replace") history.replaceState(null, "", url.pathname + url.hash);
  here.set({ path: url.pathname, route: parse(url.pathname) });
}

history.scrollRestoration = "manual";
