// The Stage's vocabulary. A scene never owns 3D: it declares DOM anchors and a list of pose keys
// along its scroll, and the one shared Stage (./Stage.tsx) puts the devices there.

export type DeviceId = "macbook" | "iphone" | "display";
export const DEVICE_IDS: DeviceId[] = ["macbook", "iphone", "display"];

/** A box on a screen in the screen's native CSS px: [x, y, w, h] (web 1440×900, phone 402×874). */
export type Box = [x: number, y: number, w: number, h: number];

/**
 * One device in a pose. Every field is optional and inherits from the previous key on the page
 * (so a key only states what changes), except `ring`, which is per key.
 */
export type DevicePose = {
  /** 0 hides the device (it shrinks away), 1 shows it. */
  show?: number;
  /** Position of the device's centre from the frame's centre, in frame units (1 = 10 cm). +y is up, +z towards the viewer. */
  x?: number;
  y?: number;
  z?: number;
  /** Rotation in degrees (x: tilt back, y: turn, z: roll). */
  rx?: number;
  ry?: number;
  rz?: number;
  /** Scale multiplier on top of the frame fit. */
  s?: number;
  /** MacBook lid angle in degrees. Not supported by the current GLB (its lid is merged); kept for the API. */
  lid?: number;
  /** Screen: an id from src/screens/registry.ts ("web-dashboard"), a URL under public/, or "live:<name>" (registerLiveScreen). null = screen off. */
  screen?: string | null;
  /** Scroll the screen image down by this many native px (long screens). */
  scroll?: number;
  /** Highlight ring on the screen, in native px. Not inherited: set it on every key that shows it. */
  ring?: Box | null;
  /** How much the rest of the screen dims while a ring is up (0..1, default 0.16). */
  dim?: number;
  /**
   * Leave the frame deliberately instead of shrinking away: -1 = glided out past the left edge of
   * the viewport (turning as it goes), +1 = past the right edge, 0 = in place. Fractions are part
   * way. NOT inherited (like `ring`): a key that doesn't set it means 0, so the next scene's first
   * key brings the device back in. See exitKeys() / API.md "Round 2".
   */
  out?: number;
};

/**
 * Push in on one spot of a device's screen: the device is scaled `zoom`× about that spot and the
 * spot is carried to `to` (fractions of the anchor box, default the centre). The other devices
 * keep their poses. Not inherited; blends in and out between keys.
 */
export type FocusSpec = {
  device: DeviceId;
  /** the spot, native px of the device's screen */
  px: [number, number];
  zoom: number;
  /** where the spot lands, as fractions of the anchor box (default [0.5, 0.5]) */
  to?: [number, number];
  /**
   * How far the push-in is applied, 0..1 (default 1). Set by the Stage itself on the pose it
   * evaluates from a clock-driven scene (a push-in half way through its blend); keys leave it out.
   */
  weight?: number;
};

export type PulseSpec = {
  from: DeviceId;
  to: DeviceId;
  /** 0 = at `from`, 1 = arrived at `to`. Interpolated between keys, so scroll drives it. */
  t: number;
  /** Start / end points in native px of each device's screen. Default: that device's ring centre, else its screen centre. */
  fromPx?: [number, number];
  toPx?: [number, number];
};

export type Pose = {
  /** id of a <StageAnchor>; inherits from the previous key. */
  anchor?: string;
  /** The frame [w, h] in device units that is contain-fitted into the anchor's box. Default [6, 4] (60 × 40 cm). */
  frame?: [number, number];
  macbook?: DevicePose;
  iphone?: DevicePose;
  display?: DevicePose;
  /** The orange data pulse. Not inherited. */
  pulse?: PulseSpec | null;
  /** Idle float amplitude, 0..1. Inherits. */
  float?: number;
  /** Cursor look-around amount, 0..1 (1 = ±4°). Inherits. */
  look?: number;
  /** Orbit the whole composition, in degrees (like moving the camera around it). Inherits. */
  view?: { rx?: number; ry?: number };
  /** Lighting: key 0..2 (1 = default), warm 0..1 (a warmer kicker for dusk). Inherits. */
  light?: { key?: number; warm?: number };
  /** Push in on a spot of one device's screen (see FocusSpec). Not inherited. */
  focus?: FocusSpec | null;
  /**
   * Draw this device in front of the others whatever its depth (it is moved along the camera
   * rays and scaled to match, so it looks identical but can't be cut by a closer laptop). Inherits.
   */
  front?: DeviceId | null;
  /**
   * Dock the frame: fit it into the anchor's box where that box sits once its pinned scene has
   * stuck to the top of the viewport, even while the scene is still scrolling in from below. The
   * devices then hold still on screen while the page catches up under them (the hero → One Day
   * hand-off: they rise into their first shot before One Day has arrived). Not inherited; an
   * anchor outside a pinned scene ignores it.
   */
  dock?: boolean;
};

export type EaseName = "linear" | "in" | "out" | "inOut" | "snap" | "hold";
export type Ease = EaseName | ((t: number) => number);

/**
 * A pose at a point of a scene's scroll. `at` is the scene's progress: 0 when the scene's top
 * reaches the top of the viewport, 1 when its pinned stage is about to scroll away (for a
 * non-pinned scene, 1 is when its bottom reaches the top of the viewport). `ease` shapes the
 * blend that ARRIVES at this key from the previous one.
 */
export type PoseKey = Pose & {
  at: number;
  ease?: Ease;
  /**
   * Shift the key by this many viewport heights of scroll (negative = earlier). With `at: 0` it
   * places a key before the scene's top reaches the top of the viewport, e.g. while the scene is
   * still entering from below (exitKeys/returnKeys use it).
   */
  offset?: number;
};

/** A device's fully resolved state in one key. */
export type DeviceState = {
  show: number;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  s: number;
  lid: number;
  screen: string | null;
  scroll: number;
  ring: Box | null;
  dim: number;
  out: number;
};

export type ResolvedKey = {
  scene: string;
  at: number;
  /** absolute page scroll position of this key, px */
  y: number;
  anchor: string;
  frame: [number, number];
  devices: Record<DeviceId, DeviceState>;
  pulse: PulseSpec | null;
  float: number;
  look: number;
  viewX: number;
  viewY: number;
  lightKey: number;
  lightWarm: number;
  focus: FocusSpec | null;
  front: DeviceId | null;
  dock: boolean;
  ease: Ease;
  /**
   * A clock-driven scene's place in the scroll timeline (registerPoses(…, { clock })): its pose is
   * not this key's own but the scene's keys evaluated at the scene's clock, every frame.
   */
  portal?: string;
  /**
   * The fields this key inherited from a portal (it didn't set them, nor did any key between
   * them): they follow the portal's live pose, so the keys after a clock-driven scene carry on
   * from wherever its clock left the devices.
   */
  dyn?: { from: string; key: ReadonlySet<string>; devices: Record<DeviceId, ReadonlySet<string>> };
};
