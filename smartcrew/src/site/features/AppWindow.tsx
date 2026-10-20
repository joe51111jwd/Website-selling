// The SmartCrew office web app as a clickable prototype (desktop only; Andrew: "make this a full
// screen… almost a full clickable prototype"). Its sidebar lists every screen of the app (the
// recreated web screens, src/screens/registry.ts), not ten groups; a click opens that screen, live
// (src/screens, scaled to fit, its own sidebar cut away and its page drawn to the window's height).
// A few labelled hotspots on each screen say what that part does (pointing at one, focusing it or
// clicking it rings the thing and gives its one line), and a few things on the screens open the
// screen they would in the app (a project card opens the job, a tab opens its page, a machine its
// service records). Where the screen has a field side, the crew's phone stands beside the window.
//
// Screens mount once (the shown one at once, the rest one per idle moment after the section has
// arrived) and stay, so switching is opacity and transform only.

import { startTransition, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { FEATURES } from "../../content/features";
import { Icon } from "../../screens/kit";
import logoUrl from "../../screens/kit/smartcrew-logo.svg";
import { SIZE } from "../../screens/registry";
import { PhoneFrame } from "../phone/PhoneFrame";
import { idle, screenComp, warmScreen } from "../specsheet/screens";
import { featureById, NAV_SCREENS, SCREENS, screenDef, type ScreenDef, type Spot } from "./data";

const W = SIZE.web.w;
const H = SIZE.web.h;
const TOP_BAR = 79; // the screens' own top bar, native px (the sidebar's logo row lines up with it)
const A = FEATURES.app;

type Size = { w: number; h: number };

type Props = {
  screen: string;
  onScreen: (id: string) => void;
  /** the section has arrived (the other screens start mounting) */
  arrived: boolean;
};

export default function AppWindow({ screen, onScreen, arrived }: Props) {
  const main = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const def = screenDef(screen);
  const feature = featureById(def.feature);

  // the screen area's size, on mount and on resize only
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

  // screens mount once and stay: the shown one at once, the others one per idle moment
  const [mounted, setMounted] = useState<Set<string>>(() => new Set([screen]));
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;
  useEffect(() => {
    setMounted((m) => (m.has(screen) ? m : new Set(m).add(screen)));
  }, [screen]);
  useEffect(() => {
    if (!arrived) return;
    let cancel = () => {};
    let n = 0;
    const next = () => {
      const left = SCREENS.filter((s) => !mountedRef.current.has(s.id));
      if (!left.length || n++ > SCREENS.length) return;
      const s = left[0];
      void warmScreen(s.id).then(() => {
        cancel = idle(() => {
          startTransition(() => setMounted((m) => new Set(m).add(s.id)));
          cancel = idle(next, 2000);
        }, 2000);
      });
    };
    const t = window.setTimeout(() => (cancel = idle(next, 2000)), 1400);
    return () => {
      window.clearTimeout(t);
      cancel();
    };
  }, [arrived]);

  // the phones beside the window: each mounts the first time it's wanted, then crossfades
  const [phones, setPhones] = useState<string[]>(() => (def.phone ? [def.phone] : []));
  useEffect(() => {
    if (def.phone) setPhones((p) => (p.includes(def.phone!) ? p : [...p, def.phone!]));
  }, [def.phone]);

  // the sidebar's logo row lines up with the screens' own top bar
  const scale295 = size ? size.w / (W - 295) : 0.55;

  return (
    <div className={`ft-app${def.phone ? " has-phone" : ""}`} data-ft-in="4">
      <div className="ft-win" role="group" aria-label={A.label}>
        <div className="ft-bar">
          <span className="ft-lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <p className="ft-crumb" aria-live="polite">
            <span className="ft-crumb-a">SmartCrew</span>
            <span className="ft-crumb-sep" aria-hidden="true">/</span>
            <span className="ft-crumb-b">{feature.name}</span>
            <span className="ft-crumb-sep" aria-hidden="true">/</span>
            <span className="ft-crumb-c">{def.name}</span>
          </p>
        </div>

        <div className="ft-body-app">
          <nav className="ft-side" aria-label={A.nav}>
            <div className="ft-logo" style={{ height: Math.round(TOP_BAR * scale295) }} aria-hidden="true">
              <span className="ft-logo-mark">
                <img src={logoUrl} alt="" draggable={false} />
              </span>
              <span className="ft-logo-word">SMARTCREW</span>
            </div>
            <ul className="ft-nav">
              {NAV_SCREENS.map((s, i) => {
                const on = s.id === screen || s.id === def.nav;
                const mine = s.feature === def.feature;
                return (
                  <li key={s.id} style={{ "--i": i } as CSSProperties}>
                    <button
                      type="button"
                      className={`ft-nav-item${on ? " is-on" : ""}${mine ? " is-mine" : ""}${s.under ? " is-sub" : ""}`}
                      aria-current={on ? "page" : undefined}
                      aria-label={`${s.name} ${A.screen}`}
                      data-screen={s.id}
                      data-cursor="link"
                      onClick={() => onScreen(s.id)}
                      onPointerEnter={() => void warmScreen(s.id)}
                    >
                      <Icon name={s.icon} size={s.under ? 16 : 18} stroke={on ? 1.85 : 1.6} />
                      <span className="ft-nav-name">{s.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {/* no "Demo account…" line (Andrew's comment-mode note, Oct 20: "Cut") */}
          </nav>

          <div ref={main} className="ft-main">
            {size &&
              SCREENS.map((s) =>
                mounted.has(s.id) ? <Page key={s.id} def={s} on={s.id === screen} size={size} onScreen={onScreen} /> : null,
              )}
          </div>
        </div>
      </div>

      {phones.map((id) => (
        <div key={id} className={`ft-phone${id === def.phone ? " is-on" : ""}`} aria-hidden={id !== def.phone}>
          <p className="ft-phone-tag">{A.phone}</p>
          <PhoneFrame screens={[id]} sizes="190px" loading="eager" alt={id === def.phone ? A.phone : ""} />
        </div>
      ))}
    </div>
  );
}

function Page({ def, on, size, onScreen }: { def: ScreenDef; on: boolean; size: Size; onScreen: (id: string) => void }) {
  const Comp = screenComp(def.id);
  const scale = size.w / (W - def.crop);
  // the page is drawn as tall as the window (its tables and boards run on, like the real app)
  const nh = Math.max(H, Math.ceil(size.h / scale));
  const [spot, setSpot] = useState<string | null>(null);
  useEffect(() => {
    if (!on) setSpot(null);
  }, [on]);
  const x = (v: number) => (v - def.crop) * scale;
  const y = (v: number) => v * scale;
  return (
    <div className={`ft-page${on ? " is-on" : ""}`} aria-hidden={!on} inert={!on}>
      <div
        className="ft-scr"
        aria-hidden="true"
        inert
        style={{ width: W, height: nh, transform: `translate3d(${-def.crop * scale}px, 0, 0) scale(${scale})`, "--ft-nh": `${nh}px` } as CSSProperties}
      >
        <Suspense fallback={null}>
          <Comp />
        </Suspense>
      </div>

      {def.links.map((l, i) => {
        const to = screenDef(l.to);
        const [bx, by, bw, bh] = l.box;
        return (
          <button
            key={`${l.to}-${i}`}
            type="button"
            // (its hint opens to the right near the window's left edge, so it isn't cut, and on a
            // table row, so the crew's phone beside the window doesn't hide it)
            className={`ft-link${x(bx + bw) < 220 || bw * scale > size.w / 2 ? " is-left" : ""}`}
            style={{ left: x(bx) - 3, top: y(by) - 3, width: bw * scale + 6, height: bh * scale + 6 }}
            aria-label={`${A.open}: ${to.name}`}
            data-cursor="link"
            onClick={() => onScreen(l.to)}
            onPointerEnter={() => void warmScreen(l.to)}
          >
            <span className="ft-link-hint" aria-hidden="true">
              {A.open}: {to.name}
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        );
      })}

      {def.spots.map((s, i) => (
        <SpotView
          key={s.id}
          s={s}
          i={i}
          on={spot === s.id}
          size={size}
          x={x}
          y={y}
          onOn={(v) => setSpot((cur) => (v ? s.id : cur === s.id ? null : cur))}
        />
      ))}
    </div>
  );
}

function SpotView({
  s,
  i,
  on,
  size,
  x,
  y,
  onOn,
}: {
  s: Spot;
  i: number;
  on: boolean;
  size: Size;
  x: (v: number) => number;
  y: (v: number) => number;
  onOn: (v: boolean) => void;
}) {
  const [bx, by, bw, bh] = s.box;
  const L = x(bx);
  const T = y(by);
  const R = x(bx + bw);
  const B = y(by + bh);
  // the name sits on the box's top edge (or its foot), from its left corner, or from its right
  // corner near the window's right edge; the line opens under the box, or over it near the foot,
  // and from the box's right corner when it would run past the window (it is the wider of the two)
  const flip = L > size.w - 210;
  const tipFlip = L > size.w - 310;
  const up = B > size.h - 130;
  const chip: CSSProperties = {
    top: s.place === "below" ? B + 5 : T - 27,
    ...(flip ? { right: size.w - R } : { left: Math.max(6, L) }),
  };
  const tip: CSSProperties = {
    ...(up ? { bottom: size.h - T + 8 } : { top: B + 8 }),
    ...(tipFlip ? { right: Math.max(6, size.w - R) } : { left: Math.max(6, L) }),
  };
  const tipId = `ft-tip-${s.id}`;
  return (
    <div className={`ft-spot${on ? " is-on" : ""}${up ? " is-up" : ""}`} style={{ "--i": i } as CSSProperties}>
      <span className="ft-ring" aria-hidden="true" style={{ left: L - 4, top: T - 4, width: R - L + 8, height: B - T + 8 }} />
      <button
        type="button"
        className="ft-spot-btn"
        style={chip}
        aria-expanded={on}
        aria-describedby={on ? tipId : undefined}
        aria-label={A.hotspot(s.label)}
        data-cursor="link"
        onClick={() => onOn(!on)}
        onFocus={() => onOn(true)}
        onBlur={() => onOn(false)}
        onPointerEnter={(e) => e.pointerType === "mouse" && onOn(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && onOn(false)}
        onKeyDown={(e) => e.key === "Escape" && onOn(false)}
      >
        <span className="ft-spot-dot" aria-hidden="true" />
        <span className="ft-spot-label" aria-hidden="true">
          {s.label}
        </span>
      </button>
      <span className="ft-spot-tip" id={tipId} role="tooltip" style={tip}>
        {s.line}
      </span>
    </div>
  );
}
