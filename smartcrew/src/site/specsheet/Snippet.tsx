// A crisp, live look at the real app for one tool: the recreated SmartCrew screen (React DOM, so it
// stays vector-sharp at any size) laid out at its native size inside a clipped frame, with a camera
// that frames the tool's exact region and a geofence ring on it. Between tools on the same screen
// the camera glides; to another screen it crossfades. Decorative for assistive tech (the row it
// illustrates carries the words) and inert, so nothing inside the screen can take focus.

import { lazy, Suspense, useLayoutEffect, useRef, useState, type ComponentType, type LazyExoticComponent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SIZE, screenById } from "../../screens/registry";
import type { Box } from "../../content/moments";
import type { Shot } from "./data";

const comps = new Map<string, LazyExoticComponent<ComponentType>>();

function screenComp(id: string) {
  let c = comps.get(id);
  if (!c) {
    const def = screenById(id);
    if (!def) throw new Error(`spec sheet: no screen ${id}`);
    c = lazy(def.load);
    comps.set(id, c);
  }
  return c;
}

/** Start loading a screen's code (on hover/focus of what will show it). */
export function warmScreen(id: string) {
  void screenById(id)?.load();
}

type Cam = { s: number; x: number; y: number };

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

/** Where the camera sits for a shot in a frame of fw × fh CSS px. */
export function camFor(shot: Shot, fw: number, fh: number, compact: boolean): Cam {
  const { w: W, h: H } = SIZE[shot.kind];
  const F: Box = shot.focus;
  if (shot.kind === "phone") {
    // the whole width of the phone, as big as the frame allows while staying legible
    const s = clamp(Math.min((fw * (compact ? 0.66 : 0.62)) / W, fh / (compact ? 360 : 470)), 0.5, compact ? 0.72 : 0.8);
    const x = (fw - W * s) / 2;
    // it reads as a phone when an edge shows: sit it on its top (status bar) or its bottom (tab
    // bar) whenever the tool's spot still fits; centre on the spot only when it can't
    const edge = compact ? 12 : 18;
    const room = 18;
    if ((F[1] + F[3]) * s + edge + room <= fh) return { s, x, y: edge };
    const yb = fh - edge - H * s;
    if (F[1] * s + yb >= room) return { s, x, y: yb };
    const cy = F[1] + F[3] / 2;
    return { s, x, y: clamp(fh / 2 - cy * s, fh - H * s, 0) };
  }
  const pad = compact ? 28 : 46;
  const s = clamp(Math.min(fw / (F[2] + pad * 2), fh / (F[3] + pad * 2)), compact ? 0.42 : 0.58, compact ? 0.8 : 0.96);
  // a box wider (or taller) than the window: start from its left (top) edge, keep the rest in reach
  const cx = (F[2] + pad * 2) * s > fw ? F[0] - pad + fw / (2 * s) : F[0] + F[2] / 2;
  const cy = (F[3] + pad * 2) * s > fh ? F[1] - pad + fh / (2 * s) : F[1] + F[3] / 2;
  const x = W * s <= fw ? (fw - W * s) / 2 : clamp(fw / 2 - cx * s, fw - W * s, 0);
  const y = H * s <= fh ? (fh - H * s) / 2 : clamp(fh / 2 - cy * s, fh - H * s, 0);
  return { s, x, y };
}

const spring = { type: "spring", stiffness: 150, damping: 24, mass: 0.9 } as const;

export function Snippet({ shot, compact = false, toolKey }: { shot: Shot; compact?: boolean; toolKey: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      setSize((p) => (p && Math.abs(p.w - r.width) < 0.5 && Math.abs(p.h - r.height) < 0.5 ? p : { w: r.width, h: r.height }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = SIZE[shot.kind];
  const cam = size ? camFor(shot, size.w, size.h, compact) : null;
  const Comp = screenComp(shot.screen);
  const R = shot.ring;
  // the callout goes under the ring, or over it when the ring sits low in the window
  const tagBelow = !!(cam && R && (R[1] + R[3]) * cam.s + cam.y + 40 < (size?.h ?? 0));

  return (
    <div ref={frame} className="spec-snip" data-kind={shot.kind} aria-hidden="true" inert>
      {cam && (
        <AnimatePresence initial={false}>
          <motion.div
            key={shot.screen}
            className="spec-snip-layer"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="spec-snip-screen"
              data-kind={shot.kind}
              style={{ width: W, height: H, originX: 0, originY: 0 }}
              initial={false}
              animate={{ x: cam.x, y: cam.y, scale: cam.s }}
              transition={spring}
            >
              <Suspense fallback={null}>
                <Comp />
              </Suspense>
              {R && (
                <motion.div
                  className="spec-snip-ring"
                  style={{ "--k": 1 / cam.s } as React.CSSProperties}
                  initial={false}
                  animate={{ left: R[0] - 5 / cam.s, top: R[1] - 5 / cam.s, width: R[2] + 10 / cam.s, height: R[3] + 10 / cam.s }}
                  transition={spring}
                >
                  <span key={toolKey} className="spec-snip-ping" />
                </motion.div>
              )}
              {R && shot.tag && (
                <motion.span
                  key={`tag-${toolKey}`}
                  className="spec-snip-tag"
                  style={
                    tagBelow
                      ? { left: R[0], top: R[1] + R[3] + 12 / cam.s, scale: 1 / cam.s, originX: 0, originY: 0 }
                      : { left: R[0], bottom: H - R[1] + 12 / cam.s, scale: 1 / cam.s, originX: 0, originY: 1 }
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  {shot.tag}
                </motion.span>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
