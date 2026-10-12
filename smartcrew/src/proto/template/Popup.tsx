import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SIZES, T, type SignupRequest, type SizeBucket } from "./types";
import { session, track } from "./track";
import markUrl from "./assets/brand/mark.svg";

// PLAYBOOK §5 / CRO §4: "Claim your Founding Member trial". Feels like setting up an account
// (company first, a live preview of it), says plainly that a call with Andrew comes next,
// and never claims an account or trial was created. Step 1 is fully built; steps 2–3 work
// client-side; nothing is sent anywhere in the prototype.

type Values = { size?: SizeBucket; company: string; name: string; email: string; tel: string; sms: boolean };
type Errs = Partial<Record<"size" | "company" | "name" | "email" | "tel", string>>;

const KEY = "sc_signup_v1";
const EASE = [0.23, 1, 0.32, 1] as const;

function load(): { v: Values; step: number } | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function save(v: Values, step: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v, step, ts: Date.now() }));
  } catch {
    /* private mode: the popup still works, it just won’t resume */
  }
}

const DOMAIN_FIX: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "outlook.con": "outlook.com",
};

function telFormat(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function Popup({ req, onClose }: { req: SignupRequest | null; onClose: (unfinished: boolean) => void }) {
  return <AnimatePresence>{req && <Dialog key="dlg" req={req} onClose={onClose} />}</AnimatePresence>;
}

function Dialog({ req, onClose }: { req: SignupRequest; onClose: (unfinished: boolean) => void }) {
  const uid = useId();
  const reduce = useReducedMotion();
  const saved = useRef(load()).current;
  const resumed = !!saved && saved.step > 1 && !req.size;
  const [v, setV] = useState<Values>(() => ({
    company: "",
    name: "",
    email: "",
    tel: "",
    sms: false,
    ...(saved?.v ?? {}),
    ...(req.size ? { size: req.size } : {}),
  }));
  const [step, setStep] = useState<number>(() => (resumed ? Math.min(saved!.step, 3) : 1));
  const [errs, setErrs] = useState<Errs>({});
  const [suggest, setSuggest] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dlg = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step);
  stepRef.current = step;
  const prefilled = !!req.size;
  const demo = req.intent === "demo";

  // open: history entry so Android back / swipe-back closes it; lock page scroll
  useEffect(() => {
    track("popup_open", { intent: req.intent, source: req.source, size_prefilled: prefilled, resumed });
    const prev = document.activeElement as HTMLElement | null;
    history.pushState({ scPopup: true }, "");
    const onPop = () => onClose(stepRef.current < 4);
    window.addEventListener("popstate", onPop);
    const y = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      document.documentElement.style.overflow = y;
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // focus the first empty field of each step
  useLayoutEffect(() => {
    const root = dlg.current;
    if (!root) return;
    const t = window.setTimeout(() => {
      const fields = Array.from(root.querySelectorAll<HTMLElement>("[data-field]"));
      const first = fields.find((el) => (el instanceof HTMLInputElement ? !el.value : el.getAttribute("aria-checked") !== "true" && el.dataset.group !== "done")) ?? fields[0];
      first?.focus();
    }, 60);
    return () => window.clearTimeout(t);
  }, [step]);

  const close = () => {
    if (history.state?.scPopup) history.back();
    else onClose(step < 4);
  };

  // Esc closes from anywhere (focus can be on <body> after a step swaps its fields out)
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Tab" && dlg.current) {
      const f = Array.from(dlg.current.querySelectorAll<HTMLElement>('button, input, a[href], [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute("disabled"));
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
    }
  };

  const check = (field: keyof Errs, vals = v): string | undefined => {
    switch (field) {
      case "size":
        return vals.size ? undefined : "Pick your crew size to continue.";
      case "company":
        return vals.company.trim().length >= 2 ? undefined : "Add your company name. Andrew sets up your trial under it.";
      case "name":
        return vals.name.trim().length >= 2 ? undefined : "Add your name so Andrew knows who he’s talking to.";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(vals.email.trim()) ? undefined : "That email looks off. Check for a typo?";
      case "tel":
        return vals.tel.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "").length === 10 ? undefined : "Enter a 10-digit mobile number, like (555) 123-4567.";
    }
  };

  const blur = (field: keyof Errs) => {
    const m = check(field);
    setErrs((e) => ({ ...e, [field]: m }));
    if (field === "email" && !m) {
      const dom = v.email.split("@")[1]?.toLowerCase();
      setSuggest(dom && DOMAIN_FIX[dom] ? `${v.email.split("@")[0]}@${DOMAIN_FIX[dom]}` : null);
    }
  };

  const fieldsOf: Record<number, (keyof Errs)[]> = { 1: ["size", "company"], 2: ["name", "email"], 3: ["tel"] };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const fs = fieldsOf[step] ?? [];
    const next: Errs = {};
    fs.forEach((f) => (next[f] = check(f)));
    setErrs((x) => ({ ...x, ...next }));
    const bad = fs.find((f) => next[f]);
    if (bad) {
      track("field_error", { field: bad, step });
      const el = dlg.current?.querySelector<HTMLElement>(`[data-field="${bad}"]`);
      el?.focus();
      return;
    }
    track("step_complete", { step });
    if (step < 3) {
      save(v, step + 1);
      if (step === 2) track("lead_partial");
      setStep(step + 1);
      return;
    }
    setSaving(true);
    const lead = {
      intent: req.intent,
      entry_source: req.source,
      crew_size: v.size,
      company: v.company.trim(),
      name: v.name.trim(),
      email: v.email.trim(),
      tel: v.tel,
      sms_consent: v.sms,
      calc: req.calc,
      modules_viewed: [...session.modulesViewed],
      faq_opened: [...session.faqOpened],
      // live site field names kept for the existing notification mapping (DOSSIER §10.2)
      "Company-Name": v.company.trim(),
      "Company-Size": v.size,
    };
    window.setTimeout(() => {
      track("lead_submit", { crew_size: v.size, sms_consent: v.sms });
      console.info("[prototype] lead payload", lead);
      save(v, 4);
      setSaving(false);
      setStep(4);
    }, 700);
  };

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((x) => ({ ...x, [k]: val }));

  // a size picked on the page fills the first segment ("crew size saved", endowed progress)
  const progress = step >= 4 ? 3 : step - 1 + (step === 1 ? (prefilled ? 1 : v.size ? 0.5 : 0) : 0);
  const title = demo ? "Book your demo with Andrew" : "Claim your Founding Member trial";
  const company = v.company.trim();

  const fieldErr = (k: keyof Errs) =>
    errs[k] ? (
      <p className="pop-err" id={`${uid}-${k}-err`} role="alert">
        {errs[k]}
      </p>
    ) : null;

  const motionPanel = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    transition: { duration: 0.26, ease: EASE },
  };

  return (
    <motion.div className="pop-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <motion.div ref={dlg} className="pop" role="dialog" aria-modal="true" aria-labelledby={`${uid}-t`} onKeyDown={onKey} {...motionPanel}>
        <div className="pop-top">
          <img src={markUrl} alt="SmartCrew" className="pop-mark" width={17} height={20} />
          <div className="pop-prog" aria-label={`Step ${Math.min(step, 3)} of 3`}>
            <div className="pop-bars">
              {[0, 1, 2].map((i) => (
                <span key={i} className="pop-bar">
                  <i style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress - i))})` }} />
                </span>
              ))}
            </div>
            <span className="pop-step tnum">{step >= 4 ? "Details saved" : prefilled && step === 1 ? "Step 1 of 3 · crew size saved" : `Step ${step} of 3`}</span>
          </div>
          <button type="button" className="pop-x focusable" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
            </svg>
          </button>
        </div>

        <div className="pop-scroll">
          <h2 className="pop-title" id={`${uid}-t`}>
            {resumed && step < 4 && company ? `Welcome back. Let’s finish setting up ${company}.` : title}
          </h2>
          <p className="pop-sub">Takes less than a minute. Then you pick a time to talk with Andrew.</p>

          <Preview company={company} size={v.size} name={step >= 3 ? v.name.trim().split(" ")[0] : ""} />

          {step < 4 ? (
            <form className="pop-form" onSubmit={submit} noValidate>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} className="pop-step-body" initial={{ opacity: 0, x: reduce ? 0 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -12 }} transition={{ duration: 0.2, ease: EASE }}>
                  {step === 1 && (
                    <>
                      <h3 className="pop-h">Set up your company</h3>
                      <Field>
                        <span className="pop-label" id={`${uid}-size-l`}>
                          How many people work for you?
                        </span>
                        <span className="pop-hint">Field and office.</span>
                        <div className="pop-chips" role="radiogroup" aria-labelledby={`${uid}-size-l`} aria-describedby={errs.size ? `${uid}-size-err` : undefined}>
                          {SIZES.map((s, i) => (
                            <button
                              key={s}
                              type="button"
                              role="radio"
                              aria-checked={v.size === s}
                              data-field={i === 0 ? "size" : undefined}
                              data-group={v.size ? "done" : undefined}
                              className="chip pop-chip"
                              onClick={() => {
                                set("size", s);
                                setErrs((e) => ({ ...e, size: undefined }));
                              }}
                            >
                              {v.size === s && <Tick />}
                              {s}
                            </button>
                          ))}
                        </div>
                        {fieldErr("size")}
                      </Field>
                      <Field>
                        <label className="pop-label" htmlFor={`${uid}-co`}>
                          Company name
                        </label>
                        <input
                          id={`${uid}-co`}
                          data-field="company"
                          className={`pop-in ${errs.company ? "is-bad" : ""}`}
                          name="organization"
                          autoComplete="organization"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          maxLength={80}
                          value={v.company}
                          aria-invalid={!!errs.company}
                          aria-describedby={errs.company ? `${uid}-company-err` : undefined}
                          onChange={(e) => set("company", e.target.value)}
                          onBlur={() => v.company && blur("company")}
                        />
                        {fieldErr("company")}
                      </Field>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h3 className="pop-h">{company ? `Who’s setting up ${company}?` : "Who’s setting this up?"}</h3>
                      <Field>
                        <label className="pop-label" htmlFor={`${uid}-nm`}>
                          Your name
                        </label>
                        <input
                          id={`${uid}-nm`}
                          data-field="name"
                          className={`pop-in ${errs.name ? "is-bad" : ""}`}
                          name="name"
                          autoComplete="name"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          value={v.name}
                          aria-invalid={!!errs.name}
                          aria-describedby={errs.name ? `${uid}-name-err` : undefined}
                          onChange={(e) => set("name", e.target.value)}
                          onBlur={() => v.name && blur("name")}
                        />
                        {fieldErr("name")}
                      </Field>
                      <Field>
                        <label className="pop-label" htmlFor={`${uid}-em`}>
                          Email
                        </label>
                        <span className="pop-hint">Any email you check is fine. Gmail works.</span>
                        <input
                          id={`${uid}-em`}
                          data-field="email"
                          className={`pop-in ${errs.email ? "is-bad" : ""}`}
                          type="email"
                          name="email"
                          autoComplete="email"
                          inputMode="email"
                          autoCapitalize="off"
                          spellCheck={false}
                          enterKeyHint="next"
                          value={v.email}
                          aria-invalid={!!errs.email}
                          aria-describedby={errs.email ? `${uid}-email-err` : undefined}
                          onChange={(e) => set("email", e.target.value)}
                          onBlur={() => v.email && blur("email")}
                        />
                        {fieldErr("email")}
                        {suggest && (
                          <p className="pop-suggest">
                            Did you mean <b>{suggest}</b>?{" "}
                            <button
                              type="button"
                              className="link"
                              onClick={() => {
                                set("email", suggest);
                                setSuggest(null);
                              }}
                            >
                              Use this
                            </button>
                          </p>
                        )}
                      </Field>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <h3 className="pop-h">Where can Andrew reach you?</h3>
                      <Field>
                        <label className="pop-label" htmlFor={`${uid}-tel`}>
                          Mobile number
                        </label>
                        <span className="pop-hint">Andrew uses this to confirm your call.</span>
                        <input
                          id={`${uid}-tel`}
                          data-field="tel"
                          className={`pop-in tnum ${errs.tel ? "is-bad" : ""}`}
                          type="tel"
                          name="tel"
                          autoComplete="tel"
                          inputMode="tel"
                          enterKeyHint="done"
                          placeholder="(555) 123-4567"
                          value={v.tel}
                          aria-invalid={!!errs.tel}
                          aria-describedby={errs.tel ? `${uid}-tel-err` : undefined}
                          onChange={(e) => set("tel", telFormat(e.target.value))}
                          onBlur={() => v.tel && blur("tel")}
                        />
                        {fieldErr("tel")}
                      </Field>
                      <label className="pop-check">
                        <input type="checkbox" name="sms_consent" checked={v.sms} onChange={(e) => set("sms", e.target.checked)} />
                        <span>
                          <b>Text me reminders about my call</b> (optional)
                          <small>
                            By checking this, you agree to get call reminders by text from SmartCrew at this number. About 3 messages per booking. Msg &amp; data rates may apply. Reply STOP to opt out.
                          </small>
                        </span>
                      </label>
                      <div className="pop-next">
                        {demo ? (
                          <b>Next: pick a time for your demo with Andrew.</b>
                        ) : (
                          <>
                            <b>
                              Next: watch Andrew’s short video and pick a time for your {T.N}-minute call.
                            </b>{" "}
                            Founding Member trials are set up on this call.
                          </>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="pop-actions">
                <button type="submit" className="btn btn-dark btn-lg pop-go" disabled={saving}>
                  {saving ? "Saving…" : step < 3 ? "Continue" : demo ? "Pick my demo time" : "Pick my setup call time"}
                </button>
                {step === 2 && <p className="caption pop-under">We’ll send your call details here.</p>}
                {step === 3 && (
                  <p className="caption pop-under">
                    By continuing, you agree to our{" "}
                    <a className="link" href="#terms" onClick={(e) => e.preventDefault()}>
                      Terms
                    </a>{" "}
                    and{" "}
                    <a className="link" href="#privacy" onClick={(e) => e.preventDefault()}>
                      Privacy Policy
                    </a>
                    .
                  </p>
                )}
                {step > 1 && (
                  <button type="button" className="pop-back link" onClick={() => setStep(step - 1)}>
                    Back
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="pop-done">
              <p className="pop-h">Next: pick a time with Andrew.</p>
              <p>
                In the live flow this opens <b>/book</b>: Andrew’s short video next to his real open times. Your details are already filled in, so booking takes two taps.
              </p>
              <span className="ph-tag">Prototype ends here</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ children }: { children: ReactNode }) {
  return <div className="pop-field">{children}</div>;
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

/** The "workspace preview": a miniature of the real app’s top bar filling in as they type. */
function Preview({ company, size, name }: { company: string; size?: SizeBucket; name: string }) {
  return (
    <div className="pv" aria-hidden>
      <span className="pv-label">Preview</span>
      <div className="pv-bar">
        <img src={markUrl} alt="" className="pv-mark" width={11} height={13} />
        <span className="pv-word">SMARTCREW</span>
        <span className="pv-co">
          <span className={`pv-name ${company ? "" : "is-empty"}`}>{company || "Your company"}</span>
          <span className="pv-sub">
            {size ? `${size} people` : "Crew size"}
            {name ? ` · ${name}` : ""}
          </span>
        </span>
      </div>
      <div className="pv-body">
        <span className="pv-nav">
          <i>Jobs</i>
          <i>Crew</i>
          <i>Timecards</i>
        </span>
        <span className="pv-sk">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}
