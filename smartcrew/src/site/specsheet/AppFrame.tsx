// The click-through (desktop): the SmartCrew office web app in a crisp browser window, all DOM.
// The sidebar is the spec sheet's six groups (a vertical tablist: click, or ↑ ↓ Home End); the
// main area is the group's real screen (src/screens, live React, scaled to fit, its own sidebar
// cut away), with its pages as tabs in the window's title bar. On each screen 1–4 quiet orange
// dots sit on the things that matter; pointing at one, focusing it or clicking it rings the exact
// thing and names the tool in one line. A spot below the visible part of the screen is brought in
// by panning the page (a transform), as if the app scrolled; spots out of view wait as arrows on
// the window's edge.
//
// Every screen is mounted once (the first at once, the rest in idle time after the boot) and kept,
// so switching is opacity and transform only: no layout, no long task.

import { startTransition, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "../../screens/kit";
import logoUrl from "../../screens/kit/smartcrew-logo.svg";
import { SIZE } from "../../screens/registry";
import { GROUPS, type Page } from "./tour";
import type { Pos } from "./useTour";
import { idle, screenComp, warmScreen } from "./screens";

const W = SIZE.web.w;
const H = SIZE.web.h;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

/** Every page in tour order, with where it sits. */
const PAGES = GROUPS.flatMap((g, gi) => g.pages.map((page, pi) => ({ key: `${gi}-${pi}`, g: gi, p: pi, page })));

export const COPY = {
  /** the tour's control (screen reader / tooltip only) */
  pause: "Pause the walkthrough",
  play: "Play the walkthrough",
};

type Size = { w: number; h: number };

/** Native px the page is panned by so spot `s` is in view (0 when it fits from the top). */
function panFor(page: Page, s: number, scale: number, size: Size) {
  const b = page.spots[s]?.box;
  const V = size.h / scale;
  const max = Math.max(0, H - V);
  if (!b || max === 0) return 0;
  if (b[1] + b[3] + 28 <= V) return 0;
  return clamp(b[1] + b[3] / 2 - V * 0.52, 0, max);
}

export type FrameProps = {
  pos: Pos;
  go: (p: Pos) => void;
  /** 0 before arrival, then 1 frame · 2 sidebar · 3 screen · 4 dots · 5 the first name. */
  boot: number;
  running: boolean;
  stopped: boolean;
  wait: number;
  beat: number;
  onToggle: () => void;
  onHover: (on: boolean) => void;
  onPoke: () => void;
};

export function AppFrame({ pos, go, boot, running, stopped, wait, beat, onToggle, onHover, onPoke }: FrameProps) {
  const main = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const group = GROUPS[pos.g];
  const page = group.pages[pos.p];
  const activeKey = `${pos.g}-${pos.p}`;

  // the main area's size, on mount and on resize only
  useLayoutEffect(() => {
    const el = main.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize((p) => (p && p.w === w && p.h === h ? p : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // pages mount once and stay: the shown one at once, the others one per idle moment after the
  // boot (in tour order), each as a low-priority render
  const [mounted, setMounted] = useState<Set<string>>(() => new Set([activeKey]));
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;
  useEffect(() => {
    setMounted((m) => (m.has(activeKey) ? m : new Set(m).add(activeKey)));
  }, [activeKey]);
  useEffect(() => {
    void warmScreen(PAGES[0].page.screen);
  }, []);
  useEffect(() => {
    if (boot < 5) return;
    let cancel = () => {};
    let i = 0;
    const next = () => {
      const left = PAGES.filter((x) => !mountedRef.current.has(x.key));
      if (!left.length || i++ > PAGES.length) return;
      const x = left[0];
      void warmScreen(x.page.screen).then(() => {
        cancel = idle(() => {
          startTransition(() => setMounted((m) => new Set(m).add(x.key)));
          cancel = idle(next, 2000);
        }, 2000);
      });
    };
    cancel = idle(next, 2000);
    return () => cancel();
  }, [boot]);

  // ↑ ↓ Home End move between the groups (and open them, like tabs)
  const onNavKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = GROUPS.length;
    const to =
      e.key === "ArrowDown" ? (pos.g + 1) % n : e.key === "ArrowUp" ? (pos.g - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to === null) return;
    e.preventDefault();
    go({ g: to, p: 0, s: 0 });
    nav.current?.querySelectorAll<HTMLElement>("[role=tab]")[to]?.focus({ preventScroll: true });
  };
  const onTabsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = group.pages.length;
    const to = e.key === "ArrowRight" ? (pos.p + 1) % n : e.key === "ArrowLeft" ? (pos.p - 1 + n) % n : null;
    if (to === null) return;
    e.preventDefault();
    go({ g: pos.g, p: to, s: 0 });
    e.currentTarget.querySelectorAll<HTMLElement>("[role=tab]")[to]?.focus({ preventScroll: true });
  };

  const mouse = (fn: () => void) => (e: PointerEvent) => e.pointerType === "mouse" && fn();

  return (
    <div
      className="spx"
      data-boot={boot}
      onPointerEnter={mouse(() => onHover(true))}
      onPointerLeave={mouse(() => onHover(false))}
      onPointerDown={onPoke}
      onKeyDown={onPoke}
    >
      {/* the window's title bar: the lights, the group's pages as tabs, the walkthrough control */}
      <div className="spx-bar">
        <span className="spx-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className="spx-tabs" role="tablist" aria-label={group.cat.name} onKeyDown={onTabsKey}>
          {group.pages.map((pg, i) => {
            const on = i === pos.p;
            return (
              <button
                key={`${pos.g}-${i}`}
                type="button"
                role="tab"
                id={`spx-tab-${pos.g}-${i}`}
                className={`spx-tab${on ? " is-on" : ""}`}
                aria-selected={on}
                aria-controls="spx-panel"
                tabIndex={on ? 0 : -1}
                data-cursor="link"
                style={{ "--i": i } as CSSProperties}
                onClick={() => go({ g: pos.g, p: i, s: 0 })}
              >
                <Icon name={group.icon} size={14} stroke={1.7} />
                <span>{pg.name}</span>
              </button>
            );
          })}
        </div>
        <span key={activeKey} className="spx-load" aria-hidden="true" />
        <button
          type="button"
          className={`spx-play${stopped ? " is-stopped" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={stopped ? COPY.play : COPY.pause}
          title={stopped ? COPY.play : COPY.pause}
          data-cursor="link"
        >
          {stopped ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5 3.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L5.9 3.1a.6.6 0 0 0-.9.5z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect x="4" y="3.2" width="2.6" height="9.6" rx="0.8" fill="currentColor" />
              <rect x="9.4" y="3.2" width="2.6" height="9.6" rx="0.8" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>

      <div className="spx-app">
        {/* the app's sidebar: the six groups */}
        <div ref={nav} className="spx-side" role="tablist" aria-orientation="vertical" aria-label="SmartCrew" onKeyDown={onNavKey}>
          <div className="spx-logo" aria-hidden="true">
            <span className="spx-logo-mark">
              <img src={logoUrl} alt="" draggable={false} />
            </span>
            <span className="spx-logo-word">SMARTCREW</span>
          </div>
          {GROUPS.map((g, i) => {
            const on = i === pos.g;
            return (
              <button
                key={g.cat.id}
                type="button"
                role="tab"
                id={`spx-g-${g.cat.id}`}
                className={`spx-item${on ? " is-on" : ""}`}
                data-cat={g.cat.id}
                aria-selected={on}
                aria-controls="spx-panel"
                tabIndex={on ? 0 : -1}
                data-cursor="link"
                style={{ "--i": i } as CSSProperties}
                onClick={() => go({ g: i, p: 0, s: 0 })}
                onPointerEnter={() => g.pages.forEach((pg) => void warmScreen(pg.screen))}
              >
                <span className="spx-item-row">
                  <Icon name={g.icon} size={20} stroke={on ? 1.85 : 1.6} />
                  <span className="spx-item-name">{g.cat.name}</span>
                  <span className="spx-item-n">
                    {g.cat.tools.length}
                    <span className="sr-only"> tools</span>
                  </span>
                </span>
                <span className="spx-item-out" aria-hidden={!on}>
                  <span>{g.cat.outcome}</span>
                </span>
                {on && running && <span key={`${beat}-${pos.p}-${pos.s}`} className="spx-prog" style={{ animationDuration: `${wait}ms` }} aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {/* the screen */}
        <div ref={main} id="spx-panel" className="spx-main" role="tabpanel" aria-labelledby={`spx-g-${group.cat.id}`}>
          {size &&
            PAGES.map((x) =>
              mounted.has(x.key) ? (
                <PageView key={x.key} page={x.page} on={x.key === activeKey} s={x.key === activeKey ? pos.s : 0} size={size} boot={boot} onSpot={(s) => go({ g: x.g, p: x.p, s })} />
              ) : null,
            )}
          {size && <Edges page={page} s={pos.s} size={size} boot={boot} onSpot={(s) => go({ g: pos.g, p: pos.p, s })} />}
        </div>
      </div>
    </div>
  );
}

/** Focus a spot's dot without scrolling anything (after the re-render that makes it tabbable). */
function focusDot(root: Element | null, toolId: string) {
  requestAnimationFrame(() => root?.querySelector<HTMLElement>(`[data-tool="${toolId}"]`)?.focus({ preventScroll: true }));
}

function PageView({ page, on, s, size, boot, onSpot }: { page: Page; on: boolean; s: number; size: Size; boot: number; onSpot: (s: number) => void }) {
  const Comp = screenComp(page.screen);
  const scale = size.w / (W - page.crop);
  const pan = panFor(page, s, scale, size);
  const showTip = on && boot >= 5;
  return (
    <div className={`spx-page${on ? " is-on" : ""}`} aria-hidden={!on} inert={!on}>
      <div className="spx-pan" style={{ transform: `translate3d(0, ${-pan * scale}px, 0)` }}>
        <div className="spx-scr" aria-hidden="true" inert style={{ width: W, height: H, transform: `translate3d(${-page.crop * scale}px, 0, 0) scale(${scale})` }}>
          <Suspense fallback={null}>
            <Comp />
          </Suspense>
        </div>
        {page.spots.map((spot, i) => {
          const [bx, by, bw, bh] = spot.box;
          const dx = (spot.dot[0] - page.crop) * scale;
          const dy = spot.dot[1] * scale;
          const active = showTip && i === s;
          const inView = dy - pan * scale;
          const below = inView < 70;
          const align = dx > size.w * 0.72 ? "end" : dx < size.w * 0.22 ? "start" : "mid";
          return (
            <div key={spot.tool.id} className={`spx-spot${active ? " is-on" : ""}`} style={{ "--i": i } as CSSProperties}>
              <span
                className="spx-ring"
                aria-hidden="true"
                style={{ left: (bx - page.crop) * scale - 5, top: by * scale - 5, width: bw * scale + 10, height: bh * scale + 10 }}
              />
              <button
                type="button"
                className="spx-dot"
                style={{ left: dx, top: dy }}
                aria-label={spot.tool.label}
                aria-pressed={active}
                // one dot in the tab order (the named one); arrow keys move between them, so the
                // browser never scrolls the page to a dot that sits outside the window
                tabIndex={i === s ? 0 : -1}
                data-tool={spot.tool.id}
                data-cursor="link"
                onClick={() => onSpot(i)}
                onFocus={() => i !== s && onSpot(i)}
                onKeyDown={(e) => {
                  const n = page.spots.length;
                  const to =
                    e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
                  if (to === null || to === i) return;
                  e.preventDefault();
                  onSpot(to);
                  focusDot(e.currentTarget.closest(".spx-pan"), page.spots[to].tool.id);
                }}
                onPointerEnter={(e) => e.pointerType === "mouse" && i !== s && onSpot(i)}
              >
                <span className="spx-dot-core" />
              </button>
              <span className={`spx-tip spx-tip--${align}${below ? " is-below" : ""}`} style={{ left: dx, top: dy }} aria-hidden="true">
                <span className="spx-tip-in">{spot.tool.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Spots of the shown page that sit above or below the visible part: arrows on the edge. */
function Edges({ page, s, size, boot, onSpot }: { page: Page; s: number; size: Size; boot: number; onSpot: (s: number) => void }) {
  const scale = size.w / (W - page.crop);
  const pan = panFor(page, s, scale, size);
  const out = useMemo(
    () =>
      page.spots
        .map((spot, i) => {
          const y = (spot.dot[1] - pan) * scale;
          const x = (spot.dot[0] - page.crop) * scale;
          return { spot, i, x: clamp(x, 24, size.w - 24), side: y < 6 ? "top" : y > size.h - 6 ? "bottom" : null };
        })
        .filter((e) => e.side),
    [page, pan, scale, size],
  );
  if (boot < 5) return null;
  return (
    <>
      {out.map((e) => (
        <button
          key={`${page.screen}-${e.spot.tool.id}-${pan}`}
          type="button"
          className={`spx-edge spx-edge--${e.side}`}
          style={{ left: e.x }}
          aria-label={e.spot.tool.label}
          data-cursor="link"
          onClick={(ev) => {
            onSpot(e.i);
            // the arrow goes once its spot is in view: focus moves on to the spot's dot
            focusDot(ev.currentTarget.parentElement?.querySelector(".spx-page.is-on .spx-pan") ?? null, e.spot.tool.id);
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d={e.side === "bottom" ? "M4 6l4 4 4-4" : "M4 10l4-4 4 4"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </>
  );
}
