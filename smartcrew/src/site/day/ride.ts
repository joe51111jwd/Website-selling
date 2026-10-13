// One Day as a film: "Enjoy the ride". The whole day's beats on one clock (ms), built from the
// choreography table (./script.ts) and the words on screen. Poses (./poses.ts), the screens' own
// animations (./rideLife.ts) and the DOM (./Day.tsx) all read this one timeline, so a tap, its
// pulse and its update land on the same millisecond, every time, for every visitor.
//
// The pace is set by reading, not by a beat (RIDE_BRIEF addendum): in each moment exactly ONE
// thing moves at a time, in reading order, then everything holds still until a slow reader has
// read what landed:
//
//   glide    the devices (camera) move to the moment's shot; last moment's labels fade
//   time     the big clock rolls to the moment's time
//   head     the headline (and its quiet feature line) fades up
//   tap      a finger lands on the button; the screen changes to its result; its label appears
//   pulse    the orange pulse travels to the other device
//   update   the office screen changes in place (row slides in · number ticks · block drops · flips)
//   push     the camera pushes in on what changed, and the crisp update card + label land
//   hold     time to read what landed (0.7 s + 0.24 s per word, at least 2.9 s; the headline has
//            been up since the tap), while the shot keeps drifting slowly (a dolly, a few
//            degrees of orbit): never a frozen frame, and slow enough that the words stay easy
//            to read
//
// 5:30 PM runs office → field: the click is on the laptop, the office card lands first, the pulse
// carries the plan to the phone, the phone swings forward with it.
//
// Before the first moment: "Enjoy the ride" holds, then the hand-off: the devices rise from where
// they waited under the hero into the first shot while the clock sets. After the last one, the
// FINALE: the camera eases out to the whole app (the office dashboard and the crew's phone),
// "That's SmartCrew.", and the orange button. About a minute in all (the brief: 45–60 s).

import { MOMENTS, type MomentId } from "../../content/moments";
import { DAY2 } from "../../content/copy";
import { SCRIPT, type Script } from "./script";

/** Every duration of the film, ms. One place to tune the pace. */
export const PACE = {
  /** "Enjoy the ride" holds this long once the page has glided to One Day … */
  title: 1300,
  /** … then fades */
  titleOut: 480,
  /** the hand-off: the devices rise into the first shot (starts as the title fades) */
  riseAt: 1500,
  rise: 1400,
  /** the camera move from one moment's last shot to the next one's first */
  glide: 900,
  /** the last moment's labels and card fade out at the start of the glide */
  out: 320,
  /** the big clock rolls */
  time: 620,
  /** the headline fades up */
  head: 500,
  /** finger down → the screen shows its result */
  press: 240,
  /** a state label fades in */
  label: 340,
  /** the orange pulse's flight */
  pulse: 560,
  /** the camera pushes in on what changed */
  push: 820,
  /** the update card lands */
  card: 400,
  /** the hold: max(holdMin, holdBase + perWord × words), the shot drifting slowly */
  holdMin: 2900,
  holdBase: 700,
  perWord: 240,
  /** the finale: the camera eases out to the whole app, "That's SmartCrew.", the CTA, a hold */
  finaleGlide: 1500,
  finaleHold: 2900,
  /** after the finale, the page is handed back this much later */
  release: 800,
} as const;

/** How long each kind of office update takes to play (./rideLife.ts draws them). */
export const UPDATE_MS: Record<Script["laptop"]["update"]["kind"], number> = { insert: 760, tick: 1500, block: 560, approve: 1900 };

export type RideMoment = {
  i: number;
  id: MomentId;
  up: boolean;
  /** the glide begins (the moment before fades out) */
  start: number;
  /** the shot has settled */
  settle: number;
  time: [number, number];
  head: [number, number];
  /** the finger lands */
  tap: number;
  /** the acting screen shows its result */
  shown: number;
  /** the phone's state label */
  phoneLabel: [number, number];
  pulse: [number, number];
  /** the receiving screen changes (the office update plays from here to update[1]) */
  update: [number, number];
  /** the phone's screen changes (5:30 PM: when the plan arrives) */
  phoneShown: number;
  push: [number, number];
  /** the office's label and the update card */
  card: [number, number];
  hold: [number, number];
  end: number;
  /** the words that landed (the hold's reading time) */
  words: number;
};

export type Ride = {
  duration: number;
  title: [number, number];
  moments: RideMoment[];
  /** the finale: the camera eases out to the whole app (start → settle), then holds to `end` */
  finale: { start: number; settle: number; line: [number, number]; end: number };
  /** the finale's orange button comes in */
  cta: [number, number];
  /** extra beat times (labels, card, hold) */
  cues: number[];
};

const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}$]/u.test(w)).length;

export function buildRide(): Ride {
  const P = PACE;
  const moments: RideMoment[] = [];
  let start: number = P.riseAt;
  MOMENTS.forEach((m, i) => {
    const s = SCRIPT[i];
    const up = s.dir === "up";
    const copy = DAY2[m.id];
    const settle = start + (i === 0 ? P.rise : P.glide);
    // the clock rolls as the camera comes to rest (the move is easing out), then the headline
    const time: [number, number] = [settle - 140, settle - 140 + P.time];
    const head: [number, number] = [time[1] - 120, time[1] - 120 + P.head];
    const tap = head[1] + 80;
    const shown = tap + P.press;
    const updDur = UPDATE_MS[s.laptop.update.kind];
    let phoneLabel: [number, number];
    let pulse: [number, number];
    let update: [number, number];
    let phoneShown: number;
    let push: [number, number];
    let card: [number, number];
    if (up) {
      // field → office: the phone's label, the pulse, the office update, the push-in, the card
      phoneLabel = [shown + 140, shown + 140 + P.label];
      phoneShown = shown;
      pulse = [phoneLabel[0] + 180, phoneLabel[0] + 180 + P.pulse];
      update = [pulse[1], pulse[1] + updDur];
      push = [pulse[1] + 140, pulse[1] + 140 + P.push];
      const c = Math.max(push[1], update[1]) - 220;
      card = [c, c + P.card];
    } else {
      // office → field: the click lands the block on the calendar, the office card, then the
      // pulse carries it to the crew's phone, which swings forward with the plan on it
      update = [tap + 60, tap + 60 + updDur];
      card = [update[1] + 60, update[1] + 60 + P.card];
      pulse = [card[1] + 120, card[1] + 120 + P.pulse];
      phoneShown = pulse[1];
      push = [pulse[1] + 60, pulse[1] + 60 + P.push];
      phoneLabel = [push[1] - 240, push[1] - 240 + P.label];
    }
    const landed = Math.max(card[1], phoneLabel[1], push[1]);
    const w = words(copy.phone) + words(copy.office) + words(copy.where);
    const holdMs = Math.round(Math.max(P.holdMin, P.holdBase + P.perWord * w) / 10) * 10;
    const hold: [number, number] = [landed, landed + holdMs];
    moments.push({ i, id: m.id, up, start, settle, time, head, tap, shown, phoneLabel, pulse, update, phoneShown, push, card, hold, end: hold[1], words: w });
    start = hold[1];
  });
  const last = moments[moments.length - 1];
  const fs = last.end;
  const finale = { start: fs, settle: fs + P.finaleGlide, line: [fs + P.finaleGlide - 500, fs + P.finaleGlide] as [number, number], end: fs + P.finaleGlide + P.finaleHold };
  const cta: [number, number] = [finale.line[1] + 150, finale.line[1] + 650];
  const cues: number[] = [P.title, P.title + P.titleOut];
  moments.forEach((m) => cues.push(m.head[0], m.tap, m.phoneLabel[0], m.card[0], m.hold[0]));
  cues.push(finale.start, finale.line[0], cta[0]);
  return { duration: finale.end, title: [P.title, P.title + P.titleOut], moments, finale, cta, cues };
}

export const RIDE = buildRide();

/** The chapters for the player's rail (one per moment). */
export const rideChapters = (R: Ride = RIDE) =>
  // the finale belongs to the last chapter (Friday)
  R.moments.map((m, i) => ({ start: m.start, at: m.settle - 40, rest: m.hold[0], end: i === R.moments.length - 1 ? R.duration : m.end, label: MOMENTS[m.i].when }));

/** The moment the clock is in. */
export function momentAt(t: number, R: Ride = RIDE) {
  let i = 0;
  while (i < R.moments.length - 1 && R.moments[i + 1].start <= t) i++;
  return i;
}

const smooth = (x: number) => {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};

/**
 * The time of day as a continuous moment index (0 = 6:42 AM … 6 = Friday): whole while a moment
 * plays, eased between them during the camera's glide (the light and the ground follow it).
 */
export function dayClockAt(t: number, R: Ride = RIDE) {
  const i = momentAt(t, R);
  const m = R.moments[i];
  if (i > 0 && t < m.settle) return i - 1 + smooth((t - m.start) / (m.settle - m.start));
  return i;
}
