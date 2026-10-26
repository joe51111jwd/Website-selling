import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import type { SiteCopy } from "../copy";
import { copyNow, ensureBootloader } from "../bootloader";
import { getCopy, useCopy } from "../copyStore";
import { FrameStore, fetchOk } from "../frames";
import { LINKS } from "../links";
import { BEATS, BOOK_P, BOOTLOADER_P, CL_VH, T, frameAt, geo, hairEase, hapticPattern, poseRect, seqRect, smooth, truckRect, type Rect } from "../closedloop";
import { AssistantChips } from "./AssistantChips";
import { CopyButton } from "./CopyButton";
import { openNotice } from "./NoticeDialog";

const BASE = import.meta.env.BASE_URL;
const win = typeof window !== "undefined";
const reduced = win && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = win && window.matchMedia("(pointer: coarse)").matches;
const mac = win && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const query = win ? new URLSearchParams(window.location.search) : new URLSearchParams();
const asset = (name: string) => `${BASE}closed/${name}`;
const isPhone = () => window.innerWidth <= 900;

// the frame-50 picture's layout fractions (x right, y down)
const [RCX, RCY] = geo.ringC;
const HAIR = geo.hair;
const Q = geo.q.box; // [l, t, r, b]
const QC = [(Q[0] + Q[2]) / 2, (Q[1] + Q[3]) / 2];
const VP = geo.vp;
const TAG = [RCX + HAIR.rx * Math.sin(Math.PI / 6), RCY - HAIR.ry * Math.cos(Math.PI / 6)];

type Ring = "open" | "dropping" | "closed" | "error";

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
  const { seq, words, bytes } = useCopy();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const hair = useRef<SVGPathElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const beatC = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const leader = useRef<HTMLDivElement>(null);
  const capBook = useRef<HTMLParagraphElement>(null);
  const capRing = useRef<HTMLParagraphElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);

  const start = query.get("closed");
  const [ring, setRing] = useState<Ring>(start === "copied" ? "closed" : start === "error" ? "error" : "open");
  const [armed, setArmed] = useState(false);
  const [press, setPress] = useState(false);
  const [instant, setInstant] = useState(start != null);
  const [after, setAfter] = useState(start === "copied");
  const now = useRef<Ring>(ring);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const seen = useRef(seq);
  const viaKey = useRef(false);
  const inView = useRef(false);
  const pressTimer = useRef(0);
  const startXY = useRef<[number, number] | null>(null);

  const { scrollYProgress: p } = useScroll({ target: section, offset: ["start start", "end end"] });
  // Quality is lowered over its gap as the ring is finished (.45-.462)
  const lower = useTransform(p, [0.45, 0.462], [0, 1]);
  const railShow = useTransform(p, [0, 0.02, 0.72, 0.745], [0, 1, 1, 0]);
  // the layers over the picture (Quality, the line, the tag) belong to the finished ring
  const plateIn = useTransform(p, [0.445, 0.452], [0, 1]);
  const plateVis = useTransform(plateIn, (o) => (o > 0.5 ? "visible" : "hidden"));
  const railFill = useTransform(p, [0, 0.47], [0, 1]);
  const [narrow] = useState(() => win && window.innerWidth > 900 && window.innerWidth <= 1200);
  const scrim = useTransform(p, [0, 0.42, 0.46, 0.72, 0.745], narrow ? [1, 1, 1, 1, 0] : [1, 1, 0, 0, 0]);

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

  // the count is written by hand, so the sweep can run it without React redrawing over it
  const counting = useRef(false);
  useEffect(() => {
    if (num.current && !counting.current) num.current.textContent = words ? words.toLocaleString() : "· · ·";
  }, [words]);

  // the hairline closes around the ring while the count runs up to the file's real size
  const sweep = (ms: number, count: boolean) => {
    const path = hair.current;
    const n = getCopy().words;
    const t0 = performance.now();
    counting.current = count;
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / ms);
      const e = hairEase(t);
      if (path) path.style.strokeDashoffset = String(1 - e);
      if (count && num.current && n) num.current.textContent = Math.round(n * e).toLocaleString();
      if (t < 1) raf.current = requestAnimationFrame(step);
      else counting.current = false;
    };
    step();
  };

  const close = (fresh: boolean) => {
    if (reduced) {
      go("closed");
      setAfter(true);
      return;
    }
    sweep(fresh ? T.hairMs : T.againMs, true);
    later(fresh ? T.swap : T.againMs, () => {
      go("closed");
      setAfter(true);
    });
  };

  // the copy: Quality drops into its gap, the ring closes, the page asks the first question
  const ritual = (prom: Promise<number>, own: boolean) => {
    const s = now.current;
    setPress(false);
    if (s === "dropping") return; // already on its way
    if (s === "closed") {
      // copy again: a small lift and set, the line redrawn
      prom.then(
        () => {
          stage.current?.classList.remove("is-again");
          void stage.current?.offsetWidth;
          stage.current?.classList.add("is-again");
          if (reduced) return;
          navigator.vibrate?.(10);
          sweep(T.againMs, true);
        },
        () => {},
      );
      return;
    }
    clearTimers();
    setInstant(false);
    const toChips = () => own && viaKey.current && later(reduced ? 0 : T.focus, () => section.current?.querySelector<HTMLElement>(".cl-c .chip")?.focus({ preventScroll: true }));
    if (reduced) {
      prom.then(
        () => {
          close(true);
          toChips();
        },
        () => go("error"),
      );
      return;
    }
    const t0 = performance.now();
    go("dropping");
    later(T.drop, () => {
      stage.current?.classList.remove("is-thud");
      void stage.current?.offsetWidth;
      stage.current?.classList.add("is-thud");
      if (own) navigator.vibrate?.(hapticPattern());
    });
    prom.then(
      () => later(Math.max(0, T.hairStart - (performance.now() - t0)), () => close(true)),
      () => {
        clearTimers();
        go("error");
      },
    );
    prom.then(toChips, () => {});
  };

  const activate = () => {
    const prom = copyNow("loop"); // first, inside the click
    window.clearTimeout(pressTimer.current);
    ritual(prom, true);
    return prom;
  };

  // a copy from anywhere else: play it here if the ring is on screen, otherwise just show it closed
  useEffect(() => {
    if (seq === seen.current) return;
    seen.current = seq;
    if (getCopy().source === "loop" && now.current !== "error") return;
    const s = now.current;
    if (s === "closed" || s === "dropping") return;
    const v = p.get();
    if (inView.current && v > 0.46 && v < 0.75 && !reduced) ritual(Promise.resolve(getCopy().words), false);
    else {
      clearTimers();
      setInstant(true);
      go("closed");
      setAfter(true);
      if (hair.current) hair.current.style.strokeDashoffset = "0";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  // the press: at once for a mouse or a key, after 80ms of stillness for a finger (a scroll never presses)
  const down = (e: RPointerEvent) => {
    viaKey.current = false;
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
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      viaKey.current = true;
      setPress(true);
    }
  };
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
    let phone = isPhone();
    let pose: Rect = poseRect(window.innerWidth, window.innerHeight, phone);

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
      const fx = 0.06 * dw;
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
        const left = tx + 80 + tagW > window.innerWidth - 16;
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
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      if (v >= 0.45 && pano) {
        // frame 50 is the panorama's middle, so the hand-over is seamless. At the copy pose the paper
        // hides the panorama's far ends; it gives way as the camera starts to slide.
        const tv = reduced ? (phone ? (v < 0.82 ? 0.74 : 0.87) : v < 0.77 ? 0.74 : v < 0.89 ? 0.83 : 0.92) : v;
        const r = v < 0.74 ? pose : truckRect(tv, cw, ch, phone);
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
        const r = v >= 0.45 ? pose : seqRect(i, cw, ch, phone);
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
      phone = isPhone();
      pose = poseRect(window.innerWidth, window.innerHeight, phone);
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

  // beat C's button lines up with Quality, and a fine line joins them (desktop)
  useLayoutEffect(() => {
    const place = () => {
      const c = beatC.current;
      const b = pill.current;
      const l = leader.current;
      if (!c || !b || !l) return;
      if (isPhone()) {
        c.style.top = "";
        l.style.display = "none";
        return;
      }
      const r = poseRect(window.innerWidth, window.innerHeight, false);
      const ringLeft = r.ox + (RCX - HAIR.rx) * r.dw;
      c.style.maxWidth = `${Math.max(280, Math.min(500, 0.35 * window.innerWidth, ringLeft - 16 - c.offsetLeft))}px`;
      // a short window: drop the closing line rather than run into the rail
      c.classList.remove("is-tight");
      if (c.offsetHeight > window.innerHeight - 96 - 88) c.classList.add("is-tight");
      const qy = r.oy + QC[1] * r.dh;
      const qx = r.ox + Q[0] * r.dw;
      const off = b.offsetTop + b.offsetHeight / 2;
      const top = Math.max(96, Math.min(window.innerHeight - c.offsetHeight - 88, qy - off)); // clear of the rail
      c.style.top = `${top}px`;
      const by = top + off;
      const x0 = c.offsetLeft + b.offsetLeft + b.offsetWidth + 12;
      const x1 = qx - 16;
      const ok = Math.abs(by - qy) <= 8 && x1 - x0 > 24;
      l.style.display = ok ? "" : "none";
      l.style.left = `${x0}px`;
      l.style.top = `${qy}px`;
      l.style.width = `${x1 - x0}px`;
    };
    place();
    window.addEventListener("resize", place);
    void document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [after]);

  const book = copy.book;
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
            aria-label="Seen from above, the Up, Side and Down blocks lie face up under blocks labelled SOPs, AI tools, apps, Slack and CRM. The pile is swept off the table and twelve painted system blocks are set down in a ring around them, green for Scaling Up, ochre for Scaling Sideways, red for Scaling Down. The last block, Quality, waits above its gap. Further along the same table lies the hardcover of the book."
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
            <div
              className="cl-hit"
              role="presentation"
              style={{
                left: `calc(${QC[0] * 100}% - max(48px, ${(Q[2] - Q[0]) * 50}%))`,
                top: `calc(${QC[1] * 100}% - max(48px, ${(Q[3] - Q[1]) * 50}%))`,
                width: `max(96px, ${(Q[2] - Q[0]) * 100}%)`,
                height: `max(96px, ${(Q[3] - Q[1]) * 100}%)`,
              }}
              onClick={() => pill.current?.click()}
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
          {ring === "closed" ? "Copy again" : "Copy"}
        </div>

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

        <CopyBeat p={p} refEl={beatC}>
          <p className="beat-k">
            <TriDot />
            <span className="cl-swap ph" data-on={after ? "b" : "a"}>
              <span className="a">{copy.copy.kicker}</span>
              <span className="b" aria-hidden={!after}>
                {copy.after.kicker}
              </span>
            </span>
          </p>
          <h2 className="beat-h cl-h" id="cl-h">
            <span className="cl-swap ph" data-on={after ? "b" : "a"}>
              <span className="a">{copy.copy.headline}</span>
              <span className="b" aria-hidden={!after}>
                {copy.after.question}
              </span>
            </span>
          </h2>
          <div className="cl-meter">
            <span className="cl-num" aria-hidden="true" ref={num} />
            <span className="cl-meta" aria-hidden="true">
              <span className="cl-swap" data-on={after ? "b" : "a"}>
                <span className="a">
                  <b>Words</b>
                  <em>{copy.copy.scope}</em>
                </span>
                <span className="b">
                  <b>Words · Copied</b>
                  <em>
                    {coarse ? (
                      "Long-press → Paste · may attach as a file"
                    ) : (
                      <>
                        Paste <kbd>{mac ? "⌘" : "Ctrl"}</kbd>
                        <kbd>V</kbd> · may attach as a file
                      </>
                    )}
                  </em>
                </span>
              </span>
            </span>
            <span className="sr-only" id="cl-meter">
              {words ? `The whole file, ${words.toLocaleString()} words` : "The whole file"}
            </span>
          </div>
          <div
            className="cl-pill"
            onPointerEnter={hover(true)}
            onPointerLeave={(e) => {
              hover(false)();
              if (e.pointerType === "mouse") setPress(false);
            }}
          >
            <CopyButton ref={pill} source="loop" size="lg" run={activate} flashMs={3400} aria-describedby="cl-meter" onKeyDown={key} onFocus={() => setArmed(true)} onBlur={() => (setArmed(false), cancel())} {...press$} />
          </div>
          <div className="cl-dl">
            <a className={`dl${ring === "error" ? " is-promoted" : ""}`} href={`${BASE}bootloader.md`} download="SUSD-Bootloader.md">
              <span aria-hidden="true">↓</span> Download
              <small>{kb ? `SUSD-Bootloader.md · ${kb}` : "SUSD-Bootloader.md"}</small>
            </a>
            {ring === "error" && (
              <a className="dl-open" href={`${BASE}bootloader.txt`} target="_blank" rel="noopener">
                Open the file
              </a>
            )}
            <button type="button" className="notice-link" onClick={(e) => openNotice(e.currentTarget)}>
              Use notice
            </button>
          </div>
          <div className="cl-c">
            <AssistantChips variant="paper" />
          </div>
          <div className="cl-after desk-only" aria-hidden={!after}>
            <p className="cl-after-k">{copy.after.kicker}</p>
            <p className="cl-after-q">{copy.after.question}</p>
            <p className="cl-after-l">{copy.after.line}</p>
          </div>
        </CopyBeat>

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
