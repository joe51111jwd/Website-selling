import { addTask, wake } from "./ticker";
import { Spring, clamp, r2 } from "./spring";
import { holdMagnet, releaseMagnet, magnetOffset } from "./magnet";
import { loupeKey, parseLoupe, quadInverse, quadWidth, toScreen, type LoupeConfig, type Quad } from "./loupe";

// The geofence cursor. A crew member (orange dot) inside a geofence (dashed ring). The dot is the
// hotspot and follows almost rigidly; the fence trails on a spring and its dashes travel with the
// distance it covers. Over a call to action the fence closes around the button and goes solid,
// the way a geofence closes around a jobsite when a truck clocks in.
//
// Everything here is imperative: React renders the skeleton once, then this file writes
// transforms (and, while the shape morphs, the SVG rect's geometry) from one rAF loop.

export type CursorMode = "default" | "link" | "cta" | "drag" | "loupe" | "view" | "text" | "hide";
const MODES = new Set<string>(["default", "link", "cta", "drag", "loupe", "view", "text", "hide"]);

const MATCH =
  '[data-cursor],a[href],button,[role="button"],[role="link"],[role="slider"],summary,label[for],input,textarea,select,iframe,video[controls],[contenteditable]';

// sizes in CSS px
const RING = 34;
const LINK = 20;
const HINT = 40;
const VIEW = 84;
const DRAG_W = 92;
const DRAG_H = 44;
const PAD = 6; // fence clearance around a CTA
const DOT = 12; // rendered size of .cur-dot; scaled down from here
const DOT_REST = 0.6;
const DASHED = 0.5; // share of each dash period that is ink

// how the fence follows, per mode: [natural frequency rad/s, damping ratio]
// (steady lag behind a moving pointer is about speed x 2 x damping / frequency: ~45px at 1000px/s)
const FOLLOW: Record<CursorMode, [number, number]> = {
  default: [31, 0.7],
  link: [36, 0.78],
  cta: [26, 0.68],
  drag: [44, 0.9],
  view: [28, 0.8],
  text: [90, 1],
  loupe: [36, 0.92],
  hide: [60, 1],
};

const clock = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function autoMode(m: HTMLElement): CursorMode {
  const tag = m.tagName;
  if (tag === "INPUT") {
    const t = (m as HTMLInputElement).type;
    if (t === "range") return "drag";
    if (/^(checkbox|radio|button|submit|reset|image|color|file)$/.test(t)) return (m as HTMLInputElement).disabled ? "default" : "link";
    return "hide";
  }
  if (tag === "TEXTAREA" || tag === "SELECT" || tag === "IFRAME" || tag === "VIDEO") return "hide";
  if (m.hasAttribute("contenteditable")) return m.isContentEditable ? "hide" : "default";
  if (m.getAttribute("role") === "slider") return "drag";
  if ((m as HTMLButtonElement).disabled || m.getAttribute("aria-disabled") === "true") return "default";
  return "link";
}

export function startCursor(root: HTMLElement): () => void {
  const html = document.documentElement;
  const q = <T extends Element>(s: string) => root.querySelector(s) as T;
  const dotEl = q<HTMLElement>(".cur-dot");
  const ringEl = q<HTMLElement>(".cur-ring");
  const shapeEl = q<SVGRectElement>(".cur-shape");
  const labelEl = q<HTMLElement>(".cur-label-text");
  const tagEl = q<HTMLElement>(".cur-tag");
  const tagTextEl = q<HTMLElement>(".cur-tag-text");
  const loupeEl = q<HTMLElement>(".cur-loupe");
  const lensEl = q<HTMLElement>(".cur-loupe-img");
  const rippleEl = q<HTMLElement>(".cur-ripple");
  const rippleSvg = q<SVGSVGElement>(".cur-ripple svg");
  const rippleShape = q<SVGRectElement>(".cur-ripple rect");

  const mqReduced = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = mqReduced.matches;

  // pointer and visibility
  let px = innerWidth / 2;
  let py = innerHeight / 2;
  let visible = false;
  let blurred = false;
  let nativeHidden = false;
  let snapNext = true;
  let vw = html.clientWidth;
  let vh = html.clientHeight;

  // what is under the pointer
  let mode: CursorMode = "default"; // resolved from the element
  let vmode: CursorMode = "default"; // what is drawn (a loupe falls back to default off-screen)
  let el: HTMLElement | null = null;
  let leaf: Element | null = null;
  let toneEl: Element | null = null;
  let tone = "light";
  let pressed = false;
  let dragLock = false;
  let needsHit = false;
  let measured = false;

  // scroll hint
  let scrolled = scrollY > 40;
  let hint = false;
  let idle = 0;

  // geometry of the current target
  let cta = { x: 0, y: 0, w: 0, h: 0, r: 0 };
  let caret = 20;
  let clockedIn = false;
  let tagWaiting = false;

  // loupe
  type Cand = { node: Element; key: string; cfg: LoupeConfig; cq: Quad | null; inv: number[] | null };
  let cands: Cand[] = [];
  let candsAt = -1e9;
  let lhit: Cand | null = null;
  let pendingTag: string | null = null;
  let lcfg: LoupeConfig | null = null;
  let lquad: Quad | null = null;
  let linv: number[] | null = null;
  let lsrc = "";
  let lnat: { w: number; h: number } | null = null;
  let lsize = 0;
  const natCache = new Map<string, { w: number; h: number } | null>();

  // springs
  const ringX = new Spring(px, ...FOLLOW.default, 0.01);
  const ringY = new Spring(py, ...FOLLOW.default, 0.01);
  const sw = new Spring(RING, 26, 0.8);
  const sh = new Spring(RING, 26, 0.8);
  const sr = new Spring(RING / 2, 26, 0.8);
  const dash = new Spring(DASHED, 16, 1, 0.002);
  const dotS = new Spring(DOT_REST, 28, 0.62, 0.002);
  let march = 0;
  let lastRX = px;
  let lastRY = py;

  // last written values, so the DOM is touched only on change
  let wDot = "";
  let wRing = "";
  let wShape = "";
  let wDash = "";
  let wLoupe = "";
  let wLens = "";
  let wTag = "";
  let wTagSide = "";

  const set = (k: string, v: string) => {
    if (root.getAttribute(k) !== v) root.setAttribute(k, v);
  };

  function syncNative() {
    const hide = visible && !blurred && vmode !== "hide";
    if (hide !== nativeHidden) {
      nativeHidden = hide;
      html.classList.toggle("cur-on", hide);
    }
  }

  function setVisible(v: boolean) {
    if (v && !visible) snapNext = true;
    visible = v;
    set("data-visible", v ? "1" : "0");
    syncNative();
    wake();
  }

  function setVMode(m: CursorMode) {
    if (m === vmode) return;
    vmode = m;
    set("data-mode", m);
    syncNative();
  }

  function setHint(v: boolean) {
    if (v === hint) return;
    hint = v;
    set("data-hint", v ? "1" : "0");
    wake();
  }

  function setTarget(next: CursorMode, m: HTMLElement | null) {
    if (next === mode && m === el) return;
    if (el && mode === "cta") releaseMagnet(el);
    mode = next;
    el = m;
    measured = false;
    clockedIn = false;
    cands = [];
    candsAt = -1e9;
    lhit = null;
    if (mode === "cta" && el && !reduced) {
      const s = Number(el.getAttribute("data-cursor-magnet") ?? 6);
      if (s > 0) holdMagnet(el, s);
    }
    const raw = el?.getAttribute("data-cursor-label") ?? "";
    const text = raw.replace("{time}", clock());
    if (mode === "view") {
      labelEl.textContent = text || "View";
      set("data-play", /^play\b/i.test(text) ? "1" : "0");
      set("data-tag", "0");
    } else {
      const t = text || (mode === "drag" ? "Drag" : "");
      if (t) tagTextEl.textContent = t;
      // a CTA's tag waits for the fence to close (see "clocked in" in write); a loupe's waits
      // until the pointer is over one of its screens (readLoupe)
      tagWaiting = !!t && mode === "cta";
      set("data-tag", t && !tagWaiting && mode !== "text" && mode !== "hide" && mode !== "loupe" ? "1" : "0");
    }
    if (mode === "loupe") setVMode("default");
    else setVMode(mode);
    if (mode !== "default") setHint(false);
    wake();
  }

  function resolve(l: Element | null) {
    leaf = l;
    const m = (l && typeof l.closest === "function" ? l.closest(MATCH) : null) as HTMLElement | null;
    let next: CursorMode = "default";
    if (m) {
      let a = m.getAttribute("data-cursor");
      // No zoom on hover: the magnifier over device screens and the big "view" disc read as
      // distracting, so screens get the plain cursor and "view" targets the quiet link ring.
      if (a === "loupe") a = "default";
      else if (a === "view") a = "link";
      next = a !== null ? ((MODES.has(a) ? a : "default") as CursorMode) : autoMode(m);
    }
    toneEl = l && typeof l.closest === "function" ? l.closest("[data-cursor-tone]") : null;
    setTarget(next, m);
    // the I-beam matches the type under it, which can change within one text block
    if (next === "text") measured = false;
  }

  function ripple(signal: boolean) {
    if (reduced) return;
    const w = Math.max(sw.x, 2);
    const h = Math.max(sh.x, 2);
    const r = clamp(sr.x, 0, Math.min(w, h) / 2);
    rippleShape.setAttribute("x", String(r2(-w / 2)));
    rippleShape.setAttribute("y", String(r2(-h / 2)));
    rippleShape.setAttribute("width", String(r2(w)));
    rippleShape.setAttribute("height", String(r2(h)));
    rippleShape.setAttribute("rx", String(r2(r)));
    rippleEl.style.transform = `translate3d(${r2(ringX.x)}px,${r2(ringY.x)}px,0)`;
    rippleEl.setAttribute("data-signal", signal ? "1" : "0");
    const grow = signal ? 14 : 12;
    rippleSvg.animate(
      [
        { transform: "scale(1)", opacity: signal ? 0.7 : 0.45 },
        { transform: `scale(${(w + grow * 2) / w},${(h + grow * 2) / h})`, opacity: 0 },
      ],
      { duration: signal ? 640 : 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }

  function setLensSrc(src: string) {
    if (src === lsrc) return;
    lsrc = src;
    lnat = natCache.get(src) ?? null;
    wLens = "";
    lensEl.style.backgroundImage = src ? `url("${src.replace(/"/g, '\\"')}")` : "";
    if (lnat) {
      lensEl.style.width = `${lnat.w}px`;
      lensEl.style.height = `${lnat.h}px`;
    } else if (src && !natCache.has(src)) {
      natCache.set(src, null);
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img
        .decode()
        .then(() => {
          natCache.set(src, { w: img.naturalWidth, h: img.naturalHeight });
          if (lsrc === src) {
            lsrc = "";
            setLensSrc(src);
            wake();
          }
        })
        .catch(() => natCache.delete(src));
    }
  }

  // ---- events --------------------------------------------------------------------------------

  const armHint = () => {
    if (!scrolled && visible && mode === "default" && !pressed) setHint(true);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      if (visible) setVisible(false);
      return;
    }
    px = e.clientX;
    py = e.clientY;
    if (blurred) {
      if (!document.hasFocus()) return;
      blurred = false;
    }
    // a classic (non-overlay) scrollbar shows the system cursor; don't draw ours on top of it
    if (px >= vw || py >= vh) {
      if (visible) setVisible(false);
      return;
    }
    if (!dragLock && e.target !== leaf) resolve(e.target as Element);
    if (!visible) setVisible(true);
    if (hint) setHint(false);
    if (!scrolled) {
      clearTimeout(idle);
      idle = window.setTimeout(armHint, 2000);
    }
    wake();
  };

  // the parent document sees pointerover (not pointermove) for an iframe, so resolve here too
  const onOver = (e: PointerEvent) => {
    if (e.pointerType === "touch" || dragLock || e.target === leaf) return;
    resolve(e.target as Element);
    wake();
  };

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "touch" || !visible) return;
    pressed = true;
    set("data-pressed", "1");
    if (mode === "drag") dragLock = true;
    setHint(false);
    if (vmode === "default" || vmode === "link" || vmode === "cta") ripple(vmode === "cta");
    wake();
  };

  const onUp = () => {
    if (!pressed) return;
    pressed = false;
    set("data-pressed", "0");
    if (dragLock) {
      dragLock = false;
      needsHit = true;
    }
    wake();
  };

  const onScroll = (e: Event) => {
    if (!scrolled && (e.target === document || e.target === window) && scrollY > 2) {
      scrolled = true;
      clearTimeout(idle);
      setHint(false);
    }
    needsHit = true;
    wake();
  };

  const onOut = (e: PointerEvent) => {
    if (!e.relatedTarget && visible) setVisible(false);
  };

  const onBlur = () => {
    blurred = true;
    pressed = false;
    dragLock = false;
    set("data-pressed", "0");
    setVisible(false);
  };

  const onVis = () => {
    if (document.hidden) setVisible(false);
  };

  const onReduced = () => {
    reduced = mqReduced.matches;
    if (reduced && el && mode === "cta") releaseMagnet(el);
    snapNext = true;
    wake();
  };

  const ro = new ResizeObserver(() => {
    vw = html.clientWidth;
    vh = html.clientHeight;
    needsHit = true;
    wake();
  });
  ro.observe(html);

  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onDown, { passive: true });
  addEventListener("pointerup", onUp, { passive: true });
  addEventListener("pointercancel", onUp, { passive: true });
  addEventListener("scroll", onScroll, { passive: true, capture: true });
  addEventListener("blur", onBlur);
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  mqReduced.addEventListener("change", onReduced);

  // ---- frame ---------------------------------------------------------------------------------

  let pendingV: CursorMode | null = null;
  let pendingTone: string | null = null;

  function read(now: number) {
    if (!visible) return;
    if (needsHit && !dragLock) {
      needsHit = false;
      const l = document.elementFromPoint(px, py);
      if (l !== leaf) resolve(l);
    }
    if (el && !el.isConnected) resolve(null);
    const t = toneEl?.getAttribute("data-cursor-tone") === "dark" ? "dark" : "light";
    if (t !== tone) pendingTone = t;

    if (mode === "cta" && el) {
      const r = el.getBoundingClientRect();
      const o = magnetOffset(el);
      if (!measured) {
        const cs = getComputedStyle(el);
        cta.r = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.height / 2);
        measured = true;
      }
      cta = { x: r.left + r.width / 2 - o.x, y: r.top + r.height / 2 - o.y, w: r.width, h: r.height, r: cta.r };
    } else if (mode === "text" && !measured && leaf) {
      const fs = parseFloat(getComputedStyle(leaf as Element).fontSize) || 16;
      caret = clamp(fs * 1.3, 16, 80);
      measured = true;
    } else if (mode === "loupe" && el) {
      readLoupe(el, now);
    }
  }

  // A loupe element may describe one screen itself (data-loupe-src on it) and/or several
  // screens as descendants carrying data-loupe-src (e.g. one overlay over the shared WebGL
  // canvas with a child per device). Quads and rects are in px relative to the loupe element.
  function readLoupe(host: HTMLElement, now: number) {
    if (now - candsAt > 500) {
      candsAt = now;
      const nodes: Element[] = host.hasAttribute("data-loupe-src") ? [host] : [];
      host.querySelectorAll("[data-loupe-src]:not([data-cursor])").forEach((n) => nodes.push(n));
      cands = nodes.map((node) => cands.find((c) => c.node === node) ?? { node, key: "", cfg: parseLoupe(node), cq: null, inv: null });
    }
    const base = host.getBoundingClientRect();
    let hit: Cand | null = null;
    // later in the DOM = in front (the phone leans in front of the laptop), so test back to front
    // and keep the last hit
    for (const c of cands) {
      const key = loupeKey(c.node);
      if (key !== c.key) {
        c.key = key;
        c.cfg = parseLoupe(c.node);
      }
      let cq: Quad;
      if (c.cfg.quad) {
        const ox = c.cfg.viewport ? 0 : base.left;
        const oy = c.cfg.viewport ? 0 : base.top;
        cq = c.cfg.quad.map((v, i) => v + (i % 2 ? oy : ox)) as Quad;
      } else {
        const r = c.node === host ? base : c.node.getBoundingClientRect();
        cq = [r.left, r.top, r.right, r.top, r.right, r.bottom, r.left, r.bottom];
      }
      if (!c.cq || cq.some((v, i) => Math.abs(v - c.cq![i]) > 0.05)) {
        c.cq = cq;
        c.inv = quadInverse(cq);
      }
      if (c.inv && c.cfg.src) {
        const [a, b] = toScreen(c.inv, px, py);
        if (a >= 0 && a <= 1 && b >= 0 && b <= 1) hit = c;
      }
    }
    if (hit) {
      lcfg = hit.cfg;
      lquad = hit.cq;
      linv = hit.inv;
      setLensSrc(hit.cfg.src);
    }
    if (hit !== lhit) {
      lhit = hit;
      const label = hit && (hit.node.getAttribute("data-cursor-label") ?? host.getAttribute("data-cursor-label"));
      pendingTag = label ?? "";
    }
    pendingV = hit ? "loupe" : "default";
  }

  function write(dt: number): boolean {
    if (pendingTone) {
      tone = pendingTone;
      pendingTone = null;
      set("data-tone", tone);
    }
    if (pendingV) {
      setVMode(pendingV);
      pendingV = null;
    }
    if (pendingTag !== null) {
      if (pendingTag) tagTextEl.textContent = pendingTag;
      set("data-tag", pendingTag ? "1" : "0");
      pendingTag = null;
    }
    if (!visible) return false;

    // targets
    let tx = px;
    let ty = py;
    let w = RING;
    let h = RING;
    let r = RING / 2;
    let d = DASHED;
    let ds = DOT_REST;
    switch (vmode) {
      case "link":
        w = h = LINK;
        r = LINK / 2;
        d = 1;
        ds = 0.8;
        break;
      case "cta": {
        const o = magnetOffset(el);
        tx = cta.x + o.x * 1.35;
        ty = cta.y + o.y * 1.35;
        w = cta.w + PAD * 2;
        h = cta.h + PAD * 2;
        r = cta.r + PAD;
        d = 1;
        ds = 0.5;
        break;
      }
      case "drag":
        w = pressed ? DRAG_W - 10 : DRAG_W;
        h = DRAG_H;
        r = DRAG_H / 2;
        d = 1;
        ds = 0;
        break;
      case "view":
        w = h = VIEW;
        r = VIEW / 2;
        d = 1;
        ds = 0;
        break;
      case "text":
        w = 2;
        h = caret;
        r = 1;
        d = 1;
        ds = 0;
        break;
      case "loupe": {
        const s = lcfg?.size ?? 200;
        w = h = s;
        r = s / 2;
        d = 1;
        ds = 0;
        break;
      }
      case "hide":
        ds = 0;
        break;
      default:
        if (hint) {
          w = h = HINT;
          r = HINT / 2;
          ds = 0;
        }
    }
    if (pressed && (vmode === "default" || vmode === "link" || vmode === "view")) {
      w *= 0.82;
      h *= 0.82;
      r *= 0.82;
      ds *= 0.85;
    } else if (pressed && vmode === "cta") {
      w -= 4;
      h -= 4;
      r = Math.max(0, r - 2);
    }

    const [fw, fz] = FOLLOW[vmode];
    ringX.tune(fw, fz);
    ringY.tune(fw, fz);
    ringX.target = tx;
    ringY.target = ty;
    sw.target = w;
    sh.target = h;
    sr.target = r;
    dash.target = d;
    dotS.target = ds;

    if (snapNext) {
      ringX.snap();
      ringY.snap();
      lastRX = ringX.x;
      lastRY = ringY.x;
      snapNext = false;
    }
    if (reduced) {
      for (const s of [ringX, ringY, sw, sh, sr, dash, dotS]) s.snap();
    }

    let busy = false;
    for (const s of [ringX, ringY]) if (s.step(dt)) busy = true;
    let shapeBusy = false;
    for (const s of [sw, sh, sr, dash, dotS]) if (s.step(dt)) shapeBusy = true;
    busy ||= shapeBusy;

    // dashes travel with the distance the fence covers, like a measuring wheel
    if (!reduced && dash.x < 0.995) march += Math.hypot(ringX.x - lastRX, ringY.x - lastRY) * 0.3;
    lastRX = ringX.x;
    lastRY = ringY.x;

    // the fence has closed around the CTA: clocked in
    if (vmode === "cta" && !clockedIn && dash.x > 0.97) {
      clockedIn = true;
      ripple(true);
      if (tagWaiting) {
        tagWaiting = false;
        set("data-tag", "1");
      }
    }

    // ---- writes
    const s = r2(dotS.x);
    // the dot is the hotspot, so it sits exactly on the pointer; only the fence trails
    const dt3 = `translate3d(${r2(px - DOT / 2)}px,${r2(py - DOT / 2)}px,0) scale(${s})`;
    if (dt3 !== wDot) dotEl.style.transform = wDot = dt3;

    const rt = `translate3d(${r2(ringX.x)}px,${r2(ringY.x)}px,0)`;
    if (rt !== wRing) ringEl.style.transform = wRing = rt;

    const W = Math.max(sw.x, 1);
    const H = Math.max(sh.x, 1);
    const R = clamp(sr.x, 0, Math.min(W, H) / 2);
    const sk = `${r2(W)} ${r2(H)} ${r2(R)}`;
    if (sk !== wShape) {
      wShape = sk;
      shapeEl.setAttribute("x", String(r2(-W / 2)));
      shapeEl.setAttribute("y", String(r2(-H / 2)));
      shapeEl.setAttribute("width", String(r2(W)));
      shapeEl.setAttribute("height", String(r2(H)));
      shapeEl.setAttribute("rx", String(r2(R)));
    }

    // the tag sits on the fence's top-left corner, flipped below or right-aligned near an edge
    const below = ty - h / 2 < 40;
    const right = tx - w / 2 + 180 > vw;
    const tk = `${below ? 1 : 0}${right ? 1 : 0}`;
    if (tk !== wTagSide) {
      wTagSide = tk;
      set("data-tag-side", `${below ? "bottom" : "top"} ${right ? "right" : "left"}`);
    }
    const tg = `translate3d(${r2(right ? W / 2 : -W / 2)}px,${r2(below ? H / 2 : -H / 2)}px,0)`;
    if (tg !== wTag) tagEl.style.transform = wTag = tg;

    const P = 2 * (W - 2 * R) + 2 * (H - 2 * R) + 2 * Math.PI * R;
    const n = Math.max(6, Math.round(P / 8.5));
    const seg = P / n;
    const on = seg * clamp(dash.x, 0, 1);
    const dk = dash.x >= 0.995 ? "none" : `${r2(on)} ${r2(seg - on)}|${r2(-(march % seg))}`;
    if (dk !== wDash) {
      wDash = dk;
      if (dk === "none") {
        shapeEl.style.strokeDasharray = "none";
      } else {
        shapeEl.style.strokeDasharray = `${r2(on)} ${r2(seg - on)}`;
        shapeEl.style.strokeDashoffset = String(r2(-(march % seg)));
      }
    }

    // loupe: the lens grows out of the fence, so its scale follows the fence size
    if (lsrc && (vmode === "loupe" || shapeBusy || wLoupe !== "")) {
      const S = lcfg?.size ?? 200;
      if (S !== lsize) {
        lsize = S;
        loupeEl.style.width = loupeEl.style.height = `${S}px`;
      }
      const lt = vmode === "loupe" || shapeBusy ? `translate3d(${r2(ringX.x - S / 2)}px,${r2(ringY.x - S / 2)}px,0) scale(${r2(W / S)})` : "";
      if (lt !== wLoupe) loupeEl.style.transform = wLoupe = lt;
      if (lnat && linv && lquad && lcfg && vmode === "loupe") {
        const [u, v] = toScreen(linv, ringX.x, ringY.x);
        const [cx, cy, cw, ch] = lcfg.crop;
        const ix = cx + clamp(u, -0.5, 1.5) * cw;
        const iy = cy + clamp(v, -0.5, 1.5) * ch;
        // magnified width of the whole image: zoom x its on-page size, but never smaller than
        // the app's own CSS size (so text is readable) nor larger than the image's pixels
        const page = quadWidth(lquad) / cw;
        const Wi = clamp(page * lcfg.zoom, lnat.w / lcfg.dpr, lnat.w);
        const k = Wi / lnat.w;
        const lens = `translate3d(${r2(S / 2 - ix * Wi)}px,${r2(S / 2 - iy * lnat.h * k)}px,0) scale(${Math.round(k * 10000) / 10000})`;
        if (lens !== wLens) lensEl.style.transform = wLens = lens;
      }
    }

    return busy || mode === "loupe";
  }

  const remove = addTask({ read, write });
  set("data-mode", "default");
  set("data-tone", "light");
  set("data-visible", "0");

  return () => {
    remove();
    ro.disconnect();
    clearTimeout(idle);
    if (el && mode === "cta") releaseMagnet(el);
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerdown", onDown);
    removeEventListener("pointerup", onUp);
    removeEventListener("pointercancel", onUp);
    removeEventListener("scroll", onScroll, { capture: true });
    removeEventListener("blur", onBlur);
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("visibilitychange", onVis);
    mqReduced.removeEventListener("change", onReduced);
    html.classList.remove("cur-on");
  };
}
