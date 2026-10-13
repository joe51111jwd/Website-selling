import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { aCall, config } from "../config";
import { firstName, saveBooking, savedBooking, savedLead, type Booking, type Lead } from "../lib/lead";
import { track, trackCustom } from "../lib/track";
import { Flag } from "../signup/Flag";
import { mountCal, mountVidalytics } from "./embeds";
import { downloadIcs, downloadVcf, googleUrl, when } from "./calendar";
import { Logo } from "../brand/Logo";
import faceUrl from "../signup/assets/andrew-face.webp";
import bustUrl from "../signup/assets/andrew-bust.webp";

// /book, "Last step: pick a time with Andrew" (BRIEF /book, BOOKING.md, PLAYBOOK §6). Two jobs, in
// order: he books before leaving, then he shows up. Andrew's walkthrough plays on the dark side;
// his calendar sits on the light side, already filled in from the popup. After booking, the
// calendar turns into the ticket for the call.

const LITE = typeof window !== "undefined" && window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
/** Phones: the calendar (the last step) comes first; Andrew's video is one tap-to-open row above it. */
const PHONE = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
const blur = (px: number): { filter?: string } => (LITE ? {} : { filter: `blur(${px}px)` });
const ease = [0.22, 1, 0.36, 1] as const;

/** Dev only: /book/?demo=booked shows the booked state without touching Andrew's calendar. */
function devBooking(): Booking | null {
  if (!import.meta.env.DEV) return null;
  const q = new URLSearchParams(location.search);
  if (q.get("demo") !== "booked") return null;
  const s = new Date();
  s.setDate(s.getDate() + 1);
  s.setHours(10, 30, 0, 0);
  return { uid: "demo", start: s.toISOString(), end: new Date(+s + 45 * 60e3).toISOString() };
}

export default function Book() {
  const reduce = useReducedMotion() ?? false;
  const [lead] = useState<Lead | null>(() => savedLead());
  const [booking, setBooking] = useState<Booking | null>(() => devBooking() ?? savedBooking());
  const [fresh, setFresh] = useState(false); // booked on this visit (vs. came back later)
  const [cal, setCal] = useState<"loading" | "ready" | "failed">("loading");
  const [videoFailed, setVideoFailed] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const first = lead?.first || (lead ? firstName(lead.name) : "");
  const demo = lead?.intent === "demo";
  const company = lead?.company?.trim();

  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    track("ViewContent", { content_name: "Book a call", intent: lead?.intent ?? "direct" }, lead?.lead_id ? `${lead.lead_id}-book` : undefined);
  }, [lead]);

  // Andrew's video after first paint, so the headline and calendar come first. Phones: after the
  // calendar has loaded (or 2 s), so the player's scripts don't compete with the booking for the
  // main thread; the poster (Andrew, a play mark) holds the spot meanwhile.
  const video = useRef(false);
  const mountVideo = () => {
    if (video.current) return;
    video.current = true;
    mountVidalytics(config.vidalytics.walkthrough, () => setVideoFailed(true));
  };
  // phones: the video stays a row until he opens it (its player loads then, not before)
  const [vidOpen, setVidOpen] = useState(!PHONE);
  useEffect(() => {
    if (PHONE) return;
    const id = window.setTimeout(mountVideo, LITE && !booking ? 2000 : 60);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!PHONE && LITE && cal !== "loading") mountVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cal]);
  useEffect(() => {
    if (PHONE && vidOpen) mountVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vidOpen]);

  // Andrew's calendar, prefilled; a failure falls back to a plain link and email
  useEffect(() => {
    if (booking || !calRef.current) return;
    mountCal(calRef.current, lead, {
      onReady: () => setCal("ready"),
      onFailed: () => setCal("failed"),
      onViewed: () => trackCustom("cal_booker_viewed"),
      onBooked: (b) => {
        const full = { ...b, lead_id: lead?.lead_id };
        track("Schedule", { content_name: demo ? "Demo with Andrew" : "Founding Member call" }, b.uid ?? lead?.lead_id);
        saveBooking(full);
        try {
          history.replaceState(null, "", `${location.pathname}?status=booked`);
        } catch {
          /* ignore */
        }
        setFresh(true);
        setBooking(full);
      },
    });
    // if Cal never says it's ready (blocked, offline), show the way out after a while
    const t = window.setTimeout(() => setCal((c) => (c === "loading" ? "failed" : c)), 15000);
    return () => window.clearTimeout(t);
  }, [booking, lead, demo]);

  const h1 = booking
    ? first
      ? `See you on the call, ${first}.`
      : "See you on the call."
    : demo
      ? first
        ? `${first}, pick a time for your demo with Andrew.`
        : "Pick a time for your demo with Andrew."
      : first
        ? `Last step, ${first}: pick a time with Andrew.`
        : "Last step: pick a time with Andrew.";

  const kicker = demo ? (company ? `Demo with Andrew for ${company}` : "Demo with Andrew") : company ? `Founding Member trial for ${company}` : "Founding Member trial";

  const sub = demo ? (
    <>
      {cap(aCall())} with the founder. No sales team. No BDR. Just Andrew.
      {!config.callLengthConfirmed && <Flag note="Andrew to confirm the call length (his Cal.com event is 45 minutes today)" />}
    </>
  ) : (
    <>
      Your Founding Member trial is set up on {aCall()} with Andrew. Watch how SmartCrew works while you pick a time.
      {!config.callLengthConfirmed && <Flag note="Andrew to confirm the call length (his Cal.com event is 45 minutes today)" />}
    </>
  );

  return (
    <div className={`bk${booking ? " is-booked" : ""}`}>
      <section className="bk-dark">
        <header className="bk-brand">
          <a href="../" className="bk-logo" aria-label="SmartCrew, back to the product page">
            <Logo tone="white" decorative className="bk-logo-svg" />
          </a>
        </header>

        <div className="bk-intro">
          <motion.p className="bk-kicker" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.5, ease, delay: 0.05 }}>
            {kicker}
          </motion.p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={h1}
              className="bk-h1"
              initial={{ opacity: 0, y: reduce ? 0 : "0.3em", ...blur(reduce ? 0 : 12) }}
              animate={{ opacity: 1, y: 0, ...blur(0) }}
              exit={{ opacity: 0, y: reduce ? 0 : "-0.2em", ...blur(reduce ? 0 : 8) }}
              transition={{ duration: reduce ? 0 : 0.6, ease }}
            >
              {h1}
            </motion.h1>
          </AnimatePresence>
          {!booking && (
            <motion.p className="bk-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.5, delay: 0.2 }}>
              {sub}
            </motion.p>
          )}

          {PHONE && !vidOpen && (
            <button type="button" className="bk-vrow" onClick={() => setVidOpen(true)} aria-expanded={false} aria-controls="bk-video">
              <span className="bk-vrow-thumb" aria-hidden="true">
                <img src={bustUrl} alt="" />
                <span className="bk-vrow-play">
                  <svg width="12" height="12" viewBox="0 0 18 18">
                    <path d="M5 3.2v11.6L14.6 9z" fill="currentColor" />
                  </svg>
                </span>
              </span>
              <span className="bk-vrow-tx">
                <b>Watch Andrew’s walkthrough</b>
                <span>Andrew Drish, founder, shows SmartCrew</span>
              </span>
            </button>
          )}
          <motion.figure
            id="bk-video"
            hidden={!vidOpen}
            className="bk-video"
            initial={{ opacity: 0, y: reduce ? 0 : 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20, delay: 0.18 }}
          >
            <div className="bk-video-frame">
              <div className="bk-poster" aria-hidden="true">
                <img src={bustUrl} alt="" />
                {videoFailed ? (
                  <span className="bk-poster-note">Andrew's video didn't load here.</span>
                ) : (
                  <span className="bk-poster-play">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path d="M5 3.2v11.6L14.6 9z" fill="currentColor" />
                    </svg>
                  </span>
                )}
              </div>
              <div id={`vidalytics_embed_${config.vidalytics.walkthrough}`} className="bk-vid" />
            </div>
            <figcaption className="bk-cap">
              <img src={faceUrl} alt="" width={26} height={26} />
              Andrew Drish, founder, walks through SmartCrew.
            </figcaption>
          </motion.figure>
        </div>
      </section>

      <section className="bk-light" aria-label={booking ? "Your call" : "Pick a time"}>
        <header className="bk-top">
          <ol className="bk-progress" aria-label="Progress">
            <li className="is-done">
              <Tick /> Your details
            </li>
            <li className="bk-progress-line" aria-hidden="true">
              <motion.i initial={false} animate={{ scaleX: booking ? 1 : 0.5 }} transition={{ duration: reduce ? 0 : 0.8, ease }} />
            </li>
            <li className={booking ? "is-done" : "is-now"}>
              {booking ? <Tick /> : <span className="bk-now-dot" aria-hidden="true" />}
              {booking ? "Call booked" : "Pick a time"}
            </li>
          </ol>
          <a className="bk-help" href={`mailto:${config.email}`}>
            {config.email}
          </a>
        </header>

        <div className="bk-stage">
          <AnimatePresence mode="wait" initial={false}>
            {booking ? (
              <Ticket key="ticket" booking={booking} lead={lead} fresh={fresh} reduce={reduce} demo={demo} />
            ) : (
              <motion.div key="cal" className="bk-cal-wrap" exit={{ opacity: 0, scale: 0.97, ...blur(8) }} transition={{ duration: reduce ? 0 : 0.3, ease }}>
                {lead?.estimate && (
                  <p className="bk-est">
                    Your estimate: <b>${Math.round(lead.estimate.annual).toLocaleString("en-US")} a year</b> in loose time. Andrew will start there.
                    <Flag note="Andrew to confirm he opens the call with the visitor's own estimate" />
                  </p>
                )}
                <div className={`bk-cal is-${cal}`}>
                  <div ref={calRef} className="bk-cal-embed" />
                  <AnimatePresence>{cal === "loading" && <CalSkeleton key="skel" />}</AnimatePresence>
                  {cal === "failed" && <CalFallback />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bk-after">
            <div className="bk-covers">
              <h2>
                On the call
                <Flag note="Andrew to confirm what the call covers" />
              </h2>
              <ol>
                <li>You tell Andrew how you track time, equipment and job costs today.</li>
                <li>He shows you SmartCrew on a job like yours.</li>
                <li>If it fits, he sets up your Founding Member trial. If it doesn't, he'll tell you.</li>
              </ol>
            </div>
            <ul className="bk-assure">
              <li>Most companies are fully set up within a few days.</li>
              <li>A real person answers, by phone, chat or email.</li>
              <li>No contracts. Cancel anytime.</li>
            </ul>
          </div>
        </div>

        <footer className="bk-foot">
          <span>© {new Date().getFullYear()} SmartCrew</span>
          <a href={`mailto:${config.email}`}>{config.email}</a>
          <a href={config.privacyUrl}>Privacy</a>
          <a href={config.termsUrl}>Terms</a>
        </footer>
      </section>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Tick() {
  return (
    <span className="bk-tick" aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 12 12">
        <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function CalSkeleton() {
  return (
    <motion.div className="bk-skel" aria-hidden="true" initial={false} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
      <div className="bk-skel-cal">
        <span className="bk-skel-bar bk-skel-bar--title" />
        <div className="bk-skel-grid">
          {Array.from({ length: 35 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 7) * 60}ms` }} />
          ))}
        </div>
      </div>
      <div className="bk-skel-times">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <p className="bk-skel-note">Loading Andrew's open times…</p>
    </motion.div>
  );
}

function CalFallback() {
  const url = `https://cal.com/${config.calLink}`;
  return (
    <div className="bk-fallback" role="alert">
      <p className="bk-fallback-h">Andrew's calendar didn't load here.</p>
      <p>
        Open it on Cal.com, or email <a href={`mailto:${config.email}`}>{config.email}</a> and Andrew will find you a time.
      </p>
      <a className="bk-btn" href={url} target="_blank" rel="noopener noreferrer">
        Open Andrew's calendar
      </a>
    </div>
  );
}

function Ticket({ booking, lead, fresh, reduce, demo }: { booking: Booking; lead: Lead | null; fresh: boolean; reduce: boolean; demo: boolean }) {
  const w = when(booking);
  const first = lead?.first;
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    head.current?.focus({ preventScroll: false });
  }, []);
  const item = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 12, ...blur(reduce ? 0 : 6) },
    animate: { opacity: 1, y: 0, ...blur(0) },
    transition: { duration: reduce ? 0 : 0.5, ease, delay: reduce ? 0 : 0.25 + i * 0.07 },
  });
  return (
    <motion.article
      className="bk-ticket"
      initial={{ opacity: 0, y: reduce ? 0 : 30, scale: 0.97, rotateX: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 20 }}
      style={{ transformPerspective: 1200 }}
    >
      <div className="bk-ticket-top">
        <motion.span className="bk-ticket-check" initial={{ scale: reduce ? 1 : 0 }} animate={{ scale: 1 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 18, delay: 0.15 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <motion.path
              d="M5.5 11.4 9.4 15l7.2-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.3, ease }}
            />
          </svg>
        </motion.span>
        <motion.h2 ref={head} tabIndex={-1} className="bk-ticket-h" {...item(0)}>
          {fresh ? "You're booked" : "You're already booked"}
          {first ? `, ${first}` : ""}.
        </motion.h2>
        <motion.p className="bk-ticket-day" {...item(1)}>
          {w.day}
        </motion.p>
        <motion.p className="bk-ticket-time" {...item(2)}>
          {w.time}
          {w.zone ? <span> · {w.zone}</span> : null}
        </motion.p>
        <motion.p className="bk-ticket-with" {...item(3)}>
          {demo ? "Your demo" : "Your setup call"} with Andrew Drish, founder of SmartCrew. The confirmation and the call details are in your email.
        </motion.p>
        <motion.div className="bk-ticket-actions" {...item(4)}>
          <a className="bk-btn" href={googleUrl(booking)} target="_blank" rel="noopener noreferrer" onClick={() => trackCustom("add_to_calendar", { kind: "google" })}>
            <CalIcon /> Add to Google Calendar
          </a>
          <button
            type="button"
            className="bk-btn bk-btn--ghost"
            onClick={() => {
              trackCustom("add_to_calendar", { kind: "ics" });
              downloadIcs(booking);
            }}
          >
            Apple / Outlook (.ics)
          </button>
        </motion.div>
      </div>

      <div className="bk-ticket-perf" aria-hidden="true" />

      <div className="bk-ticket-bottom">
        <motion.div className="bk-handy" {...item(5)}>
          <p className="bk-handy-h">Have these handy</p>
          <ul>
            <li>Your crew count</li>
            <li>How you do timecards today</li>
            <li>Your last payroll</li>
          </ul>
        </motion.div>
        <motion.div className="bk-save" {...item(6)}>
          <img src={faceUrl} alt="" width={40} height={40} />
          <p>
            <b>Save Andrew's number</b> so you know it's him when he calls.
            <Flag note="Andrew to pick the public number he calls and texts from (config.andrewPhone)" />
          </p>
          <button
            type="button"
            className="bk-btn bk-btn--ghost bk-btn--sm"
            onClick={() => {
              trackCustom("save_contact");
              downloadVcf();
            }}
          >
            Save contact
          </button>
        </motion.div>
        <motion.p className="bk-ticket-move" {...item(7)}>
          Need a different time? Use the link in your confirmation email.
        </motion.p>
      </div>
    </motion.article>
  );
}

function CalIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 6.5h12M5.5 1.8v2.6M10.5 1.8v2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
