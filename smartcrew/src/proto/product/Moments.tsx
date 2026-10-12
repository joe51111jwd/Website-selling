import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MOMENTS, type Feature, type Moment, type MomentId, type OfficeView, type PhoneView } from "./data";
import { Crop, EASE, FRAME, Phone, phoneScale, useBox } from "./Shots";
import { track } from "./track";

// S5, the feature system. Seven everyday moments; each one is a pair: what the crew does in
// the crew app, and what the office sees because of it. Every moment names the features it
// carries (38 in all, each once); tapping a feature points the stage at the part of the real
// screen that does it. No auto-rotation, no hover-only content (PLAYBOOK S5 rule 8).

function resolve(m: Moment, f: Feature): { phone: PhoneView; office: OfficeView } {
  // a feature with no screen (or one Andrew still has to confirm) never gets a ring on a screen
  if (f.confirm || f.noScreen) return { phone: { ...m.phone, ring: undefined }, office: { ...m.office, mark: undefined } };
  const fp = f.phone;
  const phone: PhoneView = fp?.id && fp.id !== m.phone.id ? { id: fp.id, y: fp.y ?? 30, ring: fp.ring } : { ...m.phone, ...(fp ?? {}) };
  const fo = f.office;
  const office: OfficeView =
    fo?.id && fo.id !== m.office.id ? { id: fo.id, x: fo.x ?? 340, y: fo.y ?? 150, mark: fo.mark } : { ...m.office, ...(fo ?? {}) };
  return { phone, office };
}

export default function Moments({ initial }: { initial: MomentId }) {
  const [mid, setMid] = useState<MomentId>(initial);
  const [fi, setFi] = useState(0);
  const m = MOMENTS.find((x) => x.id === mid)!;
  const f = m.features[fi] ?? m.features[0];
  const views = useMemo(() => resolve(m, f), [m, f]);
  const seen = useRef(new Set<string>());
  const rows = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const key = `${m.id}:${f.id}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);
    track("module_view", { module_id: f.id, moment: m.id });
  }, [m.id, f.id]);

  const reduce = useReducedMotion();
  const pick = (id: MomentId) => {
    if (id === mid) return;
    setMid(id);
    setFi(0);
    // phone: the stage lives inside the opened row; keep that row's heading on screen
    if (window.matchMedia("(max-width: 760px)").matches) {
      const i = MOMENTS.findIndex((x) => x.id === id);
      setTimeout(() => {
        const el = rows.current[i];
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        if (top < 64 || top > window.innerHeight * 0.4) window.scrollTo({ top: window.scrollY + top - 64, behavior: reduce ? "auto" : "smooth" });
      }, reduce ? 0 : 280);
    }
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const j = (i + (e.key === "ArrowDown" ? 1 : -1) + MOMENTS.length) % MOMENTS.length;
    rows.current[j]?.focus();
    pick(MOMENTS[j].id);
  };

  return (
    <div className="pm">
      <div className="pm-index">
        <ol className="pm-list">
          {MOMENTS.map((x, i) => {
            const on = x.id === mid;
            return (
              <li key={x.id} className={`pm-row${on ? " is-on" : ""}`}>
                <button
                  ref={(el) => {
                    rows.current[i] = el;
                  }}
                  type="button"
                  className="pm-head"
                  aria-expanded={on}
                  aria-controls={`pm-body-${x.id}`}
                  onClick={() => pick(x.id)}
                  onKeyDown={(e) => onKey(e, i)}
                >
                  <span className="pm-when">{x.when}</span>
                  <span className="pm-title">{x.title}</span>
                  <span className="pm-count" aria-label={`${x.features.length} features`}>
                    {x.features.length}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      className="pm-body"
                      id={`pm-body-${x.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.26, ease: EASE }}
                    >
                      <MomentBody m={x} fi={fi} setFi={setFi} views={views} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="pm-stage-col" aria-live="polite">
        <Stage m={m} views={views} />
      </div>
    </div>
  );
}

function MomentBody({ m, fi, setFi, views }: { m: Moment; fi: number; setFi: (i: number) => void; views: { phone: PhoneView; office: OfficeView } }) {
  const f = m.features[fi] ?? m.features[0];
  return (
    <div className="pm-open">
      <p className="pm-outcome">{m.outcome}</p>
      {/* phone layout: the stage sits inside the open moment */}
      <div className="pm-inline-stage">
        <Stage m={m} views={views} compact />
      </div>
      <ul className="pm-chips" aria-label={`What ${m.title.toLowerCase()} uses`}>
        {m.features.map((x, i) => (
          <li key={x.id}>
            <button type="button" className={`pm-chip${i === fi ? " is-on" : ""}${x.confirm ? " is-confirm" : ""}`} aria-pressed={i === fi} onClick={() => setFi(i)}>
              {x.label}
              {x.confirm && <span className="pm-chip-flag">to confirm</span>}
            </button>
          </li>
        ))}
      </ul>
      <p className="pm-line" key={f.id}>
        {f.line}
        {f.confirm && <span className="pp-ph pp-ph-inline">Placeholder for Andrew: confirm this is live before launch</span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The stage: crew phone on the left, office window on the right, joined by the entry.
// ─────────────────────────────────────────────────────────────────────────────
function Stage({ m, views, compact = false }: { m: Moment; views: { phone: PhoneView; office: OfficeView }; compact?: boolean }) {
  const [ref, box] = useBox<HTMLDivElement>();
  const reduce = useReducedMotion();
  const { phone, office } = views;
  const W = box.w;
  const H = box.h;
  const key = `${phone.id}|${phone.ring?.join(",")}|${office.id}|${office.x},${office.y}|${office.mark?.label}`;

  if (compact) return <CompactStage m={m} views={views} />;

  let inner = null;
  let labels = null;
  if (W > 0 && H > 0) {
    const pad = 22;
    const phoneW = Math.round(Math.min(272, Math.max(204, W * 0.3)));
    const sp = phoneScale(phoneW);
    const frameH = (phoneW * FRAME.h) / FRAME.w;
    const scrTop = frameH * FRAME.sy;
    const scrLeft = phoneW * FRAME.sx;
    const phoneLeft = 30;
    // pan the phone so native y `phone.y` sits near the panel top; it bleeds off top or bottom
    let frameTop = pad - (scrTop + phone.y * sp);
    frameTop = Math.min(pad, Math.max(H - frameH - 14, frameTop));

    const oLeft = phoneLeft + phoneW + 56;
    const oTop = pad;
    const oVisW = W - oLeft;
    const sw = oVisW / (office.w ?? 740);
    const oH = H - oTop - pad;

    // office ring: the element the entry lands on, clipped to the visible window
    const mk = office.mark;
    let ring: { l: number; t: number; w: number; h: number } | null = null;
    if (mk) {
      const l = Math.max(0, (mk.b[0] - office.x) * sw);
      const t = Math.max(0, (mk.b[1] - office.y) * sw);
      const r2 = Math.min(oVisW - 2, (mk.b[0] + mk.b[2] - office.x) * sw);
      const b2 = Math.min(oH - 2, (mk.b[1] + mk.b[3] - office.y) * sw);
      if (r2 - l > 12 && b2 - t > 10) ring = { l: oLeft + l, t: oTop + t, w: r2 - l, h: b2 - t };
    }
    const markIn = !!ring;
    const my = ring ? ring.t + ring.h / 2 - oTop : 0;

    // the entry: from the tapped control on the phone to the office window's edge, level with
    // the row it lands on. It never crosses the office screen itself.
    const r = phone.ring;
    const rx = r ? phoneLeft + scrLeft + (r[0] + r[2]) * sp + 7 : 0;
    const ry = r ? frameTop + scrTop + (r[1] + r[3] / 2) * sp : 0;
    const ringIn = !!r && ry > 12 && ry < H - 12;
    const ex = oLeft - 3;
    const ey = Math.max(oTop + 16, Math.min(oTop + oH - 16, oTop + my));
    const link = markIn && ringIn && ex - rx > 18;
    const mid = (rx + ex) / 2;
    const d = m.dir === "up" ? `M ${rx} ${ry} C ${mid} ${ry}, ${mid} ${ey}, ${ex} ${ey}` : `M ${ex} ${ey} C ${mid} ${ey}, ${mid} ${ry}, ${rx} ${ry}`;
    const tip = m.dir === "up" ? { x: ex, y: ey, a: 0 } : { x: rx, y: ry, a: 180 };

    labels = (
      <div className="pm-labels" aria-hidden="true">
        <span style={{ left: phoneLeft }}>Crew app</span>
        <span style={{ left: oLeft }}>
          Office{mk && markIn ? <b>: {mk.label}</b> : null}
        </span>
        <span className="pm-dir" style={{ left: phoneLeft + phoneW + 4, width: 52 }}>
          {m.dir === "up" ? "→" : "←"}
        </span>
      </div>
    );
    inner = (
      <>
        <motion.div className="pm-phone-pos" style={{ left: phoneLeft }} initial={false} animate={{ y: frameTop }} transition={reduce ? { duration: 0 } : { duration: 0.42, ease: EASE }}>
          <Phone id={phone.id} width={phoneW} ring={phone.ring} />
        </motion.div>
        <Crop id={office.id} x={office.x} y={office.y} s={sw} className="pm-window" style={{ left: oLeft, top: oTop, width: oVisW + 80, height: oH }} />
        <AnimatePresence>
          {link && (
            <motion.svg key={`l-${key}`} className="pm-link" width={W} height={H} viewBox={`0 0 ${W} ${H}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} aria-hidden="true">
              <motion.path d={d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={reduce ? { duration: 0 } : { delay: 0.16, duration: 0.26, ease: EASE }} />
              <motion.path className="pm-tip" d="M -7 -4.5 L 0 0 L -7 4.5" transform={`translate(${tip.x} ${tip.y}) rotate(${tip.a})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.38, duration: 0.12 }} />
            </motion.svg>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {ring && (
            <motion.span
              key={`r-${key}`}
              className="pp-ring pm-oring"
              style={{ left: ring.l - 3, top: ring.t - 3, width: ring.w + 6, height: ring.h + 6 }}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: reduce ? 0 : 0.36, duration: reduce ? 0 : 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="pm-stage-wrap">
      {labels ?? <div className="pm-labels" />}
      <div ref={ref} className="pm-stage">
        {inner}
        <span className="pm-demo">Demo account, a 16-person dirt work company. Names and numbers are made up.</span>
      </div>
    </div>
  );
}

// Phone layout: two legible crops (P8 vignettes), field above office (or below for office → field).
function CompactStage({ m, views }: { m: Moment; views: { phone: PhoneView; office: OfficeView } }) {
  const [ref, box] = useBox<HTMLDivElement>();
  const { phone, office } = views;
  const W = box.w;
  const ph = 150;
  const oh = 176;
  let pc = null;
  let oc = null;
  if (W > 0) {
    const sp = W / 402;
    const r = phone.ring;
    const cy = r ? r[1] + r[3] / 2 : phone.y + 120;
    const py = Math.max(0, Math.min(874 - ph / sp, cy - ph / sp / 2));
    pc = (
      <Crop id={phone.id} x={0} y={py} s={sp} className="pm-c-phone" style={{ height: ph }}>
        {r && <span className="pp-ring" style={{ left: r[0] * sp - 4, top: (r[1] - py) * sp - 4, width: r[2] * sp + 8, height: r[3] * sp + 8 }} />}
      </Crop>
    );
    const sw = W / 520;
    const mk = office.mark;
    const vw = W / sw;
    const vh = oh / sw;
    const cx = mk ? mk.b[0] + Math.min(mk.b[2], vw * 0.8) / 2 : office.x + vw / 2;
    const ocy = mk ? mk.b[1] + mk.b[3] / 2 : office.y + vh / 2;
    const ox = Math.max(0, Math.min(1440 - vw, mk && mk.b[2] > vw * 0.8 ? mk.b[0] - 8 : cx - vw / 2));
    const oy = Math.max(0, Math.min(900 - vh, ocy - vh / 2));
    oc = (
      <Crop id={office.id} x={ox} y={oy} s={sw} className="pm-c-office" style={{ height: oh }}>
        {mk && <span className="pp-ring" style={{ left: (mk.b[0] - ox) * sw - 3, top: (mk.b[1] - oy) * sw - 3, width: Math.min(mk.b[2] * sw, W - (mk.b[0] - ox) * sw - 4) + 6, height: mk.b[3] * sw + 6 }} />}
      </Crop>
    );
  }
  const field = (
    <div className="pm-c-part">
      <span className="pm-c-label">Crew app</span>
      {pc}
    </div>
  );
  const officePart = (
    <div className="pm-c-part">
      <span className="pm-c-label">
        Office{office.mark ? <b>: {office.mark.label}</b> : null}
      </span>
      {oc}
    </div>
  );
  return (
    <div ref={ref} className="pm-cstage">
      {m.dir === "up" ? field : officePart}
      <span className="pm-c-arrow" aria-hidden="true">
        <svg width="12" height="22" viewBox="0 0 12 22">
          <path d="M6 1v18M1.5 14.5 6 19.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {m.dir === "up" ? officePart : field}
      <p className="pm-caption">Demo account. Names and numbers are made up.</p>
    </div>
  );
}
