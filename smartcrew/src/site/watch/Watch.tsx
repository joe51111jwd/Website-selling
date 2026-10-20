// Watch it work (round 5, Andrew's Oct 19 doc: "A Day In The Life"): the product in three tabs, The
// Day for the crews, The Week for the admins, The Results for the owners. Laid out after his
// reference (keeping our own type, colours and parts): the tab bar on top; under it, on the left,
// the tab's eyebrow, headline, sub and list of features (his words, src/content/watch.ts) and its
// one button; on the right the office app on a laptop with the crew's phone over its corner, both
// live app screens (src/screens, scaled). Pointing at an item (mouse, after a short dwell),
// clicking it or focusing it highlights it and switches the laptop and the phone to the screens
// that show it (./shots.ts).
//
// Phones: the tabs are three compact segments; the list shows each item's title, the highlighted
// one with its line; then the phone alone (no laptop: an office screen can't be read that small),
// then the button. Only one panel (and so one orange button) shows at a time.
//
// Classic sets the section on a dark ground (./classic.css): the phone gets the frame's dark-ground
// rim and the cursor its dark tone.
//
// Motion is calm and only on input: the panel fades in when its tab opens and the screens
// crossfade. No timers move anything, nothing pins. Screens mount once (the shown ones when the
// section is a screen away, the rest one per idle moment) and stay, so a switch is opacity only.

import { startTransition, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { splitTitle, WATCH, type WatchTab } from "../../content/watch";
import { CLASSIC } from "../../lib/look";
import { Icon } from "../../screens/kit/Icon";
import { SIZE, type ScreenKind } from "../../screens/registry";
import { Scene } from "../scene/Scene";
import { Cta } from "../ui/Cta";
import { usePhone } from "../phone";
import { LaptopFrame } from "../phone/LaptopFrame";
import { PhoneFrame } from "../phone/PhoneFrame";
import { useArrive } from "../phone/useArrive";
import { idle, screenComp, shotFor, warmScreen } from "./shots";
import "./watch.css";
import "./glass.css";
import "./focus.css";
import "./bold.css";
import "./classic.css";

const TABS = WATCH.tabs;
/** How long the mouse rests on an item before the devices follow it (a sweep across the list doesn't flicker them). */
const DWELL = 90;

function TabGlyph({ id }: { id: WatchTab["id"] }) {
  if (id === "week") return <Icon name="calendar" size={20} stroke={1.7} />;
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {id === "day" ? (
        <>
          <circle cx={12} cy={12} r={4.2} />
          <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.35 5.35l1.5 1.5M17.15 17.15l1.5 1.5M5.35 18.65l1.5-1.5M17.15 6.85l1.5-1.5" />
        </>
      ) : (
        <path d="M4 20.5h16M6.5 17v-4.5M11 17V9M15.5 17v-6M20 17V5.5" />
      )}
    </svg>
  );
}

function Chevron() {
  return (
    <svg className="wt-chev" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** One device's screens, stacked: every mounted one drawn at its native size and scaled to the slot; the shown one on top. */
function Stack({ kind, ids, shown }: { kind: ScreenKind; ids: string[]; shown: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const { w, h } = SIZE[kind];

  // the slot's width, on mount and on resize only
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(e.contentRect.width / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  return (
    <div ref={ref} className="wt-stack" inert>
      {k > 0 &&
        ids.map((id) => {
          const Comp = screenComp(id);
          return (
            <div key={id} className={`wt-shot${id === shown ? " is-on" : ""}`}>
              <div className="wt-scr" style={{ width: w, height: h, transform: `scale(${k})` } as CSSProperties}>
                <Suspense fallback={null}>{Comp && <Comp />}</Suspense>
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default function Watch() {
  const phone = usePhone();
  const [tab, setTab] = useState(0);
  const [picks, setPicks] = useState<number[]>(() => TABS.map(() => 0));
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dwell = useRef(0);
  // a screen away: the shown screens mount; then the rest, one per idle moment
  const [nearRef, near] = useArrive<HTMLDivElement>({ amount: 0, margin: "100% 0px 100% 0px" });

  const t = TABS[tab];
  const shot = shotFor(t.id, t.items[picks[tab]].id);

  const [mounted, setMounted] = useState<string[]>([]);
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;
  const add = (id: string) => setMounted((m) => (m.includes(id) ? m : [...m, id]));

  useEffect(() => {
    if (!near) return;
    add(shot.phone);
    if (!phone) add(shot.web);
  }, [near, phone, shot.web, shot.phone]);

  useEffect(() => {
    if (!near) return;
    // this tab's screens first, then the other tabs' (phones: the phone screens only)
    const order = [...TABS.slice(tab), ...TABS.slice(0, tab)].flatMap((x) =>
      x.items.flatMap((it) => {
        const s = shotFor(x.id, it.id);
        return phone ? [s.phone] : [s.web, s.phone];
      }),
    );
    let cancel = () => {};
    let dead = false;
    const next = () => {
      const id = order.find((x) => !mountedRef.current.includes(x));
      if (!id || dead) return;
      void warmScreen(id).then(() => {
        if (dead) return;
        cancel = idle(() => {
          startTransition(() => add(id));
          cancel = idle(next, 2000);
        }, 2000);
      });
    };
    const timer = window.setTimeout(() => (cancel = idle(next, 2000)), 700);
    return () => {
      dead = true;
      window.clearTimeout(timer);
      cancel();
    };
  }, [near, tab, phone]);

  useEffect(() => () => window.clearTimeout(dwell.current), []);

  // the cursor reads its tone off the nearest [data-cursor-tone]; the section's own element is Scene's
  useEffect(() => {
    if (CLASSIC) document.getElementById("watch")?.setAttribute("data-cursor-tone", "dark");
  }, []);

  const choose = (i: number) => {
    window.clearTimeout(dwell.current);
    setTab(i);
  };
  const pick = (j: number) => {
    window.clearTimeout(dwell.current);
    setPicks((p) => (p[tab] === j ? p : p.map((v, i) => (i === tab ? j : v))));
  };
  const rest = (j: number) => {
    window.clearTimeout(dwell.current);
    dwell.current = window.setTimeout(() => pick(j), DWELL);
  };

  // ← → Home End move between the tabs (and open them)
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = TABS.length;
    const to = e.key === "ArrowRight" ? (tab + 1) % n : e.key === "ArrowLeft" ? (tab - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to === null) return;
    e.preventDefault();
    choose(to);
    tabRefs.current[to]?.focus();
  };

  const kindIds = (kind: ScreenKind) => mounted.filter((id) => id.startsWith(`${kind}-`));

  return (
    <Scene id="watch" pinnedViewports={0} stage="keep" label={WATCH.label} className="wt">
      <div className="wrap wt-wrap" ref={nearRef}>
        <h2 className="t-h2 wt-title">{WATCH.title}</h2>

        <div className="wt-tablist" role="tablist" aria-label={WATCH.tabsLabel} onKeyDown={onTabKey}>
          {TABS.map((x, i) => (
            <button
              key={x.id}
              ref={(n) => {
                tabRefs.current[i] = n;
              }}
              type="button"
              role="tab"
              id={`wt-tab-${x.id}`}
              aria-selected={i === tab}
              aria-controls={`wt-panel-${x.id}`}
              tabIndex={i === tab ? 0 : -1}
              className="wt-tab"
              data-cursor="link"
              onClick={() => choose(i)}
            >
              <span className="wt-tab-ic" aria-hidden="true">
                <TabGlyph id={x.id} />
              </span>
              <span className="wt-tab-txt">
                <span className="wt-tab-name">{x.name}</span> <span className="wt-tab-who">{x.who}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="wt-body">
          <div className="wt-panels">
            {TABS.map((x, i) => (
              <div
                key={x.id}
                className={`wt-panel${i === tab ? "" : " is-off"}`}
                role="tabpanel"
                id={`wt-panel-${x.id}`}
                aria-labelledby={`wt-tab-${x.id}`}
                inert={i !== tab}
              >
                <p className="wt-eyebrow">{x.eyebrow}</p>
                <h3 className="wt-h">{x.headline}</h3>
                <p className="t-lead wt-sub">{x.sub}</p>
                <ul className="wt-list" data-tab={x.id}>
                  {x.items.map((it, j) => {
                    const on = j === picks[i];
                    const { lead, head } = splitTitle(it.title);
                    return (
                      <li key={it.id}>
                        <button
                          type="button"
                          className="wt-item"
                          aria-current={on || undefined}
                          data-item={it.id}
                          data-cursor="link"
                          onClick={() => pick(j)}
                          onFocus={() => pick(j)}
                          onPointerEnter={(e) => e.pointerType === "mouse" && rest(j)}
                          onPointerLeave={() => window.clearTimeout(dwell.current)}
                        >
                          <span className="wt-ic" aria-hidden="true">
                            <Icon name={shotFor(x.id, it.id).icon} size={18} stroke={1.7} />
                          </span>
                          <span className="wt-txt">
                            <span className="wt-t">
                              {lead && (
                                <span className={`wt-lead${x.id === "day" ? " is-time" : ""}`}>
                                  {lead}
                                  <span className="wt-dash"> — </span>
                                </span>
                              )}
                              <span className="wt-head">{head}</span>
                            </span>{" "}
                            <span className="wt-line">{it.line}</span>
                          </span>
                          <Chevron />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="wt-dev" data-web={phone ? undefined : shot.web} data-phone={shot.phone}>
            <div className="wt-devs">
              {!phone && (
                <LaptopFrame screens={[]} className="wt-laptop">
                  <Stack kind="web" ids={kindIds("web")} shown={shot.web} />
                </LaptopFrame>
              )}
              <PhoneFrame screens={[]} className="wt-phone" tone={CLASSIC ? "dark" : "light"}>
                <Stack kind="phone" ids={kindIds("phone")} shown={shot.phone} />
              </PhoneFrame>
            </div>
          </div>

          <div className="wt-act">
            {TABS.map((x, i) => (
              <div key={x.id} className="wt-act-cta" hidden={i !== tab}>
                <Cta source={`watch-${x.id}`} intent={x.cta.intent} label={x.cta.label} size="lg" cue={i === 0} />
              </div>
            ))}
            {/* no "Demo account…" caption under the devices (Andrew's comment-mode note, Oct 20: "cut this") */}
          </div>
        </div>
      </div>
    </Scene>
  );
}
