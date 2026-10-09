import { useEffect, useRef } from "react";
import { heroMedia, pad, still, type Project } from "../content/work";
import { cursorCircle } from "../lib/cursor";
import { stage, type Plane } from "../lib/gl/stage";
import { clamp, easeInOut, isTouch, lerp, onTick } from "../lib/ticker";
import type { ExpandFrom } from "../lib/transition";
import { Arrow } from "./Footer";
import { Link } from "./Link";
import { Roll } from "./Text";

/**
 * A floating WebGL preview that follows the cursor over a list, swings with
 * its speed, and wipes from one project to the next as you move down rows.
 */
function useHoverPreview() {
  const s = useRef({
    plane: null as Plane | null,
    current: null as Project | null,
    x: 0,
    y: 0,
    scale: 0,
    target: 0,
    mix: 1,
    tilt: 0,
  }).current;

  useEffect(() => {
    if (!stage.enabled || isTouch) return;
    const plane = stage.free({ bend: false, radius: 3, top: true });
    s.plane = plane;
    s.x = cursorCircle.x;
    s.y = cursorCircle.y;
    const stop = onTick((_, dt) => {
      const px = s.x;
      s.x = lerp(s.x, cursorCircle.x, 0.16);
      s.y = lerp(s.y, cursorCircle.y, 0.16);
      s.scale = lerp(s.scale, s.target, 0.11);
      s.tilt = lerp(s.tilt, clamp((s.x - px) * -0.006, -0.22, 0.22), 0.12);
      const w = Math.min(440, window.innerWidth * 0.3);
      const h = w * 0.625;
      const k = s.scale;
      plane.setRect({ x: s.x - (w * k) / 2, y: s.y - (h * k) / 2, w: w * k, h: h * k });
      plane.rotation = s.tilt;
      plane.alpha = k > 0.02 ? 1 : 0;
      if (s.mix < 1) {
        s.mix = Math.min(1, s.mix + dt / 600);
        plane.set("uMix", easeInOut(s.mix));
        if (s.mix >= 1 && s.current) plane.show(still(s.current));
      }
    });
    return () => {
      stop();
      plane.dispose();
      s.plane = null;
    };
  }, [s]);

  return {
    enter(p: Project) {
      const plane = s.plane;
      if (!plane || s.current === p) return;
      stage.preload([heroMedia(p)]);
      if (s.current && s.scale > 0.3) {
        plane.show(still(s.current), still(p), 0);
        s.mix = 0;
      } else {
        plane.show(still(p));
        s.mix = 1;
      }
      s.current = p;
      s.target = 1;
    },
    leave() {
      s.target = 0;
    },
    expandFrom(p: Project): ExpandFrom | undefined {
      if (!s.plane || s.scale < 0.5 || s.current !== p) return undefined;
      return { rect: s.plane.rect, media: still(p) };
    },
  };
}

/** Rows of projects: index, name, category, year. */
export function ProjectList({ items, offset = 0 }: { items: Project[]; offset?: number }) {
  const preview = useHoverPreview();
  return (
    <ul className="plist" onPointerLeave={preview.leave} data-x="ul.project-list">
      {items.map((p, i) => (
        <li key={p.slug}>
          <Link
            to={`/work/${p.slug}`}
            className="prow"
            data-cursor="view"
            onPointerEnter={() => preview.enter(p)}
            onFocus={() => preview.enter(p)}
            expand={() => preview.expandFrom(p)}
          >
            <span className="prow-index">{pad(offset + i + 1)}</span>
            <span className="prow-name">
              <Roll>{p.name}</Roll>
            </span>
            <span className="prow-cat">{p.category}</span>
            <span className="prow-year">{p.year}</span>
            <Arrow className="prow-arrow" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
