// Five apps → one: the Stage's choreography, and the beats the DOM tiles share with it.
//
//   0.00  the devices sit dark (screens off) in the middle; five app tiles drift around them
//   S..L  each tile is pulled in, magnet-like, and vanishes into the exact place on the screen it
//         becomes (Time tracking → the phone's running timer, Fleet → Equipment, CRM → Pipeline,
//         Files → the phone's Docs tab, Group chat → Messaging). The first tile into a device
//         switches its screen on; each landing pings a ring on that spot.
//   0.58  all five are in; "Or one that does."
//   0.60→0.74  the devices glide right to make room for the close, and an orange pulse runs from
//         the phone's timer to the office: the two talk to each other (the clock-in row lights)
//   0.68  sub + CTA
//
// Phones: the same beats, every tile goes into the phone (the laptop waits behind it), and the
// devices lift to make room for the copy at the bottom.
//
// The devices never just appear or vanish (BRIEF round 2 §6): they are out of frame during Proof
// (its exitKeys), glide in from the right turning to face you as this scene comes up (returnKeys),
// and once the close has had its beat they glide out past the right edge, turning away (the laptop
// first, the phone a moment later), as Andrew + the offer comes up.

import { phone, registerLiveScreen, returnKeys, type Box, type DevicePose, type PoseKey } from "../../three/stage";

export type Target = {
  device: "macbook" | "iphone";
  ring: Box | null;
  at: Box;
};
export type Beat = { start: number; land: number };

// ─── rings / targets on the screens, native px (measured at ?screen=<id>) ─────
const R = {
  timer: [46, 327, 310, 42] as Box, // phone-working: "02h 14m 36s"
  docs: [174, 771, 54, 58] as Box, // phone-working: the Docs tab
  project: [50, 381, 302, 28] as Box, // phone-working: Project row
  equipRow: [50, 441, 302, 28] as Box, // phone-working: Equipment row
  working: [40, 266, 322, 34] as Box, // phone-working: "Currently working on"
  equipment: [26, 300, 214, 38] as Box, // web-dashboard sidebar: Equipment
  pipeline: [26, 447, 214, 38] as Box, // … Pipeline
  messaging: [26, 545, 214, 38] as Box, // … Messaging
  clockRow: [339, 694, 1057, 66] as Box, // web-dashboard: Marcus Bell, Clocked In (the Day's 6:42 AM row)
};

/** Where each tile (APPS.apps order) lands. */
export const TARGETS: Target[] = phone
  ? [
      { device: "iphone", ring: null, at: R.timer },
      { device: "iphone", ring: null, at: R.equipRow },
      { device: "iphone", ring: null, at: R.project },
      { device: "iphone", ring: null, at: R.docs },
      { device: "iphone", ring: null, at: R.working },
    ]
  : [
      { device: "iphone", ring: R.timer, at: R.timer },
      { device: "macbook", ring: R.equipment, at: R.equipment },
      { device: "macbook", ring: R.pipeline, at: R.pipeline },
      { device: "iphone", ring: R.docs, at: R.docs },
      { device: "macbook", ring: R.messaging, at: R.messaging },
    ];

/** Each tile's flight, in scene progress. */
const FLIGHT = phone ? 0.15 : 0.17;
const FIRST = phone ? 0.07 : 0.08;
const GAP = phone ? 0.075 : 0.07;
export const BEATS: Beat[] = TARGETS.map((_, i) => ({
  start: FIRST + i * GAP,
  land: FIRST + i * GAP + FLIGHT,
}));
const LAST = BEATS[BEATS.length - 1].land;
/** DOM beats. */
export const PAYOFF_AT = LAST + 0.04;
export const CLOSE_AT = phone ? LAST + 0.13 : 0.68;
export const GLIDE_FROM = LAST + 0.06;
export const GLIDE_TO = phone ? LAST + 0.2 : 0.74;

type Pose5 = Required<Pick<DevicePose, "x" | "y" | "z" | "rx" | "ry" | "rz" | "s">>;
type Shot = { frame: [number, number]; macbook: Pose5; iphone: Pose5 };

/** The opening shot (screens off) and the closing one (shifted for the copy). */
export const SHOTS: { open: Shot; close: Shot } = phone
  ? {
      open: {
        frame: [2.9, 2.7],
        iphone: { x: 0.12, y: -0.08, z: 0.6, rx: 3, ry: -7, rz: -1.5, s: 1.42 },
        macbook: { x: -0.62, y: 0.42, z: -1.6, rx: 13, ry: 18, rz: 0, s: 0.72 },
      },
      close: {
        frame: [2.9, 2.7],
        iphone: { x: 0.5, y: 0.34, z: 0.6, rx: 3, ry: -12, rz: -2, s: 1.04 },
        macbook: { x: -0.14, y: 0.5, z: -0.6, rx: 11, ry: 8, rz: 0, s: 0.72 },
      },
    }
  : {
      open: {
        frame: [5.6, 2.9],
        macbook: { x: -0.32, y: 0.02, z: -0.2, rx: 9, ry: -5, rz: 0, s: 1 },
        iphone: { x: 1.42, y: -0.32, z: 0.95, rx: 4, ry: -12, rz: -3, s: 1.08 },
      },
      close: {
        frame: [5.6, 2.9],
        macbook: { x: 1.0, y: 0.15, z: -0.15, rx: 9, ry: -13, rz: 0, s: 1.02 },
        iphone: { x: 2.62, y: -0.2, z: 0.95, rx: 4, ry: -18, rz: -3, s: 1.08 },
      },
    };

const ANCHOR = "apps";
const DIM = 0.1;

// Screens OFF: a tiny near-black canvas per device as a live screen. (`screen: null` can't be used:
// once a screen has shown an image the Stage keeps showing it on null; see the result notes.)
const OFF = {
  macbook: "live:apps-off-web",
  iphone: "live:apps-off-phone",
} as const;
let offReady = false;
function ensureOffScreens() {
  if (offReady || typeof document === "undefined") return;
  offReady = true;
  for (const [name, w, h] of [
    ["apps-off-web", 1440, 900],
    ["apps-off-phone", 402, 874],
  ] as const) {
    const c = document.createElement("canvas");
    c.width = c.height = 4;
    const g = c.getContext("2d")!;
    g.fillStyle = "#08080a";
    g.fillRect(0, 0, 4, 4);
    registerLiveScreen(name, c, w, h);
  }
}

/** How many screens the scene takes. */
export const APPS_VIEWPORTS = phone ? 2.0 : 1.8;

/** Scene progress for a point `vh` screens past the end of the pin (the exit runs there). */
const past = (vh: number) => 1 + vh / (APPS_VIEWPORTS - 1);

const SCREEN = { macbook: "web-dashboard", iphone: "phone-working" } as const;

export function appsPoses(): PoseKey[] {
  ensureOffScreens();
  const { open, close } = SHOTS;
  // the opening shot, screens off. Phones: the phone alone at first (the tiles stack over it); the
  // laptop joins for the close
  const first: Omit<PoseKey, "at"> = {
    anchor: ANCHOR,
    frame: open.frame,
    macbook: { ...open.macbook, screen: OFF.macbook, show: phone ? 0 : 1 },
    iphone: { ...open.iphone, screen: OFF.iphone },
    display: { show: 0 },
    float: 0.2,
    look: 0.4,
    view: { rx: 0, ry: 0 },
    light: { key: 1, warm: 0 },
  };
  const keys: PoseKey[] = [
    // they come back from the right (where Try it sent the phone) as this scene rises under
    // Katie's quote, and settle as it reaches the top
    ...returnKeys(first, { side: 1, start: -0.95, end: -0.02, devices: ["macbook", "iphone"] }),
    { ...first, at: 0, ease: "out" },
  ];
  // each landing: the device it enters wakes up (first time) and pings a ring on the spot
  const on = { macbook: false, iphone: false };
  TARGETS.forEach((t, i) => {
    const dev: DevicePose = {};
    if (!on[t.device]) {
      on[t.device] = true;
      dev.screen = SCREEN[t.device];
    }
    if (t.ring) {
      dev.ring = t.ring;
      dev.dim = DIM;
    }
    keys.push({ at: BEATS[i].land, [t.device]: dev, ease: "hold" });
  });
  // phones: the laptop's screen is on before it joins
  if (!on.macbook) keys[keys.length - 1].macbook = { screen: SCREEN.macbook, show: 0 };
  // all in: a beat of stillness, then the pulse carries the phone's clock-in to the office while
  // the devices glide over for the close
  keys.push({
    at: GLIDE_FROM,
    macbook: { ...open.macbook, show: phone ? 0 : 1 },
    iphone: { ...open.iphone, ring: R.timer, dim: DIM },
    pulse: { from: "iphone", to: "macbook", t: 0 },
  });
  keys.push({
    at: GLIDE_TO,
    macbook: { ...close.macbook, ring: R.clockRow, dim: DIM },
    iphone: { ...close.iphone },
    pulse: { from: "iphone", to: "macbook", t: 1 },
    light: { key: 1.08, warm: 0.12 },
  });
  keys.push({
    at: 1,
    macbook: { ...close.macbook, ring: R.clockRow, dim: DIM },
    iphone: { ...close.iphone },
  });
  // the exit, as Andrew + the offer comes up: a beat, then out past the right edge, turning away
  // (the laptop first, the phone a moment later), hidden once out of frame. `out` isn't inherited,
  // so it is restated on every key until the device is hidden.
  keys.push({ at: past(0.16), macbook: { ...close.macbook }, iphone: { ...close.iphone } });
  keys.push({ at: past(0.56), macbook: { ...close.macbook, out: 1 }, iphone: { ...close.iphone, out: 0.25 }, ease: "in" });
  keys.push({ at: past(0.68), macbook: { show: 0, out: 1 }, iphone: { ...close.iphone, out: 1 }, ease: "in" });
  keys.push({ at: past(0.76), macbook: { show: 0 }, iphone: { show: 0, out: 1 } });
  return keys;
}

/** The pose the devices hold while the tiles fly (they don't move until all five are in). */
export const FLY_POSE = SHOTS.open;

/** The scroll position where each device's screen comes on (its first landing). */
export const SCREEN_ON = {
  iphone: BEATS[TARGETS.findIndex((t) => t.device === "iphone")].land,
  macbook: TARGETS.some((t) => t.device === "macbook") ? BEATS[TARGETS.findIndex((t) => t.device === "macbook")].land : LAST,
};
export const SCREEN_SRC = SCREEN;

/** The devices' pose at a scene progress, as the Stage blends it (for the cursor's loupe). */
export function shotAt(p: number): Shot {
  const { open, close } = SHOTS;
  const t = Math.max(0, Math.min(1, (p - GLIDE_FROM) / (GLIDE_TO - GLIDE_FROM)));
  const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const mix = (a: Pose5, b: Pose5): Pose5 => ({
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    z: a.z + (b.z - a.z) * k,
    rx: a.rx + (b.rx - a.rx) * k,
    ry: a.ry + (b.ry - a.ry) * k,
    rz: a.rz + (b.rz - a.rz) * k,
    s: a.s + (b.s - a.s) * k,
  });
  return { frame: open.frame, macbook: mix(open.macbook, close.macbook), iphone: mix(open.iphone, close.iphone) };
}
