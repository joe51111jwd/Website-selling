import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { aCall, config } from "../config";
import { firstName, saveBooking, savedBooking, savedLead, type Booking, type Lead } from "../lib/lead";
import { track, trackCustom } from "../lib/track";
import { Flag } from "../signup/Flag";
import { OFFER } from "../content/copy";
import { TRIAL_FIRST } from "../lib/offer";
import { mountCal, mountVidalytics, vidalyticsPlayer, type VidPlayer } from "./embeds";
import { downloadIcs, downloadVcf, googleUrl, when } from "./calendar";
import { Logo } from "../brand/Logo";
import { BrandLogo } from "../brand/BrandLogo";
import { CLASSIC } from "../lib/look";
import faceUrl from "../signup/assets/andrew-face.webp";
import bustUrl from "../signup/assets/andrew-bust.webp";

// /book: Andrew's words and blocks (Oct 19, his layout by text; his Loom, Oct 20). His headline
// centred, then his two columns: the video with "Here's what we'll cover" under it on the left, the
// calendar on the right in a card that says what the call is, already filled in from the popup.
// No gate in front of the calendar (Oct 20: "I don't want to have this skipping book… I think we
// want it all on the same page… probably to the right"; this replaces the video-first page of
// Oct 19). Once the video is playing and they scroll it out of sight, it keeps playing in a corner
// player top-left ("I love how… that keeps running"). After booking, the page becomes his final
// confirmation page (his doc, Oct 20 17:30Z): his "You're Booked!" headline and line over the same
// video, now centred and wide, the call's ticket under it. The video stays as it is until the
// agency owner's new one arrives.

const LITE = typeof window !== "undefined" && window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
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
  const [cal, setCal] = useState<"loading" | "ready" | "failed">("loading");
  const [videoFailed, setVideoFailed] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);
  /** the video in the corner, still playing, while they book: it is playing, its slot has scrolled
   *  out of sight, and they haven't closed the corner player since they last pressed play */
  const [playing, setPlaying] = useState(false);
  const [slotOut, setSlotOut] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const mini = playing && slotOut && !dismissed && !booking && !videoFailed;
  const slotRef = useRef<HTMLDivElement>(null);
  const player = useRef<VidPlayer | null>(null);

  const first = lead?.first || (lead ? firstName(lead.name) : "");
  const demo = lead?.intent === "demo";
  /** Bold look, once Andrew turns it on: the trial starts here and the call is optional (src/lib/offer.ts). */
  const trialFirst = TRIAL_FIRST && !demo;
  const T1 = OFFER.trialFirst;

  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    track("ViewContent", { content_name: "Book a call", intent: lead?.intent ?? "direct" }, lead?.lead_id ? `${lead.lead_id}-book` : undefined);
  }, [lead]);

  // Andrew's video right after first paint; a tap on the poster loads the player at once
  const video = useRef(false);
  const [vidOn, setVidOn] = useState(false);
  const mountVideo = () => {
    if (video.current) return;
    video.current = true;
    setVidOn(true);
    vidalyticsPlayer(config.vidalytics.walkthrough).then((p) => {
      if (!p) return;
      player.current = p;
      p.on("play", () => {
        setPlaying(true);
        setDismissed(false);
      });
      p.on("pause", () => setPlaying(false));
      p.on("ended", () => {
        setPlaying(false);
        trackCustom("video_ended");
      });
    });
    mountVidalytics(config.vidalytics.walkthrough, () => setVideoFailed(true));
  };
  useEffect(() => {
    const id = window.setTimeout(mountVideo, 60);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // the video's slot in sight or not (the corner player takes over when it isn't)
  useEffect(() => {
    const el = slotRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setSlotOut(e.intersectionRatio < 0.35), { threshold: [0, 0.35, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  /** The corner player's ×: the video stops and goes back to its place (play again and it can follow). */
  const closeMini = () => {
    player.current?.pause();
    setDismissed(true);
  };

  // Andrew's calendar, prefilled; a failure falls back to a plain link and email
  useEffect(() => {
    if (booking || !calRef.current) return;
    mountCal(calRef.current, lead, {
      onReady: () => setCal("ready"),
      onFailed: () => setCal("failed"),
      onViewed: () => trackCustom("cal_booker_viewed"),
      onBooked: (b) => {
        const full = { ...b, lead_id: lead?.lead_id };
        track("Schedule", { content_name: demo ? "Demo with Andrew" : "Free trial setup call" }, b.uid ?? lead?.lead_id);
        saveBooking(full);
        try {
          history.replaceState(null, "", `${location.pathname}?status=booked`);
        } catch {
          /* ignore */
        }
        setBooking(full);
        // his confirmation page starts at the top: the headline, the line, the video
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        window.setTimeout(() => document.getElementById("bk-h1")?.focus({ preventScroll: true }), reduce ? 50 : 700);
      },
    });
    // if Cal never says it's ready (blocked, offline), show the way out after a while
    const t = window.setTimeout(() => setCal((c) => (c === "loading" ? "failed" : c)), 15000);
    return () => window.clearTimeout(t);
  }, [booking, lead, demo, reduce]);

  const h1 = booking
    ? BOOK.booked.h1
    : trialFirst
      ? config.trialStartUrl
        ? T1.h1Ready(first)
        : T1.h1Coming(first)
    : demo
      ? first
        ? `${first}, pick a time for your demo with Andrew.`
        : "Pick a time for your demo with Andrew."
      : BOOK.h1;

  // Andrew's words from his layout (Oct 19, by text), as written. The free-trial lines carry a ⚑:
  // the same day he moved every button to "Try SmartCrew" with no free trial up front, and said
  // he'll tweak this page's copy himself.
  const trialNote = "Andrew to update: still promises a free trial (buttons now say “Try SmartCrew”, Oct 19)";
  // his Loom (Oct 20): "Cut the free trial piece": no kicker unless they asked for a demo
  const kicker = demo ? "Demo request received" : null;

  const sub = booking ? (
    BOOK.booked.sub
  ) : trialFirst ? (
    <>
      {!config.trialStartUrl && <>{T1.login} </>}
      {T1.sub}
      <Flag note={T1.note} />
    </>
  ) : demo ? (
    <>
      {cap(aCall())} with the founder. No sales team. No BDR. Just Andrew.
      {config.callLength && !config.callLengthConfirmed && <Flag note={CALL_NOTE} />}
    </>
  ) : (
    BOOK.sub
  );

  return (
    // masked in Clarity recordings: the headline and the booked ticket carry the visitor's name
    <div className={`bk${booking ? " is-booked" : ""}`} data-clarity-mask="True">
      <header className="bk-bar">
        <a href="../" className="bk-logo" aria-label="SmartCrew, back to the product page">
          {CLASSIC ? <BrandLogo className="bk-logo-img" /> : <Logo decorative className="bk-logo-svg" />}
        </a>
        <a className="bk-help" href={`mailto:${config.email}`}>
          <MailIcon />
          <span className="bk-help-k">{BOOK.help}</span> <b>{config.email}</b>
        </a>
      </header>

      {/* 1 · his headline, centred */}
      <section className="bk-intro" aria-labelledby="bk-h1">
        {!booking && kicker && (
          <motion.p className="bk-kicker" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.5, ease, delay: 0.05 }}>
            <span className="bk-kicker-check" aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 12 12">
                <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {kicker}
          </motion.p>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={h1}
            id="bk-h1"
            tabIndex={-1}
            className="bk-h1"
            initial={{ opacity: 0, y: reduce ? 0 : "0.3em", ...blur(reduce ? 0 : 12) }}
            animate={{ opacity: 1, y: 0, ...blur(0) }}
            exit={{ opacity: 0, y: reduce ? 0 : "-0.2em", ...blur(reduce ? 0 : 8) }}
            transition={{ duration: reduce ? 0 : 0.6, ease }}
          >
            {h1}
          </motion.h1>
        </AnimatePresence>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={booking ? "booked" : "book"} className="bk-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.2 }}>
            {sub}
          </motion.p>
        </AnimatePresence>
        {!booking && trialFirst && config.trialStartUrl && (
          <a className="bk-open" href={config.trialStartUrl} onClick={() => trackCustom("trial_open")}>
            {T1.open}
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </section>

      {/* 2 · one page, his text (Oct 20): the video at 2/3 width with the three bullets under it, the calendar on the right */}
      <main className={`bk-grid${mini ? " has-mini" : ""}`}>
        <div className="bk-video-slot" ref={slotRef}>
          <motion.figure
            id="bk-video"
            className={`bk-video${mini ? " is-mini" : ""}`}
            data-testid="book-video"
            initial={{ opacity: 0, y: reduce ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.7, ease, delay: reduce ? 0 : 0.15 }}
          >
            <div className="bk-video-frame">
              <div className="bk-poster" aria-hidden="true">
                <img src={bustUrl} alt="" />
                {videoFailed ? (
                  <span className="bk-poster-note">Andrew's video didn't load here.</span>
                ) : (
                  <span className="bk-poster-play">
                    <svg width="22" height="22" viewBox="0 0 18 18">
                      <path d="M5 3.2v11.6L14.6 9z" fill="currentColor" />
                    </svg>
                  </span>
                )}
              </div>
              <div id={`vidalytics_embed_${config.vidalytics.walkthrough}`} className="bk-vid" />
              {!vidOn && <button type="button" className="bk-poster-go" onClick={mountVideo} aria-label="Play Andrew’s video" />}
            </div>
            {mini && (
              <button type="button" className="bk-mini-x" onClick={closeMini} aria-label="Close the video">
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </motion.figure>
        </div>

        <div className="bk-stage" id="bk-cal" aria-label={booking ? "Your call" : "Pick a time"}>
          <AnimatePresence mode="wait" initial={false}>
            {booking ? (
              <Ticket key="ticket" booking={booking} reduce={reduce} />
            ) : (
              <motion.section
                key="cal"
                className="bk-card"
                aria-labelledby="bk-card-h"
                initial={{ opacity: 0, y: reduce ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, ...blur(8) }}
                transition={{ duration: reduce ? 0 : 0.6, ease, delay: reduce ? 0 : 0.25 }}
              >
                {/* the face, "Book a quick demo with Andrew" and its line are cut so the calendar fits without
                    scrolling (comment-mode note, Oct 20: "remove this so we can fit in the cal with out
                    scrolling. minimize needed scroll."); the heading stays for screen readers */}
                <h2 id="bk-card-h" className="sr-only">
                  {BOOK.cardTitle}
                </h2>
                <div className={`bk-cal is-${cal}`} data-testid="book-cal">
                  <div ref={calRef} className="bk-cal-embed" />
                  <AnimatePresence>{cal === "loading" && <CalSkeleton key="skel" />}</AnimatePresence>
                  {cal === "failed" && <CalFallback />}
                </div>
                <p className="bk-card-note">
                  <CalIcon />
                  {BOOK.cardNote}
                </p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* what the call covers, while they pick a time (his confirmation page is the video alone) */}
        {!booking && (
          <section className="bk-covers" aria-labelledby="bk-covers-h" data-testid="book-covers">
            <h2 id="bk-covers-h">{BOOK.coversTitle}</h2>
            <ul>
              {BOOK.covers.map((c) => (
                <li key={c.title}>
                  <span className="bk-covers-icon" aria-hidden="true">
                    <CoverIcon kind={c.icon} />
                  </span>
                  <h3>
                    {c.title}
                    {c.trial && <Flag note={trialNote} />}
                  </h3>
                  <p>{c.text}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="bk-foot">
        <span>© {new Date().getFullYear()} SmartCrew</span>
        <a href={`mailto:${config.email}`}>{config.email}</a>
        <a href={config.privacyUrl}>Privacy</a>
        <a href={config.termsUrl}>Terms</a>
      </footer>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The call length isn't settled until his Cal.com event matches (src/config.ts). */
const CALL_NOTE = "Andrew to confirm the call length: his layout says 15 minutes, his Cal.com event is 45 minutes today";

/** Andrew's words from his booking page layout (Oct 19), as written, with his Loom's changes (Oct 20):
 *  "You're one step away from getting started", "we'll just call it a quick demo", the free-trial
 *  kicker cut. `booked`: his "FINAL CONFIRMATION PAGE" (his doc, Oct 20 17:30Z), word for word. */
const BOOK = {
  booked: {
    h1: "You’re Booked! One Last Thing Before We Meet.",
    sub: "Watch this quick SmartCrew walkthrough so we can spend our call focusing on your company instead of covering the basics.",
  },
  help: "Need help?",
  h1: "You’re One Step Away From Getting Started.",
  sub: "Watch this quick video to see how our private beta works, then book your quick demo with Andrew.",
  cardTitle: "Book a quick demo with Andrew",
  cardSub: "Choose a time that works for you. No preparation needed.",
  cardNote: "After you book, you’ll receive a confirmation email with the meeting details.",
  coversTitle: "Here’s what we’ll cover:",
  covers: [
    // Andrew's comment-mode note (Oct 21), verbatim
    { icon: "chat", title: "Your Business", text: "We’ll learn how you manage your crews, equipment, and jobs today – and where your biggest headaches are." },
    { icon: "screen", title: "Our Solutions", text: "We’ll show you how SmartCrew can simplify your operations and solve your biggest challenges." },
    { icon: "check", title: "Founding Member Invitation", text: "If you’re a good fit, you’ll have the opportunity to join our Founding Member Program with discounted pricing and special perks." },
  ] as { icon: "chat" | "screen" | "check"; title: string; text: string; trial?: boolean }[],
};

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m2.5 4.5 5.5 4.2 5.5-4.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function CoverIcon({ kind }: { kind: "chat" | "screen" | "check" }) {
  if (kind === "chat")
    return (
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M10 3.5c4 0 7 2.5 7 5.8s-3 5.8-7 5.8c-.8 0-1.6-.1-2.3-.3L4 16.3l.9-3C3.7 12.3 3 10.9 3 9.3 3 6 6 3.5 10 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 9.4h.01M10 9.4h.01M13 9.4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (kind === "screen")
    return (
      <svg width="20" height="20" viewBox="0 0 20 20">
        <rect x="2.75" y="3.75" width="14.5" height="10" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.5 17h5M10 13.75V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path d="m4.5 10.4 3.6 3.5 7.4-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function Ticket({ booking, reduce }: { booking: Booking; reduce: boolean }) {
  const w = when(booking);
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
        {/* his headline above already says they're booked: the ticket leads with the day */}
        <motion.h2 className="bk-ticket-day" {...item(1)}>
          {w.day}
        </motion.h2>
        <motion.p className="bk-ticket-time" {...item(2)}>
          {w.time}
          {w.zone ? <span> · {w.zone}</span> : null}
        </motion.p>
        <motion.p className="bk-ticket-with" {...item(3)}>
          Your quick demo with Andrew Drish, founder of SmartCrew. The confirmation and the call details are in your email.
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
        {/* no "Have these handy" list: Andrew's booking card says "No preparation needed." */}
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
