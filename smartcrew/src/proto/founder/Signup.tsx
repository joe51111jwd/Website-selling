import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CREW_BUCKETS, T, track, type Bucket, type CalcResult, type Intent } from "./copy";
import { Flag } from "./ui";
import mark from "./assets/mark.svg";

// The trial popup (PLAYBOOK §5 / CRO.md §4). It feels like setting up an account, but never says
// one was created: the visitor names his company, watches a preview fill in, and is told about
// the call before he types anything personal.

export type SignupState = { size: Bucket | null; company: string; name: string; email: string; tel: string; sms: boolean; step: 1 | 2 | 3 | 4 };
export const EMPTY: SignupState = { size: null, company: "", name: "", email: "", tel: "", sms: false, step: 1 };
const KEY = "sc_signup_v1";

export function loadSaved(): SignupState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<SignupState>) } : null;
  } catch {
    return null;
  }
}
function save(s: SignupState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, ts: Date.now() }));
  } catch {
    /* private mode: the popup still works, it just won't resume */
  }
}

const DOMAINS: Record<string, string> = { "gmail.con": "gmail.com", "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "yahooo.com": "yahoo.com", "yaho.com": "yahoo.com", "hotmial.com": "hotmail.com", "outlok.com": "outlook.com", "icloud.con": "icloud.com" };
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const suggest = (e: string) => {
  const [u, d] = e.trim().toLowerCase().split("@");
  return u && d && DOMAINS[d] ? `${u}@${DOMAINS[d]}` : null;
};
const digits = (t: string) => {
  let d = t.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d;
};
const fmtTel = (t: string) => {
  const d = digits(t).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

type Props = {
  intent: Intent;
  source: string;
  presetSize?: Bucket;
  calc?: CalcResult;
  resumed: boolean;
  initial: SignupState;
  onClose: (s: SignupState) => void;
};

export function Signup({ intent, source, presetSize, calc, resumed, initial, onClose }: Props) {
  const [s, setS] = useState<SignupState>(() => ({ ...initial, size: presetSize ?? initial.size }));
  const [err, setErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const uid = useId();
  const sizeSaved = !!presetSize && s.step === 1;
  const first = s.name.trim().split(/\s+/)[0] ?? "";
  const close = () => onClose(s);

  const sRef = useRef(s);
  sRef.current = s;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Back button closes; Esc closes; focus is trapped and starts on the first empty field.
  // The history entry is pushed on the next tick so React's dev double-mount doesn't leave a
  // stray back-navigation that would close the popup it just opened.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    let pushed = false;
    const t0 = setTimeout(() => {
      history.pushState({ scSignup: true }, "");
      pushed = true;
    }, 0);
    const onPop = () => {
      pushed = false;
      closeRef.current(sRef.current);
    };
    addEventListener("popstate", onPop);
    document.documentElement.style.overflow = "hidden";
    const t = setTimeout(() => focusFirst(), 60);
    return () => {
      clearTimeout(t0);
      clearTimeout(t);
      removeEventListener("popstate", onPop);
      document.documentElement.style.overflow = "";
      if (pushed && history.state?.scSignup) history.back();
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    track("step_view", { step: s.step });
    const t = setTimeout(() => focusFirst(), 40);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.step]);

  function focusFirst() {
    const root = dialog.current;
    if (!root) return;
    const empty = Array.from(root.querySelectorAll<HTMLInputElement>("input[data-req]")).find((i) => !i.value);
    (empty ?? root.querySelector<HTMLElement>("[data-autofocus]") ?? root.querySelector<HTMLElement>("button"))?.focus();
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
    if (e.key !== "Tab" || !dialog.current) return;
    const f = Array.from(dialog.current.querySelectorAll<HTMLElement>("button, input, a[href]")).filter((x) => !x.hasAttribute("disabled") && x.offsetParent !== null);
    if (!f.length) return;
    const a = f[0],
      z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) {
      e.preventDefault();
      z.focus();
    } else if (!e.shiftKey && document.activeElement === z) {
      e.preventDefault();
      a.focus();
    }
  };

  const set = <K extends keyof SignupState>(k: K, v: SignupState[K]) => setS((p) => ({ ...p, [k]: v }));
  const clear = (k: string) => setErr((p) => ({ ...p, [k]: "" }));

  const check = (step: number) => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!s.size) e.size = "Pick your crew size to continue.";
      if (s.company.trim().length < 2) e.company = "Add your company name. Andrew sets up your trial under it.";
    }
    if (step === 2) {
      if (s.name.trim().length < 2) e.name = "Add your name so Andrew knows who he’s talking to.";
      if (!emailOk(s.email)) e.email = "That email looks off. Check for a typo?";
    }
    if (step === 3 && digits(s.tel).length !== 10) e.tel = "Enter a 10-digit mobile number, like (555) 123-4567.";
    setErr(e);
    const k = Object.keys(e)[0];
    if (k) {
      track("field_error", { field: k });
      setTimeout(() => dialog.current?.querySelector<HTMLElement>(`[data-field="${k}"]`)?.focus(), 0);
    }
    return !k;
  };

  const next = (ev: FormEvent) => {
    ev.preventDefault();
    if (!check(s.step)) return;
    if (s.step < 3) {
      const n = { ...s, step: (s.step + 1) as SignupState["step"] };
      setS(n);
      save(n);
      track("step_complete", { step: s.step });
      if (s.step === 2) track("lead_partial", { stage: "email" });
      return;
    }
    setSaving(true);
    const lead = {
      intent,
      entry_source: source,
      Company_Size: s.size,
      Company_Name: s.company.trim(),
      Name: s.name.trim(),
      Email: s.email.trim(),
      Phone: digits(s.tel),
      sms_consent: s.sms,
      calc_crew: calc?.crew,
      calc_minutes: calc?.minutes,
      calc_rate: calc?.rate,
      calc_annual: calc ? Math.round(calc.annual) : undefined,
    };
    setTimeout(() => {
      track("lead_submit", { stage: "complete", crew_size: s.size, sms_consent: s.sms });
      if (import.meta.env.DEV) console.debug("[lead]", lead);
      const n = { ...s, step: 4 as const };
      setS(n);
      save(n);
      setSaving(false);
    }, 700);
  };

  const pct = s.step === 4 ? 100 : s.step === 1 ? (s.size ? 34 : 8) : s.step === 2 ? 50 : 80;
  const title = intent === "demo" ? "Book your demo with Andrew" : `Claim your ${T.PROGRAM}`;

  return (
    <div className="f-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <motion.div
        ref={dialog}
        className="f-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-t`}
        onKeyDown={onKeyDown}
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="f-dlg-top">
          <img src={mark} alt="SmartCrew" width={20} height={24} />
          <div className="f-progress" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`f-progress-seg${s.step > i || s.step === 4 ? " is-done" : s.step === i ? " is-now" : ""}`}>
                <span style={{ width: s.step > i || s.step === 4 ? "100%" : s.step === i ? `${Math.max(12, ((pct - (i - 1) * 33.3) / 33.3) * 100)}%` : "0%" }} />
              </span>
            ))}
          </div>
          <span className="f-dlg-step">{s.step === 4 ? "Done" : sizeSaved ? "Step 1 of 3 · crew size saved" : `Step ${s.step} of 3`}</span>
          <button type="button" className="f-x" aria-label="Close" onClick={close}>
            <span aria-hidden="true" />
          </button>
        </div>

        {s.step < 4 && (
          <>
            <h2 className="f-dlg-title" id={`${uid}-t`}>
              {resumed && s.company ? `Welcome back. Let’s finish setting up ${s.company}.` : title}
            </h2>
            <p className="f-dlg-sub">Takes less than a minute. Then you pick a time to talk with Andrew.</p>

            <div className="f-preview" aria-label="Preview">
              <span className="f-preview-tag">Preview</span>
              <div className="f-preview-bar">
                <img src={mark} alt="" width={14} height={17} />
                <span className="f-preview-co">
                  <b>{s.company.trim() || "Your company"}</b>
                  <small>{first ? `${first} · admin` : "SmartCrew"}</small>
                </span>
                {s.size && <span className="f-preview-badge">{s.size} people</span>}
              </div>
              <div className="f-preview-skel">
                {["Jobs", "Crew", "Timecards"].map((x) => (
                  <span key={x}>
                    <b>{x}</b>
                    <i />
                    <i />
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <form className="f-dlg-form" onSubmit={next} noValidate>
          {s.step === 1 && (
            <>
              <h3 className="f-dlg-h">Set up your company</h3>
              <div className="f-field">
                <span className="f-label" id={`${uid}-size`}>
                  How many people work for you?
                </span>
                <span className="f-hint">Field and office.</span>
                <div className="f-sizes" role="radiogroup" aria-labelledby={`${uid}-size`} aria-describedby={err.size ? `${uid}-size-e` : undefined}>
                  {CREW_BUCKETS.map((b, i) => (
                    <button
                      key={b}
                      type="button"
                      role="radio"
                      aria-checked={s.size === b}
                      data-field={i === 0 ? "size" : undefined}
                      className="f-chip f-chip-lg"
                      onClick={() => {
                        set("size", b);
                        clear("size");
                      }}
                    >
                      {s.size === b && <span className="f-chip-tick" aria-hidden="true" />}
                      {b}
                    </button>
                  ))}
                </div>
                {err.size && (
                  <span className="f-err" id={`${uid}-size-e`} role="alert">
                    {err.size}
                  </span>
                )}
              </div>
              <div className="f-field">
                <label className="f-label" htmlFor={`${uid}-co`}>
                  Company name
                </label>
                <input
                  id={`${uid}-co`}
                  data-req
                  data-field="company"
                  className="f-input"
                  name="organization"
                  autoComplete="organization"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  maxLength={80}
                  value={s.company}
                  aria-invalid={!!err.company}
                  aria-describedby={err.company ? `${uid}-co-e` : undefined}
                  onChange={(e) => set("company", e.target.value)}
                  onBlur={() => s.company && s.company.trim().length < 2 && setErr((p) => ({ ...p, company: "Add your company name. Andrew sets up your trial under it." }))}
                  onFocus={() => clear("company")}
                />
                {err.company && (
                  <span className="f-err" id={`${uid}-co-e`} role="alert">
                    {err.company}
                  </span>
                )}
              </div>
              <button type="submit" className="f-btn f-btn-dark f-btn-block">
                Continue
              </button>
            </>
          )}

          {s.step === 2 && (
            <>
              <h3 className="f-dlg-h">Who’s setting up {s.company.trim() || "this"}?</h3>
              <div className="f-field">
                <label className="f-label" htmlFor={`${uid}-n`}>
                  Your name
                </label>
                <input
                  id={`${uid}-n`}
                  data-req
                  data-field="name"
                  className="f-input"
                  name="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  value={s.name}
                  aria-invalid={!!err.name}
                  aria-describedby={err.name ? `${uid}-n-e` : undefined}
                  onChange={(e) => set("name", e.target.value)}
                  onFocus={() => clear("name")}
                />
                {err.name && (
                  <span className="f-err" id={`${uid}-n-e`} role="alert">
                    {err.name}
                  </span>
                )}
              </div>
              <div className="f-field">
                <label className="f-label" htmlFor={`${uid}-e`}>
                  Email
                </label>
                <span className="f-hint" id={`${uid}-e-h`}>
                  Any email you check is fine. Gmail works.
                </span>
                <input
                  id={`${uid}-e`}
                  data-req
                  data-field="email"
                  className="f-input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={s.email}
                  aria-invalid={!!err.email}
                  aria-describedby={`${uid}-e-h${err.email ? ` ${uid}-e-e` : ""}`}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => s.email && !emailOk(s.email) && setErr((p) => ({ ...p, email: "That email looks off. Check for a typo?" }))}
                  onFocus={() => clear("email")}
                />
                {suggest(s.email) && (
                  <span className="f-suggest">
                    Did you mean <b>{suggest(s.email)}</b>?{" "}
                    <button type="button" className="f-link" onClick={() => set("email", suggest(s.email)!)}>
                      Use this
                    </button>
                  </span>
                )}
                {err.email && (
                  <span className="f-err" id={`${uid}-e-e`} role="alert">
                    {err.email}
                  </span>
                )}
              </div>
              <button type="submit" className="f-btn f-btn-dark f-btn-block">
                Continue
              </button>
              <p className="f-dlg-note">We’ll send your call details here.</p>
            </>
          )}

          {s.step === 3 && (
            <>
              <h3 className="f-dlg-h">Where can Andrew reach you?</h3>
              <div className="f-field">
                <label className="f-label" htmlFor={`${uid}-t3`}>
                  Mobile number
                </label>
                <span className="f-hint" id={`${uid}-t3-h`}>
                  Andrew uses this to confirm your call.
                  <Flag />
                </span>
                <input
                  id={`${uid}-t3`}
                  data-req
                  data-field="tel"
                  className="f-input"
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="done"
                  placeholder="(555) 123-4567"
                  value={s.tel}
                  aria-invalid={!!err.tel}
                  aria-describedby={`${uid}-t3-h${err.tel ? ` ${uid}-t3-e` : ""}`}
                  onChange={(e) => set("tel", fmtTel(e.target.value))}
                  onBlur={() => s.tel && digits(s.tel).length !== 10 && setErr((p) => ({ ...p, tel: "Enter a 10-digit mobile number, like (555) 123-4567." }))}
                  onFocus={() => clear("tel")}
                />
                {err.tel && (
                  <span className="f-err" id={`${uid}-t3-e`} role="alert">
                    {err.tel}
                  </span>
                )}
              </div>
              <label className="f-check">
                <input type="checkbox" name="sms_consent" checked={s.sms} onChange={(e) => set("sms", e.target.checked)} />
                <span>
                  <b>Text me reminders about my call</b> (optional)
                  <small>
                    By checking this, you agree to get call reminders by text from SmartCrew at this number. About 3 messages per booking. Msg &amp; data rates may apply. Reply STOP to opt
                    out.
                    <Flag />
                  </small>
                </span>
              </label>
              <div className="f-nextbox">
                {intent === "demo" ? (
                  <b>Next: pick a time for your demo with Andrew.</b>
                ) : (
                  <>
                    <b>
                      Next: watch Andrew’s short video and pick a time for your <span className="f-nw">{T.N}-minute</span> call.
                    </b> {T.PROGRAM}s are set up on this call.
                    <Flag />
                  </>
                )}
              </div>
              <button type="submit" className="f-btn f-btn-dark f-btn-block" disabled={saving} aria-busy={saving}>
                {saving ? (
                  <>
                    <span className="f-spin" aria-hidden="true" /> Saving…
                  </>
                ) : intent === "demo" ? (
                  "Pick my demo time"
                ) : (
                  "Pick my setup call time"
                )}
              </button>
              <p className="f-dlg-note">
                By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.
              </p>
            </>
          )}

          {s.step === 4 && (
            <div className="f-dlg-done">
              <h2 className="f-dlg-title" id={`${uid}-t`}>
                Last step: pick a time with Andrew.
              </h2>
              <p className="f-dlg-sub">
                On the live page this goes straight to /book: Andrew’s short video and his next open times, with {s.company.trim() || "your company"} and your details already filled in.
              </p>
              <a className="f-btn f-btn-dark f-btn-block" href="/book/" data-autofocus>
                Go to the booking page
              </a>
              <p className="f-dlg-note">Prototype: nothing was sent. No account was created and no trial has started yet.</p>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
