// One Day's set pieces: every moment ends on its own big, bold payoff, so the ride never plays the
// same "phone + laptop + a row slides in" frame twice. (The boss, after watching v2: "the idea is
// good, it just looks too repetitive and not interesting.")
//
// The crew's action stays on the 3D phone; the office's result comes off the laptop as one big,
// readable piece on the right, each a different kind of thing:
//   6:42   the clock-in row grows into Marcus's on-site badge
//   6:55   the inspection sheet slides up, ticks itself off, and gets the APPROVED stamp
//   9:20   the load ticket prints out of a slot, like a scale-house printer
//   4:12   the leak report types itself out, huge, then flies off to the shop as a work order
//   5:00   the profit card comes through the screen (./Fx.tsx: ProfitMacro)
//   5:30   three crew phones rise in a fan and buzz with Monday's plan
//   Friday the week's timecards flip to Approved, row by row, and payroll is ready
//
// Each piece is plain DOM on the film's clock (Player.track: opacity and transform keyframes, run
// by the compositor), on the same beats as the rest of the moment (./ride.ts), so the timeline (and
// the music's marks) are unchanged. A veil in the ground's own colour pushes the devices back on
// the right while a piece is up; the copy column on the left is never covered.
// All the records are the demo's own (Cedar Ridge Earthworks, fictional): ./states/data.ts and the
// timecards of src/screens/data.ts.

import { memo, useEffect, useRef } from "react";
import { DAY2 } from "../../content/copy";
import { EASE, type Player, type TrackFrame } from "../player";
import { RIDE, type Ride } from "./ride";
import { groundAt } from "./RideGround";
import { DAY_DATA } from "./states/data";

type W = [number, number];

/** The week's timecards as the Timecards screen shows them (src/screens/data.ts: Σ of the day cells). */
const TIMECARDS = [
  { ini: "MB", name: "Marcus Bell", hrs: "51h 00m" },
  { ini: "ER", name: "Elena Ruiz", hrs: "50h 20m" },
  { ini: "DH", name: "Dale Hendricks", hrs: "48h 20m" },
  { ini: "TO", name: "Tomás Ortega", hrs: "50h 48m" },
  { ini: "JL", name: "Jake Lindqvist", hrs: "40h 44m" },
  { ini: "AW", name: "Andre Whitfield", hrs: "50h 58m" },
];
/** The crew the plan goes out to (as ./Fx.tsx's chips were: the pipe crew on Hwy 9). */
const PLAN_CREW = ["Elena", "Jake", "Andre"];
const LEAK_TEXT = `${DAY_DATA.leak.issue}.`;

/** The SmartCrew mark (the hard hat), for the notification's app icon. */
const Mark = () => (
  <svg viewBox="0 0 75 71.18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M2.5 38A2.5 2.5 0 0 1 0 35.5L0 32.5A2.5 2.5 0 0 1 2.5 30L5 30A30 30 0 0 1 65 30L72.5 30A2.5 2.5 0 0 1 75 32.5L75 35.5A2.5 2.5 0 0 1 72.5 38ZM8.47 44A30 30 0 0 0 13.79 51.21L32.88 70.31A3 3 0 0 0 37.12 70.31L56.21 51.21A30 30 0 0 0 61.53 44L53.33 44A18.5 18.5 0 0 1 16.67 44Z"
    />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 12.4l3.6 3.6 7.4-7.6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── the markup ──────────────────────────────────────────────────────────────

const SetsBody = memo(function SetsBody() {
  const C = DAY_DATA.clockin;
  const P = DAY_DATA.pretrip;
  const L = DAY_DATA.load;
  const K = DAY_DATA.leak;
  const N = DAY_DATA.plan;
  return (
    <>
      <div className="rs-veil" />

      {/* 6:42 · the on-site badge */}
      <div className="rs-piece rs-badge">
        <div className="rs-card rs-badge-card">
          <span className="rs-badge-av">
            {C.initials}
            <span className="rs-badge-dot" />
            <span className="rs-badge-ring" />
            <span className="rs-badge-ring" />
          </span>
          <div className="rs-badge-body">
            <p className="rs-badge-name">{C.name}</p>
            <p className="rs-badge-role">{C.role} · Pipe Crew</p>
            <p className="rs-badge-status">
              <span className="rs-pill rs-pill--green">Clocked In</span>
              <span className="rs-badge-time">{C.time}</span>
            </p>
          </div>
          <dl className="rs-badge-rows">
            <div className="rs-row">
              <dt>Project</dt>
              <dd>
                {C.project} <span className="rs-dim">{C.number}</span>
              </dd>
            </div>
            <div className="rs-row">
              <dt>Activity</dt>
              <dd>{C.activity}</dd>
            </div>
            <div className="rs-row">
              <dt>Equipment</dt>
              <dd>{C.equipment}</dd>
            </div>
          </dl>
        </div>
        <p className="rs-where">{DAY2.clockin.where}</p>
      </div>

      {/* 6:55 · the inspection sheet and its stamp */}
      <div className="rs-piece rs-sheet">
        <div className="rs-card rs-sheet-card">
          <p className="rs-kicker">DOT inspection report</p>
          <p className="rs-sheet-title">Mack Granite #1102</p>
          <dl className="rs-sheet-rows">
            {[
              ["Operator", P.operator],
              ["Mileage", P.reading],
              ["Trailer", "No trailer"],
              ["Defects", "None"],
              ["Time", "6:55 AM"],
            ].map(([k, v], i) => (
              <div className="rs-row rs-sheet-row" key={k} data-i={i}>
                <dt>{k}</dt>
                <dd>{v}</dd>
                <span className="rs-tick">
                  <Check />
                </span>
              </div>
            ))}
          </dl>
          <p className="rs-stamp">{P.status}</p>
        </div>
        <p className="day-tag rs-tag">
          <span className="day-tag-dot" />
          {DAY2.pretrip.office}
        </p>
      </div>

      {/* 9:20 · the load ticket prints */}
      <div className="rs-piece rs-print">
        <p className="day-tag rs-tag rs-print-tag">
          <span className="day-tag-dot" />
          {DAY2.load.office}
        </p>
        <div className="rs-feed">
          <div className="rs-ticket">
            <p className="rs-tk-co">Cedar Ridge Earthworks</p>
            <p className="rs-tk-h">
              <b>Ticket {L.ticket}</b>
              <span>Oct 9, 2026 · {L.time}</span>
            </p>
            <hr />
            <dl className="rs-tk-rows">
              <div>
                <dt>Truck</dt>
                <dd>{L.truck}</dd>
              </div>
              <div>
                <dt>Driver</dt>
                <dd>{L.driver}</dd>
              </div>
              <div>
                <dt>Job</dt>
                <dd>
                  {L.project} {L.number}
                </dd>
              </div>
              <div>
                <dt>Load</dt>
                <dd>
                  {L.type} · {L.material}
                </dd>
              </div>
              <div>
                <dt>From</dt>
                <dd>{L.from}</dd>
              </div>
            </dl>
            <hr />
            <p className="rs-tk-qty">{L.qty}</p>
            <svg className="rs-tk-edge" viewBox="0 0 340 9" preserveAspectRatio="none" aria-hidden="true">
              <path d={`M0 0 ${Array.from({ length: 34 }, (_, i) => `L${i * 10 + 5} 7 L${i * 10 + 10} 0`).join(" ")} L340 -1 L0 -1 Z`} />
            </svg>
          </div>
        </div>
        <span className="rs-slot" />
      </div>

      {/* 4:12 · the leak report types itself out */}
      <div className="rs-piece rs-msg">
        <div className="rs-card rs-msg-card">
          <p className="rs-msg-head">
            <span className="rs-av">DH</span>
            <span>
              <b>{K.by}</b> · Service request
            </span>
            <span className="rs-dim">4:12 PM</span>
          </p>
          <p className="rs-msg-eq">{K.equipment}</p>
          <p className="rs-msg-text" aria-label={LEAK_TEXT}>
            {LEAK_TEXT.split("").map((ch, i) => (
              <span key={i} className="rs-ch">
                {ch}
              </span>
            ))}
          </p>
          <p className="rs-msg-foot">
            <span className="rs-pill rs-pill--red">Urgency · {K.urgency}</span>
          </p>
        </div>
      </div>

      {/* 5:30 · the crew's phones buzz with Monday's plan */}
      <div className="rs-piece rs-phones">
        {PLAN_CREW.map((name, k) => (
          <div key={name} className="rs-ph" data-k={k}>
            <div className="rs-ph-body">
              <span className="rs-ph-notch" />
              <p className="rs-ph-time">5:31</p>
              <div className="rs-note">
                <p className="rs-note-app">
                  <span className="rs-note-ico">
                    <Mark />
                  </span>
                  SmartCrew <span>now</span>
                </p>
                <p className="rs-note-t">{DAY2.plan.phone}</p>
                <p className="rs-note-b">{N.project}</p>
                <p className="rs-note-b">
                  {N.day} · {N.time.replace(" - ", " – ")}
                </p>
              </div>
            </div>
            <p className="rs-ph-name">{name}</p>
          </div>
        ))}
      </div>

      {/* Friday · the timecards flip to Approved, and payroll is ready */}
      <div className="rs-piece rs-pay">
        <div className="rs-card rs-pay-card">
          <p className="rs-pay-head">
            <b>Timecards</b>
            <span className="rs-dim">Sep 28 – Oct 4</span>
          </p>
          {TIMECARDS.map((r, i) => (
            <p key={r.ini} className="rs-pay-row" data-i={i}>
              <span className="rs-av">{r.ini}</span>
              <span className="rs-pay-name">{r.name}</span>
              <span className="rs-pay-hrs">{r.hrs}</span>
              <span className="rs-pay-st">
                <span className="rs-pill rs-pill--grey rs-pay-rev">Review</span>
                <span className="rs-pill rs-pill--green rs-pay-ok">Approved</span>
              </span>
            </p>
          ))}
        </div>
        <div className="rs-pay-sum">
          <p className="rs-pay-big">14 timecards approved</p>
          <p className="rs-pay-ready">
            <span className="rs-pay-check">
              <Check />
            </span>
            {DAY_DATA.payroll.title}
          </p>
        </div>
      </div>
    </>
  );
});

// ─── the timing ──────────────────────────────────────────────────────────────

const hide = (y = 0, s = 1): Record<string, string | number> => ({ opacity: 0, transform: `translate3d(0, ${y}em, 0)${s !== 1 ? ` scale(${s})` : ""}` });
const show: Record<string, string | number> = { opacity: 1, transform: "translate3d(0, 0, 0)" };

/** In over `a`, out over `b`: from below, settling; leaving the way `outY` says. */
function inOut(a: W, b: W, inY = 1.6, outY = -1, s = 0.97): TrackFrame[] {
  return [
    { t: 0, ...hide(inY, s) },
    { t: a[0], ...hide(inY, s), ease: EASE.out },
    { t: a[1], ...show },
    { t: b[0], ...show, ease: EASE.in },
    { t: b[1], ...hide(outY, 1) },
  ];
}

/** Each piece's windows (absolute ms of the film). */
function windows(R: Ride) {
  const m = R.moments;
  const tail = (i: number): W => [m[i].end - 420, m[i].end];
  return {
    badge: { in: [m[0].at.lift[1] - 120, m[0].at.lift[1] + 480] as W, out: tail(0) },
    sheet: { in: [m[1].at.insert[0], m[1].at.insert[0] + 560] as W, out: tail(1) },
    print: { in: [m[2].at.rise[0], m[2].at.rise[0] + 300] as W, out: tail(2) },
    msg: { in: [m[3].at.type[0] - 420, m[3].at.type[0]] as W, out: [m[3].at.sent[0] + 30, m[3].at.sent[0] + 420] as W },
    phones: { in: [m[5].at.chips[0], m[5].at.chips[0] + 700] as W, out: tail(5) },
    pay: { in: [m[6].at.pulse[0], m[6].at.cascade[0]] as W, out: [R.finale.start, R.finale.start + 420] as W },
  };
}

export const RideSets = memo(function RideSets({ player: p }: { player: Player }) {
  const root = useRef<HTMLDivElement>(null);
  const R = RIDE;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const offs: (() => void)[] = [];
    const one = (sel: string) => el.querySelector<HTMLElement>(sel);
    const all = (sel: string) => [...el.querySelectorAll<HTMLElement>(sel)];
    const tr = (e: HTMLElement | null, fr: TrackFrame[]) => e && offs.push(p.track(e, fr));
    const m = R.moments;
    const Wn = windows(R);

    // ── the veil: the ground's own colour, over the right of the frame, while a piece is up ──
    const veil = one(".rs-veil");
    if (veil) {
      const on: W[] = [Wn.badge.in, Wn.sheet.in, Wn.print.in, Wn.msg.in, Wn.phones.in, Wn.pay.in];
      const off: W[] = [Wn.badge.out, Wn.sheet.out, Wn.print.out, Wn.msg.out, Wn.phones.out, Wn.pay.out];
      const fr: TrackFrame[] = [{ t: 0, opacity: 0 }];
      on.forEach((a, k) => {
        const b = off[k];
        fr.push({ t: a[0], opacity: 0, ease: EASE.inOut }, { t: a[1], opacity: 0.9 }, { t: b[0], opacity: 0.9, ease: EASE.inOut }, { t: b[1], opacity: 0 });
      });
      tr(veil, fr);
      // its colour follows the ground through the day (one keyframe a second)
      const col: TrackFrame[] = [];
      for (let t = 0; t <= R.duration; t += 1000) {
        const c = groundAt(t, R);
        col.push({ t, backgroundColor: `rgb(${c[0]}, ${c[1]}, ${c[2]})` });
      }
      tr(veil, col);
    }

    // ── 6:42 · the badge ──
    {
      const w = Wn.badge;
      tr(one(".rs-badge"), inOut(w.in, w.out, 1.2, -0.8, 0.94));
      all(".rs-badge .rs-row").forEach((r, i) => {
        const a = w.in[1] - 120 + i * 140;
        tr(r, [{ t: 0, opacity: 0, transform: "translate3d(0.8em, 0, 0)" }, { t: a, opacity: 0, transform: "translate3d(0.8em, 0, 0)", ease: EASE.out }, { t: a + 380, opacity: 1, transform: "translate3d(0, 0, 0)" }]);
      });
      // the on-site dot rings out, slowly, through the hold
      all(".rs-badge-ring").forEach((r, k) => {
        const fr: TrackFrame[] = [{ t: 0, opacity: 0, transform: "scale(1)" }];
        for (let q = 0; q < 4; q++) {
          const a = w.in[1] + 200 + k * 700 + q * 1400;
          if (a > w.out[0]) break;
          fr.push({ t: a, opacity: 0, transform: "scale(1)" }, { t: a + 40, opacity: 0.55, transform: "scale(1)", ease: EASE.out }, { t: a + 1300, opacity: 0, transform: "scale(3.2)" });
        }
        tr(r, fr);
      });
    }

    // ── 6:55 · the sheet, its ticks, the stamp ──
    {
      const w = Wn.sheet;
      tr(one(".rs-sheet"), [
        { t: 0, opacity: 0, transform: "translate3d(0, 14em, 0) rotate(3deg)" },
        { t: w.in[0], opacity: 0, transform: "translate3d(0, 14em, 0) rotate(3deg)", ease: EASE.out },
        { t: w.in[0] + 120, opacity: 1, transform: "translate3d(0, 8em, 0) rotate(2deg)", ease: EASE.out },
        { t: w.in[1], opacity: 1, transform: "translate3d(0, 0, 0) rotate(-1.2deg)" },
        { t: w.out[0], opacity: 1, transform: "translate3d(0, 0, 0) rotate(-1.2deg)", ease: EASE.in },
        { t: w.out[1], opacity: 0, transform: "translate3d(0, 4em, 0) rotate(-1.2deg)" },
      ]);
      const t0 = w.in[1] + 80;
      all(".rs-sheet .rs-tick").forEach((tk, i) => {
        const a = t0 + i * 230;
        tr(tk, [{ t: 0, opacity: 0, transform: "scale(0.4)" }, { t: a, opacity: 0, transform: "scale(0.4)", ease: EASE.out }, { t: a + 220, opacity: 1, transform: "scale(1)" }]);
      });
      const st = t0 + 5 * 230 + 180;
      tr(one(".rs-stamp"), [
        { t: 0, opacity: 0, transform: "rotate(-11deg) scale(1.9)" },
        { t: st, opacity: 0, transform: "rotate(-11deg) scale(1.9)", ease: EASE.in },
        { t: st + 150, opacity: 0.94, transform: "rotate(-11deg) scale(1)", ease: EASE.out },
        { t: st + 330, opacity: 0.9, transform: "rotate(-11deg) scale(1.04)", ease: EASE.inOut },
        { t: st + 520, opacity: 0.9, transform: "rotate(-11deg) scale(1)" },
      ]);
      // the sheet takes the stamp's hit
      tr(one(".rs-sheet-card"), [
        { t: 0, transform: "translate3d(0, 0, 0)" },
        { t: st + 130, transform: "translate3d(0, 0, 0)", ease: EASE.out },
        { t: st + 190, transform: "translate3d(0, 0.35em, 0) scale(0.992)", ease: EASE.out },
        { t: st + 420, transform: "translate3d(0, 0, 0)" },
      ]);
      tr(one(".rs-sheet .rs-tag"), [
        { t: 0, ...hide(0.6) },
        { t: st + 450, ...hide(0.6), ease: EASE.out },
        { t: st + 800, ...show },
      ]);
    }

    // ── 9:20 · the ticket prints, line by line ──
    {
      const w = Wn.print;
      tr(one(".rs-print"), inOut(w.in, w.out, 0, 2, 1));
      // the paper feeds up out of the slot in short steps, top line first, like a thermal printer
      const feed = one(".rs-ticket");
      const a = m[2].at.ticket[0];
      const steps = 11;
      const each = 150;
      const fr: TrackFrame[] = [{ t: 0, transform: "translate3d(0, 100%, 0)" }, { t: a, transform: "translate3d(0, 100%, 0)", ease: EASE.out }];
      for (let s = 1; s <= steps; s++) {
        const y = 100 - (100 * s) / steps;
        fr.push({ t: a + s * each - 50, transform: `translate3d(0, ${y.toFixed(2)}%, 0)`, ease: EASE.linear }, { t: a + s * each, transform: `translate3d(0, ${y.toFixed(2)}%, 0)`, ease: EASE.out });
      }
      tr(feed, fr);
      const done = a + steps * each;
      // it tears off: the slot steps aside, the ticket lifts free with a little turn
      tr(one(".rs-slot"), [
        { t: 0, opacity: 1 },
        { t: done + 200, opacity: 1, ease: EASE.inOut },
        { t: done + 500, opacity: 0 },
      ]);
      tr(one(".rs-feed"), [
        { t: 0, transform: "translate3d(0, 0, 0) rotate(0deg)" },
        { t: done + 200, transform: "translate3d(0, 0, 0) rotate(0deg)", ease: EASE.out },
        { t: done + 650, transform: "translate3d(0, -1em, 0) rotate(-2deg)" },
      ]);
      tr(one(".rs-print-tag"), [
        { t: 0, ...hide(0.6) },
        { t: done + 500, ...hide(0.6), ease: EASE.out },
        { t: done + 850, ...show },
      ]);
    }

    // ── 4:12 · the report types itself, then goes ──
    {
      const w = Wn.msg;
      tr(one(".rs-msg"), [
        { t: 0, opacity: 0, transform: "translate3d(0, 1.2em, 0) scale(0.95)" },
        { t: w.in[0], opacity: 0, transform: "translate3d(0, 1.2em, 0) scale(0.95)", ease: EASE.out },
        { t: w.in[1], opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
        // sent: it shrinks away towards the phone
        { t: w.out[0], opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", ease: EASE.in },
        { t: w.out[1], opacity: 0, transform: "translate3d(-14em, 6em, 0) scale(0.35)" },
      ]);
      const [ty0, ty1] = m[3].at.type;
      const chs = all(".rs-ch");
      chs.forEach((c, i) => {
        const a = ty0 + ((ty1 - ty0) * i) / chs.length;
        tr(c, [{ t: 0, opacity: 0 }, { t: a, opacity: 0, ease: EASE.linear }, { t: a + 40, opacity: 1 }]);
      });
      const u = m[3].at.urgency[0];
      tr(one(".rs-msg .rs-pill--red"), [
        { t: 0, opacity: 0, transform: "scale(1.5)" },
        { t: u, opacity: 0, transform: "scale(1.5)", ease: EASE.out },
        { t: u + 200, opacity: 1, transform: "scale(1)" },
      ]);
    }

    // ── 5:30 · the phones rise in a fan and buzz ──
    {
      const w = Wn.phones;
      tr(one(".rs-phones"), [
        { t: 0, opacity: 0 },
        { t: w.in[0], opacity: 0, ease: EASE.linear },
        { t: w.in[0] + 1, opacity: 1 },
        { t: w.out[1] - 1, opacity: 1, ease: EASE.linear },
        { t: w.out[1], opacity: 0 },
      ]);
      const ROT = [-9, 0, 9];
      all(".rs-ph").forEach((ph, k) => {
        const a = w.in[0] + k * 150;
        const r = ROT[k];
        const at = (y: number, rot: number) => `translate3d(0, ${y}em, 0) rotate(${rot}deg)`;
        tr(ph, [
          { t: 0, opacity: 0, transform: at(30, r * 2.4) },
          { t: a, opacity: 0, transform: at(30, r * 2.4), ease: EASE.out },
          { t: a + 120, opacity: 1, transform: at(20, r * 2), ease: EASE.out },
          { t: a + 750, opacity: 1, transform: at(0, r) },
          { t: w.out[0] + k * 40, opacity: 1, transform: at(0, r), ease: EASE.in },
          { t: w.out[1], opacity: 0, transform: at(16, r * 1.4) },
        ]);
      });
      const n0 = w.in[1] + 350;
      all(".rs-ph-body").forEach((b, k) => {
        const a = n0 + k * 420;
        const fr: TrackFrame[] = [{ t: 0, transform: "translate3d(0, 0, 0)" }, { t: a, transform: "translate3d(0, 0, 0)", ease: EASE.linear }];
        // the buzz: a few quick shakes
        [0.28, -0.28, 0.22, -0.2, 0.12, 0].forEach((x, q) => fr.push({ t: a + 45 * (q + 1), transform: `translate3d(${x}em, 0, 0)`, ease: EASE.linear }));
        tr(b, fr);
      });
      all(".rs-note").forEach((n, k) => {
        const a = n0 + k * 420 + 60;
        tr(n, [
          { t: 0, opacity: 0, transform: "translate3d(0, -0.8em, 0) scale(0.92)" },
          { t: a, opacity: 0, transform: "translate3d(0, -0.8em, 0) scale(0.92)", ease: EASE.out },
          { t: a + 320, opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
        ]);
      });
    }

    // ── Friday · the cascade, then the summary ──
    {
      const w = Wn.pay;
      tr(one(".rs-pay"), [
        { t: 0, opacity: 0, transform: "translate3d(4em, 0, 0)" },
        { t: w.in[0], opacity: 0, transform: "translate3d(4em, 0, 0)", ease: EASE.out },
        { t: w.in[1], opacity: 1, transform: "translate3d(0, 0, 0)" },
        { t: w.out[0], opacity: 1, transform: "translate3d(0, 0, 0)", ease: EASE.in },
        { t: w.out[1], opacity: 0, transform: "translate3d(0, -1em, 0)" },
      ]);
      const [c0, c1] = m[6].at.cascade;
      const step = (c1 - c0) / TIMECARDS.length;
      all(".rs-pay-row").forEach((row, i) => {
        const a = c0 + i * step;
        const rev = row.querySelector<HTMLElement>(".rs-pay-rev");
        const ok = row.querySelector<HTMLElement>(".rs-pay-ok");
        tr(rev, [{ t: 0, opacity: 1, transform: "translate3d(0, 0, 0)" }, { t: a, opacity: 1, transform: "translate3d(0, 0, 0)", ease: EASE.in }, { t: a + 180, opacity: 0, transform: "translate3d(0, -0.6em, 0)" }]);
        tr(ok, [{ t: 0, opacity: 0, transform: "translate3d(0, 0.6em, 0)" }, { t: a + 90, opacity: 0, transform: "translate3d(0, 0.6em, 0)", ease: EASE.out }, { t: a + 300, opacity: 1, transform: "translate3d(0, 0, 0)" }]);
        tr(row, [{ t: 0, transform: "translate3d(0, 0, 0)" }, { t: a + 90, transform: "translate3d(0, 0, 0)", ease: EASE.out }, { t: a + 160, transform: "translate3d(0.35em, 0, 0)", ease: EASE.out }, { t: a + 380, transform: "translate3d(0, 0, 0)" }]);
      });
      const s0 = m[6].at.toast[0];
      tr(one(".rs-pay-big"), [{ t: 0, ...hide(1) }, { t: s0, ...hide(1), ease: EASE.out }, { t: s0 + 450, ...show }]);
      tr(one(".rs-pay-ready"), [{ t: 0, ...hide(0.8) }, { t: s0 + 200, ...hide(0.8), ease: EASE.out }, { t: s0 + 650, ...show }]);
    }

    return () => offs.forEach((f) => f());
  }, [p, R]);

  return (
    <div className="ride-sets" ref={root} aria-hidden="true">
      <SetsBody />
    </div>
  );
});
