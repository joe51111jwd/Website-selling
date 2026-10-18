// The live half of the liquid glass (src/lib/liquidGlass.ts): bakes the lens for a surface's current
// size and renders the SVG filter it uses as its backdrop-filter. Off unless asked for (the focus look
// only), off on phones (no backdrop-filter there: it janks scrolling on mid-range Android) and off
// when the visitor asked for less transparency or more contrast. The surface's CSS keeps its plain
// frosted look until the lens is ready, and keeps it for good wherever the lens can't run.
//
// The lens "materializes" when it first applies (Apple: glass appears "by gradually modulating the
// light bending and lensing", not by fading): its strength runs from 0 to full in about half a second.
// Reduced motion: it simply appears.

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { buildGlassMap, canRefract, type GlassMap, type GlassMapOptions } from "../../lib/liquidGlass";

type Opts = Omit<GlassMapOptions, "width" | "height" | "radius">;

const OFF = "(max-width: 760px), (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)";

/** The filter id once the lens for `ref`'s current size is baked and decoded, else null. */
export function useLiquidGlass(ref: RefObject<HTMLElement | null>, opts: Opts, enabled: boolean) {
  const id = "lg" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [map, setMap] = useState<GlassMap | null>(null);
  const key = JSON.stringify(opts);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || !canRefract()) return;
    const o = JSON.parse(key) as Opts;
    const off = window.matchMedia(OFF);
    let last = "";
    let timer = 0;
    let raf = 0;
    let alive = true;
    const build = () => {
      if (off.matches) {
        last = "";
        setMap(null);
        return;
      }
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (w < 8 || h < 8) return;
      // the radius comes from the CSS, so the stylesheet stays the one source of the shape
      const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
      const k = `${w}|${h}|${r}|${devicePixelRatio}`;
      if (k === last) return;
      last = k;
      const m = buildGlassMap({ ...o, width: w, height: h, radius: r });
      // apply only once decoded: an unloaded feImage reads as R = G = 0, a jump of half the scale
      const decode = (src?: string) => {
        if (!src) return Promise.resolve();
        const img = new Image();
        img.src = src;
        return img.decode().catch(() => {});
      };
      Promise.all([decode(m.href), decode(m.specHref)]).then(() => {
        if (alive && last === k) setMap(m);
      });
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(build);
      }, 120);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    off.addEventListener("change", build);
    // a zoom or a move to another screen changes devicePixelRatio
    window.addEventListener("resize", schedule);
    build();
    return () => {
      alive = false;
      ro.disconnect();
      off.removeEventListener("change", build);
      window.removeEventListener("resize", schedule);
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [ref, key, enabled]);

  return { id: map ? id : null, map };
}

/** The lens's SVG filter. Rendered next to the surface; never display: none (that drops the filter). */
export function LiquidGlassFilter({ id, map }: { id: string | null; map: GlassMap | null }) {
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const shown = useRef(false);

  // materialize once, on the first map; later rebakes (a resize) swap in at full strength
  useEffect(() => {
    const el = disp.current;
    if (!el || !map || shown.current) return;
    shown.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now();
    const T = 560;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / T);
      const e = 1 - (1 - p) ** 3;
      el.setAttribute("scale", (map.scale * e).toFixed(2));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    el.setAttribute("scale", "0");
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      el.setAttribute("scale", String(map.scale));
    };
  }, [map]);

  if (!id || !map) return null;
  const { width: w, height: h } = map;
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
      <filter id={id} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={map.href} x="0" y="0" width={w} height={h} preserveAspectRatio="none" result="map" />
        <feDisplacementMap ref={disp} in="SourceGraphic" in2="map" scale={map.scale} xChannelSelector="R" yChannelSelector="G" result="bent" />
        {map.specHref && (
          <>
            <feImage href={map.specHref} x="0" y="0" width={w} height={h} preserveAspectRatio="none" result="spec" />
            <feBlend in="spec" in2="bent" mode="screen" />
          </>
        )}
      </filter>
    </svg>
  );
}
