// One Day as a film: "Enjoy the ride", v2 (RIDE_SHOTS.md, the creative director's shot list).
// ONE clock (ms of the film) for the whole day: the Stage's camera (./poses.ts), the live UI on
// the screens (./rideLife.ts), the DOM that follows the devices (./fx.ts), the clock, the
// headlines and the ground (./Day.tsx) all read this one timeline, so a tap and what it causes
// land on the same millisecond, every time, for every visitor.
//
// v2 is one continuous walk through one day: each moment is its own SHOT (a different framing,
// camera move and UI verb), it hands its motion to the next one, and nothing is ever still. In
// every moment one thing moves at a time, in reading order:
//
//   camera (the clock rolls with it) → headline → the crew's action → the office's result → hold
//
// The hold lasts until a slow reader has read what landed (PACE: 0.7 s + 0.24 s per word, at
// least 2.9 s) while the camera keeps drifting and the screens stay alive (a timer ticking, KPIs,
// bars, a ring sweeping).
//
// Every beat below is ms from the moment's start (the shot list's computed timeline,
// scratchpad hero-int/cd/timeline-v2.txt). `rideBeats()` turns them into absolute times.

import { MOMENTS, type MomentId } from "../../content/moments";

/** The film's pace, ms. One place to tune it. */
export const PACE = {
  /** "Enjoy the ride": in, then it holds over the walking ground until the phone rises */
  titleIn: 350,
  subIn: [150, 500] as [number, number],
  /** the title drifts up and away as the first shot rises (no empty frame between them) */
  titleOut: 600,
  /** the opening: the title's own time before 6:42 begins */
  opening: 1300,
  /** the hold rule */
  holdMin: 2900,
  holdBase: 700,
  perWord: 240,
  /** the finale */
  finale: 4400,
  /** after the finale, the page is handed back this much later */
  release: 800,
} as const;

type W = [number, number];

/**
 * Each moment's beats, ms from its start. `settle`: the transition in has landed; `clock`: the big
 * time rolls; `head`: the headline; `hold`: [start, end] of the hold (end = the moment's end).
 * The rest are the moment's own verbs (see poses.ts / rideLife.ts / fx.ts for what each does).
 */
type BeatTable = { settle: number; clock: W; head: W; hold: W } & Record<string, number | W>;

const B: Record<MomentId, BeatTable> = {
  // 6:42 AM · extreme close-up on the crew's phone → pull back and pan right as the office arrives
  clockin: {
    settle: 1200,
    clock: [600, 1200],
    head: [1100, 1550],
    tap1: 1650, // Clock In
    sheet: [1900, 2160], // the "Select task and project" sheet
    tap2: 2500, // Start
    clocked: 2750, // Currently working on · 00h 00m 03s (the timer runs from here)
    dolly: [1200, 3150], // the slow dolly in on the phone
    pull: [3150, 4350], // pull back + pan right: the laptop arrives
    pulse: [3850, 4350], // (it leaves once the office is in the frame)
    insert: [4350, 5050], // the Clock Ins row slides in
    lift: [4850, 5550], // push in on the row, it lifts off the screen
    hold: [5550, 8450],
  },
  // 6:55 AM · a close orbit round the phone, the office over its shoulder
  pretrip: {
    settle: 1100,
    swap: 400, // the phone's screen turns to the DOT form while it turns
    clock: [450, 1100],
    head: [900, 1350],
    fill: [1400, 2680], // four fields fill themselves, 320 ms each
    tap: 2780, // Submit
    sent: 3030, // Pre-trip passed
    pulse: [3200, 3650],
    insert: [3650, 4410], // Tomás Ortega's 06:55 inspection, Approved
    ring: [4200, 4600], // a ring on the record + its tag (no push-in)
    orbit: [1100, 7600],
    hold: [4600, 7600],
  },
  // 9:20 AM · crane up; the truck drives the haul road on our own contour map (variant B, see
  // RIDE_SHOTS §4.3: a moving map pin would claim live driver tracking Andrew hasn't confirmed)
  load: {
    settle: 1100,
    drive: [700, 2100], // pit → Riverside, the camera tracking with it
    clock: [700, 2100], // the hours turn while the truck covers the road
    arrive: [2100, 2400], // one soft ping on the job
    head: [2100, 2550],
    tap: 2650, // the phone in the corner: Submit
    sent: 2900, // Load #14 logged (+ the film's only phone tag)
    rise: [3250, 3850], // the office comes up to us: Materials · Hauling
    ticket: [3850, 4300], // the ticket drops onto its slot
    merge: [4300, 4650], // … and becomes the row
    kpis: [4900, 5800], // Loads today 13 → 14, Yards hauled 156 → 168 yd³, Imported 8 → 9 loads
    hold: [4600, 7500],
  },
  // 4:12 PM · low angle; the request types itself, then the camera cranes up after the card
  leak: {
    settle: 1200,
    clock: [550, 1200],
    head: [1000, 1450],
    type: [1500, 2650], // "Left track tension low, idler seeping oil." at ~36 characters a second
    urgency: [2700, 2950], // Urgency → High
    tap: 3050, // Submit
    sent: 3300, // Leak reported
    fly: [3450, 4250], // the summary card flies phone → shop queue, the crane follows it
    land: [4250, 4600], // … and becomes the queue's new top row
    ring: [4500, 4800], // ring + tag "Work order · CAT D6"
    hold: [4800, 7700],
  },
  // 5:00 PM · the payoff: a square push straight through the screen to the number
  profit: {
    settle: 1100,
    clock: [450, 1100],
    head: [900, 1350],
    tap: 1450, // Clock Out
    sent: 1700, // Clocked out · 10h 18m
    pulse: [1850, 2300],
    push: [2300, 2900], // the Stage pushes in on the Profit card …
    macro: [2700, 3250], // … the crisp card takes over and comes up to fill the frame
    count: [3300, 4500], // $53,611.75 → $57,731.75
    today: [4500, 4800], // +$4,120 today
    bars: [4800, 6000], // the four budget bars
    hold: [4800, 7700],
  },
  // 5:30 PM · office → field: a counter-orbit; the plan fans out to the crew
  plan: {
    settle: 1100,
    unzoom: [0, 600], // the number shrinks back into the screen
    swap: 650, // the screen turns to Scheduling
    clock: [450, 1100],
    head: [900, 1350],
    cursor: [1400, 1950], // the office's cursor glides to Mon 12 and clicks
    block: [2000, 2560], // the block drops in
    chips: [2650, 3400], // three crew chips fan out
    swing: [3200, 4150], // Marcus's phone swings forward with the plan on it
    plan: 3350, // … its sheet slides up
    hold: [4150, 7150],
  },
  // Friday · nightfall, a high angle on a lamp-lit desk, a slow turntable
  payroll: {
    settle: 1200,
    night: [0, 1200],
    clock: [550, 1200],
    head: [1100, 1550],
    tap: 1650, // Submit Timecard
    sent: 1900, // Timecard submitted
    pulse: [2050, 2500],
    cascade: [2500, 3700], // Review → Approved, row by row
    toast: [3750, 4150], // Payroll report ready for QuickBooks
    hold: [4150, 7050],
  },
};

export type RideMoment = {
  i: number;
  id: MomentId;
  /** the transition in begins (the moment before has finished its hold) */
  start: number;
  /** the shot has settled */
  settle: number;
  /** the big clock rolls */
  clock: W;
  head: W;
  hold: W;
  end: number;
  /** every beat, absolute ms */
  at: Record<string, W>;
};

export type Ride = {
  duration: number;
  /** "Enjoy the ride": in, out */
  title: { in: W; sub: W; out: W };
  moments: RideMoment[];
  /** the finale: the dolly back to the whole app, "That's SmartCrew.", the CTA, the ring sweep */
  finale: { start: number; settle: number; screens: number; line: W; cta: W; sweep: W; end: number };
  /** the CTA's window (kept for the page: the bar's own CTA steps aside when it comes in) */
  cta: W;
  /** beat times for the DOM (React re-renders only on these) */
  cues: number[];
};

const win = (v: number | W): W => (typeof v === "number" ? [v, v] : v);

export function buildRide(): Ride {
  const moments: RideMoment[] = [];
  let start: number = PACE.opening;
  MOMENTS.forEach((m, i) => {
    const b = B[m.id];
    const at: Record<string, W> = {};
    for (const k in b) {
      const w = win(b[k]);
      at[k] = [start + w[0], start + w[1]];
    }
    moments.push({ i, id: m.id, start, settle: at.settle[0], clock: at.clock, head: at.head, hold: at.hold, end: at.hold[1], at });
    start = at.hold[1];
  });
  const fs = start;
  const finale = {
    start: fs,
    settle: fs + 1600,
    screens: fs + 600,
    line: [fs + 1100, fs + 1600] as W,
    cta: [fs + 1750, fs + 2250] as W,
    sweep: [fs + 2400, fs + 4000] as W,
    end: fs + PACE.finale,
  };
  const title = { in: [0, PACE.titleIn] as W, sub: PACE.subIn, out: [PACE.opening, PACE.opening + PACE.titleOut] as W };
  const cues: number[] = [title.out[0], title.out[1]];
  moments.forEach((m) => cues.push(m.start, m.head[0], m.hold[0]));
  cues.push(finale.start, finale.line[0], finale.cta[0]);
  return { duration: finale.end, title, moments, finale, cta: finale.cta, cues };
}

export const RIDE = buildRide();

/** The chapters for the player's rail (one per moment; Friday's runs to the end, the finale with it). */
export const rideChapters = (R: Ride = RIDE) =>
  R.moments.map((m, i) => ({ start: m.start, at: m.settle - 40, rest: m.hold[0] + 200, end: i === R.moments.length - 1 ? R.duration : m.end, label: MOMENTS[m.i].when }));

/** The moment the clock is in. */
export function momentAt(t: number, R: Ride = RIDE) {
  let i = 0;
  while (i < R.moments.length - 1 && R.moments[i + 1].start <= t) i++;
  return i;
}

/** A beat's window of moment i (absolute ms). */
export const beat = (i: number, k: string, R: Ride = RIDE): W => R.moments[i].at[k];

const smooth = (x: number) => {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};

/**
 * The time of day as a continuous moment index (0 = 6:42 AM … 6 = Friday, 7 = the finale): it
 * never stands still, so the light shifts all the time, not in steps. It eases from one moment's
 * settle to the next one's (most of the change during the camera's move), and Friday's nightfall
 * is the one fast change.
 */
export function dayClockAt(t: number, R: Ride = RIDE) {
  const ms = R.moments;
  if (t <= ms[0].settle) return 0;
  for (let i = 0; i < ms.length - 1; i++) {
    const a = ms[i].settle;
    const b = ms[i + 1].settle;
    if (t < b) {
      // a slow creep through the moment, then most of the change while the next shot moves in
      const p = (t - a) / (b - a);
      const k = (ms[i + 1].start - a) / (b - a);
      const v = p < k ? 0.25 * (p / k) : 0.25 + 0.75 * smooth((p - k) / (1 - k));
      return i + v;
    }
  }
  return ms.length - 1;
}
