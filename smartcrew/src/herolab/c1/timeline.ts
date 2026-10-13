// Herolab c1 · the first three seconds. Every move is a Web Animation on transform or opacity
// (compositor-only; the desktop ring draw is the one stroke animation), created once when the
// hand-over starts and never touched again: no per-frame JS, so a busy main thread (the 3D
// loading underneath, a slow phone) can't stall it. All of them share one clock, so the whole
// sequence can be paused and seeked for review (window.__hl1.seek(ms)).
//
// Static CSS is the FINAL frame; each animation only supplies the "from" state (fill: backwards).
// So reduced motion, a resize mid-way or a finished timeline all fall back to the same frame.

export type Track = {
  el: Element;
  kf: Keyframe[];
  at: number;
  dur: number;
  ease?: string;
  /** keep the last keyframe after the end (for states that differ from the static CSS) */
  hold?: boolean;
};

export type Timeline = {
  play: () => void;
  seek: (ms: number) => void;
  cancel: () => void;
  /** ms after `start` when the last track ends */
  end: number;
  done: Promise<void>;
};

export const EASE = {
  /** the camera: a pull-back that leaves gently and settles long */
  cam: "cubic-bezier(0.62, 0.02, 0.18, 1)",
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  expo: "cubic-bezier(0.16, 1, 0.3, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  in: "cubic-bezier(0.5, 0, 0.75, 0)",
  spring: "cubic-bezier(0.34, 1.42, 0.64, 1)",
  /** the 5:00 PM line: picks up, crosses at a steady pace, settles on the stamp */
  sweep: "cubic-bezier(0.42, 0, 0.3, 1)",
};

/** Build all tracks, starting `lead` ms from now (the hold on the intro's last frame). */
export function timeline(tracks: Track[], lead: number): Timeline {
  const list: Animation[] = [];
  let end = 0;
  for (const t of tracks) {
    end = Math.max(end, t.at + t.dur);
    const a = t.el.animate(t.kf, {
      delay: lead + t.at,
      duration: Math.max(1, t.dur),
      easing: t.ease ?? "linear",
      fill: t.hold ? "both" : "backwards",
    });
    a.pause();
    list.push(a);
  }
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  Promise.all(list.map((a) => a.finished.catch(() => undefined))).then(() => resolve());
  return {
    end,
    done,
    play: () => list.forEach((a) => a.play()),
    seek: (ms: number) =>
      list.forEach((a) => {
        a.pause();
        a.currentTime = lead + ms;
      }),
    cancel: () => {
      list.forEach((a) => a.cancel());
      resolve();
    },
  };
}

// ─── cubic-bezier, solved: when does the sweep line reach x? ─────────────────────

function bez(p1: number, p2: number) {
  return (s: number) => 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;
}

/** For an easing cubic-bezier(x1,y1,x2,y2), the time fraction at which progress reaches p. */
export function timeAtProgress(css: string, p: number): number {
  const m = css.match(/cubic-bezier\(([^)]+)\)/);
  if (!m) return p;
  const [x1, y1, x2, y2] = m[1].split(",").map(Number);
  const bx = bez(x1, x2);
  const by = bez(y1, y2);
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (by(mid) < p) lo = mid;
    else hi = mid;
  }
  return bx((lo + hi) / 2);
}

/** Progress of an easing at time fraction u (for placing things on the camera's path). */
export function progressAt(css: string, u: number): number {
  const m = css.match(/cubic-bezier\(([^)]+)\)/);
  if (!m) return u;
  const [x1, y1, x2, y2] = m[1].split(",").map(Number);
  const bx = bez(x1, x2);
  const by = bez(y1, y2);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < u) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
}
