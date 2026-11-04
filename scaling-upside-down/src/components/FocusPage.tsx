// The focus version (/focus): one thing on screen at a time, and the picture needs no words.
//   the book alone → the book makes way for the model → the film (no words at all) → the words, alone,
//   once the film is done → the book and its sign-up
// The film is render/loadpath.py: an architect's model grown by doing everything at once, which falls;
// then rebuilt one move at a time (green up, ochre side, red down), again and again, far taller.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { COPY } from "../copy";
import { BOOK } from "../book";
import { FrameStore } from "../frames";
import { FilmPainter, FILM_FRAMES } from "../fit";
import { APPENDIX_URL, optinLive, sendOptin, validEmail } from "../optin";
import { openNotice } from "./NoticeDialog";
import { lenis } from "../lenis";
import "../focus-page.css";

const BASE = import.meta.env.BASE_URL;
const FRAMES = `${BASE}frames-lp/`;
const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};

// the film section's own scroll, 0-1: the book, its hand-over, then the film (frames 0-385, with a few
// still beats), then the picture gives way to the paper
const HERO_OUT: [number, number] = [0.035, 0.075];
const FILM_IN: [number, number] = [0.07, 0.1];
const FILM_OUT: [number, number] = [0.965, 0.995];
const KEYS: [number, number][] = [
  [0.1, 0],
  [0.12, 0], // the small white building, still
  [0.29, 83], // everything piled on at once, to the brink
  [0.31, 86], // a held breath at the tipping point
  [0.4, 140], // it falls
  [0.42, 146], // the wreckage, still
  [0.95, FILM_FRAMES - 1], // cleared; the core; three rounds of up, side and down
  [1, FILM_FRAMES - 1],
];
const frameAt = (p: number) => {
  if (p <= KEYS[0][0]) return KEYS[0][1];
  for (let k = 0; k < KEYS.length - 1; k++) {
    const [p0, f0] = KEYS[k];
    const [p1, f1] = KEYS[k + 1];
    if (p <= p1) return f0 + ((p - p0) / (p1 - p0)) * (f1 - f0);
  }
  return KEYS[KEYS.length - 1][1];
};

const FILM_ALT =
  "A white architectural model on a stone site board. It is grown by piling volumes on top and bolting wings onto its sides all at once, until it leans and falls. The site is cleared, a concrete raft and core go in first, and the tower is rebuilt one move at a time: storeys grow up, walls slide in from the sides and hold it straight, and a wing that came up with the growth is lowered away. After three rounds it stands far taller than the one that fell.";

function FocusNav() {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => setPast(window.scrollY > window.innerHeight * 0.5);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="fp-nav">
      <a className="fp-brand" href="#top" aria-label="Scaling Up-Side-Down, back to top">
        <span className="fp-mark" aria-hidden="true">
          <i className="up" />
          <i className="side" />
          <i className="down" />
        </span>
        <span>Scaling Up-Side-Down</span>
      </a>
      <a className={`fp-btn fp-btn-sm${past ? "" : " is-away"}`} href="#join" tabIndex={past ? undefined : -1} aria-hidden={past ? undefined : true}>
        Join the list
      </a>
    </header>
  );
}

function Film() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cv = canvas.current!;
    const sec = section.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    const painter = new FilmPainter(ctx);
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    let lo: FrameStore | null = null;
    let hi: FrameStore | null = null;
    let raf = 0;
    let cur = 0;
    let lastKey = "";
    let lastBmp: ImageBitmap | null = null;
    let scale = 1;
    let disposed = false;
    let onScreen = true;
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    const progress = () => {
      const r = sec.getBoundingClientRect();
      return clamp(-r.top / Math.max(1, r.height - window.innerHeight));
    };
    const resize = () => {
      const r = cv.getBoundingClientRect();
      scale = dpr();
      const w = Math.round(r.width * scale);
      const h = Math.round(r.height * scale);
      if (w !== cv.width || h !== cv.height) {
        cv.width = w;
        cv.height = h;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#e9e1d4";
        ctx.fillRect(0, 0, w, h);
        if (lastBmp) painter.draw(lastBmp, Math.round(cur), w, h, scale);
      }
      lastKey = "";
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();

    const loop = () => {
      raf = 0;
      if (disposed) return;
      const p = progress();
      // the book, then the model: never both at once
      const out = smooth((p - HERO_OUT[0]) / (HERO_OUT[1] - HERO_OUT[0]));
      if (hero.current) {
        hero.current.style.opacity = String(1 - out);
        hero.current.style.transform = reduced ? "" : `translate3d(0, ${(-40 * out).toFixed(1)}px, 0)`;
        hero.current.style.visibility = out >= 1 ? "hidden" : "";
      }
      if (cue.current) cue.current.style.opacity = String(clamp(1 - p / 0.02));
      const film = smooth((p - FILM_IN[0]) / (FILM_IN[1] - FILM_IN[0])) * (1 - smooth((p - FILM_OUT[0]) / (FILM_OUT[1] - FILM_OUT[0])));
      cv.style.opacity = String(film);
      if (!lo) return void (raf = requestAnimationFrame(loop));
      const target = frameAt(p);
      if (!onScreen && Math.abs(target - cur) < 0.01 && lastKey) return;
      raf = requestAnimationFrame(loop);
      const diff = target - cur;
      cur = reduced || !onScreen ? target : Math.abs(diff) < 0.02 ? target : cur + diff * 0.2;
      const i = Math.max(0, Math.min(lo.m.count - 1, Math.round(cur)));
      const dir = Math.sign(diff) || 1;
      const hiHas = !!hi?.blobs[i];
      const sharp = hi?.get(i) ?? null;
      hi?.prefetch(i, dir, small ? 6 : 10);
      const bmp = sharp ?? (hiHas ? hi!.nearest(i, dir, 2) : null) ?? lo.peek(i) ?? lo.get(i) ?? lo.nearest(i, dir) ?? hi?.nearest(i, dir) ?? null;
      if (!hiHas) lo.prefetch(i, dir, 6);
      const exact = !!(sharp || lo.peek(i));
      const key = `${i}:${cv.width}x${cv.height}`;
      if (bmp && (key !== lastKey || bmp !== lastBmp)) {
        painter.draw(bmp, i, cv.width, cv.height, scale);
        lastBmp = bmp;
        lastKey = exact ? key : "";
      }
    };
    const start = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(loop);
    };
    const onScroll = () => start();
    window.addEventListener("scroll", onScroll, { passive: true });
    let sleep = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        window.clearTimeout(sleep);
        if (onScreen) lastKey = "";
        else
          sleep = window.setTimeout(() => {
            lo?.release();
            hi?.release();
          }, 2000);
        start();
      },
      { threshold: [0, 0.01] },
    );
    io.observe(sec);
    start();

    (async () => {
      try {
        const decodeW = Math.min(1600, Math.round(Math.max(window.innerWidth, window.innerHeight * 1.6) * dpr()));
        const hiOpen = FrameStore.open(`${FRAMES}hi/`, small ? 12 : 24, decodeW, () => undefined).catch(() => null);
        const set = await FrameStore.open(`${FRAMES}lo/`, 24, 9999, () => undefined);
        if (disposed) return set.dispose();
        await new Promise((r) => requestAnimationFrame(r));
        const at = Math.round(frameAt(progress()));
        await set.loadChunk(set.chunkOf(at)).catch(() => undefined);
        if (disposed) return;
        void set.loadAll([set.chunkOf(at)], 2);
        set.aim(at);
        await Promise.all(Array.from({ length: 8 }, (_, n) => set.decode(Math.min(set.m.count - 1, at + n))));
        if (disposed) return;
        lo = set;
        cur = at;
        setReady(true);
        start();
        const store = await hiOpen;
        if (disposed) return store?.dispose();
        if (store) {
          hi = store;
          store.aim(at);
          await store.loadAll([store.chunkOf(at)], 2);
        }
      } catch {
        if (!disposed) setReady(true);
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(sleep);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      io.disconnect();
      lo?.dispose();
      hi?.dispose();
    };
  }, []);

  const h = COPY.hero;
  return (
    <section ref={section} className={`fp-film${ready ? " is-ready" : ""}`} id="top">
      <div className="fp-stage">
        <canvas ref={canvas} className="fp-canvas" role="img" aria-label={FILM_ALT} />
        <div className="fp-hero" ref={hero}>
          <figure className="fp-book">
            <img src={BOOK.src} srcSet={BOOK.srcSet} sizes="(max-width: 700px) 56vw, (max-width: 1100px) 300px, 340px" width={BOOK.w} height={BOOK.h} alt={h.cover} decoding="async" fetchPriority="high" draggable={false} />
          </figure>
          <div className="fp-hero-text">
            <p className="fp-kicker">{h.kicker}</p>
            <h1 className="fp-title">
              Scaling
              <br />
              {"Up\u2011Side\u2011Down"}
            </h1>
            <p className="fp-sub">{h.sub}</p>
            <a className="fp-btn" href="#join">
              {h.join}
            </a>
            <p className="fp-free">{h.free}</p>
          </div>
        </div>
        <div className="fp-cue" ref={cue} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </div>
    </section>
  );
}

/** the words, once the film is done: what it showed, named */
function Thesis() {
  const r = COPY.beats.find((b) => b.id === "repeat")!;
  return (
    <section className="fp-thesis" aria-labelledby="fp-thesis-h">
      <p className="fp-kicker">{r.kicker}</p>
      <h2 className="fp-thesis-h" id="fp-thesis-h">
        {r.headline}
      </h2>
      <p className="fp-thesis-d">{r.detail}</p>
    </section>
  );
}

type State = "idle" | "busy" | "sent" | "already" | "bad" | "failed" | "soon";

function SignUp() {
  const b = COPY.closed.block;
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const live = useRef<boolean | null>(null);
  useEffect(() => {
    void optinLive().then((v) => (live.current = v));
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "busy") return;
    if (!validEmail(email)) {
      setState("bad");
      field.current?.focus();
      return;
    }
    if (live.current === false) return setState("soon");
    setState("busy");
    try {
      const r = await sendOptin(email, "home");
      if (!r.emailed && !r.already) return setState("soon");
      setSentTo(email.trim());
      setState(r.already ? "already" : "sent");
    } catch (err) {
      setState(err instanceof Error && err.message === "email" ? "bad" : "failed");
    }
  };
  const done = state === "sent" || state === "already";
  const msg = state === "bad" ? b.badEmail : state === "failed" ? b.sendFailed : state === "soon" ? b.soon : state === "sent" ? b.sentTo.replace("{email}", sentTo) : state === "already" ? b.already : "";
  return (
    <form className={`fp-form is-${state}`} onSubmit={submit} noValidate>
      <label className="fp-label" htmlFor="fp-email">
        {b.email}
      </label>
      <div className="fp-row">
        <input
          ref={field}
          id="fp-email"
          className="fp-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={b.placeholder}
          value={email}
          disabled={done}
          aria-invalid={state === "bad" || undefined}
          aria-describedby="fp-msg"
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "bad" || state === "soon" || state === "failed") setState("idle");
          }}
        />
        <button className="fp-btn" type="submit" disabled={state === "busy" || done} aria-label={done ? (state === "already" ? b.names.joined : b.names.sent) : state === "busy" ? b.names.busy : b.names.join}>
          {state === "busy" ? b.sending : state === "sent" ? b.sent : state === "already" ? b.joined : state === "failed" ? b.tryAgain : "Join the list"}
        </button>
      </div>
      <p className="fp-msg" id="fp-msg" role={state === "bad" || state === "failed" ? "alert" : "status"}>
        {msg}
      </p>
    </form>
  );
}

function Close() {
  const c = COPY.closed;
  return (
    <section className="fp-close" id="join" aria-labelledby="fp-close-h">
      <figure className="fp-close-book">
        <img src={BOOK.src} srcSet={BOOK.srcSet} sizes="(max-width: 700px) 46vw, 300px" width={BOOK.w} height={BOOK.h} alt="" loading="lazy" decoding="async" draggable={false} />
      </figure>
      <div className="fp-close-text">
        <p className="fp-kicker">{c.copy.kicker}</p>
        <h2 className="fp-close-h" id="fp-close-h">
          {c.copy.headline}
        </h2>
        <p className="fp-close-b">{c.book.body}</p>
        <p className="fp-offer">{c.copy.offer}</p>
        <SignUp />
        <p className="fp-links">
          <span className="fp-soon">{c.book.soon}</span>
          <a href={APPENDIX_URL}>{c.block.appendix}</a>
        </p>
      </div>
    </section>
  );
}

function FocusFooter() {
  const top = () => {
    if (lenis && !reduced) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo(0, 0);
    document.querySelector<HTMLElement>(".fp-brand")?.focus({ preventScroll: true });
  };
  return (
    <footer className="fp-foot">
      <p className="fp-foot-line">{COPY.footer.line}</p>
      <button type="button" className="fp-repeat" onClick={top}>
        Repeat <span aria-hidden="true">↑</span>
      </button>
      <div className="fp-foot-bar">
        <span>Scaling Up-Side-Down</span>
        <button type="button" className="fp-notice" onClick={(e) => openNotice(e.currentTarget)}>
          Use notice
        </button>
        <span>© 2026 Michael Wentz</span>
      </div>
    </footer>
  );
}

export function FocusPage() {
  return (
    <div className="fp">
      <FocusNav />
      <main>
        <Film />
        <Thesis />
        <Close />
      </main>
      <FocusFooter />
    </div>
  );
}
