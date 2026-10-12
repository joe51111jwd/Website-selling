// 2b · The spec sheet: "That was one day. Here's everything it does." (BRIEF round 2 §10)
//
// Contractors buy iron off spec sheets, so the full feature list is one: a model plate and four
// key specs on a heavy rule, then six ruled sections, each with its outcome, its top three tools in
// plain words and its count of tools as a big tabular figure, summed into a total. One screen, all
// of it at once: skim it in three seconds and the answer is "it does everything".
//
// Open a section and the sheet folds in place (never taller than the screen): the six sections
// become an index on the left, every tool in the section is a row (name, one plain line, field /
// office), and the row you point at or focus shows the real screen for it on the right, a live
// render of the app with a ring on the exact spot. Phones: tapping a row opens its screen inline.
// "Show everything" lays all 38 tools out as one wall. A single primary CTA closes the section.
//
// No devices here. They don't shrink away: as the sheet rises they glide out past the edges,
// turning (the laptop left, the phone right; the Stage's `out`), and Try it's first key brings the
// phone back in.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useInView, useMotionValue, useSpring, type Variants } from "motion/react";
import { CTA, SPEC } from "../../content/copy";
import { Logo } from "../../brand/Logo";
import { Scene } from "../scene/Scene";
import { reducedMotion, type PoseKey } from "../../three/stage";
import { Cta, DemoLink } from "../ui/Cta";
import { playCue } from "../ui/cue";
import { CATEGORIES, TOOL_COUNT, peekOf, screensOf, type Category, type Tool } from "./data";
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
 * The devices' exit. The first key is already "out", so the move is the scroll from One Day's last
 * key to this section's top (the sheet rising): a glide and a turn, never a vanish (BRIEF round 2
 * §6). `out` isn't inherited, so the next scene's first key brings them back on its own.
 */
const EXIT: PoseKey[] = [
  { at: 0, ease: "in", macbook: { out: -1 }, iphone: { out: 1 }, display: { show: 0 } },
  { at: 1, ease: "linear", macbook: { out: -1 }, iphone: { out: 1 }, display: { show: 0 } },
];

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
  // where focus goes back to when a panel closes
  const back = useRef<string | null>(null);

  const markEntered = useCallback(() => setEntered(true), []);
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

  return (
    <div ref={root} className="spec-in wrap" data-view={view.kind} onKeyDown={onKey}>
      <h2 className="t-h2 spec-title">
        <span className="spec-title-a">{SPEC.kicker}</span> <span className="spec-title-b">{SPEC.title}</span>
      </h2>

      <LayoutGroup id="spec">
        <div className="spec-body">
          <AnimatePresence initial={false}>
            {view.kind === "sheet" && (
              <Sheet key="sheet" play={play} entered={entered} onEntered={markEntered} onOpen={open} onAll={showAll} focusBack={back} />
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
                onAll={showAll}
              />
            )}
            {view.kind === "all" && <Wall key="wall" phoneUI={phoneUI} onPick={(c, t) => open(c, t)} onClose={close} />}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      <div className="spec-foot">
        <Cta source="specsheet" size="lg" cursorLabel="Clocked in · {time}" className="spec-cta" cue={false} />
        <DemoLink source="specsheet" className="spec-demo" />
        <p className="t-micro spec-micro">{CTA.micro}</p>
      </div>
    </div>
  );
}

// ─── collapsed: the sheet ────────────────────────────────────────────────────

const ROW_STEP = 0.085;
const PEEK = { w: 336, h: 206 };
const ROW_START = 0.28;

function Sheet({
  play,
  entered,
  onEntered,
  onOpen,
  onAll,
  focusBack,
}: {
  play: boolean;
  entered: boolean;
  onEntered: () => void;
  onOpen: (cat: string) => void;
  onAll: () => void;
  focusBack: React.RefObject<string | null>;
}) {
  const el = useRef<HTMLDivElement>(null);
  // how many rows have landed: the total adds up as they do
  const [landed, setLanded] = useState(entered ? CATEGORIES.length : 0);

  useEffect(() => {
    if (entered || !play) return;
    const timers = CATEGORIES.map((_, i) => window.setTimeout(() => setLanded(i + 1), (ROW_START + i * ROW_STEP + 0.18) * 1000));
    timers.push(window.setTimeout(onEntered, (ROW_START + CATEGORIES.length * ROW_STEP + 0.6) * 1000));
    return () => timers.forEach(clearTimeout);
  }, [play, entered, onEntered]);

  // coming back from a panel: focus returns to what opened it
  useLayoutEffect(() => {
    const sel = focusBack.current;
    if (!sel) return;
    focusBack.current = null;
    el.current?.querySelector<HTMLElement>(sel)?.focus({ preventScroll: true });
  }, [focusBack]);

  // pointing at a section (mouse only) floats a small live screen of it beside the pointer
  const [peek, setPeek] = useState<string | null>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 260, damping: 30, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 260, damping: 30, mass: 0.6 });
  const peekOn = !reducedMotion && entered;
  const track = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !el.current) return;
    const row = (e.target as Element).closest(".spec-row");
    if (!row) return;
    const r = el.current.getBoundingClientRect();
    const b = row.getBoundingClientRect();
    // it hangs off the row you're on, never over it: under the upper rows, over the lower ones,
    // and slides along with the pointer
    const below = b.top + b.height / 2 - r.top < r.height * 0.5;
    px.set(Math.min(Math.max(e.clientX - r.left - PEEK.w * 0.35, 0), r.width - PEEK.w));
    py.set(below ? b.bottom - r.top + 8 : b.top - r.top - PEEK.h - 8);
  };

  const total = CATEGORIES.slice(0, landed).reduce((n, c) => n + c.tools.length, 0);
  const shown = entered || play;
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
      <motion.span
        className="spec-rule-heavy"
        aria-hidden="true"
        initial={entered ? false : { scaleX: 0 }}
        animate={{ scaleX: shown ? 1 : 0 }}
        transition={{ duration: 0.9, ease }}
      />
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
      <p className="spec-keys-short">{SPEC.specsShort}</p>

      <ul
        className="spec-rows"
        onKeyDown={(e) => arrows(e, ".spec-row")}
        onPointerMove={peekOn ? track : undefined}
        onPointerLeave={() => setPeek(null)}
      >
        {CATEGORIES.map((c, i) => {
          const more = c.tools.length - 3;
          return (
            <motion.li key={c.id} className="spec-row-li" {...fx(i)}>
              <button
                type="button"
                className="spec-row"
                data-cat={c.id}
                aria-expanded={false}
                aria-controls="spec-panel"
                data-cursor-label={SPEC.tools(c.tools.length)}
                onClick={() => onOpen(c.id)}
                onPointerEnter={(e) => {
                  warm(c);
                  if (peekOn && e.pointerType === "mouse") {
                    track(e);
                    if (!peek) {
                      sx.jump(px.get());
                      sy.jump(py.get());
                    }
                    setPeek(c.id);
                  }
                }}
                onFocus={() => warm(c)}
              >
                <span className="spec-row-head">
                  <motion.span layoutId={`spec-name-${c.id}`} className="spec-row-name">
                    {c.name}
                  </motion.span>
                  <span className="spec-row-out">{c.outcome}</span>
                </span>
                <span className="spec-row-tools">
                  <span className="spec-row-top">
                    {c.tools.slice(0, 3).map((t, k) => (
                      <span key={t.id} className="spec-row-tool">
                        {k > 0 && (
                          <span className="spec-dot" aria-hidden="true">
                            {" · "}
                          </span>
                        )}
                        {k > 0 && <span className="sr-only">, </span>}
                        <span className="spec-full">{t.label}</span>
                        {SPEC.short[t.id] && <span className="spec-short">{SPEC.short[t.id]}</span>}
                      </span>
                    ))}
                  </span>
                  {more > 0 && <span className="spec-row-more">{SPEC.more(more)}</span>}
                  <span className="spec-lead" aria-hidden="true" />
                </span>
                <motion.span layoutId={`spec-count-${c.id}`} className="spec-row-count">
                  <Roll value={shown ? c.tools.length : 0} delay={entered ? 0 : ROW_START + i * ROW_STEP + 0.08} />
                  <span className="spec-unit">tools</span>
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

      <AnimatePresence>
        {peek && (
          <motion.div
            key="peek"
            className="spec-peek"
            aria-hidden="true"
            style={{ x: sx, y: sy, width: PEEK.w, height: PEEK.h }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
            transition={{ duration: 0.28, ease }}
          >
            <Snippet shot={peekOf(catById(peek)).shot} compact toolKey={`peek-${peek}`} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="spec-total" {...fx(CATEGORIES.length)}>
        <button type="button" className="spec-all" data-all aria-expanded={false} aria-controls="spec-wall" onClick={onAll}>
          <GridGlyph />
          <span>{SPEC.all}</span>
        </button>
        <span className="spec-total-n">
          <span className="spec-total-k">{SPEC.total}</span>
          <Roll value={total} digits={2} />
          <span className="spec-unit">tools</span>
        </span>
      </motion.div>
    </motion.div>
  );
}

// ─── open: one section, every tool, the real screen ──────────────────────────

const listV: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
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
  onAll,
}: {
  cat: Category;
  toolId: string | null;
  phoneUI: boolean;
  onCat: (id: string) => void;
  onTool: (id: string | null) => void;
  onClose: () => void;
  onAll: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  // desktop always shows one tool (the first until you point at another); phones open none until tapped
  const sel = cat.tools.find((t) => t.id === toolId) ?? (phoneUI ? null : cat.tools[0]);
  const idx = CATEGORIES.indexOf(cat);
  const nextCat = CATEGORIES[(idx + 1) % CATEGORIES.length];

  // a list taller than its panel fades out at the bottom until it's scrolled to the end
  useEffect(() => {
    const l = list.current;
    if (!l) return;
    const sync = () => l.classList.toggle("has-more", l.scrollHeight - l.clientHeight - l.scrollTop > 4);
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

  // on open (and on switching section) focus lands on the picked tool, or the first one
  useEffect(() => {
    const t = window.setTimeout(() => {
      const target = toolId
        ? el.current?.querySelector<HTMLElement>(`[data-tool="${toolId}"]`)
        : el.current?.querySelector<HTMLElement>(phoneUI ? ".spec-back" : "[data-tool]");
      target?.focus({ preventScroll: true });
      if (toolId && phoneUI) target?.scrollIntoView({ block: "nearest" });
    }, 60);
    list.current?.scrollTo({ top: 0 });
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat.id]);

  const rows = (
    <AnimatePresence mode="wait" initial={true}>
      <motion.ul key={cat.id} className="spec-tools" variants={listV} initial="hidden" animate="show" exit="exit" onKeyDown={(e) => arrows(e, "[data-tool]")}>
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
                onPointerEnter={(e) => e.pointerType === "mouse" && onTool(t.id)}
                onPointerMove={(e) => e.pointerType === "mouse" && !on && onTool(t.id)}
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
          <button type="button" className="spec-all spec-ix-all" data-all aria-expanded={false} aria-controls="spec-wall" onClick={onAll}>
            <GridGlyph />
            <span>{SPEC.allTitle(TOOL_COUNT)}</span>
          </button>
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

// ─── show everything: the wall ───────────────────────────────────────────────

function Wall({ phoneUI, onPick, onClose }: { phoneUI: boolean; onPick: (cat: string, tool: string) => void; onClose: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState<Tool | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => el.current?.querySelector<HTMLElement>("[data-wall-tool]")?.focus({ preventScroll: true }), 60);
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
        <h3 className="spec-wall-title">
          {SPEC.allTitle(TOOL_COUNT)}
        </h3>
        <Close onClick={onClose} label={`${SPEC.close}: ${SPEC.allTitle(TOOL_COUNT)}`} />
      </div>
      <div className="spec-wall-grid" data-lenis-prevent onKeyDown={(e) => arrows(e, "[data-wall-tool]", true)} onPointerLeave={() => setHot(null)}>
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
              {c.tools.map((t, ti) => {
                const d = 0.12 + ci * 0.05 + ti * 0.03;
                return (
                  <motion.li key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: d }}>
                    <button
                      type="button"
                      className={`spec-wall-tool${hot?.id === t.id ? " is-hot" : ""}`}
                      data-wall-tool={t.id}
                      data-col={ci}
                      data-row={ti}
                      data-cursor-label={SPEC.view}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setHot(t)}
                      onFocus={() => setHot(t)}
                      onClick={() => onPick(c.id, t.id)}
                    >
                      <span>{t.label}</span>
                      {t.confirm && <Flag />}
                      <span className="sr-only">. {t.line}</span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        ))}
        </div>
      </div>
      {!phoneUI && (
        <p className="spec-wall-read" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={hot?.id ?? "hint"} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
              {hot ? (
                <ReadOut t={hot} />
              ) : (
                <span className="spec-wall-hint">{SPEC.allHint}</span>
              )}
            </motion.span>
          </AnimatePresence>
        </p>
      )}
      {phoneUI && <p className="spec-wall-read spec-wall-hint">{SPEC.allHintTouch}</p>}
    </motion.div>
  );
}

function ReadOut({ t }: { t: Tool }): ReactNode {
  return (
    <>
      <strong>{t.label}</strong>
      <span className="spec-wall-line">{t.line}</span>
      <span className="spec-wall-side">{sideLabel(t)}</span>
    </>
  );
}
