import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type PanInfo,
} from "motion/react";
import "./permit.css";

/** Where a torn-off permit is drafted to. Placeholder: the client replaces this address. */
export const CONTACT_EMAIL = "hello@example.com";

const EXPO = [0.16, 1, 0.3, 1] as const;

const BAYS = ["01", "02", "03", "04", "05"] as const;
type Bay = (typeof BAYS)[number];
const TASK: Record<Bay, string> = {
  "01": "Bricklaying",
  "02": "Drywall installation",
  "03": "Bolted assembly",
  "04": "Pipe assembly",
  "05": "Layout and marking",
};
const SUPPLIES = ["Products", "Equipment", "Funding", "Venue"] as const;
type Supply = (typeof SUPPLIES)[number];
const MODES = ["team", "company"] as const;
type Mode = (typeof MODES)[number];
const MODE_LABEL: Record<Mode, string> = { team: "Robot team", company: "Sponsor" };
type Status = "idle" | "tearing" | "torn";

/** Below this width the stub stacks under the permit (keep in step with permit.css). */
const STACKED_MQ = "(max-width: 699px)";
const COARSE_MQ = "(hover: none), (pointer: coarse)";
const rm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useMedia(q: string) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const fn = () => setM(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [q]);
  return m;
}

function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function four(seed: string) {
  const r = seeded(seed);
  let c = "";
  for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(r() * CODE_CHARS.length)];
  return c;
}

/** The same team (or company) always draws the same number. */
function permitNo(mode: Mode, bay: Bay, supply: Supply, name: string) {
  const who = name.trim().toLowerCase();
  return mode === "team" ? `HRCG-27-${bay}-${four(`team|${who || "our team"}`)}` : `HRCG-27-${supply[0]}${bay}-${four(`co|${who || "our company"}`)}`;
}

function draftMailto(mode: Mode, team: string, company: string, bay: Bay, supply: Supply, no: string) {
  const task = TASK[bay];
  let subject: string;
  let lines: string[];
  if (mode === "team") {
    const t = team.trim();
    subject = `HRCG 2027 - Robot entry - ${t || "Our team"} - Bay ${bay}`;
    lines = [`Team: ${t}`, `Challenge: ${bay} ${task}`, "Platform: ", "What we would need to take part: ", "", `Permit no. ${no}`];
  } else {
    const c = company.trim();
    subject = `HRCG 2027 - Sponsor/supplier - ${c || "Our company"} - ${supply}`;
    lines = [`Company: ${c}`, `Supplying: ${supply}`, `Bay we would equip: ${bay} ${task}`, "What we could provide: ", "Contact person: ", "", `Submittal no. ${no}`];
  }
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\r\n"))}`;
}

/** Text that slides and blurs between values. */
function Swap({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`pm-swap ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="pm-swap__in"
          initial={{ y: "70%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-70%", opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.65, ease: EXPO }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Letter by letter, rolling like a split-flap board. */
function Code({ value }: { value: string }) {
  return (
    <span className="pm-code">
      <span className="pm-sr">{value}</span>
      {[...value].map((ch, i) => (
        <span className="pm-code__slot" key={i} aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={ch + i + value}
              initial={{ y: "100%", rotateX: -80, opacity: 0 }}
              animate={{ y: "0%", rotateX: 0, opacity: 1 }}
              exit={{ y: "-100%", rotateX: 80, opacity: 0 }}
              transition={{ duration: 0.7, ease: EXPO, delay: i * 0.07 }}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

/** Deciphers into `text` when it changes: glyphs step every 50 ms and resolve left to right. */
function Decipher({ text, className = "", onMount = false }: { text: string; className?: string; onMount?: boolean }) {
  const [out, setOut] = useState(text);
  const first = useRef(!onMount);
  useEffect(() => {
    if (first.current || rm()) {
      first.current = false;
      setOut(text);
      return;
    }
    const start = performance.now();
    const n = text.length;
    let step = -1;
    let raf = 0;
    const tick = (now: number) => {
      const t = now - start;
      const s = Math.floor(t / 50);
      if (s !== step) {
        step = s;
        const k = Math.floor((t / 600) * n);
        setOut([...text].map((ch, i) => (i < k || ch === " " || ch === "·" ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
      }
      if (t < 600) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return (
    <span className={className}>
      <span className="pm-sr">{text}</span>
      <span aria-hidden="true">{out}</span>
    </span>
  );
}

function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    const r = seeded(seed);
    const out: { x: number; w: number }[] = [];
    let x = 0;
    while (x < 236) {
      const w = 1 + Math.floor(r() * 3);
      if (r() > 0.32) out.push({ x, w });
      x += w + 1 + Math.floor(r() * 2);
    }
    return out;
  }, [seed]);
  return (
    <svg className="pm-barcode" viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b, i) => (
        <motion.rect
          key={seed + i}
          x={b.x}
          y="0"
          width={b.w}
          height="40"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, ease: EXPO, delay: i * 0.004 }}
          style={{ originY: "100%" }}
        />
      ))}
    </svg>
  );
}

/** A 21×21 two-dimensional code: three hollow finder squares, timing rows, seeded data modules. */
function Grid({ seed }: { seed: string }) {
  const N = 21;
  const cells = useMemo(() => {
    const r = seeded(seed + "grid");
    const finder = (x: number, y: number) => {
      const fx = x < 7 ? x : x > N - 8 ? x - (N - 7) : -1;
      const fy = y < 7 ? y : y > N - 8 ? y - (N - 7) : -1;
      if (fx < 0 || fy < 0 || (x > N - 8 && y > N - 8)) return null;
      const ring = fx === 0 || fx === 6 || fy === 0 || fy === 6;
      const core = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
      return ring || core;
    };
    const out: boolean[] = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const f = finder(x, y);
        const sep = (x === 7 && (y < 8 || y > N - 9)) || (y === 7 && (x < 8 || x > N - 9)) || (x === N - 8 && y < 8) || (y === N - 8 && x < 8);
        if (f !== null) out.push(f);
        else if (sep) out.push(false);
        else if (x === 6 || y === 6) out.push((x + y) % 2 === 0);
        else out.push(r() > 0.52);
      }
    return out;
  }, [seed]);
  return (
    <svg className="pm-grid21" viewBox={`0 0 ${N} ${N}`} aria-hidden="true" shapeRendering="crispEdges">
      {cells.map((c, i) => (c ? <rect key={i} x={i % N} y={Math.floor(i / N)} width="1" height="1" /> : null))}
    </svg>
  );
}

/** a ragged tear along one edge, as a clip-path polygon */
function tornEdge(side: "right" | "bottom", teeth = 34, depth = 5) {
  const pts: string[] = [];
  if (side === "right") {
    pts.push("0 0");
    for (let i = 0; i <= teeth; i++) {
      const y = (i / teeth) * 100;
      const d = i % 2 === 0 ? 0 : depth * (0.6 + ((i * 37) % 7) / 10);
      pts.push(`calc(100% - ${d.toFixed(1)}px) ${y.toFixed(2)}%`);
    }
    pts.push("0 100%");
  } else {
    pts.push("0 0", "100% 0");
    for (let i = teeth; i >= 0; i--) {
      const x = (i / teeth) * 100;
      const d = i % 2 === 0 ? 0 : depth * (0.6 + ((i * 37) % 7) / 10);
      pts.push(`${x.toFixed(2)}% calc(100% - ${d.toFixed(1)}px)`);
    }
  }
  return `polygon(${pts.join(", ")})`;
}

/** The chosen option, circled in pen. */
function PenRing() {
  const reduced = useReducedMotion();
  return (
    <svg className="pm-ring" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <motion.path
        d="M80 5C60 0 17 1 6 12-4 23 15 37 50 37 84 37 100 28 95 15 91 6 71 2 51 4"
        vectorEffect="non-scaling-stroke"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 0.5, ease: EXPO }, opacity: { duration: 0.08 } }}
      />
    </svg>
  );
}

/** A single-choice group: arrow keys move the choice, one tab stop. */
function Choices<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  label,
  className = "",
  optionClass = "",
  optionLabel,
  render,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelledBy?: string;
  label?: string;
  className?: string;
  optionClass?: string;
  optionLabel?: (v: T) => string;
  render: (v: T, on: boolean) => ReactNode;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = options.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next]);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} aria-label={label} className={className}>
      {options.map((o, i) => (
        <button
          key={o}
          ref={(el) => void (refs.current[i] = el)}
          type="button"
          role="radio"
          aria-checked={o === value}
          aria-label={optionLabel?.(o)}
          tabIndex={o === value ? 0 : -1}
          className={`${optionClass} ${o === value ? "is-on" : ""}`}
          onClick={() => onChange(o)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {render(o, o === value)}
        </button>
      ))}
    </div>
  );
}

export function Permit() {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const [mode, setMode] = useState<Mode>("team");
  const [team, setTeam] = useState("");
  const [company, setCompany] = useState("");
  const [bay, setBay] = useState<Bay>("01");
  const [supply, setSupply] = useState<Supply>("Equipment");
  const [status, setStatus] = useState<Status>("idle");
  const statusRef = useRef<Status>(status);
  statusRef.current = status;
  const stacked = useMedia(STACKED_MQ);
  const coarse = useMedia(COARSE_MQ);

  // the number re-draws once typing pauses, not on every keystroke
  const name = mode === "team" ? team : company;
  // the stub won't tear until the permit has a name on it: it stretches, then snaps back with a note
  const filled = name.trim().length > 0;
  const [need, setNeed] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const needTimer = useRef(0);
  const askToFill = () => {
    setNeed(true);
    window.clearTimeout(needTimer.current);
    needTimer.current = window.setTimeout(() => setNeed(false), 2600);
    nameRef.current?.focus({ preventScroll: true });
  };
  const [seed, setSeed] = useState({ mode, name: "" });
  useEffect(() => {
    if (seed.mode !== mode) {
      setSeed({ mode, name: name.trim() });
      return;
    }
    const t = window.setTimeout(() => setSeed({ mode, name: name.trim() }), 320);
    return () => window.clearTimeout(t);
  }, [mode, name, seed.mode]);
  const seedName = seed.mode === mode ? seed.name : name.trim();
  const no = permitNo(mode, bay, supply, seedName);
  const mailto = draftMailto(mode, team, company, bay, supply, no);
  const task = TASK[bay];

  // ── tilt, glare, recoil ───────────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const stubRef = useRef<HTMLDivElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(72);
  const gy = useMotionValue(-10);
  // critically damped: settles without a wobble; the glare eases home on its own spring too
  const srx = useSpring(rx, { stiffness: 170, damping: 26 });
  const sry = useSpring(ry, { stiffness: 170, damping: 26 });
  const sgx = useSpring(gx, { stiffness: 120, damping: 20 });
  const sgy = useSpring(gy, { stiffness: 120, damping: 20 });
  const mx = useMotionTemplate`${sgx}%`;
  const my = useMotionTemplate`${sgy}%`;
  // the card recoils as the stub lets go, then recentres once the stub's column is empty
  const recoil = useMotionValue(0);
  const shift = useMotionValue(0);
  const dragging = useRef(false);
  const touchTimer = useRef(0);
  const tilt = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    // a little gentler than a boarding pass: this one has fields to fill in
    ry.set((px - 0.5) * 16);
    rx.set(-(py - 0.5) * 12);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const rest = () => {
    rx.set(0);
    ry.set(0);
    gx.set(72);
    gy.set(-10);
  };
  const move = (e: RPointerEvent) => {
    if (rm() || dragging.current || e.pointerType === "touch") return;
    tilt(e.clientX, e.clientY);
  };
  const down = (e: RPointerEvent) => {
    if (rm() || e.pointerType !== "touch") return;
    // touch: tip toward the tap, then spring back
    tilt(e.clientX, e.clientY);
    window.clearTimeout(touchTimer.current);
    touchTimer.current = window.setTimeout(rest, 600);
  };

  // ── the stub: pull along the perforation axis (sideways, on every layout) until it gives ──
  const sx = useMotionValue(0);
  const sy = useMotionValue(0);
  const sop = useMotionValue(1);
  const rot = useTransform(sx, (v) => v * (stacked ? 0.02 : 0.06));
  const sag = useTransform(sx, (v) => (stacked ? 0 : Math.abs(v) * 0.12));
  const prev = useRef<Status>(status);
  const flung = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    const was = prev.current;
    prev.current = status;
    if (status === "idle") {
      animate(shift, 0, { type: "spring", stiffness: 220, damping: 28 });
      if (was === "idle") {
        sx.set(0);
        sy.set(0);
        sop.set(1);
        return;
      }
      // "Start over": a fresh stub slides back in along the perforation
      sy.set(0);
      if (rm()) {
        sx.set(0);
        sop.set(1);
        return;
      }
      sx.set(60);
      sop.set(0);
      animate(sx, 0, { type: "spring", stiffness: 260, damping: 26 });
      animate(sop, 1, { duration: 0.35, ease: "easeOut" });
      return;
    }
    if (status !== "tearing") {
      // torn: the empty stub column closes up and the permit recentres (desktop)
      if (!stacked && !rm()) animate(shift, 100, { type: "spring", stiffness: 160, damping: 24 });
      else shift.set(0);
      return;
    }
    if (rm()) {
      animate(sop, 0, { duration: 0.15 });
      return;
    }
    const v = flung.current;
    animate(sx, sx.get() + (stacked ? 220 : 200), { type: "spring", stiffness: 200, damping: 24, velocity: Math.max(v, 400) });
    animate(sy, stacked ? 30 : 80, { type: "spring", stiffness: 200, damping: 24 });
    animate(sop, 0, { duration: 0.5, delay: 0.12, ease: "easeIn" });
    // a small counter-rotation in the card, sprung back
    animate(recoil, 0, { type: "spring", stiffness: 300, damping: 12, velocity: stacked ? -10 : -26 });
  }, [status, stacked, sx, sy, sop, shift, recoil]);

  // keyboard tears hand focus on to "Start over" once the stub has gone
  useEffect(() => {
    if (status !== "torn") return;
    const a = document.activeElement;
    if (a && stubRef.current?.contains(a)) againRef.current?.focus({ preventScroll: true });
  }, [status]);

  const tear = (v: number) => {
    if (statusRef.current !== "idle") return;
    statusRef.current = "tearing";
    const fresh = permitNo(mode, bay, supply, name);
    setSeed({ mode, name: name.trim() });
    flung.current = v;
    dragging.current = false;
    setStatus("tearing");
    const href = draftMailto(mode, team, company, bay, supply, fresh);
    const quick = rm();
    timers.current.push(
      window.setTimeout(() => setStatus((s) => (s === "tearing" ? "torn" : s)), quick ? 160 : 460),
      // let the stub get going before the email app takes over
      window.setTimeout(() => void (window.location.href = href), quick ? 0 : 320),
    );
  };
  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    statusRef.current = "idle";
    setStatus("idle");
  };
  const startOver = () => {
    reset();
    window.requestAnimationFrame(() => stubRef.current?.focus({ preventScroll: true }));
  };
  /** Any edit after tearing puts a fresh stub back on the permit. */
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    if (statusRef.current !== "idle") reset();
  };

  const threshold = () => (stacked ? Math.max(60, (stubRef.current?.offsetWidth ?? 300) * 0.4) : 120);
  const onPan = (_: unknown, info: PanInfo) => {
    if (statusRef.current !== "idle") return;
    const dx = Math.max(0, info.offset.x);
    const th = threshold();
    if (!filled) {
      // not filled in yet: the perforation holds, the stub just stretches
      sx.set(th * 0.55 * Math.tanh(dx / (th * 0.9)));
      return;
    }
    // resistance before the perforation gives: the stub follows less and less, then tears mid-drag
    if (dx > th) {
      tear(info.velocity.x);
      return;
    }
    sx.set(th * 0.78 * Math.tanh(dx / (th * 0.78)));
  };
  const onPanEnd = (_: unknown, info: PanInfo) => {
    dragging.current = false;
    if (statusRef.current !== "idle") return;
    if (!filled) {
      animate(sx, 0, { type: "spring", stiffness: 700, damping: 14 });
      if (info.offset.x > 24) askToFill();
      return;
    }
    if (info.velocity.x > 700 && info.offset.x > 40) tear(info.velocity.x);
    else animate(sx, 0, { type: "spring", stiffness: 520, damping: 32 });
  };
  const onStubKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (!filled) return askToFill();
    tear(0);
  };
  // a small give on hover says the stub moves
  const nudge = (to: number) => {
    if (dragging.current || statusRef.current !== "idle" || rm()) return;
    animate(sx, to, { type: "spring", stiffness: 400, damping: 30 });
  };

  const torn = status !== "idle";
  const isTeam = mode === "team";

  return (
    <MotionConfig reducedMotion="user">
      <section className="permit" aria-labelledby={id("title")}>
        <Choices
          options={MODES}
          value={mode}
          onChange={edit(setMode)}
          label="Who is applying"
          className="pm-toggle"
          optionClass="pm-toggle__opt"
          render={(m, on) => (
            <>
              {on && <motion.span layoutId={`${uid}-pill`} className="pm-toggle__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="pm-toggle__txt">{MODE_LABEL[m]}</span>
            </>
          )}
        />

        <div className="pm-stage" onPointerMove={move} onPointerLeave={rest} onPointerDown={down}>
          <motion.div
            ref={cardRef}
            className={`pm-card is-${status} is-${mode}`}
            style={{ x: shift, rotate: recoil, rotateX: srx, rotateY: sry, transformPerspective: 1300, ["--mx" as string]: mx, ["--my" as string]: my }}
          >
            <div className="pm-main" style={{ clipPath: torn ? tornEdge(stacked ? "bottom" : "right") : undefined }}>
              <div className="pm-cell pm-head">
                <div className="pm-head__l">
                  <span className="pm-label pm-kicker">
                    <Swap value={isTeam ? "HRCG 2027 · Robot entry" : "HRCG 2027 · Supplier entry"} />
                  </span>
                  <h3 className="pm-title" id={id("title")}>
                    Site permit
                  </h3>
                </div>
                <div className="pm-head__r">
                  <span className={`pm-status ${status === "torn" ? "is-done" : ""}`}>
                    <Decipher text={status === "torn" ? "Drafted · not sent" : "Not yet filed"} />
                  </span>
                  <Barcode seed={no} />
                </div>
              </div>

              <div className="pm-cell pm-name">
                <label className="pm-label" htmlFor={id("name")}>
                  <Swap value={isTeam ? "Team" : "Company"} />
                </label>
                <input
                  id={id("name")}
                  className={need ? "pm-input pm-need" : "pm-input"}
                  type="text"
                  autoComplete="organization"
                  spellCheck={false}
                  maxLength={60}
                  placeholder={isTeam ? "Your team" : "Your company"}
                  ref={nameRef}
                  value={name}
                  aria-invalid={need || undefined}
                  onChange={(e) => edit(isTeam ? setTeam : setCompany)(e.target.value)}
                />
              </div>

              <div className="pm-fold" inert={isTeam} aria-hidden={isTeam || undefined}>
                <div className="pm-cell pm-supply">
                  <span className="pm-label" id={id("supply")}>
                    Supplying
                  </span>
                  <Choices
                    options={SUPPLIES}
                    value={supply}
                    onChange={edit(setSupply)}
                    labelledBy={id("supply")}
                    className="pm-opts"
                    optionClass="pm-opt"
                    render={(s, on) => (
                      <>
                        {s}
                        {on && <PenRing />}
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="pm-cell pm-pick">
                <span className="pm-label" id={id("bay")}>
                  <Swap value={isTeam ? "Bay" : "Bay you would equip"} />
                </span>
                <Choices
                  options={BAYS}
                  value={bay}
                  onChange={edit(setBay)}
                  labelledBy={id("bay")}
                  className="pm-opts"
                  optionClass="pm-opt pm-opt--bay"
                  optionLabel={(b) => `${b} ${TASK[b]}`}
                  render={(b, on) => (
                    <>
                      {b}
                      {on && <PenRing />}
                    </>
                  )}
                />
              </div>

              <div className="pm-cell pm-bay">
                <span className="pm-label">Challenge</span>
                <div className="pm-bay__body">
                  <span className="pm-bay__num">
                    <Code value={bay} />
                  </span>
                  <span className="pm-value pm-bay__task">
                    <Swap value={task} className="pm-swap--wrap" />
                  </span>
                </div>
              </div>

              <div className="pm-cell pm-site">
                <span className="pm-label">Site</span>
                <span className="pm-value">New York City</span>
              </div>
              <div className="pm-cell pm-date">
                <span className="pm-label">Date</span>
                <span className="pm-value">To be announced</span>
              </div>
              <div className="pm-cell pm-no">
                <span className="pm-label">
                  <Swap value={isTeam ? "Permit no." : "Submittal no."} />
                </span>
                <span className="pm-value pm-value--mono">
                  <Swap value={no} />
                </span>
              </div>

              <AnimatePresence>
                {status === "torn" && (
                  <motion.div
                    className="pm-stamp"
                    style={{ x: "-50%", y: "-50%" }}
                    initial={{ scale: 1.7, opacity: 0, rotate: -22 }}
                    animate={{ scale: 1, opacity: 1, rotate: -7 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.2 }}
                  >
                    <strong>
                      <Decipher text="Request drafted" onMount />
                    </strong>
                    <span>Your email app opens with it filled in</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              ref={stubRef}
              className="pm-stub"
              role="button"
              tabIndex={torn ? -1 : 0}
              aria-hidden={torn || undefined}
              aria-label={`Tear off the stub to draft the email for ${no}`}
              aria-describedby={id("hint")}
              onKeyDown={onStubKey}
              onHoverStart={() => nudge(6)}
              onHoverEnd={() => nudge(0)}
              onPanStart={() => {
                dragging.current = true;
                rest();
              }}
              onPan={onPan}
              onPanEnd={onPanEnd}
              style={{ x: sx, y: stacked ? sy : sag, rotate: rot, opacity: sop, touchAction: "pan-y" }}
            >
              <span className={`pm-grip ${need ? "is-need" : ""}`} aria-live="polite">
                {need ? (isTeam ? "Write your team name first" : "Write your company name first") : coarse ? "Swipe to tear →" : "Tear to send →"}
              </span>
              <span className="pm-stub__bay">
                <span className="pm-label">Bay</span>
                <span className="pm-stub__num">
                  <Swap value={bay} />
                </span>
                <span className="pm-stub__task">
                  <Swap value={task} className="pm-swap--wrap" />
                </span>
              </span>
              <span className="pm-stub__code">
                <Grid seed={no} />
                <span className="pm-stub__no">{no}</span>
              </span>
            </motion.div>
          </motion.div>
        </div>

        <p className="pm-after">
          {status === "torn" ? (
            <button ref={againRef} type="button" className="pm-link" onClick={startOver}>
              Start over
            </button>
          ) : (
            <span id={id("hint")}>Nothing is sent until you press send.</span>
          )}
          <span className="pm-dot" aria-hidden="true">
            ·
          </span>
          <a className="pm-link" href={mailto}>
            Email us instead
          </a>
        </p>
        <p className="pm-sr" role="status" aria-live="polite">
          {status === "torn" ? "Request drafted. Your email app opens with it filled in." : ""}
        </p>
      </section>
    </MotionConfig>
  );
}
