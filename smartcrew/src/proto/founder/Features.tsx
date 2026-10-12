import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FEATURES, GROUPS, byId, type Feature } from "./features";
import { ScreenCanvas, screenSize, useWidth } from "./Screen";
import { Pin } from "./Pin";
import { track } from "./copy";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Where the camera sits over the real screen for one feature. The scale never drops below
 * ~0.64 on a laptop, so UI text stays ≥ 10 px on screen (AISMELL V11): the frame crops, it
 * doesn't shrink.
 */
function frame(f: Feature, W: number, H: number) {
  if (!f.screen || !f.focus) return null;
  const { w: SW, h: SH } = screenSize(f.screen);
  const r = f.focus;
  const phone = SW < 600;
  const small = W < 420;
  let s: number, tx: number, ty: number;
  if (phone) {
    s = small ? 0.46 : Math.max(0.54, Math.min(0.72, H / r.h));
    tx = (W - SW * s) / 2;
    ty = -r.y * s + (small ? 6 : 14);
    ty = Math.min(14, Math.max(H - SH * s - 14, ty));
  } else {
    s = Math.max(small ? 0.46 : 0.64, Math.min(1, W / r.w, H / r.h));
    tx = W / 2 - (r.x + r.w / 2) * s;
    ty = H / 2 - (r.y + r.h / 2) * s;
    tx = SW * s <= W ? (W - SW * s) / 2 : Math.min(0, Math.max(W - SW * s, tx));
    ty = SH * s <= H ? (H - SH * s) / 2 : Math.min(0, Math.max(H - SH * s, ty));
  }
  return { s, tx, ty, phone, SW, SH };
}

export function Features({ initial }: { initial: string }) {
  const [active, setActive] = useState(initial);
  const f = byId(active);
  const reduce = useReducedMotion();
  const [winRef, W] = useWidth<HTMLDivElement>();
  const [H, setH] = useState(360);
  const btns = useRef<Map<string, HTMLSpanElement>>(new Map());
  const order = useMemo(() => FEATURES.map((x) => x.id), []);

  useEffect(() => {
    const el = winRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [winRef]);

  const pick = (id: string, focus = false) => {
    setActive(id);
    track("module_view", { module_id: id });
    if (focus) btns.current.get(id)?.focus();
  };

  // clauses are inline spans with role=button (a <button> can't wrap across lines)
  const press = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(id);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    const i = order.indexOf(active);
    let n = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = Math.min(order.length - 1, i + 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = Math.max(0, i - 1);
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = order.length - 1;
    if (n >= 0) {
      e.preventDefault();
      pick(order[n], true);
    }
  };

  const fr = W > 0 ? frame(f, W, H) : null;
  const dur = reduce ? 0 : 0.42;

  return (
    <section className="f-feat" id="features" aria-labelledby="f-feat-h" data-sec="features">
      <div className="f-wrap">
        <h2 id="f-feat-h" className="f-h2 f-feat-h">
          Here’s everything SmartCrew does, from the first clock-in to the last load.
        </h2>
        <div className="f-feat-grid">
          <div className="f-feat-index">
            <p className="f-feat-para" onKeyDown={onKey}>
              {GROUPS.map((g) => (
                <span className={`f-feat-group${f.group === g.id ? " is-on" : ""}`} key={g.id}>
                  <span role="button" tabIndex={-1} className="f-feat-head" onClick={() => pick(g.lead)} onKeyDown={(e) => press(e, g.lead)}>
                    {g.head}
                  </span>{" "}
                  {FEATURES.filter((x) => x.group === g.id).map((x) => (
                    <span key={x.id}>
                      <span
                        role="button"
                        ref={(el) => {
                          if (el) btns.current.set(x.id, el);
                        }}
                        className={`f-clause${x.id === active ? " is-active" : ""}${x.pending ? " is-pending" : ""}`}
                        aria-pressed={x.id === active}
                        aria-controls="f-stage"
                        tabIndex={x.id === active ? 0 : -1}
                        onClick={() => pick(x.id)}
                        onKeyDown={(e) => press(e, x.id)}
                      >
                        {x.text}
                      </span>
                      {x.after}
                    </span>
                  ))}
                </span>
              ))}
            </p>
            <p className="f-feat-legend">
              Tap any line to see it in the app. <span className="f-feat-legend-dash">Dashed lines</span> are waiting on Andrew to confirm they’re live.
            </p>
          </div>

          <div className="f-stage" id="f-stage" aria-live="polite" data-pair-end>
            <div className="f-stage-top">
              <span className="f-stage-side">{f.side}</span>
              <span className="f-stage-name">{f.name}</span>
            </div>
            <div className={`f-stage-window${fr?.phone ? " is-phone" : ""}${f.pending ? " is-pending" : ""}`} ref={winRef}>
              <AnimatePresence initial={false}>
                {f.pending ? (
                  <motion.div key="pending" className="f-stage-pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }}>
                    <span className="f-ph-label">Placeholder for Andrew</span>
                    <p>No screen yet. This one goes live on the page once Andrew confirms the feature is in the app.</p>
                  </motion.div>
                ) : (
                  fr &&
                  f.screen && (
                    <motion.div
                      key={f.screen}
                      className="f-stage-layer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
                    >
                      <motion.div
                        className={`f-stage-move${fr.phone ? " is-phone" : ""}`}
                        initial={false}
                        animate={{ x: fr.tx, y: fr.ty, scale: fr.s }}
                        transition={{ duration: dur, ease: EASE }}
                        style={{ width: fr.SW, height: fr.SH, borderRadius: fr.phone ? 20 / fr.s : 0 }}
                      >
                        <ScreenCanvas id={f.screen} />
                      </motion.div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
              {fr && f.pin && !f.pending && (
                <motion.div
                  key={`${f.id}-pin`}
                  className="f-stage-pin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.3 }}
                >
                  <Pin left={`${f.pin.x * fr.s + fr.tx}px`} top={`${f.pin.y * fr.s + fr.ty}px`} label={f.pin.label} dir={f.pin.x * fr.s + fr.tx > W * 0.62 ? "nw" : "ne"} len={34} />
                </motion.div>
              )}
            </div>
            <p className="f-stage-detail">{f.detail}</p>
            <p className="f-caption">
              {f.shown ? `Shown: ${f.shown}. ` : ""}
              {f.pending ? `Source: ${f.src === "LV" ? "Lovable mockup" : "Vercel mockup"} copy.` : "Demo account. Names and numbers are made up."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
