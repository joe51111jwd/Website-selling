import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SIZES, T, type Intent, type Size } from "./data";
import { prep, track } from "./track";
import markUrl from "./assets/mark.svg";

// The "Claim your Founding Member trial" popup (PLAYBOOK §5, CRO §4). It feels like setting up
// an account: the visitor names his company and watches the preview fill in. It never says
// "account created" or "trial started"; the call is disclosed before anything personal is typed.

export type SignupState = { open: boolean; intent: Intent; source: string; size?: Size; calc?: Record<string, number> };

type Values = { size?: Size; company: string; name: string; email: string; tel: string; sms: boolean };
const KEY = "sc_signup_v1";
const empty: Values = { company: "", name: "", email: "", tel: "", sms: false };

function load(): { v: Values; step: number } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { v: { ...empty, ...d.v }, step: d.step ?? 0 };
  } catch {
    return null;
  }
}
function save(v: Values, step: number, intent: Intent) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: { ...v, tel: "" }, step, intent, ts: Date.now() }));
  } catch {
    /* private mode: the popup still works, it just won't resume */
  }
}

const DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "comcast.net"];
function typo(email: string): string | null {
  const m = email.trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m) return null;
  const dom = m[2];
  if (DOMAINS.includes(dom)) return null;
  const dist = (a: string, b: string) => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  };
  const best = DOMAINS.map((d) => [d, dist(dom, d)] as const).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] > 0 && best[1] <= 2 ? `${m[1]}@${best[0]}` : null;
}
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e.trim());
const digits = (t: string) => t.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
function fmtTel(t: string) {
  const d = digits(t).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function Signup({ state, onClose }: { state: SignupState; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState<Values>(empty);
  const [step, setStep] = useState(0);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const [resumed, setResumed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [sizeSaved, setSizeSaved] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const uid = useId();

  // open: restore saved values, apply a pre-picked size, push a history state for Back
  useLayoutEffect(() => {
    if (!state.open) return;
    opener.current = document.activeElement;
    const saved = load();
    let nv = saved?.v ?? empty;
    let st = saved && saved.step > 0 ? Math.min(saved.step, 2) : 0;
    setResumed(!!saved && saved.step > 0 && !!saved.v.company);
    if (state.size) {
      nv = { ...nv, size: state.size };
      setSizeSaved(true);
    } else setSizeSaved(false);
    setV(nv);
    setStep(st);
    setErrs({});
    setOk({});
    setDone(false);
    setSaving(false);
    track("popup_open", { intent: state.intent, source: state.source, size_prefilled: !!state.size, resumed: !!saved });
    try {
      history.pushState({ scSignup: 1 }, "");
    } catch {
      /* ignore */
    }
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      document.documentElement.style.overflow = prevOverflow;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [state.open]);

  const close = useCallback(() => {
    try {
      if (history.state?.scSignup) history.back();
      else onClose();
    } catch {
      onClose();
    }
  }, [onClose]);

  // focus the first empty field of the step; trap Tab; Esc closes
  useEffect(() => {
    if (!state.open) return;
    const t = setTimeout(() => {
      const el = panel.current?.querySelector<HTMLElement>("[data-first]") ?? panel.current?.querySelector<HTMLElement>("input,button");
      el?.focus();
    }, reduce ? 0 : 220);
    return () => clearTimeout(t);
  }, [state.open, step, reduce]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const f = [...panel.current.querySelectorAll<HTMLElement>("button,input,a[href]")].filter((x) => !x.hasAttribute("disabled") && x.offsetParent !== null);
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

  const set = (k: keyof Values, val: string | boolean) => {
    setV((p) => ({ ...p, [k]: val }));
    if (errs[k]) setErrs((p) => ({ ...p, [k]: "" }));
  };

  const check = (k: string, nv: Values = v): string => {
    if (k === "size") return nv.size ? "" : "Pick your crew size to continue.";
    if (k === "company") return nv.company.trim().length >= 2 ? "" : "Add your company name. Andrew sets up your trial under it.";
    if (k === "name") return nv.name.trim().length >= 2 ? "" : "Add your name so Andrew knows who he’s talking to.";
    if (k === "email") return emailOk(nv.email) ? "" : "That email looks off. Check for a typo?";
    if (k === "tel") return digits(nv.tel).length === 10 ? "" : "Enter a 10-digit mobile number, like (555) 123-4567.";
    return "";
  };
  const blur = (k: string) => {
    const e = check(k);
    const val = (v as Record<string, unknown>)[k];
    if (!val) return; // don't scold an untouched field
    setErrs((p) => ({ ...p, [k]: e }));
    setOk((p) => ({ ...p, [k]: !e }));
    if (e) track("field_error", { field: k, step: step + 1 });
  };

  const FIELDS = [["size", "company"], ["name", "email"], ["tel"]];
  const next = (e: FormEvent) => {
    e.preventDefault();
    const ks = FIELDS[step];
    const ne: Record<string, string> = {};
    for (const k of ks) {
      const m = check(k);
      if (m) ne[k] = m;
    }
    setErrs((p) => ({ ...p, ...ne }));
    if (Object.keys(ne).length) {
      const firstBad = ks.find((k) => ne[k]);
      panel.current?.querySelector<HTMLElement>(`[data-field="${firstBad}"]`)?.focus();
      track("field_error", { field: firstBad, step: step + 1 });
      return;
    }
    track("step_complete", { step: step + 1 });
    if (step < 2) {
      save(v, step + 1, state.intent);
      if (step === 1) track("lead_partial", { stage: "email" });
      setStep(step + 1);
      return;
    }
    setSaving(true);
    save(v, 2, state.intent);
    track("lead_submit", { crew_size: v.size, sms_consent: v.sms, modules_viewed: [...prep.modules], faq_opened: [...prep.faqs], ...(state.calc ?? {}) });
    setTimeout(() => {
      setSaving(false);
      setDone(true);
    }, reduce ? 0 : 900);
  };

  const demo = state.intent === "demo";
  const title = resumed && v.company ? `Welcome back. Let’s finish setting up ${v.company}.` : demo ? "Book your demo with Andrew" : "Claim your Founding Member trial";
  // the bar moves as fields are completed, and starts a third full when the size came pre-picked
  const part = step === 0 ? (v.size ? 0.5 : 0) + (v.company.trim().length >= 2 ? 0.5 : 0) : step === 1 ? (v.name.trim().length >= 2 ? 0.5 : 0) + (emailOk(v.email) ? 0.5 : 0) : digits(v.tel).length === 10 ? 0.6 : 0;
  const progress = done ? 3 : step + Math.max(part, step === 0 && sizeSaved ? 0.34 : 0);

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div className="ps-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }}>
          <div className="ps-scrim" onClick={close} />
          <motion.div
            ref={panel}
            className="ps-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            onKeyDown={onKeyDown}
            initial={{ y: reduce ? 0 : 28, opacity: reduce ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduce ? 0 : 20, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.26, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="ps-top">
              <img src={markUrl} alt="SmartCrew" width={22} height={22} />
              <div className="ps-prog" aria-label={`Step ${Math.min(step + 1, 3)} of 3`}>
                <div className="ps-bars">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="ps-bar">
                      <span style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress - i))})` }} />
                    </span>
                  ))}
                </div>
                <span className="ps-step">{done ? "Details saved" : step === 0 && sizeSaved ? "Step 1 of 3 · crew size saved" : `Step ${step + 1} of 3`}</span>
              </div>
              <button type="button" className="ps-x" onClick={close} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <h2 className="ps-title" id={`${uid}-title`}>
              {title}
            </h2>
            <p className="ps-sub">Takes less than a minute. Then you pick a time to talk with Andrew.</p>

            <Preview v={v} step={done ? 2 : step} />

            {done ? (
              <div className="ps-done">
                <p className="ps-done-h">Next: pick a time with Andrew.</p>
                <p className="ps-done-p">
                  In the real flow this opens the booking page (/book): Andrew’s short video and his open times, with your details already filled in.
                </p>
                <button type="button" className="pp-btn pp-btn-dark ps-cta" onClick={close}>
                  Close the prototype popup
                </button>
              </div>
            ) : (
              <form className="ps-form" onSubmit={next} noValidate>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={step} initial={{ opacity: 0, x: reduce ? 0 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -12 }} transition={{ duration: reduce ? 0 : 0.18 }}>
                    {step === 0 && (
                      <>
                        <fieldset className="ps-field" aria-describedby={errs.size ? `${uid}-size-e` : `${uid}-size-h`}>
                          <legend className="ps-label">How many people work for you?</legend>
                          <span className="ps-hint" id={`${uid}-size-h`}>
                            Field and office.
                          </span>
                          <div className="ps-sizes" role="radiogroup" aria-label="Crew size">
                            {SIZES.map((s, i) => (
                              <button
                                key={s}
                                type="button"
                                role="radio"
                                aria-checked={v.size === s}
                                className={`pp-size${v.size === s ? " is-on" : ""}`}
                                data-field={i === 0 ? "size" : undefined}
                                data-first={!v.size && i === 0 ? "" : undefined}
                                onClick={() => {
                                  set("size", s);
                                  setOk((p) => ({ ...p, size: true }));
                                }}
                              >
                                {v.size === s && <Tick />}
                                {s}
                              </button>
                            ))}
                          </div>
                          {errs.size && (
                            <span className="ps-err" id={`${uid}-size-e`} role="alert">
                              {errs.size}
                            </span>
                          )}
                        </fieldset>
                        <Field id={`${uid}-co`} label="Company name" err={errs.company} ok={ok.company}>
                          <input
                            id={`${uid}-co`}
                            data-field="company"
                            data-first={v.size && !v.company ? "" : undefined}
                            name="organization"
                            autoComplete="organization"
                            autoCapitalize="words"
                            enterKeyHint="next"
                            maxLength={80}
                            value={v.company}
                            onChange={(e) => set("company", e.target.value)}
                            onBlur={() => blur("company")}
                            aria-invalid={!!errs.company}
                            aria-describedby={errs.company ? `${uid}-co-e` : undefined}
                          />
                        </Field>
                        <button type="submit" className="pp-btn pp-btn-dark ps-cta">
                          Continue
                        </button>
                      </>
                    )}
                    {step === 1 && (
                      <>
                        <Field id={`${uid}-n`} label="Your name" err={errs.name} ok={ok.name}>
                          <input id={`${uid}-n`} data-field="name" data-first="" name="name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" value={v.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} aria-invalid={!!errs.name} aria-describedby={errs.name ? `${uid}-n-e` : undefined} />
                        </Field>
                        <Field id={`${uid}-e`} label="Email" hint="Any email you check is fine. Gmail works." err={errs.email} ok={ok.email && !typo(v.email)} extra={typo(v.email) && !errs.email ? <TypoFix s={typo(v.email)!} onUse={(s) => set("email", s)} /> : null}>
                          <input id={`${uid}-e`} data-field="email" type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="off" spellCheck={false} enterKeyHint="next" value={v.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} aria-invalid={!!errs.email} aria-describedby={errs.email ? `${uid}-e-e` : `${uid}-e-h`} />
                        </Field>
                        <div className="ps-row">
                          <button type="button" className="pp-btn pp-btn-light ps-back" onClick={() => setStep(0)}>
                            Back
                          </button>
                          <button type="submit" className="pp-btn pp-btn-dark ps-cta">
                            Continue
                          </button>
                        </div>
                        <p className="ps-fine">We’ll send your call details here.</p>
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <Field id={`${uid}-t`} label="Mobile number" hint="Andrew uses this to confirm your call." flag err={errs.tel} ok={ok.tel}>
                          <input id={`${uid}-t`} data-field="tel" data-first="" type="tel" name="tel" autoComplete="tel" inputMode="tel" enterKeyHint="done" placeholder="(555) 123-4567" value={v.tel} onChange={(e) => set("tel", fmtTel(e.target.value))} onBlur={() => blur("tel")} aria-invalid={!!errs.tel} aria-describedby={errs.tel ? `${uid}-t-e` : `${uid}-t-h`} />
                        </Field>
                        <label className="ps-check">
                          <input type="checkbox" name="sms_consent" checked={v.sms} onChange={(e) => set("sms", e.target.checked)} />
                          <span>
                            Text me reminders about my call <em>(optional)</em>
                          </span>
                        </label>
                        <p className="ps-fine ps-fine-sms pp-ph-box">
                          <span className="pp-ph">Placeholder for Andrew · counsel review</span>
                          By checking this, you agree to get call reminders by text from SmartCrew at this number. About 3 messages per booking. Msg &amp; data rates may apply. Reply STOP to opt out.
                        </p>
                        <div className="ps-next">
                          <strong>{demo ? "Next: pick a time for your demo with Andrew." : `Next: watch Andrew’s short video and pick a time for your ${T.N}-minute call.`}</strong>
                          {!demo && <span> Founding Member trials are set up on this call.</span>}
                        </div>
                        <div className="ps-row">
                          <button type="button" className="pp-btn pp-btn-light ps-back" onClick={() => setStep(1)}>
                            Back
                          </button>
                          <button type="submit" className="pp-btn pp-btn-dark ps-cta" disabled={saving} aria-busy={saving}>
                            {saving ? "Saving…" : demo ? "Pick my demo time" : "Pick my setup call time"}
                          </button>
                        </div>
                        <p className="ps-fine">
                          By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.
                        </p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Tick() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="pp-tick">
      <path d="M2.5 7.4 5.6 10.4 11.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Field({ id, label, hint, err, ok, flag, extra, children }: { id: string; label: string; hint?: string; err?: string; ok?: boolean; flag?: boolean; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className={`ps-field${err ? " has-err" : ""}`}>
      <label className="ps-label" htmlFor={id}>
        {label}
        {ok && !err && (
          <span className="ps-ok">
            <Tick /> Looks good
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span className={`ps-hint${flag ? " pp-ph-box" : ""}`} id={`${id}-h`}>
          {flag && <span className="pp-ph">Placeholder for Andrew</span>}
          {hint}
        </span>
      )}
      {extra}
      {err && (
        <span className="ps-err" id={`${id}-e`} role="alert">
          {err}
        </span>
      )}
    </div>
  );
}

function TypoFix({ s, onUse }: { s: string; onUse: (s: string) => void }) {
  return (
    <span className="ps-typo">
      Did you mean <strong>{s}</strong>?{" "}
      <button type="button" onClick={() => onUse(s)}>
        Use this
      </button>
    </span>
  );
}

// The live preview: a mini copy of the real app's top bar with the visitor's company in the
// company-switcher slot (Gen C shows "Cedar Ridge Earthworks" there).
function Preview({ v, step }: { v: Values; step: number }) {
  const first = v.name.trim().split(/\s+/)[0];
  return (
    <div className="ps-preview" aria-hidden="true">
      <span className="ps-preview-tag">Preview</span>
      <div className="ps-pv-bar">
        <img src={markUrl} alt="" width={16} height={16} />
        <span className="ps-pv-co">
          <strong>{v.company.trim() || "Your company"}</strong>
          <span>{step >= 1 && first ? `Set up by ${first}` : "SmartCrew"}</span>
        </span>
        {v.size && <span className="ps-pv-size">{v.size} people</span>}
      </div>
      <div className={`ps-pv-skel${step >= 1 ? " is-folded" : ""}`}>
        {["Jobs", "Crew", "Timecards"].map((x) => (
          <span key={x}>
            <i>{x}</i>
            <b />
          </span>
        ))}
      </div>
    </div>
  );
}
