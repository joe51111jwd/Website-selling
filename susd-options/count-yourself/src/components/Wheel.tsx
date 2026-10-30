import { forwardRef, memo, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from 'react';

export type WheelApi = {
  /** pos is in faces (1 = one face turned); blur in px. */
  set(pos: number, blur?: number): void;
};

type Props = {
  faces: ReactNode[];
  className?: string;
  faceClassName?: (i: number) => string;
  /** 1: the next face comes up from below (odometer). -1: it comes down from above. */
  dir?: 1 | -1;
  initial?: number;
};

/**
 * A CSS 3D ring of DOM faces (text stays crisp). Face i sits at rotateX(i·step) translateZ(r),
 * r = faceHeight / (2·tan(π/N)); the ring is pushed back by r so the front face sits in the page plane.
 * The parent window crops it.
 */
export const Wheel = memo(forwardRef<WheelApi, Props>(function Wheel({ faces, className = '', faceClassName, dir = 1, initial = 0 }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const g = useRef({ r: 0, step: 360 / faces.length, pos: initial, blur: 0, shownBlur: -1, front: NaN });

  /** Only the faces within two steps of the front are rendered (the window crops the rest anyway),
   *  so a 10-face wheel keeps 5 composited faces, not 10. */
  const cull = () => {
    const s = g.current;
    const el = ring.current;
    const n = faces.length;
    if (!el || n <= 5) return;
    const front = ((Math.round(s.pos) % n) + n) % n;
    if (front === s.front) return;
    s.front = front;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs(i - front);
      (c as HTMLElement).style.visibility = Math.min(d, n - d) <= 2 ? '' : 'hidden';
    });
  };

  const apply = () => {
    const s = g.current;
    if (ring.current) ring.current.style.transform = `translateZ(${-s.r}px) rotateX(${dir * s.pos * s.step}deg)`;
    cull();
    const b = s.blur > 0.15 ? Math.round(s.blur * 10) / 10 : 0;
    if (wrap.current && b !== s.shownBlur) {
      wrap.current.style.filter = b ? `blur(${b}px)` : '';
      s.shownBlur = b;
    }
  };

  useLayoutEffect(() => {
    const el = ring.current;
    if (!el) return;
    const measure = () => {
      const face = el.firstElementChild as HTMLElement | null;
      const fh = face?.offsetHeight ?? 0;
      const n = faces.length;
      const r = fh / (2 * Math.tan(Math.PI / n));
      g.current.r = r;
      Array.from(el.children).forEach((c, i) => {
        (c as HTMLElement).style.transform = `rotateX(${-dir * i * g.current.step}deg) translateZ(${r}px)`;
      });
      g.current.front = NaN;
      apply();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faces.length, dir]);

  useImperativeHandle(ref, () => ({
    set(pos: number, blur = 0) {
      g.current.pos = pos;
      g.current.blur = blur;
      apply();
    },
  }));

  return (
    <div className={`wheel ${className}`} ref={wrap} aria-hidden="true">
      <div className="ring" ref={ring}>
        {faces.map((f, i) => (
          <div className={`face ${faceClassName ? faceClassName(i) : ''}`} key={i}>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}));
