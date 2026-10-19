import { startTransition, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import "../styles/tokens.css";
import "./signup.css";
import "./glass.css";
import "./bold.css";
import "./classic.css";
import { SIZES, openSignup, type Estimate, type Intent, type SignupRequest, type Size } from "./contract";
import {
  EMPTY_DRAFT,
  LAST_STEP,
  STEP_FIELDS,
  buildLead,
  check,
  emailTypo,
  formatPhone,
  loadProgress,
  newLeadId,
  postStage,
  saveForBooking,
  saveProgress,
  validateStep,
  type Draft,
  type Errors,
  type Field,
  type Progress,
} from "../lib/lead";
import { track, trackCustom } from "../lib/track";
import { aCall, config } from "../config";
import { OFFER } from "../content/copy";
import { SHOW_FLAGS } from "../lib/flags";
import { BOLD, CLASSIC } from "../lib/look";
import { PRICE_SLOTS, TRIAL_FIRST, priceFor } from "../lib/offer";
import Preview from "./Preview";
import { Flag } from "./Flag";
import { fly } from "./pulse";
import faceUrl from "./assets/andrew-face.webp";

// The popup (BRIEF "Popup", CRO.md §4, PLAYBOOK §5). Andrew: "it's gonna feel like building an
// account": the visitor starts a free trial, names his company and watches his own SmartCrew fill in
// beside the form. It never says "account created" or "trial started", and it never reads like a
// callback request; that the trial is set up on a call with Andrew is said before anything personal
// is typed. Steps: 1 employees + company · 2 name, work email, cell phone (the lead). Then /book.

const LITE = typeof window !== "undefined" && window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
/** Blur in and out on laptops only; animated filters are expensive on phones. */
const blur = (px: number): { filter?: string } => (LITE ? {} : { filter: `blur(${px}px)` });

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

/** Where each step's pulse lands in the preview: step 1 → the account, step 2 → the setup call. */
const PULSE_TARGET = ["company", "call"] as const;

/** The page's scroll lock (phones apply it after the sheet's slide; see the effect). */
let lockTimer = 0;
let locked = false;
let lockedPrev = "";

/** Once the visitor reaches the last step, warm up /book and Andrew's calendar so the hand-off is instant. */
function warmBooking() {
  const add = (rel: string, href: string, as?: string) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = rel;
    l.href = href;
    if (as) l.as = as;
    document.head.appendChild(l);
  };
  try {
    add("prefetch", new URL("book/", document.baseURI).href, "document");
    add("preconnect", "https://app.cal.com");
    add("preconnect", "https://fast.vidalytics.com");
  } catch {
    /* ignore */
  }
}

type Props = { req: SignupRequest | null; opener: RefObject<HTMLElement | null>; onClose: () => void };

export default function Dialog({ req, opener, onClose }: Props) {
  const reduce = useReducedMotion() ?? false;
  const phone = useMedia("(max-width: 760px)");
  const open = !!req;
  const ids = useId();

  const [intent, setIntent] = useState<Intent>("trial");
  const [source, setSource] = useState("");
  const [leadId, setLeadId] = useState("");
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState<Draft>(EMPTY_DRAFT);
  const [estimate, setEstimate] = useState<Estimate | undefined>();
  const [errors, setErrors] = useState<Errors>({});
  const [ok, setOk] = useState<Partial<Record<Field, boolean>>>({});
  const [sizeSaved, setSizeSaved] = useState(false);
  const [editSize, setEditSize] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sysError, setSysError] = useState("");
  const [focus, setFocus] = useState<Field | null>(null);
  const [kb, setKb] = useState(false);
  const [pill, setPill] = useState<Progress | null>(null);
  const [pillGone, setPillGone] = useState(false);

  const panel = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const stepStart = useRef(Date.now());
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // ── open: restore saved progress, apply what the page already knows ─────────
  useLayoutEffect(() => {
    if (!req) return;
    const saved = loadProgress();
    const draft: Draft = { ...EMPTY_DRAFT, ...(saved?.draft ?? {}) };
    if (req.size) draft.size = req.size;
    const st = saved ? Math.min(Math.max(saved.step, 0), LAST_STEP) : 0;
    setD(draft);
    setStep(st);
    setDir(1);
    setIntent(req.intent);
    setSource(req.source);
    setLeadId(saved?.lead_id ?? newLeadId());
    setEstimate(req.estimate ?? saved?.estimate);
    setSizeSaved(!!req.size);
    setEditSize(false);
    setResumed(!!saved && saved.step > 0 && draft.company.trim().length >= 2);
    setSubmitted(!!saved?.submitted);
    setErrors({});
    setOk({});
    setSaving(false);
    setSysError("");
    setFocus(null);
    stepStart.current = Date.now();
    trackCustom("popup_open", { intent: req.intent, source: req.source, size_prefilled: !!req.size, resumed: !!saved });
  }, [req]);

  // ── while open: scroll lock, Back button closes, tell the page ───────────────
  // Phones: locking the page (overflow on <html>) restyles and re-lays-out the whole page (~1,200
  // elements, every content-visibility scene re-checked): a long task if it lands in the tap. So
  // on phones the lock waits until the sheet has slid up, and comes off once it has slid away;
  // the sheet covers the page meanwhile and the finger that tapped has already lifted.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    window.clearTimeout(lockTimer);
    const prev = locked ? lockedPrev : html.style.overflow;
    const lock = () => {
      lockTimer = 0;
      if (!locked) lockedPrev = html.style.overflow;
      locked = true;
      html.style.overflow = "hidden";
      window.dispatchEvent(new CustomEvent("smartcrew:signup-state", { detail: { open: true } }));
    };
    const slow = phone && !reduce;
    if (slow) lockTimer = window.setTimeout(lock, 520);
    else lock();
    html.dataset.signup = "open";
    if (!pushed.current) {
      try {
        history.pushState({ ...(history.state ?? {}), scSignup: true }, "");
        pushed.current = true;
      } catch {
        /* sandboxed iframe */
      }
    }
    const onPop = () => {
      pushed.current = false;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      delete html.dataset.signup;
      window.clearTimeout(lockTimer);
      const unlock = () => {
        lockTimer = 0;
        if (!locked) return;
        locked = false;
        html.style.overflow = prev;
        window.dispatchEvent(new CustomEvent("smartcrew:signup-state", { detail: { open: false } }));
      };
      if (slow && locked) lockTimer = window.setTimeout(unlock, 320);
      else unlock();
      opener.current?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, opener]);

  // phones: the tap renders only the sheet's shell (header + preview strip); the form follows a
  // frame later as a transition, while the sheet is already sliding up on the compositor (it starts
  // below the screen, so nothing is missing on screen). Halves the work inside the tap.
  const [bodyOn, setBodyOn] = useState(false);
  useEffect(() => {
    if (!open) {
      setBodyOn(false);
      return;
    }
    const raf = requestAnimationFrame(() => startTransition(() => setBodyOn(true)));
    return () => cancelAnimationFrame(raf);
  }, [open]);
  const bodyNow = !phone || reduce || bodyOn;

  // the resume pill (laptops): after closing halfway, a quiet way back in
  useEffect(() => {
    if (open) return;
    const p = loadProgress();
    setPill(p && !p.submitted && p.step > 0 && p.draft.company.trim().length >= 2 ? p : null);
  }, [open]);

  // coming back from /book through the browser's bfcache: don't sit on "Saving…"
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setSaving(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // phones: keep the sheet (and its Continue button) inside the visible area above the keyboard.
  // The two variables live on the popup's own root, not on <html>: a custom property changed on
  // <html> restyles the whole page (every scene inherits it), once per keyboard resize event.
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    const root = shell.current;
    if (!vv || !root) return;
    let last = "";
    const update = () => {
      const h = `${vv.height}px`;
      const t = `${vv.offsetTop}px`;
      if (h + t === last) return;
      last = h + t;
      root.style.setProperty("--su-vvh", h);
      root.style.setProperty("--su-vvt", t);
      setKb(window.innerHeight - vv.height > 140);
    };
    // first read on the next frame: reading the visual viewport right after the DOM changed
    // forces a synchronous style + layout inside the tap
    const raf = requestAnimationFrame(update);
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--su-vvh");
      root.style.removeProperty("--su-vvt");
    };
  }, [open]);

  const close = useCallback(() => {
    if (pushed.current && history.state?.scSignup) {
      history.back(); // popstate closes it
      return;
    }
    pushed.current = false;
    closeRef.current();
  }, []);

  // ── focus: first empty field of each step, after it has slid in ──────────────
  const sizeLocked = sizeSaved && !editSize && !!d.size;
  const firstEmpty = (): Field => {
    if (step === 0) return !sizeLocked && !d.size ? "size" : "company";
    if (!d.name.trim()) return "name";
    return check("email", d, intent) ? "email" : "phone";
  };
  const focusField = (f: Field | undefined) => {
    if (!f) return;
    panel.current?.querySelector<HTMLElement>(`[data-field="${f}"]`)?.focus({ preventScroll: false });
  };
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => focusField(firstEmpty()), reduce ? 30 : 320);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    // Enter in a filled-in field moves on to the step's next field still to do (the form submits
    // once nothing is left, or to show what's wrong)
    if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "checkbox") {
      const f = e.target.dataset.field as Field | undefined;
      const fs = STEP_FIELDS[step] ?? [];
      const i = f ? fs.indexOf(f) : -1;
      if (i < 0 || check(f!, d, intent)) return;
      const next = fs.slice(i + 1).find((x) => check(x, d, intent));
      if (next) {
        e.preventDefault();
        focusField(next);
      }
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const f = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href],[tabindex="0"]')].filter(
      (x) => x.offsetParent !== null || x === document.activeElement,
    );
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // ── fields ───────────────────────────────────────────────────────────────────
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    const next = { ...d, [k]: v };
    setD(next);
    setSysError("");
    if (k === "sms") return;
    const f = k as Field;
    const msg = check(f, next, intent);
    if (errors[f] && !msg) setErrors((e) => ({ ...e, [f]: undefined }));
    if (ok[f] && msg) setOk((o) => ({ ...o, [f]: false }));
  };
  const onBlur = (f: Field) => {
    setFocus(null);
    const val = f === "size" ? d.size : d[f];
    if (!val) return; // empty fields complain on Continue, not on the way past
    const msg = check(f, d, intent);
    const suspect = f === "email" && !!emailTypo(d.email);
    setErrors((e) => ({ ...e, [f]: msg }));
    setOk((o) => ({ ...o, [f]: !msg && !suspect }));
    if (msg) trackCustom("field_error", { field: f, step: step + 1 });
  };
  const pickSize = (s: Size) => {
    set("size", s);
    setOk((o) => ({ ...o, size: true }));
  };
  const chipKeys = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const move = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!move) return;
    e.preventDefault();
    const n = (i + move + SIZES.length) % SIZES.length;
    pickSize(SIZES[n]);
    const btns = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button");
    btns?.[n]?.focus();
  };

  // ── steps ────────────────────────────────────────────────────────────────────
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const errs = validateStep(step, d, intent);
    const bad = STEP_FIELDS[step].filter((f) => errs[f]);
    if (bad.length) {
      setErrors((x) => ({ ...x, ...errs }));
      bad.forEach((f) => trackCustom("field_error", { field: f, step: step + 1, on: "continue" }));
      focusField(bad[0]);
      return;
    }
    setOk((o) => ({ ...o, ...Object.fromEntries(STEP_FIELDS[step].map((f) => [f, true])) }));
    trackCustom("step_complete", { step: step + 1, intent, ms_on_step: Date.now() - stepStart.current });
    const button = (e.nativeEvent as SubmitEvent).submitter ?? e.currentTarget.querySelector("[type=submit]");
    const target = panel.current?.querySelector(`[data-pulse~="${PULSE_TARGET[step]}"]`) ?? null;
    fly(button, target);
    if (step < LAST_STEP) {
      const ns = step + 1;
      if (ns === LAST_STEP) warmBooking();
      saveProgress({ lead_id: leadId, intent, step: ns, draft: d, estimate, submitted });
      void postStage(buildLead({ lead_id: leadId, intent, source, stage: "start", draft: d, estimate }));
      setDir(1);
      setStep(ns);
      stepStart.current = Date.now();
      return;
    }
    void finish();
  };

  const finish = async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setSysError("No signal? Everything you typed is saved. Tap the button again when you're back online.");
      return;
    }
    setSaving(true);
    setSysError("");
    const lead = buildLead({ lead_id: leadId, intent, source, stage: "complete", draft: d, estimate });
    saveForBooking(lead);
    saveProgress({ lead_id: leadId, intent, step: LAST_STEP, draft: d, estimate, submitted: true });
    const post = postStage(lead);
    if (!submitted) {
      track("Lead", { content_name: intent === "demo" ? "Book a demo" : "Free trial", content_category: d.size, entry_source: source }, leadId);
    }
    setSubmitted(true);
    await Promise.all([wait(reduce ? 250 : 950), Promise.race([post, wait(1500)])]);
    try {
      const s = { ...(history.state ?? {}) };
      delete s.scSignup;
      history.replaceState(s, "");
      pushed.current = false;
    } catch {
      /* ignore */
    }
    // relative, so it works under any base path; nothing personal in the URL
    window.location.assign(new URL("book/", document.baseURI).href);
  };

  const back = () => {
    if (step === 0 || saving) return;
    setDir(-1);
    setStep(step - 1);
    stepStart.current = Date.now();
  };

  // progress: whole segments for finished steps, the current one fills as its fields are done
  const fill = (i: number) => {
    if (i < step) return 1;
    if (i > step) return 0;
    const fs = STEP_FIELDS[step];
    const valid = fs.filter((f) => !check(f, d, intent)).length;
    return Math.max(0.06, (valid / fs.length) * 0.9);
  };

  const company = d.company.trim();
  const last = step === LAST_STEP;
  const kicker = intent === "demo" ? "Demo with Andrew" : "Free trial";
  const titles = [
    intent === "demo" ? "Book your demo with Andrew" : "Set up your SmartCrew",
    company.length >= 2 ? `Who's setting up ${company}?` : "Who's setting this up?",
  ];
  // said before anything personal is typed: the trial is set up on a call (as a sign-up, not a callback)
  const honest =
    intent === "demo" ? (
      <>Next: pick a time for your demo with Andrew.</>
    ) : TRIAL_FIRST ? (
      <>
        {OFFER.trialFirst.honest}
        <Flag note={OFFER.trialFirst.note} />
      </>
    ) : (
      <>
        Your free trial starts with {aCall()} with Andrew.
        {!config.callLengthConfirmed && <Flag note="Andrew to confirm the call length (his Cal.com event is 45 minutes today)" />}
      </>
    );

  const spring: Transition = reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30, mass: 0.9 };
  const stepVariants = {
    enter: (dr: number) => ({ opacity: 0, x: reduce ? 0 : 26 * dr, ...blur(reduce ? 0 : 6) }),
    center: { opacity: 1, x: 0, ...blur(0) },
    exit: (dr: number) => ({ opacity: 0, x: reduce ? 0 : -18 * dr, ...blur(reduce ? 0 : 4), transition: { duration: reduce ? 0 : 0.15, ease: "easeIn" as const } }),
  };

  const typo = step === 1 ? emailTypo(d.email) : null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div className="su-root" key="su-root" data-intent={intent} ref={shell}>
            <motion.div
              className="su-scrim"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.28 }}
            />
            <motion.div
              ref={panel}
              className={`su-dialog${kb ? " is-kb" : ""}`}
              data-cursor-tone="light"
              data-clarity-mask="True"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${ids}-title`}
              aria-describedby={`${ids}-honest`}
              onKeyDown={onKeyDown}
              // phones: the sheet slides up as one `transform` tween (runs on the compositor; a
              // `y` spring is written by JS every frame)
              initial={phone ? { transform: "translateY(100%)" } : { opacity: 0, y: 30, scale: 0.965, ...blur(12) }}
              animate={phone ? { transform: "translateY(0%)" } : { opacity: 1, y: 0, scale: 1, ...blur(0) }}
              exit={
                phone
                  ? { transform: "translateY(100%)", transition: { duration: reduce ? 0 : 0.26, ease: [0.4, 0, 1, 1] } }
                  : { opacity: 0, y: 14, scale: 0.98, ...blur(6), transition: { duration: 0.18 } }
              }
              transition={phone ? (reduce ? { duration: 0 } : { duration: 0.46, ease: [0.32, 0.72, 0, 1] }) : spring}
            >
              <header className="su-head">
                <div className="su-head-row">
                  <AnimatePresence initial={false}>
                    {step > 0 && (
                      <motion.button
                        type="button"
                        className="su-back"
                        onClick={back}
                        aria-label="Back to the previous step"
                        initial={{ opacity: 0, width: 0, marginRight: 0 }}
                        animate={{ opacity: 1, width: 32, marginRight: 6 }}
                        exit={{ opacity: 0, width: 0, marginRight: 0 }}
                        transition={{ duration: reduce ? 0 : 0.22 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <span className="su-kicker">{kicker}</span>
                  <span className="su-steplabel" aria-live="polite">
                    Step {step + 1} of {STEP_FIELDS.length}
                    {sizeLocked && step === 0 ? <span className="su-steplabel-x"> · company size saved</span> : null}
                  </span>
                </div>
                <div className="su-progress" role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={STEP_FIELDS.length} aria-valuenow={step}>
                  {STEP_FIELDS.map((_, i) => (
                    <span key={i} className="su-seg">
                      <motion.i initial={false} animate={{ scaleX: fill(i) }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }} />
                    </span>
                  ))}
                </div>
              </header>

              <aside className="su-side" aria-label="Preview of your SmartCrew">
                <Preview draft={d} intent={intent} focus={focus} compact={phone} saving={saving} hidden={phone && kb} />
              </aside>

              <form className="su-body" noValidate onSubmit={submit} data-step={step}>
                {bodyNow && (
                <>
                <div className="su-scroll">
                  <AnimatePresence mode="wait" initial={false} custom={dir}>
                    <motion.div
                      key={step}
                      className="su-step"
                      custom={dir}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                    {resumed && step > 0 && company.length >= 2 && <p className="su-welcome">Welcome back. Let's finish setting up {company}.</p>}
                    <h2 className="su-title" id={`${ids}-title`}>
                      {titles[step]}
                    </h2>

                    {step === 0 && (
                      <div className="su-fields">
                        {sizeLocked ? (
                          <div className="su-done">
                            <span className="su-done-tick" aria-hidden="true">
                              <svg width="12" height="12" viewBox="0 0 12 12">
                                <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="su-done-text">
                              Employees <b>{d.size}</b>
                              {estimate ? (
                                <>
                                  {" · "}your estimate <b>{money(estimate.annual)} a year</b>
                                </>
                              ) : null}
                            </span>
                            <button type="button" className="su-link" onClick={() => setEditSize(true)}>
                              Edit
                            </button>
                          </div>
                        ) : (
                          <fieldset className={`su-field${errors.size ? " has-err" : ""}`}>
                            <legend className="su-label" id={`${ids}-size`}>
                              How many employees?
                              <span className="su-label-hint">Field and office</span>
                            </legend>
                            <div className="su-chips" role="radiogroup" aria-labelledby={`${ids}-size`} aria-describedby={errors.size ? `${ids}-size-err` : undefined}>
                              {SIZES.map((s, i) => {
                                const on = d.size === s;
                                const tab = on || (!d.size && i === 0);
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    tabIndex={tab ? 0 : -1}
                                    data-field={tab ? "size" : undefined}
                                    className={`su-chip${on ? " is-on" : ""}`}
                                    onClick={() => pickSize(s)}
                                    onKeyDown={(e) => chipKeys(e, i)}
                                  >
                                    {on && <motion.span layoutId={`${ids}-chip`} className="su-chip-bg" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }} />}
                                    <span className="su-chip-t">{s}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <ErrorLine id={`${ids}-size-err`} text={errors.size} />
                            {PRICE_SLOTS && intent !== "demo" && d.size && <PriceLine size={d.size} />}
                          </fieldset>
                        )}
                        <TextField
                          id={`${ids}-company`}
                          field="company"
                          label="Company name"
                          value={d.company}
                          error={errors.company}
                          ok={ok.company}
                          onChange={(v) => set("company", v)}
                          onFocus={() => setFocus("company")}
                          onBlur={() => onBlur("company")}
                          input={{ name: "organization", autoComplete: "organization", autoCapitalize: "words", enterKeyHint: "next", maxLength: 80, spellCheck: false }}
                        />
                        {(BOLD || CLASSIC) && intent !== "demo" && <Answers />}
                      </div>
                    )}

                    {step === 1 && (
                      <div className="su-fields">
                        <TextField
                          id={`${ids}-name`}
                          field="name"
                          label="Your name"
                          value={d.name}
                          error={errors.name}
                          ok={ok.name}
                          onChange={(v) => set("name", v)}
                          onFocus={() => setFocus("name")}
                          onBlur={() => onBlur("name")}
                          input={{ name: "name", autoComplete: "name", autoCapitalize: "words", enterKeyHint: "next", maxLength: 80, spellCheck: false }}
                        />
                        <div className="su-row">
                          <TextField
                            id={`${ids}-email`}
                            field="email"
                            label="Work email"
                            note="Gmail is fine"
                            value={d.email}
                            error={errors.email}
                            ok={ok.email}
                            onChange={(v) => set("email", v.replace(/\s/g, ""))}
                            onFocus={() => setFocus("email")}
                            onBlur={() => onBlur("email")}
                            input={{ type: "email", name: "email", autoComplete: "email", inputMode: "email", autoCapitalize: "off", spellCheck: false, enterKeyHint: "next", maxLength: 120 }}
                            after={
                              typo ? (
                                <p className="su-typo">
                                  Did you mean <b>{typo}</b>?{" "}
                                  <button
                                    type="button"
                                    className="su-link"
                                    onClick={() => {
                                      set("email", typo);
                                      setOk((o) => ({ ...o, email: true }));
                                      focusField("email");
                                    }}
                                  >
                                    Use this
                                  </button>
                                </p>
                              ) : null
                            }
                          />
                          <TextField
                            id={`${ids}-tel`}
                            field="phone"
                            label="Cell phone"
                            value={d.phone}
                            error={errors.phone}
                            ok={ok.phone}
                            onChange={(v) => set("phone", formatPhone(v))}
                            onFocus={() => setFocus("phone")}
                            onBlur={() => onBlur("phone")}
                            input={{ type: "tel", name: "tel", autoComplete: "tel", inputMode: "tel", enterKeyHint: "done", maxLength: 20, placeholder: "(555) 123-4567" }}
                          />
                        </div>
                        <div className="su-sms">
                          <label className="su-check">
                            <input type="checkbox" name="sms_consent" checked={d.sms} onChange={(e) => set("sms", e.target.checked)} />
                            <span className="su-box" aria-hidden="true">
                              <svg width="12" height="12" viewBox="0 0 12 12">
                                <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span>
                              Text me call reminders from SmartCrew <span className="su-opt">(optional)</span>
                            </span>
                          </label>
                          {/* the consent terms, one quiet line under the opt-in (the box says who and why) */}
                          <p className="su-fine">
                            About 3 texts per booking. Msg &amp; data rates may apply. Reply STOP to opt out.
                            <Flag note="SMS consent wording: Andrew/counsel to confirm (sender number, frequency)" />
                          </p>
                        </div>
                      </div>
                    )}

                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="su-foot">
                    <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={last ? "next" : "honest"}
                      className="su-pre"
                      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduce ? 0 : -4 }}
                      transition={{ duration: reduce ? 0 : 0.22 }}
                    >
                      <p className={`su-honest${last ? " su-honest--next" : ""}`} id={`${ids}-honest`}>
                        <img src={faceUrl} alt="" width={28} height={28} />
                        {last ? (
                          <span>
                            {intent === "demo" ? (
                              "Next: pick a time for your demo with Andrew."
                            ) : TRIAL_FIRST ? (
                              <>
                                {OFFER.trialFirst.next}
                                <Flag note={OFFER.trialFirst.note} />
                              </>
                            ) : (
                              "Next: pick a time with Andrew to set up your free trial."
                            )}
                          </span>
                        ) : (
                          <span>{honest}</span>
                        )}
                      </p>
                    </motion.div>
                    </AnimatePresence>
                    <div className="su-actions">
                      {sysError && (
                        <p className="su-sys" role="alert">
                          {sysError}
                        </p>
                      )}
                      <button type="submit" className={`su-btn${saving ? " is-saving" : ""}`} disabled={saving} aria-busy={saving} data-cursor="cta">
                        {saving ? (
                          <>
                            <span className="su-spin" aria-hidden="true" />
                            Saving…
                          </>
                        ) : !last ? (
                          <>
                            Continue
                            <Arrow />
                          </>
                        ) : (
                          <>
                            {intent === "demo" ? "Pick my demo time" : "Start my free trial"}
                            <Arrow />
                          </>
                        )}
                      </button>
                      {last ? (
                        <p className="su-legal">
                          {intent === "demo" ? "By continuing" : "By starting your trial"}, you agree to SmartCrew's{" "}
                          <a href={config.termsUrl} target="_blank" rel="noopener noreferrer">
                            Terms
                          </a>{" "}
                          and{" "}
                          <a href={config.privacyUrl} target="_blank" rel="noopener noreferrer">
                            Privacy Policy
                          </a>
                          .
                        </p>
                      ) : (
                        <p className="su-legal su-legal--quiet">{step === 0 ? "Takes less than a minute." : "\u00a0"}</p>
                      )}
                    </div>
                </div>
                </>
                )}
              </form>

              <button type="button" className="su-close" onClick={close} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && pill && !pillGone && (
          <motion.div
            className="su-pill"
            key="su-pill"
            initial={{ opacity: 0, y: 16, ...blur(6) }}
            animate={{ opacity: 1, y: 0, ...blur(0), transition: { delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
          >
            <button type="button" className="su-pill-go" onClick={() => openSignup({ intent: pill.intent, source: "resume-pill" })}>
              <span className="su-pill-ring" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 22 22">
                  <circle cx="11" cy="11" r="9" fill="none" stroke="rgb(255 255 255 / 18%)" strokeWidth="2.4" />
                  <circle cx="11" cy="11" r="9" fill="none" stroke="var(--orange)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={`${(pill.step / STEP_FIELDS.length) * 56.5} 56.5`} transform="rotate(-90 11 11)" />
                </svg>
              </span>
              <span>
                Finish setting up <b>{pill.draft.company.trim()}</b>
              </span>
              <Arrow />
            </button>
            <button type="button" className="su-pill-x" aria-label="Dismiss" onClick={() => setPillGone(true)}>
              <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Bold look, step 1: the price for the size just picked (src/lib/offer.ts), or its ⚑ slot on a review build. */
function PriceLine({ size }: { size: string }) {
  const price = priceFor(size);
  return (
    <p className="su-price" aria-live="polite">
      {OFFER.price.forSize(size)}{" "}
      {price ? (
        <b>{price}</b>
      ) : (
        <>
          <b className="su-price-tbd">{OFFER.price.placeholder}</b>
          <Flag note={OFFER.price.note} />
        </>
      )}
    </p>
  );
}

/** Bold look, step 1: the buyer's fears answered before anything personal is typed (playbook §7.4). */
function Answers() {
  const lines = OFFER.answers.filter((a) => !a.flag || SHOW_FLAGS);
  return (
    <ul className="su-answers" aria-label={OFFER.answersLabel}>
      {lines.map((a) => (
        <li key={a.text}>
          <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            {a.text}
            {a.flag && <Flag note={a.flag} />}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Arrow() {
  return (
    <svg className="su-arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorLine({ id, text }: { id: string; text?: string }) {
  return (
    <AnimatePresence initial={false}>
      {text && (
        <motion.p
          key="err"
          id={id}
          className="su-err"
          role="alert"
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function TextField(p: {
  id: string;
  field: Field;
  label: string;
  /** A short aside on the label's line ("Gmail is fine"); read as a description, not the name. */
  note?: string;
  hint?: ReactNode;
  value: string;
  error?: string;
  ok?: boolean;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  input: InputProps;
  after?: ReactNode;
}) {
  const describedBy = [p.note ? `${p.id}-note` : "", p.hint ? `${p.id}-hint` : "", p.error ? `${p.id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`su-field${p.error ? " has-err" : ""}${p.ok && !p.error ? " is-ok" : ""}`}>
      <div className="su-label">
        <label htmlFor={p.id}>{p.label}</label>
        <AnimatePresence>
          {p.ok && !p.error && (
            <motion.span className="su-ok" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 26 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="su-sr">looks good</span>
            </motion.span>
          )}
        </AnimatePresence>
        {p.note && (
          <span className="su-label-hint" id={`${p.id}-note`}>
            {p.note}
          </span>
        )}
      </div>
      <input
        id={p.id}
        className="su-input"
        data-field={p.field}
        value={p.value}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => p.onChange(e.target.value)}
        onFocus={p.onFocus}
        onBlur={p.onBlur}
        {...p.input}
      />
      {p.after}
      {p.hint && (
        <p className="su-hint" id={`${p.id}-hint`}>
          {p.hint}
        </p>
      )}
      <ErrorLine id={`${p.id}-err`} text={p.error} />
    </div>
  );
}
