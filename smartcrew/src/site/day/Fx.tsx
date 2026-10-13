// One Day's focal layer (RIDE_SHOTS §2 "Sync"): the DOM that works WITH the devices: the finger's
// taps, the one tag per moment, the row that lifts off the office screen (6:42), the hauling ticket
// that drops onto its row (9:20), the request card that flies from the phone into the shop queue
// (4:12), the profit card that comes through the screen to fill the frame (5:00), the office's
// cursor and the crew chips the plan fans out to (5:30).
//
// Everything here that is tied to a device is placed on the Stage's own frames (onStageFrame), from
// the same clock sample the devices were drawn at, so the DOM and the 3D can never drift apart (on
// a stalled main thread they stall together). Transform and opacity only, written only when they
// change; no layout reads. The pieces that don't follow a device (the count, the bars, the veil)
// are plain tracks on the film's clock.

import { memo, useEffect, useRef } from "react";
import { DAY2 } from "../../content/copy";
import { onStageFrame, type StageFrame } from "../../three/stage/store";
import type { Box, DeviceId } from "../../three/stage/types";
import { screenUrl } from "../../three/stage/urls";
import { EASE, type Player, type TrackFrame } from "../player";
import { centre, PX } from "./poses";
import { lerpQuad, moveQuad, quadMatrix, rectQuad, type Quad } from "./quad";
import { RIDE, type Ride } from "./ride";
import { dayPresence } from "./clock";
import { RIDE_COPY } from "./rideCopy";
import { stateScreen } from "./states/registry";
import { DAY_DATA } from "./states/data";

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const out3 = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const inOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const prog = (t: number, w: [number, number]) => clamp01((t - w[0]) / Math.max(1, w[1] - w[0]));
/** In over `a`, out over `b` (eased): a window's opacity. */
const win = (t: number, a: [number, number], b?: [number, number]) => Math.min(out3(prog(t, a)), b ? 1 - inOut(prog(t, b)) : 1);

/** The taps on the crew's phone: when, and where (native px of the screen). */
function taps(R: Ride) {
  const m = R.moments;
  return [
    { t: m[0].at.tap1[0], px: centre(PX.clockIn) },
    { t: m[0].at.tap2[0], px: centre(PX.start) },
    { t: m[1].at.tap[0], px: centre(PX.submit) },
    { t: m[2].at.tap[0], px: centre(PX.submit) },
    { t: m[3].at.tap[0], px: centre(PX.submit) },
    { t: m[4].at.tap[0], px: centre(PX.clockOut) },
    { t: m[6].at.tap[0], px: centre(PX.submitTimecard) },
  ];
}

type TagSpec = { text: string; dev: DeviceId; at: [number, number]; side: "left" | "right" | "above"; show: [number, number]; hide: [number, number] };
function tags(R: Ride): TagSpec[] {
  const m = R.moments;
  const fade = (i: number): [number, number] => [m[i].end - 380, m[i].end];
  const row = (b: Box): [number, number] => [b[0], b[1] + b[3] / 2];
  return [
    { text: DAY2.clockin.office, dev: "macbook", at: [PX.clockRow[0] + 6, PX.clockRow[1]], side: "above", show: [m[0].at.lift[1] - 150, m[0].at.lift[1] + 250], hide: fade(0) },
    { text: DAY2.pretrip.office, dev: "macbook", at: [PX.inspRow[0] + 6, PX.inspRow[1]], side: "above", show: [m[1].at.ring[0], m[1].at.ring[1]], hide: fade(1) },
    { text: DAY2.load.phone, dev: "iphone", at: [402, 330], side: "right", show: [m[2].at.sent[0] + 50, m[2].at.sent[0] + 350], hide: [m[2].at.rise[0], m[2].at.rise[0] + 300] },
    { text: DAY2.load.office, dev: "macbook", at: [PX.haulRow[0] + 6, PX.haulRow[1]], side: "above", show: [m[2].at.merge[0] + 100, m[2].at.merge[1] + 100], hide: fade(2) },
    { text: DAY2.leak.office, dev: "macbook", at: row(PX.queueRow), side: "left", show: [m[3].at.ring[0], m[3].at.ring[1]], hide: fade(3) },
    { text: DAY2.plan.office, dev: "macbook", at: [PX.block[0], PX.block[1] + PX.block[3] + 4], side: "right", show: [m[5].at.block[1] + 150, m[5].at.block[1] + 450], hide: fade(5) },
  ];
}

/** The crew the plan goes out to (data.ts schedulePlan: the pipe crew on Hwy 9). */
const CREW = [
  { ini: "ER", name: "Elena" },
  { ini: "JL", name: "Jake" },
  { ini: "AW", name: "Andre" },
];

// ─── the markup ──────────────────────────────────────────────────────────────

const RideFxBody = memo(function RideFxBody({ R }: { R: Ride }) {
  const L = DAY_DATA.load;
  const crop = (id: string, b: Box, native: { w: number; h: number }) => ({
    width: b[2],
    height: b[3],
    backgroundImage: `url(${screenUrl(id)})`,
    backgroundSize: `${native.w}px ${native.h}px`,
    backgroundPosition: `${-b[0]}px ${-b[1]}px`,
  });
  return (
    <>
      <div className="fx-veil" />
      {taps(R).map((_, k) => (
        <span key={k} className="fx-touch" data-k={k}>
          <span className="fx-touch-pad" />
          <span className="fx-touch-ring" />
        </span>
      ))}
      {/* 6:42: the new row lifts off the office screen */}
      <div className="fx-quad fx-lift-shadow" style={{ width: PX.clockRow[2], height: PX.clockRow[3] }} />
      <div className="fx-quad fx-lift" style={crop("web-dashboard", PX.clockRow, { w: 1440, h: 900 })} />
      {/* 9:20: the hauling ticket */}
      <div className="fx-ticket">
        <p className="fx-ticket-h">
          <b>Ticket {L.ticket}</b>
          <span>{L.time}</span>
        </p>
        <p className="fx-ticket-r">{L.truck} · {L.driver}</p>
        <p className="fx-ticket-r">
          <b>{L.project}</b>
        </p>
        <p className="fx-ticket-r">
          {L.type} · {L.material} · {L.qty}
        </p>
        <p className="fx-ticket-f">from {L.from}</p>
      </div>
      {/* 4:12: the request's card flies from the phone into the shop queue */}
      <div className="fx-quad fx-card" style={crop(stateScreen("phone-d-service-sent"), PX.serviceCard, { w: 402, h: 874 })} />
      {/* 5:00: the profit card comes through the screen */}
      <div className="fx-quad fx-macro-img" style={crop("web-project-detail", PX.profit, { w: 1440, h: 900 })} />
      <ProfitMacro R={R} />
      {/* 5:30: the office's cursor, its click; the crew chips */}
      <span className="fx-cursor">
        <svg viewBox="0 0 20 24" aria-hidden="true">
          <path d="M3 2.5v16.2l4.3-4.1 2.9 6.6 2.8-1.2-2.9-6.5h6.1L3 2.5Z" fill="#111" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span className="fx-cursor-ring" />
      </span>
      {CREW.map((c, k) => (
        <span key={c.ini} className="fx-chip" data-k={k}>
          <span className="fx-chip-ini">
            {c.ini}
            <span className="fx-chip-dot" />
          </span>
          <span className="fx-chip-t">
            <b>{c.name}</b>
            <span>{RIDE_COPY.chipWhen}</span>
          </span>
        </span>
      ))}
      {/* Friday: the payroll toast comes off the office screen, to be read */}
      <div className="fx-toast">
        <span className="fx-toast-ok">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.5 12.4l3.6 3.6 7.4-7.6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="fx-toast-t">
          <b>{DAY_DATA.payroll.title}</b>
          <span>{DAY_DATA.payroll.meta}</span>
        </span>
        <span className="fx-toast-time">{DAY_DATA.payroll.time}</span>
      </div>
      {tags(R).map((t, k) => (
        <p key={k} className="day-tag fx-tag" data-k={k}>
          <span className="day-tag-dot" />
          {t.text}
        </p>
      ))}
    </>
  );
});

// ─── the profit macro: the app's own card, at the size it ends up, with its count and bars ──

const FROM = "53,611.75";
const TO = "57,731.75";
/** spin turns per wheel, left to right (the cents settle last) */
const TURNS = [0, 0, 1, 2, 3, 4, 5];
const BARS = [
  { k: "Labor", pct: 64.21 },
  { k: "Materials", pct: 66.96 },
  { k: "Equipment", pct: 63.62 },
  { k: "Other", pct: 49.92 },
];

function ProfitMacro({ R }: { R: Ride }) {
  void R;
  const digits = TO.replace(/\D/g, "");
  let d = -1;
  return (
    <div className="fx-macro-wrap">
      <div className="fx-quad fx-macro">
        <p className="fx-macro-where">Projects · Hwy 9 Culvert Replacement</p>
        <div className="fx-macro-card sc">
          <span className="fx-macro-well">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M14.6 9.1c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2c1.7.3 2.8.9 2.8 2.2 0 1.3-1.2 2.1-2.8 2.1-1.4 0-2.4-.6-2.8-1.6M12 6.2v1.4M12 16.4v1.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="fx-macro-body">
            <span className="fx-macro-label">Profit</span>
            <span className="fx-macro-value sc-num" aria-label={`$${TO}`}>
              <span>$</span>
              {TO.split("").map((ch, i) => {
                if (!/\d/.test(ch)) return <span key={i}>{ch}</span>;
                d++;
                const n = 10 * (TURNS[d] + 2);
                return (
                  <span key={i} className="fx-wheel" data-d={d}>
                    <span className="fx-wheel-sizer">0</span>
                    <span className="fx-wheel-strip" style={{ height: `${n * 100}%` }}>
                      {Array.from({ length: n }, (_, k) => (
                        <span key={k}>{k % 10}</span>
                      ))}
                    </span>
                  </span>
                );
              })}
            </span>
            <span className="fx-macro-today">{DAY2.profit.office}</span>
          </span>
        </div>
        <div className="fx-macro-bars">
          {BARS.map((b) => (
            <p key={b.k} className="fx-bar">
              <span className="fx-bar-k">{b.k}</span>
              <span className="fx-bar-track">
                <span className="fx-bar-fill" style={{ ["--p" as string]: b.pct / 100 }} />
              </span>
              <span className="fx-bar-v sc-num">{b.pct.toFixed(2)}%</span>
            </p>
          ))}
          <p className="fx-bar-note">{RIDE_COPY.barsNote}</p>
        </div>
      </div>
      <span hidden>{digits}</span>
    </div>
  );
}

// ─── the controller ───────────────────────────────────────────────────────────

type Els = {
  veil: HTMLElement;
  touch: HTMLElement[];
  lift: HTMLElement;
  liftShadow: HTMLElement;
  ticket: HTMLElement;
  card: HTMLElement;
  macroImg: HTMLElement;
  macro: HTMLElement;
  cursor: HTMLElement;
  toast: HTMLElement;
  chips: HTMLElement[];
  tags: HTMLElement[];
};

/** Style writes only when they change. */
const last = new WeakMap<HTMLElement, { o?: string; t?: string }>();
function put(el: HTMLElement, o: number, t?: string) {
  const s = last.get(el) ?? {};
  const os = o <= 0.001 ? "0" : o >= 0.999 ? "1" : o.toFixed(3);
  if (s.o !== os) {
    el.style.opacity = os;
    s.o = os;
  }
  if (t !== undefined && o > 0.001 && s.t !== t) {
    el.style.transform = t;
    s.t = t;
  }
  last.set(el, s);
}
const tr = (x: number, y: number, extra = "") => `translate3d(${Math.round(x * 10) / 10}px, ${Math.round(y * 10) / 10}px, 0)${extra}`;

export const RideFx = memo(function RideFx({ player: p }: { player: Player }) {
  const root = useRef<HTMLDivElement>(null);
  const R = RIDE;

  // the pieces that don't follow a device: tracks on the film's clock
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const offs: (() => void)[] = [];
    const m4 = R.moments[4];
    const m5 = R.moments[5];
    const track = (sel: string, fr: TrackFrame[]) => el.querySelectorAll<HTMLElement>(sel).forEach((x) => offs.push(p.track(x, fr)));
    // the veil softens the devices behind the profit card
    track(".fx-veil", [
      { t: 0, opacity: 0 },
      { t: m4.at.push[0] + 200, opacity: 0, ease: EASE.inOut },
      { t: m4.at.macro[1], opacity: 0.6 },
      { t: m5.at.unzoom[0], opacity: 0.6, ease: EASE.inOut },
      { t: m5.at.unzoom[0] + 450, opacity: 0 },
    ]);
    // the count: every wheel spins forward to its figure, the cents settle last
    const from = FROM.replace(/\D/g, "");
    const to = TO.replace(/\D/g, "");
    const [c0, c1] = m4.at.count;
    el.querySelectorAll<HTMLElement>(".fx-wheel").forEach((w) => {
      const d = Number(w.dataset.d);
      const n = 10 * (TURNS[d] + 2);
      const a = Number(from[d]);
      const steps = (Number(to[d]) - a + 10) % 10 + 10 * TURNS[d];
      const y = (pos: number) => `translate3d(0, ${(-pos / n) * 100}%, 0)`;
      const end = c0 + (c1 - c0) * (0.55 + (0.45 * d) / 6);
      const s = w.querySelector<HTMLElement>(".fx-wheel-strip");
      if (s) offs.push(p.track(s, [{ t: 0, transform: y(a) }, { t: c0, transform: y(a), ease: EASE.out }, { t: end, transform: y(a + steps) }]));
    });
    track(".fx-macro-today", [
      { t: 0, opacity: 0, transform: "translate3d(0, 8px, 0)" },
      { t: m4.at.today[0], opacity: 0, transform: "translate3d(0, 8px, 0)", ease: EASE.out },
      { t: m4.at.today[1], opacity: 1, transform: "translate3d(0, 0, 0)" },
    ]);
    track(".fx-macro-where", [
      { t: 0, opacity: 0 },
      { t: m4.at.macro[1] - 150, opacity: 0, ease: EASE.out },
      { t: m4.at.macro[1] + 250, opacity: 1 },
      { t: m5.at.unzoom[0], opacity: 1, ease: EASE.inOut },
      { t: m5.at.unzoom[0] + 200, opacity: 0 },
    ]);
    track(".fx-macro-bars", [
      { t: 0, opacity: 0 },
      { t: m4.at.bars[0] - 200, opacity: 0, ease: EASE.out },
      { t: m4.at.bars[0] + 100, opacity: 1 },
      { t: m5.at.unzoom[0], opacity: 1, ease: EASE.inOut },
      { t: m5.at.unzoom[0] + 200, opacity: 0 },
    ]);
    el.querySelectorAll<HTMLElement>(".fx-bar-fill").forEach((b, k) => {
      const a = m4.at.bars[0] + k * 300;
      offs.push(p.track(b, [{ t: 0, transform: "scaleX(0)" }, { t: a, transform: "scaleX(0)", ease: EASE.out }, { t: a + 600, transform: "scaleX(var(--p))" }]));
    });
    // the chips' dots light once each, in turn
    el.querySelectorAll<HTMLElement>(".fx-chip-dot").forEach((d, k) => {
      const a = m5.hold[0] + 300 + k * 450;
      offs.push(p.track(d, [{ t: 0, opacity: 0, transform: "scale(0.6)" }, { t: a, opacity: 0, transform: "scale(0.6)", ease: EASE.out }, { t: a + 300, opacity: 1, transform: "scale(1)", ease: EASE.inOut }, { t: a + 1100, opacity: 0.55, transform: "scale(1)" }]));
    });
    return () => offs.forEach((f) => f());
  }, [p, R]);

  // the pieces that follow the devices: on the Stage's frames
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends HTMLElement>(s: string) => [...el.querySelectorAll<T>(s)];
    const E: Els = {
      veil: q(".fx-veil")[0],
      touch: q(".fx-touch"),
      lift: q(".fx-lift")[0],
      liftShadow: q(".fx-lift-shadow")[0],
      ticket: q(".fx-ticket")[0],
      card: q(".fx-card")[0],
      macroImg: q(".fx-macro-img")[0],
      macro: q(".fx-macro")[0],
      cursor: q(".fx-cursor")[0],
      toast: q(".fx-toast")[0],
      chips: q(".fx-chip"),
      tags: q(".fx-tag"),
    };
    const TAPS = taps(R);
    const TAGS = tags(R);
    const m = R.moments;
    const all = [E.lift, E.liftShadow, E.ticket, E.card, E.macroImg, E.macro, E.cursor, E.toast, ...E.touch, ...E.chips, ...E.tags];
    let hidden = false;
    // the box sizes the quads map (measured once: they're fixed by CSS)
    let sizes: Map<HTMLElement, [number, number]> | null = null;
    const size = (e: HTMLElement): [number, number] => {
      if (!sizes) sizes = new Map();
      let s = sizes.get(e);
      if (!s) {
        s = [e.offsetWidth || 1, e.offsetHeight || 1];
        sizes.set(e, s);
      }
      return s;
    };
    // the main card's place inside the profit box (measured once, like the sizes)
    let card: [number, number] | null = null;
    const cardBox = (mh: number): [number, number] => {
      if (!card) {
        const c = E.macro.querySelector<HTMLElement>(".fx-macro-card");
        card = c ? [c.offsetTop, c.offsetHeight || mh] : [0, mh];
      }
      return card;
    };
    const onResize = () => {
      sizes = null;
      card = null;
    };
    window.addEventListener("resize", onResize);

    const quadOf = (f: StageFrame, dev: DeviceId, b: Box): Quad | null => {
      const a = f.project(dev, b[0], b[1]);
      const c = f.project(dev, b[0] + b[2], b[1]);
      const d = f.project(dev, b[0] + b[2], b[1] + b[3]);
      const e = f.project(dev, b[0], b[1] + b[3]);
      return a && c && d && e ? [a.x, a.y, c.x, c.y, d.x, d.y, e.x, e.y] : null;
    };
    /** How many CSS px one native px of a device's screen is, around a point. */
    const pxScale = (f: StageFrame, dev: DeviceId, x: number, y: number) => {
      const a = f.project(dev, x, y);
      const b = f.project(dev, x + 40, y);
      return a && b ? Math.hypot(b.x - a.x, b.y - a.y) / 40 : 0;
    };

    let shown = "";
    const off = onStageFrame((f) => {
      const t = p.time();
      // the layer is One Day's (fixed over the page): it fades as the scene scrolls away
      const w = dayPresence(f.y, f.h);
      const ow = w >= 0.98 ? "" : w.toFixed(3);
      if (ow !== shown) {
        el.style.opacity = ow;
        shown = ow;
      }
      // outside the ride's stretch of the page nothing here shows
      if ((!p.started && t <= 0) || w <= 0) {
        if (!hidden) all.forEach((x) => put(x, 0));
        hidden = true;
        return false;
      }
      hidden = false;

      // ── taps ──
      TAPS.forEach((tp, k) => {
        const e = E.touch[k];
        const dt = t - tp.t;
        if (dt < -60 || dt > 1000) return put(e, 0);
        const pt = f.project("iphone", tp.px[0], tp.px[1]);
        if (!pt) return put(e, 0);
        const sc = Math.max(0.5, Math.min(1.3, pxScale(f, "iphone", tp.px[0], tp.px[1]) / 1.15));
        put(e, 1, tr(pt.x, pt.y, ` scale(${sc.toFixed(3)})`));
        const pad = e.firstElementChild as HTMLElement;
        const ring = e.lastElementChild as HTMLElement;
        const po = dt < 0 ? 0 : dt < 200 ? out3(dt / 200) : dt < 420 ? 1 : 1 - inOut((dt - 420) / 340);
        put(pad, po, `scale(${(1.18 - 0.18 * out3(dt / 200)).toFixed(3)})`);
        const rt = (dt - 90) / 900;
        put(ring, rt <= 0 || rt >= 1 ? 0 : 0.95 * (1 - rt), `scale(${(0.6 + 1.8 * out3(rt)).toFixed(3)})`);
      });

      // ── 6:42: the row lifts off the screen ──
      {
        const w = m[0].at.lift;
        const vis = t >= w[0] && t < m[0].end;
        const qd = vis ? quadOf(f, "macbook", PX.clockRow) : null;
        if (!qd) {
          put(E.lift, 0);
          put(E.liftShadow, 0);
        } else {
          const e = inOut(prog(t, w));
          // it comes off the screen towards us, flat, to where it reads (centre right)
          const W = f.w * 0.6;
          const H = (W * PX.clockRow[3]) / PX.clockRow[2];
          const to = rectQuad(f.w * 0.645 - W / 2, f.h * 0.6 - H / 2, W, H);
          const up = lerpQuad(qd, to, e);
          const o = 1 - inOut(prog(t, [m[0].end - 380, m[0].end]));
          const [bw, bh] = size(E.lift);
          put(E.lift, o, quadMatrix(bw, bh, up));
          put(E.liftShadow, o * e * 0.9, quadMatrix(bw, bh, moveQuad(up, 0, 10 + 8 * e, 1.03)));
        }
      }

      // ── 9:20: the ticket drops onto its row, then becomes it ──
      {
        const a = m[2].at.ticket;
        const b = m[2].at.merge;
        const vis = t >= a[0] && t < b[1];
        const qd = vis ? quadOf(f, "macbook", PX.haulRow) : null;
        if (!qd) put(E.ticket, 0);
        else {
          const [tw, th] = size(E.ticket);
          // its slot: over the row's left half, its foot on the row
          const lx = qd[0] + (qd[2] - qd[0]) * 0.05;
          const ly = (qd[1] + qd[7]) / 2;
          const home = rectQuad(lx, ly - th + 6, tw, th);
          const drop = out3(prog(t, a));
          const fallen = moveQuad(home, 0, -40 * (1 - drop));
          const mg = inOut(prog(t, b));
          const qq = lerpQuad(fallen, qd, mg * 0.85);
          put(E.ticket, Math.min(drop * 1.4, 1) * (1 - inOut(prog(t, [b[0] + 80, b[1]]))), quadMatrix(tw, th, qq));
        }
      }

      // ── 4:12: the card flies from the phone into the shop queue ──
      {
        const a = m[3].at.fly;
        const b = m[3].at.land;
        const vis = t >= a[0] && t < b[1];
        const from = vis ? quadOf(f, "iphone", PX.serviceCard) : null;
        const row = vis ? quadOf(f, "macbook", PX.queueRow) : null;
        if (!from || !row) put(E.card, 0);
        else {
          const [cw, chh] = size(E.card);
          const e = inOut(prog(t, a));
          // where it lands: flat, 0.6 × its size on the phone, over the row's left part
          const fw = Math.hypot(from[2] - from[0], from[3] - from[1]) * 0.6;
          const fh = (fw * chh) / cw;
          const [rx, ry] = [row[0] + (row[2] - row[0]) * 0.22, (row[1] + row[7]) / 2];
          const to = rectQuad(rx - fw / 2, ry - fh / 2, fw, fh);
          const arc = -Math.sin(Math.PI * e) * Math.min(160, f.h * 0.18);
          const qq = moveQuad(lerpQuad(from, to, e), 0, arc);
          const o = 1 - inOut(prog(t, [b[0], b[1]]));
          put(E.card, o, quadMatrix(cw, chh, qq));
        }
      }

      // ── 5:00: the profit card comes through the screen (and goes back at 5:30) ──
      {
        const mac = m[4].at.macro;
        const un = m[5].at.unzoom;
        const vis = t >= mac[0] && t < un[1];
        const src = vis ? quadOf(f, "macbook", PX.profit) : null;
        if (!vis) {
          put(E.macro, 0);
          put(E.macroImg, 0);
        } else {
          const [mw, mh] = size(E.macro);
          const [iw, ih] = size(E.macroImg);
          // the card's final place: centre-right, its box as laid out (CSS: 56 % of the width)
          const fx = f.w * 0.58 - mw / 2;
          const fy = f.h * 0.47 - mh / 2;
          // the push carries on through the hold, slowly (never a still frame)
          const creep = 1 + 0.03 * prog(t, [mac[1], un[0]]);
          const big = moveQuad(rectQuad(fx, fy, mw, mh), 0, 0, creep);
          // the main card's own share of the box (the bars and the line above sit outside it)
          const k = t < un[0] ? inOut(prog(t, mac)) : 1 - inOut(prog(t, un));
          const [cTop, cH] = cardBox(mh);
          // the quad the main card would sit on when it starts on the screen's card: extend it to
          // the whole box (the parts above and below the card come along, faded)
          let small: Quad | null = null;
          if (src) {
            const ux = [(src[2] - src[0]) / mw, (src[3] - src[1]) / mw];
            const vy = [(src[6] - src[0]) / cH, (src[7] - src[1]) / cH];
            const ox = src[0] - vy[0] * cTop;
            const oy = src[1] - vy[1] * cTop;
            small = [ox, oy, ox + ux[0] * mw, oy + ux[1] * mw, ox + ux[0] * mw + vy[0] * mh, oy + ux[1] * mw + vy[1] * mh, ox + vy[0] * mh, oy + vy[1] * mh];
          }
          const qq = small ? lerpQuad(small, big, k) : big;
          put(E.macro, small || k >= 0.999 ? clamp01((k - 0.12) / 0.4) : 0, quadMatrix(mw, mh, qq));
          // the screen's own card crossfades into it as it leaves the screen
          if (src) {
            const imgQ = lerpQuad(src, rectQuad(fx, fy + cTop, mw, cH), k);
            put(E.macroImg, 1 - clamp01((k - 0.05) / 0.35), quadMatrix(iw, ih, imgQ));
          } else put(E.macroImg, 0);
        }
      }

      // ── 5:30: the office's cursor glides to Mon 12 and clicks; the chips fan out ──
      {
        const c = m[5].at.cursor;
        const blk = m[5].at.block;
        const vis = t >= c[0] - 250 && t < blk[1] + 500;
        if (!vis) put(E.cursor, 0);
        else {
          const e = inOut(prog(t, c));
          const a = centre(PX.addSchedule);
          const z = [PX.block[0] + PX.block[2] * 0.45, PX.block[1] + PX.block[3] * 0.55];
          const pt = f.project("macbook", a[0] + (z[0] - a[0]) * e, a[1] + (z[1] - a[1]) * e);
          const o = Math.min(clamp01((t - c[0] + 250) / 250), 1 - clamp01((t - blk[1] - 200) / 300));
          if (!pt) put(E.cursor, 0);
          else {
            put(E.cursor, o, tr(pt.x, pt.y));
            const rt = (t - c[1]) / 500;
            put(E.cursor.lastElementChild as HTMLElement, rt <= 0 || rt >= 1 ? 0 : 1 - rt, `scale(${(0.5 + 1.6 * out3(rt)).toFixed(3)})`);
          }
        }
        const ch = m[5].at.chips;
        const from = t >= ch[0] && t < m[5].end ? f.project("macbook", ...centre(PX.block)) : null;
        E.chips.forEach((chip, k) => {
          if (!from) return put(chip, 0);
          const a0 = ch[0] + k * 120;
          const e = out3((t - a0) / 620);
          const [cw, chh] = size(chip);
          // the column they settle in: left, under the copy, clear of the phone
          const tx = f.w * 0.045;
          const ty = f.h * (0.47 + k * 0.095);
          const sx = from.x - cw / 2;
          const sy = from.y - chh / 2;
          // a soft arc, out and up then down to the slot
          const cx = (sx + tx) / 2;
          const cy = Math.min(sy, ty) - f.h * (0.08 + 0.03 * k);
          const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * tx;
          const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * ty;
          const rot = (1 - e) * (k - 1) * 6;
          const o = Math.min(clamp01((t - a0) / 180), 1 - inOut(prog(t, [m[5].end - 380, m[5].end])));
          put(chip, t < a0 ? 0 : o, tr(x, y, ` rotate(${rot.toFixed(2)}deg) scale(${(0.7 + 0.3 * e).toFixed(3)})`));
        });
      }

      // ── Friday: the toast comes off the screen ──
      {
        const a = m[6].at.toast;
        const lift: [number, number] = [a[1] + 50, a[1] + 750];
        const vis = t >= lift[0] && t < R.finale.start + 400;
        const qd = vis ? quadOf(f, "macbook", [1036, 84, 368, 66]) : null;
        if (!qd) put(E.toast, 0);
        else {
          const [tw, th] = size(E.toast);
          const e = inOut(prog(t, lift));
          const to = rectQuad(f.w * 0.7 - tw / 2, f.h * 0.27 - th / 2, tw, th);
          const o = Math.min(clamp01((t - lift[0]) / 160), 1 - inOut(prog(t, [R.finale.start, R.finale.start + 400])));
          put(E.toast, o, quadMatrix(tw, th, lerpQuad(qd, to, e)));
        }
      }

      // ── the tags ──
      TAGS.forEach((tg, k) => {
        const e = E.tags[k];
        const o = win(t, tg.show, tg.hide);
        if (o <= 0) return put(e, 0);
        const pt = f.project(tg.dev, tg.at[0], tg.at[1]);
        if (!pt) return put(e, 0);
        const [w, h] = size(e);
        let x = pt.x;
        let y = pt.y - h / 2;
        if (tg.side === "left") x = pt.x - w - 18;
        else if (tg.side === "right") x = pt.x + 18;
        else {
          x = pt.x;
          y = pt.y - h - 12;
        }
        // keep clear of the frame's edges and the control bar
        x = Math.max(12, Math.min(f.w - w - 12, x));
        y = Math.max(12, Math.min(f.h - h - 84, y));
        put(e, o, tr(x, y + 6 * (1 - out3(prog(t, tg.show)))));
      });
      return false;
    });
    return () => {
      off();
      window.removeEventListener("resize", onResize);
    };
  }, [p, R]);

  return (
    <div className="day-fx" ref={root} aria-hidden="true">
      <RideFxBody R={R} />
    </div>
  );
});

