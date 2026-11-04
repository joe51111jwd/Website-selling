// The focus version (/focus): one thing on screen at a time, and the picture needs no words.
//   the book alone → the book makes way for the model → the film (no words at all) → the film makes way
//   for the words, alone, on the same screen → the book and its sign-up
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
/** the same words, typeset: a typewriter apostrophe becomes a real one */
const set = (s: string) => s.replace(/'/g, "’");

// the film section's own scroll, 0-1: the book; its hand-over; the film (frames 0-385, with a few still
// beats); the picture gives way to the words, which hold until the section scrolls on
const HERO_OUT: [number, number] = [0.03, 0.065];
const FILM_IN: [number, number] = [0.06, 0.09];
const FILM_OUT: [number, number] = [0.905, 0.93];
const WORDS_IN: [number, number] = [0.93, 0.955];
const KEYS: [number, number][] = [
  [0.09, 0],
  [0.11, 0], // the small white building, still
  [0.265, 83], // everything piled on at once, to the brink
  [0.285, 86], // a held breath at the tipping point
  [0.37, 140], // it falls
  [0.39, 146], // the wreckage, still
  [0.88, FILM_FRAMES - 1], // cleared; the core; three rounds of up, side and down
  [1, FILM_FRAMES - 1], // the finished tower, still
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
/** how far through the film section the page is, 0-1 */
const filmProgress = (sec: Element | null) => {
  if (!sec) return 0;
  const r = sec.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - window.innerHeight));
};

const FILM_ALT =
  "A white architectural model on a stone site board. It is grown by piling volumes on top and bolting wings onto its sides all at once, until it leans and falls. The site is cleared, a concrete raft and core go in first, and the tower is rebuilt one move at a time: storeys grow up, walls slide in from the sides and hold it straight, and a wing that came up with the growth is lowered away. After three rounds it stands far taller than the one that fell.";

function Mark() {
  // the cover's three blocks, stacked
  return (
    <span className="fp-mark" aria-hidden="true">
      <i className="up" />
      <i className="side" />
      <i className="down" />
    </span>
  );
}

function FocusNav() {
  // the one call to action shows only once the book (which has its own) has gone, and steps aside at the sign-up
  const [show, setShow] = useState(false);
  const [solid, setSolid] = useState(false);
  const btn = useRef<HTMLAnchorElement>(null);
  const brand = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    let atJoin = false;
    const on = () => {
      const film = document.querySelector(".fp-film");
      const p = filmProgress(film);
      const past = p > HERO_OUT[1] || (film ? film.getBoundingClientRect().bottom < window.innerHeight : false);
      setShow(past && !atJoin);
      setSolid(film ? film.getBoundingClientRect().bottom < 72 : false);
    };
    const join = document.getElementById("join");
    const io = new IntersectionObserver(
      ([e]) => {
        atJoin = e.isIntersecting;
        on();
      },
      { threshold: 0.15 },
    );
    if (join) io.observe(join);
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  useEffect(() => {
    // a hidden control never keeps the focus
    if (!show && document.activeElement === btn.current) brand.current?.focus({ preventScroll: true });
  }, [show]);
  return (
    <header className={`fp-nav${solid ? " is-solid" : ""}`}>
      <a className="fp-brand" href="#top" ref={brand} aria-label="Scaling Up-Side-Down, back to top">
        <Mark />
        <span>Scaling Up-Side-Down</span>
      </a>
      <a ref={btn} className={`fp-btn fp-btn-sm${show ? "" : " is-away"}`} href="#join" tabIndex={show ? undefined : -1} aria-hidden={show ? undefined : true}>
        Join the list
      </a>
    </header>
  );
}

function Film() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const heroIn = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);
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
    let lastP = 0;
    let lastKey = "";
    let lastBmp: ImageBitmap | null = null;
    let scale = 1;
    let disposed = false;
    let onScreen = true;
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
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
        if (lastBmp && lastBmp.width) painter.draw(lastBmp, Math.round(cur), w, h, scale); // (a released picture has no width)
      }
      lastKey = "";
      start();
    };
    const ro = new ResizeObserver(resize);
    // a move to a screen with another pixel density changes no CSS size: watch for it too
    let mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDpr = () => {
      mq.removeEventListener("change", onDpr);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener("change", onDpr);
      resize();
    };
    // a phone turned on its side keeps its place in the film
    let lastW = window.innerWidth;
    let turn = 0;
    const onTurn = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      window.clearTimeout(turn);
      const p = lastP;
      turn = window.setTimeout(() => {
        const r = sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight || p <= 0 || p >= 1) return;
        const y = sec.offsetTop + p * (sec.offsetHeight - window.innerHeight);
        lenis?.resize();
        if (lenis) lenis.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      }, 140);
    };

    const loop = () => {
      raf = 0;
      if (disposed) return;
      const p = filmProgress(sec);
      lastP = p;
      // the book, then the model, then the words: never two at once
      const out = smooth((p - HERO_OUT[0]) / (HERO_OUT[1] - HERO_OUT[0]));
      if (hero.current) {
        hero.current.style.opacity = String(1 - out);
        hero.current.style.visibility = out >= 1 ? "hidden" : "";
      }
      if (heroIn.current) heroIn.current.style.transform = reduced ? "" : `translate3d(0, ${(-36 * out).toFixed(1)}px, 0)`;
      if (cue.current) cue.current.style.opacity = String(clamp(1 - p / 0.02));
      const gone = smooth((p - FILM_OUT[0]) / (FILM_OUT[1] - FILM_OUT[0]));
      cv.style.opacity = String(smooth((p - FILM_IN[0]) / (FILM_IN[1] - FILM_IN[0])) * (1 - gone));
      if (stage.current) stage.current.style.backgroundColor = gone > 0 ? `rgb(${Math.round(233 + 8 * gone)},${Math.round(225 + 9 * gone)},${Math.round(212 + 11 * gone)})` : "";
      if (words.current) {
        const w = smooth((p - WORDS_IN[0]) / (WORDS_IN[1] - WORDS_IN[0]));
        words.current.style.opacity = String(w);
        words.current.style.transform = reduced ? "" : `translate3d(0, ${(18 * (1 - w)).toFixed(1)}px, 0)`;
      }
      const store = lo ?? hi;
      if (!store) {
        if (onScreen) raf = requestAnimationFrame(loop);
        return;
      }
      const target = frameAt(p);
      if (!onScreen && Math.abs(target - cur) < 0.01 && lastKey) return;
      raf = requestAnimationFrame(loop);
      const diff = target - cur;
      cur = reduced || !onScreen ? target : Math.abs(diff) < 0.02 ? target : cur + diff * 0.2;
      const i = Math.max(0, Math.min(store.m.count - 1, Math.round(cur)));
      const dir = Math.sign(diff) || 1;
      // the chunk with the frame on screen goes first (after a jump, not wherever the queue had got to)
      if (hi && !hi.blobs[i]) void hi.loadChunk(hi.chunkOf(i)).catch(() => undefined);
      if (lo && !lo.blobs[i]) void lo.loadChunk(lo.chunkOf(i)).catch(() => undefined);
      const hiHas = !!hi?.blobs[i];
      const sharp = hi?.get(i) ?? null;
      hi?.prefetch(i, dir, small ? 6 : 10);
      const bmp = sharp ?? (hiHas ? hi!.nearest(i, dir, 2) : null) ?? lo?.peek(i) ?? lo?.get(i) ?? lo?.nearest(i, dir) ?? hi?.nearest(i, dir) ?? null;
      if (!hiHas) lo?.prefetch(i, dir, 6);
      const exact = !!(sharp || lo?.peek(i));
      const key = `${i}:${cv.width}x${cv.height}`;
      if (bmp && bmp.width && (key !== lastKey || bmp !== lastBmp)) {
        painter.draw(bmp, i, cv.width, cv.height, scale);
        lastBmp = bmp;
        lastKey = exact ? key : "";
      }
    };
    function start() {
      if (!raf && !disposed) raf = requestAnimationFrame(loop);
    }
    // (watching starts here, once the loop exists)
    ro.observe(cv);
    mq.addEventListener("change", onDpr);
    window.addEventListener("resize", onTurn);
    resize();
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
            lastBmp = null;
          }, 2000);
        start();
      },
      { threshold: [0, 0.01] },
    );
    io.observe(sec);
    start();

    (async () => {
      const decodeW = small ? Math.min(1600, Math.round(Math.max(window.innerWidth, window.innerHeight * 1.6) * dpr())) : 1600;
      const hiOpen = FrameStore.open(`${FRAMES}hi/`, small ? 12 : 24, decodeW, () => undefined).catch(() => null);
      const loOpen = FrameStore.open(`${FRAMES}lo/`, 24, 9999, () => undefined).catch(() => null);
      await new Promise((r) => requestAnimationFrame(r));
      const at = Math.round(frameAt(filmProgress(sec)));
      const small1 = await loOpen;
      if (disposed) return small1?.dispose();
      if (small1) {
        await small1.loadChunk(small1.chunkOf(at)).catch(() => undefined);
        if (disposed) return;
        void small1.loadAll([small1.chunkOf(at)], 2);
        small1.aim(at);
        await Promise.all(Array.from({ length: 8 }, (_, n) => small1.decode(Math.min(small1.m.count - 1, at + n))));
        if (disposed) return;
        lo = small1;
        cur = at;
        setReady(true);
        start();
      }
      const store = await hiOpen;
      if (disposed) return store?.dispose();
      if (store) {
        hi = store; // (if the small set failed, the film runs on this one alone)
        store.aim(at);
        if (!lo) cur = at;
        setReady(true);
        start();
        await store.loadAll([store.chunkOf(at)], 2);
      } else if (!lo) setReady(true);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(sleep);
      window.clearTimeout(turn);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onTurn);
      mq.removeEventListener("change", onDpr);
      ro.disconnect();
      io.disconnect();
      lo?.dispose();
      hi?.dispose();
    };
  }, []);

  const h = COPY.hero;
  const r = COPY.beats.find((b) => b.id === "repeat")!;
  return (
    <section ref={section} className={`fp-film${ready ? " is-ready" : ""}`} id="top">
      <div className="fp-stage" ref={stage}>
        <canvas ref={canvas} className="fp-canvas" role="img" aria-label={FILM_ALT} />
        <div className="fp-hero" ref={hero}>
          <div className="fp-hero-in" ref={heroIn}>
            <figure className="fp-book">
              <img src={BOOK.src} srcSet={BOOK.srcSet} sizes="(max-width: 760px) 190px, (max-height: 560px) 150px, 340px" width={BOOK.w} height={BOOK.h} alt={h.cover} decoding="async" fetchPriority="high" draggable={false} />
            </figure>
            <div className="fp-hero-text">
              <p className="fp-kicker">{h.kicker}</p>
              <h1 className="fp-title">
                Scaling
                <br />
                {"Up‑Side‑Down"}
              </h1>
              <p className="fp-sub">{h.sub}</p>
              <a className="fp-btn" href="#join">
                {h.join}
              </a>
              <p className="fp-free">{h.free}</p>
            </div>
          </div>
        </div>
        {/* the words, once the film is done: what it showed, named (on the same screen, after the picture) */}
        <div className="fp-words" ref={words}>
          <p className="fp-kicker">{r.kicker}</p>
          <h2 className="fp-words-h">{set(r.headline)}</h2>
          <p className="fp-words-d">{set(r.detail ?? "")}</p>
        </div>
        <div className="fp-cue" ref={cue} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </div>
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
  const done = state === "sent" || state === "already";
  // the same two controls in every state (never disabled), so the keyboard's place is never lost
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "busy" || done) return;
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
  const msg = state === "bad" ? b.badEmail : state === "failed" ? b.sendFailed : state === "soon" ? b.soon : state === "sent" ? b.sentTo.replace("{email}", sentTo) : state === "already" ? b.already : "";
  const face = state === "busy" ? b.sending : state === "sent" ? b.sent : state === "already" ? b.joined : state === "failed" ? b.tryAgain : "Join the list";
  // the accessible name always begins with what the face says
  const name = state === "busy" ? b.names.busy : state === "sent" ? b.names.sent : state === "already" ? b.names.joined : state === "failed" ? undefined : b.names.join;
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
          readOnly={done}
          aria-disabled={done || undefined}
          aria-invalid={state === "bad" || undefined}
          aria-describedby="fp-msg"
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "bad" || state === "soon" || state === "failed") setState("idle");
          }}
        />
        <button className="fp-btn" type="submit" aria-disabled={state === "busy" || done || undefined} aria-label={name}>
          {face}
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
  const [first, second] = c.copy.offer.split(" · ");
  return (
    <section className="fp-close" id="join" aria-labelledby="fp-close-h">
      <figure className="fp-close-book">
        <img src={BOOK.src} srcSet={BOOK.srcSet} sizes="300px" width={BOOK.w} height={BOOK.h} alt="" loading="lazy" decoding="async" draggable={false} />
      </figure>
      <div className="fp-close-text">
        <p className="fp-kicker">{c.copy.kicker}</p>
        <h2 className="fp-close-h" id="fp-close-h">
          {set(c.copy.headline)}
        </h2>
        <p className="fp-close-b">{c.book.body}</p>
        <p className="fp-offer">
          <span>{first}</span>
          {second && (
            <>
              <span className="fp-dot" aria-hidden="true">
                {" · "}
              </span>
              <span>{second}</span>
            </>
          )}
        </p>
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
        <Close />
      </main>
      <FocusFooter />
    </div>
  );
}
