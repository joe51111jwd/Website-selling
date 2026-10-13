// 2b · The spec sheet: "That was one day. Here's everything it does." (BRIEF round 2 §10)
//
// Contractors buy iron off spec sheets, so the full feature list is one, framed by a heavy ink rule
// on top and a double rule underneath: a model plate and four key specs, then six ruled sections,
// each with its outcome, EVERY one of its tools by name (the top three in ink, the rest a step
// quieter) and its count as a big tabular figure; under the double rule, beside the CTA, the counts
// add up to the total. At face value, in three seconds: six sections, 38 named tools, one sum.
//
// Pointing at a section glides one paper band onto it; a tool's name underlines ("See it"). Click a
// section (or a tool's name, to land on that tool) and the sheet folds in place, never taller than
// the screen: the names and counts fly into an index on the left, every tool becomes a row (name,
// one plain line, field / office), and the row you point at or focus drives a live render of the
// real app screen on the right, with a ring on the exact spot. Phones show each section's top three
// and "+N more" (the full names don't fit a 390 px screen), "Show everything" for the wall of all
// 38, and tapping a tool opens its screen inline.
//
// No devices here. They don't shrink away: as the sheet rises they glide out past the edges,
// turning (the laptop left, the phone right; the Stage's `out`), and Try it's first key brings the
// phone back in.

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, useInView, type Variants } from "motion/react";
import { CTA, SPEC } from "../../content/copy";
import { Logo } from "../../brand/Logo";
import { Scene } from "../scene/Scene";
import { exitKeys, reducedMotion } from "../../three/stage";
import { Cta, DemoLink } from "../ui/Cta";
import { playCue } from "../ui/cue";
import { CATEGORIES, TOOL_COUNT, screensOf, type Category, type Tool } from "./data";
import { Roll } from "./Roll";
import { Snippet, warmScreen } from "./Snippet";
import "./specsheet.css";

type View = { kind: "sheet" } | { kind: "cat"; cat: string; tool: string | null } | { kind: "all" };

const ease = [0.22, 1, 0.36, 1] as const;

// ─── small helpers ───────────────────────────────────────────────────────────

const PHONE_Q = "(max-width: 760px)";
function usePhone() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(PHONE_Q);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(PHONE_Q).matches,
    () => false,
  );
}

const catById = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

function warm(c: Category) {
  screensOf(c).forEach(warmScreen);
}

/** Arrow keys move focus within a list (Up/Down, Home/End); in a grid also across columns. */
function arrows(e: KeyboardEvent<HTMLElement>, selector: string, grid = false) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End", ...(grid ? ["ArrowLeft", "ArrowRight"] : [])];
  if (!keys.includes(e.key)) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>(selector)];
  const i = items.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  let j = i;
  if (e.key === "ArrowDown") j = Math.min(items.length - 1, i + 1);
  else if (e.key === "ArrowUp") j = Math.max(0, i - 1);
  else if (e.key === "Home") j = 0;
  else if (e.key === "End") j = items.length - 1;
  else {
    const col = Number(items[i].dataset.col);
    const row = Number(items[i].dataset.row);
    const next = items.filter((el) => Number(el.dataset.col) === col + (e.key === "ArrowRight" ? 1 : -1));
    if (next.length) j = items.indexOf(next[Math.min(row, next.length - 1)]);
  }
  items[j]?.focus();
}

function Flag() {
  return (
    <span className="flag spec-flag" title={SPEC.flagTitle} aria-label={SPEC.flagTitle} role="img">
      ⚑
    </span>
  );
}

function Chevron({ className = "spec-chev" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GridGlyph() {
  return (
    <svg className="spec-glyph" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {[2, 7.25, 12.5].flatMap((x) =>
        [2, 7.25, 12.5].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="3.5" height="3.5" rx="0.9" fill="currentColor" />),
      )}
    </svg>
  );
}

function Close({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="spec-close" onClick={onClick} aria-label={label}>
      <span>{SPEC.close}</span>
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

const sideLabel = (t: Tool) => SPEC.side[t.side];
const captionFor = (t: Tool) => `${SPEC.app[t.shot.kind]} · ${SPEC.screen[t.shot.screen] ?? t.shot.screen}`;

// ─── the scene ───────────────────────────────────────────────────────────────

/**
 * The devices' exit (the Stage's exitKeys): over the scroll from One Day's last key to this
 * section's top (the sheet rising), the laptop glides out past the left edge and the phone past
 * the right, turning: never a vanish (BRIEF round 2 §6). Try it brings the phone back from the
 * right (its returnKeys). The recipe's last key (at: 1) is dropped: this one-screen scene isn't
 * pinned, so that key would sit exactly on Try it's first key and turn its glide into a pop.
 */
const EXIT = exitKeys({ start: -0.98, end: 0, side: { macbook: -1, iphone: 1, display: 1 } }).slice(0, 2);

export default function SpecSheet() {
  return (
    <Scene id="specs" pinnedViewports={1} poses={EXIT} label={SPEC.label} className="spec">
      <SpecInner />
    </Scene>
  );
}

function SpecInner() {
  const phoneUI = usePhone();
  const [view, setView] = useState<View>({ kind: "sheet" });
  const root = useRef<HTMLDivElement>(null);
  const seen = useInView(root, { once: true, amount: 0.18 });
  const play = seen || reducedMotion;
  // the entrance (rules draw, rows cascade, counts roll, the total adds up) plays once
  const [entered, setEntered] = useState(reducedMotion);
  // how many sections have landed: the total adds up as they do
  const [landed, setLanded] = useState(reducedMotion ? CATEGORIES.length : 0);
  // where focus goes back to when a panel closes
  const back = useRef<string | null>(null);

  useEffect(() => {
    if (entered || !play) return;
    const timers = CATEGORIES.map((_, i) => window.setTimeout(() => setLanded(i + 1), (ROW_START + i * ROW_STEP + 0.18) * 1000));
    timers.push(window.setTimeout(() => setEntered(true), (ROW_START + CATEGORIES.length * ROW_STEP + 0.6) * 1000));
    return () => timers.forEach(clearTimeout);
  }, [play, entered]);

  const open = useCallback((cat: string, tool: string | null = null) => {
    warm(catById(cat));
    setEntered(true);
    setView({ kind: "cat", cat, tool });
  }, []);
  const viewNow = useRef(view);
  useLayoutEffect(() => {
    viewNow.current = view;
  });
  const close = useCallback(() => {
    const v = viewNow.current;
    back.current = v.kind === "cat" ? `[data-cat="${v.cat}"]` : v.kind === "all" ? "[data-all]" : null;
    setView({ kind: "sheet" });
  }, []);
  const showAll = useCallback(() => {
    setEntered(true);
    setView({ kind: "all" });
  }, []);

  // the CTA's one geofence cue lands after the sheet has added up to its total, not during it
  const cued = useRef(false);
  useEffect(() => {
    const b = root.current?.querySelector<HTMLElement>(".spec-cta");
    if (!entered || cued.current || reducedMotion || !b) return;
    let cancel: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || cued.current) return;
        cued.current = true;
        io.disconnect();
        cancel = playCue(b);
      },
      { threshold: 0.98 },
    );
    io.observe(b);
    return () => {
      io.disconnect();
      cancel?.();
    };
  }, [entered]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && view.kind !== "sheet") {
      e.stopPropagation();
      close();
    }
  };

  const shown = entered || play;
  const total = entered ? TOOL_COUNT : CATEGORIES.slice(0, landed).reduce((n, c) => n + c.tools.length, 0);
  const rule = (delay: number) =>
    entered
      ? { initial: false as const, animate: { scaleX: 1 } }
      : { initial: { scaleX: 0 }, animate: { scaleX: shown ? 1 : 0 }, transition: { duration: 0.9, ease, delay } };

  return (
    <div ref={root} className="spec-in wrap" data-view={view.kind} onKeyDown={onKey}>
      <h2 className="t-h2 spec-title">
        <span className="spec-title-a">{SPEC.kicker}</span> <span className="spec-title-b">{SPEC.title}</span>
      </h2>

      {/* the sheet's frame: a heavy rule on top, a double rule under it; what's between them changes */}
      <motion.span className="spec-rule-heavy" aria-hidden="true" {...rule(0)} />
      <LayoutGroup id="spec">
        <div className="spec-body">
          <AnimatePresence initial={false}>
            {view.kind === "sheet" && (
              <Sheet
                key="sheet"
                shown={shown}
                entered={entered}
                total={total}
                phoneUI={phoneUI}
                onOpen={open}
                onAll={showAll}
                focusBack={back}
              />
            )}
            {view.kind === "cat" && (
              <Detail
                key="detail"
                cat={catById(view.cat)}
                toolId={view.tool}
                phoneUI={phoneUI}
                onCat={(c) => open(c)}
                onTool={(t) => setView((v) => (v.kind === "cat" && v.tool !== t ? { ...v, tool: t } : v))}
                onClose={close}
              />
            )}
            {view.kind === "all" && <Wall key="wall" onPick={(c, t) => open(c, t)} onClose={close} />}
          </AnimatePresence>
        </div>
      </LayoutGroup>
      <motion.span className="spec-rule-double" aria-hidden="true" {...rule(ROW_START + CATEGORIES.length * ROW_STEP)} />

      <div className="spec-foot">
        <Cta source="specsheet" size="lg" cursorLabel="Clocked in · {time}" className="spec-cta" cue={false} />
        <div className="spec-foot-alt">
          <DemoLink source="specsheet" className="spec-demo" />
          <p className="t-micro spec-micro">{CTA.micro}</p>
        </div>
        {!phoneUI && <Total value={total} className="spec-foot-total" show={entered || landed > 0} />}
      </div>
    </div>
  );
}

/** The sum under the double rule: every tool on the sheet (it arrives with the first section). */
function Total({ value, className, show = true }: { value: number; className?: string; show?: boolean }) {
  return (
    <motion.p
      className={`spec-total-n${className ? ` ${className}` : ""}`}
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <span className="spec-total-k">{SPEC.total}</span>
      <Roll value={value} digits={2} />
      <span className="spec-unit">{SPEC.unit}</span>
    </motion.p>
  );
}

// ─── collapsed: the sheet ────────────────────────────────────────────────────

const ROW_STEP = 0.085;
const ROW_START = 0.28;
const hotSpring = { type: "spring", stiffness: 520, damping: 44, mass: 0.8 } as const;

function Sheet({
  shown,
  entered,
  total,
  phoneUI,
  onOpen,
  onAll,
  focusBack,
}: {
  shown: boolean;
  entered: boolean;
  total: number;
  phoneUI: boolean;
  onOpen: (cat: string, tool?: string | null) => void;
  onAll: () => void;
  focusBack: React.RefObject<string | null>;
}) {
  const el = useRef<HTMLDivElement>(null);
  // the row under the pointer (or keyboard focus): one paper band glides between rows
  const [hot, setHot] = useState<string | null>(null);

  // coming back from a panel: focus returns to what opened it
  useLayoutEffect(() => {
    const sel = focusBack.current;
    if (!sel) return;
    focusBack.current = null;
    el.current?.querySelector<HTMLElement>(sel)?.focus({ preventScroll: true });
  }, [focusBack]);

  const fx = (i: number) =>
    entered
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 14 },
          animate: shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
          transition: { duration: 0.6, ease, delay: ROW_START + i * ROW_STEP },
        };

  return (
    <motion.div
      ref={el}
      className="spec-sheet spec-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.12 } }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
    >
      <dl className="spec-keys">
        <motion.div className="spec-plate" {...fx(-2)}>
          <Logo variant="mark" className="spec-plate-mark" />
          <span>
            <strong>{SPEC.plate.name}</strong>
            <span>{SPEC.plate.sub}</span>
          </span>
        </motion.div>
        {SPEC.specs.map((s, i) => (
          <motion.div key={s.k} className="spec-key" {...fx(-1.6 + i * 0.4)}>
            <dt>{s.k}</dt>
            <dd>{s.v}</dd>
          </motion.div>
        ))}
      </dl>

      <ul className="spec-rows" onKeyDown={(e) => arrows(e, ".spec-row")} onPointerLeave={() => setHot(null)}>
        {CATEGORIES.map((c, i) => {
          const more = c.tools.length - 3;
          return (
            <motion.li key={c.id} className="spec-row-li" {...fx(i)}>
              <AnimatePresence>
                {hot === c.id && (
                  <motion.span
                    key="hot"
                    layoutId="spec-hot"
                    className="spec-hot"
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.18 } }}
                    transition={hotSpring}
                  />
                )}
              </AnimatePresence>
              <button
                type="button"
                className="spec-row"
                data-cat={c.id}
                aria-expanded={false}
                aria-controls="spec-panel"
                data-cursor-label={SPEC.tools(c.tools.length)}
                // a click on one tool's name opens the section on that tool
                onClick={(e) => onOpen(c.id, (e.target as Element).closest<HTMLElement>("[data-tool-id]")?.dataset.toolId ?? null)}
                onPointerEnter={(e) => {
                  warm(c);
                  if (!phoneUI && e.pointerType === "mouse") setHot(c.id);
                }}
                onFocus={() => {
                  warm(c);
                  if (!phoneUI) setHot(c.id);
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.closest(".spec-rows")?.contains(e.relatedTarget as Node | null)) setHot(null);
                }}
              >
                <span className="spec-row-head">
                  <motion.span layoutId={`spec-name-${c.id}`} className="spec-row-name">
                    {c.name}
                  </motion.span>
                  <span className="spec-row-out">{c.outcome}</span>
                </span>
                <span className="spec-row-tools">
                  {c.tools.map((t, k) => (
                    <Fragment key={t.id}>
                      {k > 0 && " "}
                      <span
                        className={`spec-row-tool${k < 3 ? " is-top" : ""}${k === c.tools.length - 1 ? " is-last" : ""}`}
                        data-tool-id={t.id}
                        data-cursor="view"
                        data-cursor-label={SPEC.view}
                      >
                        <span className="spec-full">{t.label}</span>
                        {SPEC.short[t.id] && <span className="spec-short">{SPEC.short[t.id]}</span>}
                        {t.confirm && <Flag />}
                        {k < c.tools.length - 1 && <span className="sr-only">,</span>}
                      </span>
                    </Fragment>
                  ))}
                  {more > 0 && <span className="spec-row-more"> {SPEC.more(more)}</span>}
                </span>
                <motion.span layoutId={`spec-count-${c.id}`} className="spec-row-count">
                  <Roll value={shown ? c.tools.length : 0} delay={entered ? 0 : ROW_START + i * ROW_STEP + 0.08} />
                  <span className="spec-unit">{SPEC.unit}</span>
                </motion.span>
                <Chevron />
              </button>
              <motion.span
                className="spec-rule"
                aria-hidden="true"
                initial={entered ? false : { scaleX: 0 }}
                animate={{ scaleX: shown ? 1 : 0 }}
                transition={{ duration: 0.7, ease, delay: entered ? 0 : ROW_START + i * ROW_STEP }}
              />
            </motion.li>
          );
        })}
      </ul>

      {/* phones: the sheet shows each section's top three, so the full list is one tap away */}
      {phoneUI && (
        <motion.div className="spec-total" {...fx(CATEGORIES.length)}>
          <button type="button" className="spec-all" data-all aria-expanded={false} aria-controls="spec-wall" onClick={onAll}>
            <GridGlyph />
            <span>{SPEC.all}</span>
          </button>
          <Total value={total} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── open: one section, every tool, the real screen ──────────────────────────

const listV: Variants = {
  hidden: {},
  // the rows wait for the counts to land in the index (they fly across this column)
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};
const rowV: Variants = {
  hidden: { opacity: 0, x: 22 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } },
};

function Detail({
  cat,
  toolId,
  phoneUI,
  onCat,
  onTool,
  onClose,
}: {
  cat: Category;
  toolId: string | null;
  phoneUI: boolean;
  onCat: (id: string) => void;
  onTool: (id: string | null) => void;
  onClose: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  // desktop always shows one tool (the first until you point at another); phones open none until tapped
  const sel = cat.tools.find((t) => t.id === toolId) ?? (phoneUI ? null : cat.tools[0]);

  // pointing picks a tool, but only once the mouse has actually moved since the panel opened: the
  // pointer is resting wherever the click that opened it was, and the browser's synthetic moves
  // after the layout change must not swap the tool you clicked for the row that landed under it
  const origin = useRef<{ x: number; y: number } | null>(null);
  const armed = useRef(false);
  useEffect(() => {
    origin.current = null;
    armed.current = false;
  }, [cat.id]);
  const pointTo = (e: React.PointerEvent, id: string) => {
    if (phoneUI || e.pointerType !== "mouse") return;
    if (!armed.current) {
      const o = origin.current;
      if (!o) {
        origin.current = { x: e.clientX, y: e.clientY };
        return;
      }
      if (Math.hypot(e.clientX - o.x, e.clientY - o.y) < 10) return;
      armed.current = true;
    }
    if (id !== sel?.id) onTool(id);
  };
  const idx = CATEGORIES.indexOf(cat);
  const nextCat = CATEGORIES[(idx + 1) % CATEGORIES.length];

  // a list taller than its panel fades at the bottom until it's scrolled to the end, and at the top
  // once it has scrolled (rows soften under the rule instead of being sliced by it)
  useEffect(() => {
    const l = list.current;
    if (!l) return;
    const sync = () => {
      l.classList.toggle("has-more", l.scrollHeight - l.clientHeight - l.scrollTop > 4);
      l.classList.toggle("has-above", l.scrollTop > 4);
    };
    const t = window.setTimeout(sync, 700);
    l.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(l);
    return () => {
      window.clearTimeout(t);
      l.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [cat.id, toolId]);

  // phones: once a tapped row has opened, scroll the list (only the list) so its screen is in view
  useEffect(() => {
    if (!phoneUI || !toolId) return;
    const t = window.setTimeout(() => {
      const l = list.current;
      const li = l?.querySelector<HTMLElement>(`[data-tool="${toolId}"]`)?.closest("li");
      if (!l || !li) return;
      const top = li.offsetTop; // .spec-list is the offset parent
      const over = top + li.offsetHeight - (l.scrollTop + l.clientHeight);
      if (top < l.scrollTop) l.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      else if (over > 0) l.scrollTo({ top: Math.min(top, l.scrollTop + over + 8), behavior: reducedMotion ? "auto" : "smooth" });
    }, 420);
    return () => window.clearTimeout(t);
  }, [phoneUI, toolId]);

  // on open (and on switching section) focus lands on the picked tool, or the first one; a tool
  // picked from the sheet that sits low in a long list is scrolled into view (the list only)
  useEffect(() => {
    // switching from the index: focus stays on the index (like tabs), it isn't pulled into the list
    if (el.current?.querySelector(".spec-index")?.contains(document.activeElement)) {
      list.current?.scrollTo({ top: 0 });
      return;
    }
    const t = window.setTimeout(() => {
      const target = toolId
        ? el.current?.querySelector<HTMLElement>(`[data-tool="${toolId}"]`)
        : el.current?.querySelector<HTMLElement>(phoneUI ? ".spec-back" : "[data-tool]");
      target?.focus({ preventScroll: true });
      const l = list.current;
      const li = toolId ? target?.closest("li") : null;
      if (l && li && li.offsetTop + li.offsetHeight > l.scrollTop + l.clientHeight)
        l.scrollTo({ top: li.offsetTop + li.offsetHeight - l.clientHeight + 8 });
    }, 60);
    list.current?.scrollTo({ top: 0 });
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat.id]);

  const rows = (
    <AnimatePresence mode="wait" initial={true}>
      <motion.ul
        key={cat.id}
        className="spec-tools"
        variants={listV}
        initial="hidden"
        animate="show"
        exit="exit"
        onKeyDown={(e) => arrows(e, "[data-tool]")}
      >
        {cat.tools.map((t) => {
          const on = sel?.id === t.id;
          return (
            <motion.li key={t.id} variants={rowV} className={`spec-tool-li${on ? " is-on" : ""}`}>
              <button
                type="button"
                className="spec-tool"
                data-tool={t.id}
                data-cursor="view"
                data-cursor-label={SPEC.view}
                aria-current={!phoneUI && on ? "true" : undefined}
                aria-expanded={phoneUI ? on : undefined}
                aria-controls={phoneUI ? `spec-snip-${t.id}` : "spec-preview"}
                // desktop only: pointing picks the tool for the preview; on the phone layout rows open
                // on a tap only (a stray mouse there must never expand rows under it)
                onPointerEnter={(e) => pointTo(e, t.id)}
                onPointerMove={(e) => pointTo(e, t.id)}
                onFocus={() => !phoneUI && onTool(t.id)}
                onClick={() => onTool(phoneUI && on ? null : t.id)}
              >
                <span className="spec-tool-name">
                  <span className="spec-tool-dot" aria-hidden="true" />
                  {t.label}
                  {t.confirm && <Flag />}
                </span>
                <span className="spec-tool-side">{sideLabel(t)}</span>
                <span className="spec-tool-line">{t.line}</span>
                {phoneUI && <Chevron className="spec-tool-chev" />}
              </button>
              {phoneUI && (
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`spec-snip-${t.id}`}
                      className="spec-tool-snip"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.38, ease }}
                    >
                      <div className="spec-tool-frame">
                        <Snippet shot={t.shot} compact toolKey={t.id} />
                      </div>
                      <p className="spec-preview-note">
                        {captionFor(t)} · {t.closest ? SPEC.closest : SPEC.caption}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.li>
          );
        })}
        {phoneUI && (
          <motion.li variants={rowV} className="spec-next-li">
            <button type="button" className="spec-next" onClick={() => onCat(nextCat.id)}>
              <span>
                {SPEC.next}: <strong>{nextCat.name}</strong>
              </span>
              <Chevron />
            </button>
          </motion.li>
        )}
      </motion.ul>
    </AnimatePresence>
  );

  return (
    <motion.div
      ref={el}
      id="spec-panel"
      className="spec-detail spec-view"
      role="region"
      aria-label={cat.name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.25 } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      {phoneUI ? (
        <div className="spec-dhead">
          <button type="button" className="spec-back" onClick={onClose} aria-label={`${SPEC.close} ${cat.name}`}>
            <Chevron className="spec-back-chev" />
            <span>{SPEC.back}</span>
          </button>
          <div className="spec-dhead-t">
            <motion.span layoutId={`spec-name-${cat.id}`} className="spec-dhead-name">
              {cat.name}
            </motion.span>
            <span className="spec-dhead-out">{cat.outcome}</span>
          </div>
          <motion.span layoutId={`spec-count-${cat.id}`} className="spec-dhead-count">
            <Roll value={cat.tools.length} />
            <span className="spec-unit">tools</span>
          </motion.span>
        </div>
      ) : (
        <nav className="spec-index" aria-label={SPEC.label}>
          <ul onKeyDown={(e) => arrows(e, ".spec-ix")}>
            {CATEGORIES.map((c) => {
              const on = c.id === cat.id;
              return (
                <motion.li key={c.id} layout="position" className={`spec-ix-li${on ? " is-on" : ""}`}>
                  <button
                    type="button"
                    className="spec-ix"
                    data-cat={c.id}
                    aria-expanded={on}
                    aria-controls="spec-panel"
                    onClick={() => !on && onCat(c.id)}
                    onPointerEnter={() => warm(c)}
                  >
                    <motion.span layoutId={`spec-name-${c.id}`} className="spec-ix-name">
                      {c.name}
                    </motion.span>
                    <motion.span layoutId={`spec-count-${c.id}`} className="spec-ix-count">
                      <Roll value={c.tools.length} />
                    </motion.span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span
                          className="spec-ix-out"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.32, ease }}
                        >
                          {c.outcome}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </nav>
      )}

      <div ref={list} className="spec-list" data-lenis-prevent>
        {rows}
      </div>

      {!phoneUI && sel && (
        <motion.aside
          id="spec-preview"
          className="spec-preview"
          aria-label={captionFor(sel)}
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
        >
          <div className="spec-preview-bar">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={captionFor(sel)}
                className="spec-preview-cap"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <DeviceGlyph kind={sel.shot.kind} />
                {captionFor(sel)}
              </motion.span>
            </AnimatePresence>
            <Close onClick={onClose} label={`${SPEC.close} ${cat.name}`} />
          </div>
          <div className="spec-preview-frame" data-kind={sel.shot.kind}>
            <Snippet shot={sel.shot} toolKey={sel.id} />
          </div>
          <p className="spec-preview-note">
            {sel.closest && sel.confirm ? (
              <>
                <Flag /> {SPEC.flagTitle}. {SPEC.closest}.
              </>
            ) : sel.closest ? (
              `${SPEC.closest}. ${SPEC.caption}`
            ) : (
              SPEC.caption
            )}
          </p>
        </motion.aside>
      )}
    </motion.div>
  );
}

function DeviceGlyph({ kind }: { kind: "phone" | "web" }) {
  return kind === "phone" ? (
    <svg className="spec-dev" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="4.25" y="1.75" width="7.5" height="12.5" rx="1.9" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 12.1h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ) : (
    <svg className="spec-dev" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.25" y="3" width="11.5" height="7.6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 13h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ─── show everything: the wall (phones, where the sheet shows each section's top three) ──

function Wall({ onPick, onClose }: { onPick: (cat: string, tool: string) => void; onClose: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => el.current?.querySelector<HTMLElement>(".spec-close")?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.div
      ref={el}
      id="spec-wall"
      className="spec-wall spec-view"
      role="region"
      aria-label={SPEC.allTitle(TOOL_COUNT)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.25 } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <div className="spec-wall-bar">
        <h3 className="spec-wall-title">{SPEC.allTitle(TOOL_COUNT)}</h3>
        <Close onClick={onClose} label={`${SPEC.close}: ${SPEC.allTitle(TOOL_COUNT)}`} />
      </div>
      <div className="spec-wall-grid" data-lenis-prevent onKeyDown={(e) => arrows(e, "[data-wall-tool]", true)}>
        <div className="spec-wall-flow">
          {CATEGORIES.map((c, ci) => (
            <section key={c.id} className="spec-wall-col" aria-label={c.name}>
              <motion.h4
                className="spec-wall-h"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease, delay: 0.05 + ci * 0.05 }}
              >
                <span>{c.name}</span>
                <span className="spec-wall-n">{c.tools.length}</span>
              </motion.h4>
              <ul>
                {c.tools.map((t, ti) => (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease, delay: 0.12 + ci * 0.05 + ti * 0.03 }}
                  >
                    <button
                      type="button"
                      className="spec-wall-tool"
                      data-wall-tool={t.id}
                      data-col={ci}
                      data-row={ti}
                      data-cursor-label={SPEC.view}
                      onClick={() => onPick(c.id, t.id)}
                    >
                      <span>{t.label}</span>
                      {t.confirm && <Flag />}
                      <span className="sr-only">. {t.line}</span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <p className="spec-wall-read spec-wall-hint">{SPEC.allHintTouch}</p>
    </motion.div>
  );
}
