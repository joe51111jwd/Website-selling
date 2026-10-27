import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import type { SiteCopy } from "../copy";
import { ensureBootloader } from "../bootloader";
import { getCopy, useCopy } from "../copyStore";
import { APPENDIX_URL, FILE_NAME, FILE_URL, downloadFile, optinLive, sendOptin, validEmail, type OptinResult } from "../optin";
import { FrameStore, fetchOk } from "../frames";
import { LINKS } from "../links";
import { BEATS, BOOK_P, BOOTLOADER_P, CL_VH, LIFT, T, blockFit, cb, fmtWords, frameAt, geo, hairEase, hapticPattern, modeNow, poseRect, seqRect, smooth, stampFor, truckRect, type Mode, type Rect } from "../closedloop";
import { CopyButton } from "./CopyButton";
import { CopyBlock } from "./CopyBlock";
import { openNotice } from "./NoticeDialog";

const BASE = import.meta.env.BASE_URL;
const win = typeof window !== "undefined";
const reduced = win && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = win && window.matchMedia("(pointer: coarse)").matches;
const query = win ? new URLSearchParams(window.location.search) : new URLSearchParams();
const asset = (name: string) => `${BASE}closed/${name}`;

// the frame-50 picture's layout fractions (x right, y down)
const [RCX, RCY] = geo.ringC;
const HAIR = geo.hair;
const Q = geo.q.box; // [l, t, r, b]
const QC = [(Q[0] + Q[2]) / 2, (Q[1] + Q[3]) / 2];
const VP = geo.vp;
const TAG = [RCX + HAIR.rx * Math.sin(Math.PI / 6), RCY - HAIR.ry * Math.cos(Math.PI / 6)];

type Ring = "open" | "dropping" | "closed" | "error";
/** how the opt-in ended: emailed, the file itself (no email service), or the file itself (signed up before) */
type Done = "sent" | "yours" | "already";

/** a block of words that fades in and out over a window of the stage's progress */
function Win({ p, at, className = "", children, style }: { p: MotionValue<number>; at: readonly [number, number]; className?: string; children: ReactNode; style?: CSSProperties }) {
  const [a, b] = at;
  const f = Math.min(0.02, (b - a) / 4);
  const stays = b >= 1; // the last one stays up as the stage scrolls away
  const range = stays ? [a, a + f] : [a, a + f, b - f, b];
  const opacity = useTransform(p, range, stays ? [0, 1] : [0, 1, 1, 0]);
  const y = useTransform(p, range, reduced ? range.map(() => 0) : stays ? [24, 0] : [24, 0, 0, -18]);
  const visibility = useTransform(opacity, (o) => (o > 0.05 ? "visible" : "hidden"));
  return (
    <m.div className={`beat cl-beat ${className}`} style={{ ...style, opacity, y, visibility }}>
      {children}
    </m.div>
  );
}

const TriDot = () => (
  <i className="tri" aria-hidden="true">
    <b />
    <b />
    <b />
  </i>
);

export function ClosedLoop({ copy }: { copy: SiteCopy["closed"] }) {
  const { words, bytes } = useCopy();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const hair = useRef<SVGPathElement>(null);
  const digits = useRef<HTMLSpanElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const wave = useRef<HTMLDivElement>(null);
  const beatC = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const leader = useRef<HTMLDivElement>(null);
  const capBook = useRef<HTMLParagraphElement>(null);
  const capRing = useRef<HTMLParagraphElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);

  // ?closed=sent | yours | already | error opens the beat in that state (for checking the page)
  const start = query.get("closed");
  const startDone = start === "sent" || start === "yours" || start === "already" || start === "copied";
  const startResult: Done | null = startDone ? (start === "sent" || start === "already" ? start : "yours") : null;
  const [ring, setRing] = useState<Ring>(startDone ? "closed" : start === "error" ? "error" : "open");
  const [armed, setArmed] = useState(false);
  const [press, setPress] = useState(false);
  const [instant, setInstant] = useState(start != null);
  const [after, setAfter] = useState(startDone);
  const [result, setResult] = useState<Done | null>(startResult);
  const [fieldErr, setFieldErr] = useState<"" | "email" | "send">(start === "error" ? "send" : "");
  const [sentTo, setSentTo] = useState("");
  const mailLive = useRef<boolean | null>(null); // is an email service connected (api/optin)
  const [cbLoad, setCbLoad] = useState<false | "hi" | "lo">(false);
  const blockW = useRef(320); // the COPY block's width, from the last layout
  const live = useRef(false); // the copy beat is up
  const now = useRef<Ring>(ring);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const inView = useRef(false);
  const pressTimer = useRef(0);
  const startXY = useRef<[number, number] | null>(null);

  const { scrollYProgress: p } = useScroll({ target: section, offset: ["start start", "end end"] });
  // Quality is lowered over its gap as the ring is finished (.45-.462)
  const lower = useTransform(p, [0.45, 0.462], [0, 1]);
  const railShow = useTransform(p, [0, 0.02, 0.44, 0.47], [0, 1, 1, 0]);
  // the layers over the picture (Quality, the line, the tag) belong to the finished ring
  const plateIn = useTransform(p, [0.445, 0.452], [0, 1]);
  const plateVis = useTransform(plateIn, (o) => (o > 0.5 ? "visible" : "hidden"));
  const railFill = useTransform(p, [0, 0.47], [0, 1]);
  const [narrow] = useState(() => win && window.innerWidth > 900 && window.innerWidth <= 1200);
  const scrim = useTransform(p, narrow ? [0, 0.44, 0.47] : [0, 0.42, 0.46], narrow ? [1, 1, 0] : [1, 1, 0]);

  const go = (r: Ring) => {
    now.current = r;
    setRing(r);
  };
  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    cancelAnimationFrame(raf.current);
  };
  useEffect(() => () => clearTimers(), []);

  // the block's face (data-face) and its count are written by hand, so the ritual never re-renders.
  // Its accessible name starts with the words on its face.
  type Face = "copy" | "wait" | "count" | "sent" | "yours" | "already" | "error";
  const faceNow = useRef<Face>("copy");
  const face = (k: Face) => {
    faceNow.current = k;
    const el = btn.current;
    if (!el) return;
    el.dataset.face = k === "already" ? "yours" : k; // the same green face; its name says why
    const n = getCopy().words;
    const N = copy.block.names;
    const say = k === "copy" && mailLive.current === false ? "file" : k; // no email service: the click is the file
    const name = say === "wait" || say === "count" ? N.busy : n ? N[say].replace("{n}", fmtWords(n)) : N[`${say}NoCount`];
    el.setAttribute("aria-label", name);
  };
  useEffect(() => face(faceNow.current), [words]); // eslint-disable-line react-hooks/exhaustive-deps
  const body = () => btn.current?.querySelector<HTMLElement>(".cb-body") ?? null;
  // fixed slots, right-aligned like the final number, so the digits never jostle; only changes are written
  const writeCount = (n: number) => {
    const el = digits.current;
    const final = getCopy().words;
    if (!el || !final) return;
    const target = fmtWords(final);
    if (el.childElementCount !== target.length)
      el.replaceChildren(
        ...[...target].map((ch) => {
          const i = document.createElement("i");
          if (ch === ",") i.className = "c";
          return i;
        }),
      );
    const str = fmtWords(Math.min(n, final)).padStart(target.length, " ");
    for (let k = 0; k < str.length; k++) {
      const c = str[k] === " " ? "" : str[k];
      const i = el.children[k];
      if (i.textContent !== c) i.textContent = c;
    }
  };
  useLayoutEffect(() => {
    face(startResult ?? (start === "error" ? "error" : "copy"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // each copy gets a number; an answer that arrives after a newer copy began changes nothing
  const gen = useRef(0);
  const inFlight = useRef<Promise<OptinResult> | null>(null);
  const handing = useRef(false); // focus is being handed to the block by the page, not by the visitor

  // the hairline closes around the ring while the count runs up to the file's real size
  const sweep = (ms: number, onDone: () => void) => {
    cancelAnimationFrame(raf.current);
    const path = hair.current;
    const n = getCopy().words;
    const t0 = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / ms);
      const e = hairEase(t);
      if (path) path.style.strokeDashoffset = String(1 - e);
      if (n) writeCount(Math.round(n * e));
      if (t < 1) raf.current = requestAnimationFrame(step);
      else onDone();
    };
    step();
  };

  // the line meets itself: the block turns green (Sent, or Yours when the file came straight down);
  // the page says how to use it
  const seal = (r: OptinResult, fresh: boolean) => {
    const k: Done = r.emailed ? "sent" : r.already ? "already" : "yours";
    face(k);
    // the field gives way to the status: a focus in it moves to the block, never to the page
    if (field.current && document.activeElement === field.current) {
      handing.current = true;
      btn.current?.focus({ preventScroll: true });
      handing.current = false;
    }
    setResult(k);
    if (fresh)
      later(reduced ? 0 : T.swapAfterSeal, () => {
        go("closed");
        setAfter(true);
      });
  };
  const close = (r: OptinResult, fresh: boolean, ticks: boolean) => {
    if (reduced) return seal(r, fresh);
    const g = gen.current;
    face("count");
    writeCount(0);
    if (ticks) navigator.vibrate?.(hapticPattern(false)); // the answer came late: the ticks start with the line
    sweep(fresh ? T.hairMs : T.againMs, () => g === gen.current && seal(r, fresh));
  };
  const shake = () =>
    body()?.animate(
      [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(3px)" }, { transform: "none" }],
      { duration: T.shake, easing: "ease-out" },
    );
  // the address is missing or wrong: no ritual, the field says so
  const refuse = () => {
    setFieldErr("email");
    setPress(false);
    if (!reduced) shake();
    field.current?.focus({ preventScroll: true });
  };
  const fail = (e: unknown) => {
    clearTimers();
    navigator.vibrate?.(0);
    if (hair.current) hair.current.style.strokeDashoffset = ""; // back to the open ring's
    if (e instanceof Error && e.message === "email") {
      go("open");
      face("copy");
      return refuse();
    }
    go("error");
    face("error");
    setFieldErr("send");
    if (!reduced) later(T.shakeDelay, shake);
    const g = gen.current;
    later(T.errorMs, () => g === gen.current && now.current === "error" && face("copy"));
  };

  // the moment both blocks touch down: the end of the COPY block's own fall, not a guess at it
  const landing = () =>
    new Promise<void>((res) => {
      requestAnimationFrame(() => {
        const pose = btn.current?.querySelector(".cb-pose");
        const fall = pose?.getAnimations().find((a) => (a as CSSTransition).transitionProperty === "scale");
        if (fall) fall.finished.then(() => res(), () => res());
        else later(T.fall - 16, res);
      });
    });

  // the landing: the COPY block and Quality touch down on the same frame
  const impact = (own: boolean, resolved: boolean) => {
    const st = stage.current;
    st?.classList.remove("is-thud");
    void st?.offsetWidth;
    st?.classList.add("is-thud");
    body()?.animate([{ transform: "scale(1)" }, { transform: "scale(0.988)" }, { transform: "scale(1)" }], { duration: 80, easing: "ease-out" });
    wave.current?.animate(
      [
        { transform: "scale(1)", opacity: 0.32 },
        { transform: "scale(1.5)", opacity: 0 },
      ],
      { duration: T.wave, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    );
    if (own) navigator.vibrate?.(resolved ? hapticPattern(true) : 10);
    if (resolved) {
      face("count");
      writeCount(0);
    } else face("wait"); // the file is still on its way: the clipboard is waiting for it
  };

  // once the loop is closed, the block hands over the file itself: a small lift and set, the count run again
  const again = () => {
    const g = ++gen.current;
    clearTimers();
    if (hair.current) hair.current.style.strokeDashoffset = "0";
    const st = stage.current;
    st?.classList.remove("is-again");
    void st?.offsetWidth;
    st?.classList.add("is-again");
    const end: Face = result === "already" ? "already" : "yours";
    if (reduced) return face(end);
    body()?.animate([{ transform: "scale(1)" }, { transform: "scale(1.045)", offset: 0.45 }, { transform: "scale(1)" }], { duration: T.againLift, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)" });
    btn.current?.querySelector(".cb-shd.lift")?.animate([{ opacity: 0 }, { opacity: 0.5 }, { opacity: 0 }], { duration: T.againLift });
    navigator.vibrate?.(10);
    face("count");
    writeCount(0);
    sweep(T.againMs, () => g === gen.current && face(end));
  };

  // the opt-in: both blocks fall into place, the ring closes, the block turns green
  const ritual = (prom: Promise<OptinResult>, own: boolean) => {
    setPress(false);
    setArmed(false); // a mouse resting on the block does not lift it again over the payoff
    setInstant(false);
    const g = ++gen.current;
    const ok = () => g === gen.current;
    clearTimers();
    if (reduced) {
      face("wait");
      prom.then(
        (r) => ok() && close(r, true, false),
        (e) => ok() && fail(e),
      );
      return;
    }
    let resolved = false;
    let ticked = false;
    prom.then(
      () => void (resolved = true),
      () => {},
    );
    go("dropping");
    const landed = landing();
    landed.then(() => {
      if (!ok() || now.current !== "dropping") return;
      ticked = own && resolved;
      impact(own, resolved);
    });
    Promise.all([landed, prom]).then(
      ([, r]) => ok() && later(T.hairStart - T.fall, () => ok() && close(r, true, own && !ticked)),
      (e) => ok() && fail(e),
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPress(false); // a key or a press never leaves the block held down
    if (inFlight.current || now.current === "dropping") return; // already on its way
    window.clearTimeout(pressTimer.current);
    if (now.current === "closed") {
      downloadFile(); // from the click itself, so every browser lets it through
      return again();
    }
    const email = field.current?.value ?? "";
    if (!validEmail(email)) return refuse();
    setFieldErr("");
    setSentTo(email.trim());
    let prom: Promise<OptinResult>;
    if (mailLive.current === false) {
      downloadFile(); // no email service connected yet: the file itself, now, from the click
      prom = Promise.resolve({ emailed: false });
    } else
      // not known, or connected: the answer decides. Not emailed (no service after all, or signed up
      // before, so it won't be sent again): the file itself, as soon as that's known
      prom = sendOptin(email, "home").then((r) => {
        if (!r.emailed) downloadFile();
        return r;
      });
    inFlight.current = prom;
    const done = () => {
      if (inFlight.current === prom) inFlight.current = null;
    };
    prom.then(done, done);
    ritual(prom, true);
  };

  // the press: at once for a mouse or a key, after 80ms of stillness for a finger (a scroll never presses)
  const down = (e: RPointerEvent) => {
    if (e.pointerType === "mouse") {
      if (e.button === 0) setPress(true);
      return;
    }
    startXY.current = [e.clientX, e.clientY];
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      setPress(true);
      setArmed(true);
    }, 80);
  };
  const cancel = () => {
    window.clearTimeout(pressTimer.current);
    startXY.current = null;
    setPress(false);
    if (coarse) setArmed(false);
  };
  const move = (e: RPointerEvent) => {
    const s0 = startXY.current;
    if (s0 && Math.hypot(e.clientX - s0[0], e.clientY - s0[1]) > 8) cancel();
  };
  const up = () => {
    window.clearTimeout(pressTimer.current);
    startXY.current = null;
    window.setTimeout(() => {
      setPress(false);
      if (coarse) setArmed(false);
    }, 350);
  };
  const key = (e: KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) setPress(true);
  };
  const keyUp = () => setPress(false);
  const hover = (on: boolean) => () => !coarse && setArmed(on);
  const press$ = { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: cancel };

  // the cursor tag that follows a fine pointer over Quality
  const onBlockMove = (e: RPointerEvent) => {
    move(e);
    const c = cursor.current;
    if (c && e.pointerType === "mouse") c.style.transform = `translate3d(${e.clientX + 14}px, ${e.clientY + 14}px, 0)`;
  };

  // the nav's copy button steps aside while this one is on screen
  const cIn = useTransform(p, [BEATS.copy[0], BEATS.copy[0] + 0.02, BEATS.copy[1] - 0.02, BEATS.copy[1]], [0, 1, 1, 0]);
  useMotionValueEvent(cIn, "change", (o) => {
    live.current = o > 0.5;
    if (o > 0.5) document.documentElement.dataset.stamp = "";
    else delete document.documentElement.dataset.stamp;
  });
  useEffect(() => () => void delete document.documentElement.dataset.stamp, []);

  // ---------- the picture ----------
  useEffect(() => {
    document.documentElement.style.setProperty("--seam", geo.seam); // the floor colour measured from the renders
    const cv = canvas.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    let lo: FrameStore | null = null;
    let hi: FrameStore | null = null;
    let pano: ImageBitmap | null = null;
    let started = false;
    let disposed = false;
    let onScreen = false;
    let loop = 0;
    let cur = frameAt(p.get());
    let lastKey = "";
    let dpr = 1;
    let mode: Mode = modeNow();
    let vw = cv.clientWidth || window.innerWidth;
    let vh = cv.clientHeight || window.innerHeight;
    let pose: Rect = poseRect(vw, vh, mode);

    const seam = geo.seam.match(/\w\w/g)!.map((h) => parseInt(h, 16)).join(",");
    const edge = (x0: number, y0: number, x1: number, y1: number, x: number, y: number, w: number, h: number, alpha: number) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, `rgba(${seam},${alpha})`);
      g.addColorStop(1, `rgba(${seam},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    };
    /** paper over everything outside rect r, softened into it (blocks can sit on an edge, so no stretching) */
    const paper = (r: Rect, alpha: number) => {
      if (alpha <= 0.002) return;
      const cw = cv.width;
      const ch = cv.height;
      const { ox, oy, dw, dh } = r;
      const fy = 0.08 * dh;
      const fx = 0.14 * dw; // the ring sits in the middle half, so the sides can fade a long way
      ctx.fillStyle = `rgba(${seam},${alpha})`;
      if (oy > 0.5) ctx.fillRect(0, 0, cw, oy);
      if (oy + dh < ch - 0.5) ctx.fillRect(0, oy + dh, cw, ch - oy - dh);
      if (ox > 0.5) ctx.fillRect(0, Math.max(0, oy), ox, Math.min(ch, oy + dh) - Math.max(0, oy));
      if (ox + dw < cw - 0.5) ctx.fillRect(ox + dw, Math.max(0, oy), cw - ox - dw, Math.min(ch, oy + dh) - Math.max(0, oy));
      if (oy > 0.5) edge(0, oy, 0, oy + fy, ox, oy, dw, fy, alpha);
      if (oy + dh < ch - 0.5) edge(0, oy + dh, 0, oy + dh - fy, ox, oy + dh - fy, dw, fy, alpha);
      if (ox > 0.5) edge(ox, 0, ox + fx, 0, ox, oy, fx, dh, alpha);
      if (ox + dw < cw - 0.5) edge(ox + dw, 0, ox + dw - fx, 0, ox + dw - fx, oy, fx, dh, alpha);
    };

    const scaled = (r: Rect): Rect => ({ ox: r.ox * dpr, oy: r.oy * dpr, dw: r.dw * dpr, dh: r.dh * dpr });
    /** start each picture on clean paper, so a picture's soft edge never shows a sliver of the one before */
    const clear = () => {
      ctx.fillStyle = geo.seam;
      ctx.fillRect(0, 0, cv.width, cv.height);
    };
    let tagW = 0;

    const placePlate = (r: Rect) => {
      const el = plate.current;
      if (!el) return;
      el.style.transform = `translate3d(${r.ox.toFixed(1)}px, ${r.oy.toFixed(1)}px, 0) scale(${(r.dw / pose.dw).toFixed(4)})`;
      const cb = capBook.current;
      const cr = capRing.current;
      if (cb && cr) {
        const bx = r.ox + geo.book.c[0] * r.dw;
        const by = r.oy + geo.book.base[1] * r.dh;
        cb.style.transform = `translate3d(${bx.toFixed(1)}px, ${(by + 34).toFixed(1)}px, 0) translateX(-50%)`;
        const rx = r.ox + RCX * r.dw;
        const ry = r.oy + (RCY + HAIR.ry) * r.dh;
        cr.style.transform = `translate3d(${rx.toFixed(1)}px, ${(ry + 20).toFixed(1)}px, 0) translateX(-50%)`;
      }
      // the tag rides the line at one o'clock at its own type size, and turns left if it would run off the screen
      const t = tag.current;
      if (t) {
        const tx = r.ox + TAG[0] * r.dw;
        const ty = r.oy + TAG[1] * r.dh;
        tagW ||= (t.lastElementChild as HTMLElement | null)?.offsetWidth ?? 190;
        const left = tx + 80 + tagW > vw - 16;
        t.classList.toggle("side-left", left);
        t.classList.toggle("side-right", !left);
        t.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
      }
    };

    let blob: Blob | null = null;
    const frame = () => {
      loop = 0;
      if (disposed || !lo) return;
      const v = p.get();
      const target = frameAt(v);
      if (!onScreen && cur === target && lastKey) return; // off screen: drawn once, then asleep
      const diff = target - cur;
      cur = reduced || !onScreen || Math.abs(diff) < 0.02 ? target : cur + diff * 0.2;
      const cw = vw;
      const ch = vh;
      if (v >= 0.45 && pano) {
        // frame 50 is the panorama's middle, so the hand-over is seamless. At the copy pose the paper
        // hides the panorama's far ends; it gives way as the camera starts to slide.
        const tv = reduced ? (mode !== "desk" ? (v < 0.82 ? 0.74 : 0.87) : v < 0.77 ? 0.74 : v < 0.89 ? 0.83 : 0.92) : v;
        const r = v < 0.74 ? pose : truckRect(tv, cw, ch, mode);
        const a = reduced ? (v < 0.77 ? 1 : 0) : 1 - smooth((v - 0.74) / 0.03);
        const k = `p${r.ox.toFixed(1)}:${r.oy.toFixed(1)}:${r.dw.toFixed(1)}:${a.toFixed(3)}:${cv.width}x${cv.height}`;
        if (k !== lastKey) {
          const s = scaled(r);
          // the panorama spans frame-50 x -0.95..1.10 and y -0.25..1.25
          const ps = { ox: s.ox - 0.95 * s.dw, oy: s.oy - 0.25 * s.dh, dw: 2.05 * s.dw, dh: 1.5 * s.dh };
          clear();
          ctx.drawImage(pano, ps.ox, ps.oy, ps.dw, ps.dh);
          paper(ps, 1);
          paper(s, a);
          lastKey = k;
        }
        placePlate(r);
      } else {
        const i = Math.max(0, Math.min(lo.m.count - 1, Math.round(cur)));
        const dir = Math.sign(diff) || 1;
        hi?.prefetch(i, dir, small ? 6 : 10);
        const bmp = hi?.get(i) ?? (hi?.blobs[i] ? hi.nearest(i, dir, 2) : null) ?? lo.peek(i) ?? lo.get(i) ?? lo.nearest(i, dir) ?? null;
        if (!hi?.blobs[i]) lo.prefetch(i, dir, 6);
        const r = v >= 0.45 ? pose : seqRect(i, cw, ch, mode);
        const k = `s${i}:${cv.width}x${cv.height}:${!!hi?.peek(i)}:${r.ox.toFixed(1)}:${r.dw.toFixed(1)}`;
        if (bmp && k !== lastKey) {
          const sr = scaled(r);
          clear();
          ctx.drawImage(bmp, sr.ox, sr.oy, sr.dw, sr.dh);
          paper(sr, 1);
          lastKey = k;
        }
        placePlate(pose);
      }
      // keep going only while the picture is still catching up with the scroll
      if (onScreen && cur !== target) loop = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!loop && !disposed) loop = requestAnimationFrame(frame);
    };
    const unsub = p.on("change", kick);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      mode = modeNow();
      vw = cv.clientWidth || window.innerWidth;
      vh = cv.clientHeight || window.innerHeight;
      pose = poseRect(vw, vh, mode);
      const w = Math.round(cv.clientWidth * dpr);
      const h = Math.round(cv.clientHeight * dpr);
      if (w !== cv.width || h !== cv.height) {
        cv.width = w;
        cv.height = h;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = geo.seam;
        ctx.fillRect(0, 0, w, h);
      }
      const el = plate.current;
      if (el) {
        el.style.width = `${pose.dw}px`;
        el.style.height = `${pose.dh}px`;
      }
      // the line is drawn in the picture's units (1000 tall): 1.2px on screen at the copy pose
      if (hair.current) hair.current.style.strokeWidth = String((1.2 * 1000) / pose.dh);
      tagW = 0;
      lastKey = "";
      cancelAnimationFrame(loop);
      frame(); // repaint now, so a resize never shows a blank canvas
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();
    // moving the window to a screen with another pixel ratio
    let mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDpr = () => {
      resize();
      mq.removeEventListener("change", onDpr);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener("change", onDpr);
    };
    mq.addEventListener("change", onDpr);

    const decodePano = async () => {
      if (!blob || pano) return;
      const maxDw = Math.max(window.innerWidth, window.innerHeight) * 2.2;
      const w = Math.min(3280, Math.round(2.05 * maxDw * Math.min(dpr, 1.75)));
      const bmp = await createImageBitmap(blob, { resizeWidth: w, resizeHeight: Math.round((w * 1500) / 3280), resizeQuality: "high" });
      if (disposed || pano) return bmp.close();
      pano = bmp;
      lastKey = "";
      kick();
    };

    // nothing loads until the visitor is about three screens away (or lands here from a link)
    const load = async () => {
      if (started) return;
      started = true;
      ensureBootloader("high").catch(() => {});
      void optinLive().then((v) => {
        mailLive.current = v; // null: not known (the ask failed), so a submit asks the function itself
        face(faceNow.current);
      });
      setCbLoad(LIFT * blockW.current * Math.min(window.devicePixelRatio || 1, 3) > 700 ? "hi" : "lo");
      try {
        if (!lo) {
          const decodeW = Math.min(1600, Math.round(Math.max(window.innerWidth, window.innerHeight * 1.6) * dpr));
          const hiOpen = FrameStore.open(asset("hi/"), small ? 12 : 24, decodeW, kick).catch(() => null);
          const store = await FrameStore.open(asset("lo/"), 24, 9999, kick);
          if (disposed) return store.dispose();
          lo = store;
          const at = Math.round(frameAt(p.get()));
          await lo.loadChunk(lo.chunkOf(at)).catch(() => undefined);
          void lo.loadAll([lo.chunkOf(at)], 2);
          kick();
          hi = await hiOpen;
          if (disposed) return hi?.dispose();
          if (hi) void hi.loadAll([hi.chunkOf(Math.min(hi.m.count - 1, at))], 2);
        }
        blob ??= await (await fetchOk(asset(geo.files.pano))).blob();
        await decodePano();
      } catch {
        started = false; // try again (the panorama only) next time it comes near
      }
    };
    const near = new IntersectionObserver(([e]) => e.isIntersecting && void load(), { rootMargin: "0px 0px 300% 0px" });
    near.observe(section.current!);
    // off screen for a while: let go of the decoded pictures (phones run short of memory); they decode again on return
    let sleep = 0;
    let deepSleep = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.intersectionRatio > 0;
        inView.current = onScreen;
        window.clearTimeout(sleep);
        window.clearTimeout(deepSleep);
        if (onScreen) {
          void decodePano().catch(() => undefined);
          lastKey = "";
        } else {
          sleep = window.setTimeout(() => {
            lo?.release();
            hi?.release();
          }, 2000);
          deepSleep = window.setTimeout(() => {
            pano?.close();
            pano = null;
          }, 20000);
        }
        kick();
      },
      { threshold: [0, 0.01] },
    );
    io.observe(cv);
    return () => {
      disposed = true;
      cancelAnimationFrame(loop);
      window.clearTimeout(sleep);
      window.clearTimeout(deepSleep);
      unsub();
      ro.disconnect();
      near.disconnect();
      io.disconnect();
      mq.removeEventListener("change", onDpr);
      lo?.dispose();
      hi?.dispose();
      pano?.close();
    };
  }, [p]);

  // the COPY block's size, and on desktop its face level with Quality's, a fine line joining them.
  // Runs on mount, on resizes of the stage or the column, and once the fonts are in; never on scroll.
  const placeRef = useRef<() => void>(() => {});
  const wBefore = useRef(Infinity); // the block's width before the opt-in
  useLayoutEffect(() => {
    const st = stage.current;
    const c = beatC.current;
    const place = () => {
      const b = btn.current;
      const l = leader.current;
      if (!st || !c || !b || !l) return;
      const cw = st.clientWidth;
      const ch = st.clientHeight;
      const canvasMode = modeNow();
      // a desk window too short for the column takes the words the way a phone on its side does
      const mode: Mode = canvasMode === "desk" && ch < 520 ? "land" : canvasMode;
      c.dataset.mode = mode;
      const put = (W: number, gapb: number) => {
        const { big, small } = stampFor(W);
        blockW.current = W;
        c.style.setProperty("--cbw", `${W.toFixed(1)}px`);
        c.style.setProperty("--big", `${big}px`);
        c.style.setProperty("--small", `${small}px`);
        c.style.setProperty("--gapb", `${gapb}px`);
        c.style.setProperty("--cbml", `${(0.04 * W).toFixed(1)}px`);
        c.style.setProperty("--rowsw", `${(LIFT * W).toFixed(1)}px`);
        // the stamp's small line stays inside the face whatever the face says (and before its type is in)
        const face = b.querySelector<HTMLElement>(".cb-face");
        const wide = Math.max(0, ...[...b.querySelectorAll<HTMLElement>(".cb-small > b")].map((e) => e.offsetWidth));
        if (face && wide > 0.92 * face.offsetWidth) c.style.setProperty("--small", `${Math.floor((small * 0.92 * face.offsetWidth) / wide)}px`);
      };
      c.classList.remove("is-tight", "is-tighter", "is-tightest", "is-snug", "is-clamp", "is-bare");
      c.style.removeProperty("--stl");
      delete st.dataset.fit; // measure with the headline showing
      if (mode !== "desk") {
        c.style.top = "";
        c.style.width = "";
        c.style.maxWidth = "";
        l.style.display = "none";
        // everything in the column but the block, then the block takes what is left above the rows
        const rest = () => c.offsetHeight - b.offsetHeight - (parseFloat(getComputedStyle(b).marginTop) || 0);
        const colW = c.clientWidth;
        let room: number;
        if (mode === "phone") {
          const r = poseRect(cw, ch, "phone");
          const below = parseFloat(getComputedStyle(c).bottom) || 14;
          room = ch - below - (r.oy + (RCY + HAIR.ry) * r.dh + 8); // under the ring's line
        } else room = ch - 14 - c.offsetTop;
        // the two headlines (before, after): only the one showing takes up room
        const after = st.hasAttribute("data-after");
        const h = (k: "a" | "b") => c.querySelector<HTMLElement>(`.cl-head > .${k}`)?.offsetHeight ?? 0;
        const [ha, hb] = [h("a"), h("b")];
        const fit = (floor?: number) => blockFit(mode, colW, room, rest(), ch, Infinity, floor);
        // room for the longer headline, so the block stays put when they swap
        let f = blockFit(mode, colW, room, rest() - (after ? hb : ha) + Math.max(ha, hb), ch);
        if (f.short) f = fit(); // then this state's own: the block resizes at the swap
        if (f.short) {
          c.classList.add("is-snug"); // before the opt-in the Appendix link steps aside; after it, the field's spare line
          f = fit();
        }
        if (f.short && after) {
          f = fit(0.5); // after it: the block may be smaller, its work done
          if (f.short) {
            c.classList.add("is-clamp"); // a long status keeps two lines, cut at the end (all of it is spoken)
            f = fit(0.5);
            if (f.short) {
              c.style.setProperty("--stl", "1"); // then one
              f = fit(0.5);
            }
          }
          if (f.short) {
            c.classList.add("is-bare"); // and the status line is only spoken
            f = fit(0.5);
          }
        }
        put(c.classList.contains("is-bare") ? Math.min(f.W, wBefore.current) : f.W, f.gapb); // never larger than it was
        if (!after) wBefore.current = f.W;
        if (f.short) st.dataset.fit = "short";
        return;
      }
      const r = poseRect(cw, ch, "desk");
      const gut = c.offsetLeft;
      const ringLeft = r.ox + (RCX - HAIR.rx) * r.dw;
      const colW = Math.max(280, Math.min(500, 0.35 * cw, ringLeft - 16 - gut));
      c.style.maxWidth = "";
      c.style.width = `${colW}px`;
      const f = blockFit("desk", colW, 0, 0, ch, ringLeft - gut - 96);
      put(f.W, f.gapb);
      // a short window: the follow line goes first, then the kicker, then the block gives way
      const room = ch - 96 - 14;
      if (c.offsetHeight > room) c.classList.add("is-tight");
      if (c.offsetHeight > room) c.classList.add("is-tighter");
      const over = c.offsetHeight - room;
      if (over > 0) put(Math.max(180, Math.min(f.W, f.W - (over - (f.gapb - 28)) / cb.bodyAR)), 28); // the gap still holds the message
      const qy = r.oy + QC[1] * r.dh;
      const qx = r.ox + Q[0] * r.dw;
      const faceC = () => b.offsetTop + (cb.face[1] + cb.face[3] / 2) * b.offsetHeight;
      // the face level with Quality's: the column may rise to just under the menu, and if that is
      // still not high enough, the kicker and then the deck step aside
      const lo = Math.ceil((document.querySelector(".nav")?.getBoundingClientRect().bottom ?? 56) + 8);
      const want = () => qy - faceC();
      if (want() < lo) {
        const kicker = c.classList.contains("is-tighter"); // already gone for a short window
        const only = (k: boolean, d: boolean) => {
          c.classList.toggle("is-tighter", k || kicker);
          c.classList.toggle("is-tightest", d);
          return want() >= lo;
        };
        // the kicker, else the deck, else both; if even that cannot line up, keep the words
        if (!only(true, false) && !only(false, true) && !only(true, true)) only(false, false);
      }
      const top = Math.max(Math.min(want() >= lo ? lo : 96, ch - c.offsetHeight - 14), Math.min(ch - c.offsetHeight - 24, want()));
      c.style.top = `${top}px`;
      const x0 = c.offsetLeft + b.offsetLeft + (b.offsetWidth * (1 + LIFT)) / 2 + 12;
      const x1 = qx - 16;
      const ok = Math.abs(top + faceC() - qy) <= 8 && x1 - x0 >= 24 && x1 - x0 <= 320;
      l.style.display = ok ? "" : "none";
      l.style.left = `${x0}px`;
      l.style.top = `${qy}px`;
      l.style.width = `${x1 - x0}px`;
    };
    placeRef.current = place;
    place();
    const ro = new ResizeObserver(place);
    if (st) ro.observe(st);
    if (c) ro.observe(c);
    // the stamp's type arriving (or the count) changes how wide its lines are
    const small = btn.current?.querySelector(".cb-small");
    if (small) ro.observe(small);
    void document.fonts?.ready.then(place);
    return () => ro.disconnect();
  }, []);
  // the opt-in changes what the column holds (the headline, the status, the rows): fit it again at once
  useLayoutEffect(() => placeRef.current(), [after, result, fieldErr]);

  const book = copy.book;
  const rowsState = ring === "error" ? "error" : after ? "after" : "before";
  const kb = bytes ? `${Math.round(bytes / 1024)} KB` : "";
  const qStyle = { left: `${Q[0] * 100}%`, top: `${Q[1] * 100}%`, width: `${(Q[2] - Q[0]) * 100}%`, height: `${(Q[3] - Q[1]) * 100}%`, transformOrigin: `${((VP[0] - Q[0]) / (Q[2] - Q[0])) * 100}% ${((VP[1] - Q[1]) / (Q[3] - Q[1])) * 100}%` };
  const layer = (name: "q_block" | "q_shd_rest" | "q_shd_lift") => {
    const [l, t, w, h] = geo.layers[name];
    return { left: `${l * 100}%`, top: `${t * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` };
  };
  const hairD = (() => {
    const cx = RCX * 1600;
    const cy = RCY * 1000;
    const rx = HAIR.rx * 1600;
    const ry = HAIR.ry * 1000;
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;
  })();

  // the beats that never change with the copy are made once, so the swap at the payoff re-renders little
  const earlyBeats = useMemo(
    () => (
      <>
        <Win p={p} at={BEATS.open} className="tone-down">
          <p className="beat-k">
            <i />
            {copy.open.kicker}
          </p>
          <h2 className="beat-h">{copy.open.headline}</h2>
        </Win>
        <Win p={p} at={BEATS.closing} className="tone-ink">
          <p className="beat-k">
            <TriDot />
            {copy.closing.kicker}
          </p>
          <h2 className="beat-h">{copy.closing.headline}</h2>
          <p className="beat-d">{copy.closing.detail}</p>
        </Win>
      </>
    ),
    [p, copy],
  );
  const laterBeats = useMemo(
    () => (
      <>
        <Win p={p} at={BEATS.pair} className="cl-pair desk-only">
          <p ref={capBook} className="cl-cap">
            {copy.pair.book}
          </p>
          <p ref={capRing} className="cl-cap">
            {copy.pair.file}
          </p>
        </Win>
        <Win p={p} at={BEATS.mini} className="cl-mini phone-only">
          <p>
            {copy.pair.book} {copy.pair.file}
          </p>
        </Win>

        <Win p={p} at={BEATS.book} className="cl-book">
          <p className="beat-k">
            <i className="dot down" />
            {book.kicker}
          </p>
          <div className="beat-q">
            <img src={`${BASE}michael.jpg`} alt="" width="40" height="40" loading="lazy" decoding="async" />
            <p>
              {book.quote}
              <span>{book.sign}</span>
            </p>
          </div>
          <h2 className="beat-h">{book.headline}</h2>
          {LINKS.preorder ? (
            <a className="btn" href={LINKS.preorder} target="_blank" rel="noopener">
              {book.button}
            </a>
          ) : (
            <p className="soon">
              <i className="dot down" />
              {book.soon}
            </p>
          )}
        </Win>

        <m.ol className="chapters cl-rail" style={{ opacity: railShow }} aria-hidden="true">
          {["Too fast", "Falls over", "Foundation"].map((n) => (
            <li key={n}>
              <span>{n}</span>
              <i>
                <b />
              </i>
            </li>
          ))}
          <li>
            <span>Closed loop</span>
            <i>
              <m.b style={{ scaleX: railFill }} />
            </i>
          </li>
        </m.ol>
      </>
    ),
    [p, copy, railShow, railFill],
  );

  return (
    <section ref={section} className="cl" id="closed" style={{ height: `${CL_VH}vh` }} aria-labelledby="cl-h">
      <i className="cl-mark" id="bootloader" tabIndex={-1} style={{ top: `calc(${BOOTLOADER_P} * (100% - 100vh))` }} />
      <i className="cl-mark" id="book" tabIndex={-1} style={{ top: `calc(${BOOK_P} * (100% - 100vh))` }} />
      <div
        ref={stage}
        className="cl-stage"
        data-ring={ring}
        data-armed={armed ? "" : undefined}
        data-press={press ? "" : undefined}
        data-instant={instant ? "" : undefined}
        data-after={after ? "" : undefined}
      >
        <div className="cl-world">
          <canvas
            ref={canvas}
            className="cl-canvas"
            role="img"
            aria-label="Seen from above, the Up, Side and Down blocks lie face up under blocks labelled SOPs, AI tools, apps, Slack and CRM. The pile is swept off the table and twelve painted system blocks are set down in a ring around them, green for Scaling Up, ochre for Scaling Sideways, red for Scaling Down. The last block, Quality, waits above its gap; getting the Bootloader sets it in. Further along the same table lies the hardcover of the book."
          />
          <m.div ref={plate} className="cl-plate" style={{ "--qlow": lower, opacity: plateIn, visibility: plateVis } as unknown as CSSProperties} aria-hidden="true">
            <img className="cl-shd lift" src={asset(geo.files.q_shd_lift)} alt="" style={layer("q_shd_lift")} draggable={false} />
            <img className="cl-shd rest" src={asset(geo.files.q_shd_rest)} alt="" style={layer("q_shd_rest")} draggable={false} />
            <div className="cl-q" style={qStyle}>
              <div className="cl-q-in">
                <img src={asset(geo.files.q_block)} alt="" draggable={false} style={{ position: "absolute", left: `${((geo.layers.q_block[0] - Q[0]) / (Q[2] - Q[0])) * 100}%`, top: `${((geo.layers.q_block[1] - Q[1]) / (Q[3] - Q[1])) * 100}%`, width: `${(geo.layers.q_block[2] / (Q[2] - Q[0])) * 100}%`, height: `${(geo.layers.q_block[3] / (Q[3] - Q[1])) * 100}%` }} />
              </div>
            </div>
            <svg className="cl-hair" viewBox="0 0 1600 1000" preserveAspectRatio="none">
              <path ref={hair} d={hairD} pathLength={1} />
            </svg>
            <div ref={wave} className="cl-wave" style={{ left: qStyle.left, top: qStyle.top, width: qStyle.width, height: qStyle.height }} />
            <div
              className="cl-hit"
              role="presentation"
              style={{
                left: `calc(${QC[0] * 100}% - max(48px, ${(Q[2] - Q[0]) * 50}%))`,
                top: `calc(${QC[1] * 100}% - max(48px, ${(Q[3] - Q[1]) * 50}%))`,
                width: `max(96px, ${(Q[2] - Q[0]) * 100}%)`,
                height: `max(96px, ${(Q[3] - Q[1]) * 100}%)`,
              }}
              onClick={() => btn.current?.click()}
              onPointerEnter={hover(true)}
              onPointerLeave={(e) => {
                hover(false)();
                if (e.pointerType === "mouse") setPress(false);
              }}
              onContextMenu={(e) => e.preventDefault()}
              {...press$}
              onPointerMove={onBlockMove}
            />
          </m.div>
        </div>
        <m.div className="cl-tagwrap" style={{ opacity: plateIn, visibility: plateVis }} aria-hidden="true">
          <div ref={tag} className="cl-tag callout tone-ink side-right">
            <span className="callout-line" />
            <span className="callout-tag">Closed loop · 12 systems</span>
          </div>
        </m.div>
        <m.div className="cl-scrim" style={{ opacity: scrim }} aria-hidden="true" />
        <div className="cl-scrim-m" aria-hidden="true" />
        <m.div ref={leader} className="cl-leader" style={{ opacity: cIn }} aria-hidden="true">
          <i />
        </m.div>
        <div ref={cursor} className="cl-cursor" aria-hidden="true">
          {ring === "closed" ? "Download" : "Get it"}
        </div>

        {earlyBeats}

        <CopyBeat p={p} refEl={beatC}>
          <p className="beat-k">
            <TriDot />
            <span className="cl-swap" data-on={after ? "b" : "a"}>
              <span className="a" aria-hidden={after}>
                {copy.copy.kicker}
              </span>
              <span className="b" aria-hidden={!after}>
                {copy.after.kicker}
              </span>
            </span>
          </p>
          {/* before: the claim and what the file is; after: how to use it. One cell, so nothing moves.
              The section is named by whichever headline is showing. */}
          <div className="cl-swap cl-head" data-on={after ? "b" : "a"}>
            <div className="a" aria-hidden={after}>
              <h2 className="beat-h cl-h" id={after ? undefined : "cl-h"}>
                {copy.copy.headline}
              </h2>
              <p className="cl-deck">{copy.copy.deck}</p>
            </div>
            <div className="b" aria-hidden={!after}>
              <h2 className="beat-h cl-h" id={after ? "cl-h" : undefined}>
                {copy.after.headline}
              </h2>
            </div>
          </div>
          {/* the opt-in: an address, then the block. Without JavaScript the form posts to the same function. */}
          <form className="cl-form" action={`${BASE}api/optin`} method="post" noValidate onSubmit={submit}>
            <input type="hidden" name="source" value="home" />
            <div className="cl-hp" aria-hidden="true">
              <label>
                Company <input name="company" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div className="cl-field" data-state={result ? "done" : fieldErr ? "err" : undefined}>
              {!result && (
                <>
                  <label className="cl-label" htmlFor="cl-email">
                    {copy.block.email}
                  </label>
                  <input
                    id="cl-email"
                    ref={field}
                    className="cl-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    enterKeyHint="send"
                    spellCheck={false}
                    placeholder={copy.block.placeholder}
                    aria-invalid={fieldErr === "email" || undefined}
                    aria-describedby="cl-email-msg"
                    onInput={() => fieldErr === "email" && setFieldErr("")}
                  />
                  <p className="cl-msg" id="cl-email-msg" role="alert">
                    {fieldErr === "email" ? copy.block.badEmail : fieldErr === "send" ? copy.block.sendFailed : ""}
                  </p>
                </>
              )}
              {/* one live region in every state, so the result is spoken: unseen and empty until then,
                  then the line in the field's place (only its words and class change). An address may
                  break at any letter (data-addr): it starts on the first line, a long one takes two */}
              <p className={result ? "cl-status" : "sr-only"} id="cl-status" role="status" aria-live="polite" data-addr={result === "sent" || undefined}>
                {result === "sent" ? copy.block.sentTo.replace("{email}", sentTo) : result === "already" ? copy.block.already : result === "yours" ? copy.block.notLive : ""}
              </p>
            </div>
            <CopyBlock
              ref={btn}
              type="submit"
              digitsRef={digits}
              words={words}
              labels={copy.block}
              load={cbLoad}
              onKeyDown={key}
              onKeyUp={keyUp}
              onFocus={() => !handing.current && setArmed(true)}
              onBlur={() => (setArmed(false), cancel())}
              onPointerEnter={hover(true)}
              onPointerLeave={(e) => {
                hover(false)();
                if (e.pointerType === "mouse") setPress(false);
              }}
              {...press$}
            />
          </form>
          {/* Download and the Use notice are the same two controls in every state (focus stays on them);
              the row above them reads the Appendix, or after the opt-in copies the starting prompt */}
          <div className="cl-rows" data-rows={rowsState}>
            <div className="cl-lead">
              {rowsState === "after" ? (
                <CopyButton source="loop" size="md" />
              ) : (
                <a className="cl-read" href={APPENDIX_URL}>
                  {copy.block.appendix} <span aria-hidden="true">→</span>
                </a>
              )}
            </div>
            <div className="cl-files">
              <a className={`dl${rowsState === "error" ? " is-promoted" : ""}`} href={FILE_URL} download={FILE_NAME}>
                <span aria-hidden="true">↓</span> Download
                <small>
                  {rowsState !== "after" && <span className="fn">{FILE_NAME}{kb ? " · " : ""}</span>}
                  {kb}
                </small>
              </a>
              <button type="button" className="notice-link" onClick={(e) => openNotice(e.currentTarget)}>
                Use notice
              </button>
            </div>
          </div>
          <p className="cl-follow desk-only" aria-hidden={!after}>
            {copy.after.line}
          </p>
        </CopyBeat>

        {laterBeats}
      </div>
    </section>
  );
}

/** the copy beat: same window as the others, but its position is set from the layout */
function CopyBeat({ p, refEl, children }: { p: MotionValue<number>; refEl: React.RefObject<HTMLDivElement | null>; children: ReactNode }) {
  const [a, b] = BEATS.copy;
  const range = [a, a + 0.02, b - 0.02, b];
  const opacity = useTransform(p, range, [0, 1, 1, 0]);
  const y = useTransform(p, range, reduced ? [0, 0, 0, 0] : [24, 0, 0, -18]);
  const visibility = useTransform(opacity, (o) => (o > 0.05 ? "visible" : "hidden"));
  return (
    <m.div ref={refEl} className="beat cl-beat cl-copy" style={{ opacity, y, visibility }}>
      {children}
    </m.div>
  );
}
