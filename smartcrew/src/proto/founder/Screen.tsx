import { lazy, Suspense, useLayoutEffect, useRef, useState, type ComponentType, type LazyExoticComponent } from "react";
import { SIZE, screenById } from "../../screens/registry";

// The real SmartCrew screens (src/screens), shown live and cropped rather than shrunk
// (AISMELL V11). A screen is laid out at its native size and scaled with a transform.

const cache = new Map<string, LazyExoticComponent<ComponentType>>();
function load(id: string) {
  let c = cache.get(id);
  if (!c) {
    const def = screenById(id);
    c = lazy(def ? def.load : async () => ({ default: () => null }));
    cache.set(id, c);
  }
  return c;
}

export function screenSize(id: string) {
  const def = screenById(id);
  return SIZE[def?.kind ?? "web"];
}

/** The screen at native size. Inert: nothing inside is focusable or clickable. */
export function ScreenCanvas({ id }: { id: string }) {
  const C = load(id);
  const { w, h } = screenSize(id);
  return (
    <div className="f-canvas" style={{ width: w, height: h }} inert aria-hidden="true">
      <Suspense fallback={null}>
        <C />
      </Suspense>
    </div>
  );
}

/** Measure an element's content box width. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * A fixed crop of a screen that fills its container's width. The crop's height follows its
 * aspect ratio, so the UI text keeps a readable size (pick a crop narrow enough for that).
 */
export function ScreenCrop({ id, x = 0, y = 0, w, h, className = "", label }: { id: string; x?: number; y?: number; w: number; h: number; className?: string; label: string }) {
  const [ref, cw] = useWidth<HTMLDivElement>();
  const k = cw ? cw / w : 0;
  return (
    <div ref={ref} className={`f-crop ${className}`} role="img" aria-label={label} style={{ aspectRatio: `${w} / ${h}` }}>
      {k > 0 && (
        <div className="f-crop-move" style={{ transform: `translate(${-x * k}px, ${-y * k}px) scale(${k})` }}>
          <ScreenCanvas id={id} />
        </div>
      )}
    </div>
  );
}
