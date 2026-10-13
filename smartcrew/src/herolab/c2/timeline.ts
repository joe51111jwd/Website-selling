// Herolab c2 · one clock for the first seconds. Every move is a Web Animation on transform or
// opacity (the desktop night contraction is the one clip-path tween, the desktop CTA ring the one
// stroke draw), created once and never touched again: no per-frame JS, so a busy main thread can't
// stall it. All of them share one clock, so the sequence can be paused and seeked for review
// (window.__hl2.seek(ms)).
//
// Static CSS is the FINAL frame (parked on phase 2); each animation supplies only its "from" state
// (fill: backwards) unless it says `hold`. Reduced motion, a resize mid-way or a finished timeline
// all fall back to the same frame.

export type Track = {
  el: Element | null | undefined;
  kf: Keyframe[];
  at: number;
  dur: number;
  ease?: string;
  /** keep the last keyframe after the end (for states that differ from the static CSS) */
  hold?: boolean;
  /** override the fill (e.g. "forwards" for a second move on a property another track holds) */
  fill?: FillMode;
};

export type Timeline = {
  play: () => void;
  seek: (ms: number) => void;
  cancel: () => void;
  /** finish everything and keep the final frame */
  finish: () => void;
  end: number;
  done: Promise<void>;
};

export const EASE = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  expo: "cubic-bezier(0.16, 1, 0.3, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  in: "cubic-bezier(0.5, 0, 0.75, 0)",
  spring: "cubic-bezier(0.34, 1.36, 0.64, 1)",
  /** the night contracting into the board: leaves quick, lands long and soft */
  contract: "cubic-bezier(0.7, 0, 0.16, 1)",
};

export function timeline(tracks: Track[], lead = 0): Timeline {
  const list: Animation[] = [];
  let end = 0;
  for (const t of tracks) {
    if (!t.el) continue;
    end = Math.max(end, t.at + t.dur);
    const a = t.el.animate(t.kf, {
      delay: lead + t.at,
      duration: Math.max(1, t.dur),
      easing: t.ease ?? "linear",
      fill: t.fill ?? (t.hold ? "both" : "backwards"),
    });
    a.pause();
    list.push(a);
  }
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  Promise.all(list.map((a) => a.finished.catch(() => undefined))).then(() => resolve());
  return {
    end: end + lead,
    play: () => list.forEach((a) => a.play()),
    seek: (ms) =>
      list.forEach((a) => {
        a.pause();
        a.currentTime = ms;
      }),
    cancel: () => list.forEach((a) => a.cancel()),
    finish: () =>
      list.forEach((a) => {
        try {
          a.finish();
        } catch {
          /* infinite or zero-length: ignore */
        }
      }),
    done,
  };
}
