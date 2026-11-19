import { useEffect, useRef, type CSSProperties } from "react";
import { COPY } from "../copy";
import { FrameStore } from "../frames";
import { track } from "../scroll";

const BASE = import.meta.env.BASE_URL;
const P = COPY.problem;

/** a line whose words light up one after another as the section scrolls (--t: where each word lights) */
export function Fill({ text, from = 0, to = 1, className }: { text: string; from?: number; to?: number; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={`fill ${className ?? ""}`}>
      {words.map((w, i) => (
        <span key={i} className="w" style={{ "--t": (from + ((to - from) * i) / words.length).toFixed(4) } as CSSProperties}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

// The tower: a real Blender render (render/words_film.py, frames 112-202 of the old story film), played by the
// scroll. The three ALWAYS lines come in around it as it grows, and it falls.
function Tower() {
  const ref = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    let store: FrameStore | null = null;
    let lo: FrameStore | null = null;
    let p = 0;
    let drawn = -1;
    let alive = true;
    // the film runs from p 0.06 to 0.8 of the section
    const frameAt = (q: number, n: number) => Math.max(0, Math.min(n - 1, Math.round(((q - 0.06) / 0.74) * (n - 1))));
    const draw = (force = false) => {
      const s = store ?? lo;
      if (!s || !ctx) return;
      const i = frameAt(p, s.m.count);
      if (i === drawn && !force) return;
      const bmp = store?.get(i) ?? lo?.get(i) ?? store?.nearest(i, 1) ?? lo?.nearest(i, 1);
      if (!bmp) return;
      if (cv.width !== bmp.width) {
        cv.width = bmp.width;
        cv.height = bmp.height;
      }
      ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
      if (store?.peek(i) || !store) drawn = i;
      store?.prefetch(i, 1, 6);
    };
    const redraw = () => alive && draw(true);
    const wide = window.innerWidth > 760 || window.devicePixelRatio > 1.5;
    void (async () => {
      try {
        lo = await FrameStore.open(`${BASE}fall/lo/`, 46, 600, redraw);
        await lo.loadAll([0]);
        if (!alive) return;
        if (wide) {
          store = await FrameStore.open(`${BASE}fall/hi/`, 24, window.innerWidth > 1400 ? 1600 : 1200, redraw);
          await store.loadAll([0]);
        }
      } catch {
        /* the still poster stays */
      }
    })();
    const off = track(el, "pin", (q) => {
      p = q;
      draw();
    });
    return () => {
      alive = false;
      off();
      store?.dispose();
      lo?.dispose();
    };
  }, []);

  return (
    <section className="tower" ref={ref} id="story" aria-labelledby="tower-kicker">
      <div className="tower-stage">
        <p className="kicker tower-kicker" id="tower-kicker">
          {P.kicker}
        </p>
        <figure className="plate tower-plate">
          <img className="plate-poster" src={`${BASE}img/tower-poster.webp`} alt="" aria-hidden="true" />
          <canvas ref={canvas} role="img" aria-label={P.filmAlt} />
        </figure>
        <h2 className="always">
          {P.always.map((l, i) => (
            <span key={l} className={`always-l always-${i + 1}`}>
              {l}
            </span>
          ))}
        </h2>
        <p className="settled">{P.settled}</p>
      </div>
    </section>
  );
}

function Ledger() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? track(ref.current, "pin") : undefined), []);
  return (
    <section className="ledger" ref={ref}>
      <div className="ledger-stage">
        <p className="ledger-line">
          <Fill text={P.revenue} from={0.02} to={0.42} />
        </p>
        <p className="ledger-line ledger-2">
          <Fill text={P.margins} from={0.5} to={0.9} />
        </p>
      </div>
    </section>
  );
}

function Pile() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? track(ref.current, "view") : undefined), []);
  return (
    <section className="pile" ref={ref}>
      <figure className="pile-img">
        <img src={`${BASE}img/pile-1600.webp`} srcSet={`${BASE}img/pile-800.webp 800w, ${BASE}img/pile-1600.webp 1600w`} sizes="100vw" width={1600} height={1000} alt={P.pileAlt} loading="lazy" decoding="async" />
      </figure>
      <p className="pile-line">{P.complexity}</p>
    </section>
  );
}

function Flip() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? track(ref.current, "pin") : undefined), []);
  return (
    <section className="flip" ref={ref} aria-label={`${P.isnt} ${P.is.join(" ")}`}>
      <div className="flip-stage" aria-hidden="true">
        <p className="flip-isnt">{P.isnt}</p>
        <p className="flip-is">
          <span>{P.is[0]}</span> <span className="flip-turn">{P.is[1]}</span>
        </p>
      </div>
    </section>
  );
}

export function Problem() {
  return (
    <>
      <Tower />
      <Ledger />
      <Pile />
      <Flip />
    </>
  );
}
