// The offer as a receipt (BRIEF beat 8): a narrow paper-white slip that prints line by line out of
// a slot as it comes into view, tears off, and gets Andrew's signature at the bottom.
//
// How the print works: the paper sits in its final place in the layout (so nothing around it
// moves), inside a box clipped at its bottom edge, the slot. Before printing it is translated down
// fully into the slot; then it rises one row at a time, like a thermal printer feeding paper, until
// the bottom edge clears the slot. Then the slot fades, the slip settles, and the signature is
// written in with a mask. Without JS, with reduced motion or without IntersectionObserver the
// receipt is simply there, printed and signed.

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { Logo } from "../../brand/Logo";
import { FLAG, RECEIPT } from "../../content/copy";
import { phone, reducedMotion } from "../../three/stage";
import { Signature } from "./Signature";

type Phase = "static" | "idle" | "printing" | "torn" | "signed";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stamp(d = new Date()) {
  try {
    const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${date} · ${time}`;
  } catch {
    return "";
  }
}

/** A serrated paper edge: n teeth stretched across the width, so it is symmetric at any size. */
function Edge({ side, teeth = 34 }: { side: "top" | "bottom"; teeth?: number }) {
  const w = teeth * 10;
  let d = side === "top" ? `M0 8` : `M0 0`;
  for (let i = 0; i < teeth; i++) {
    const x = i * 10;
    d += side === "top" ? ` L${x + 5} 2 L${x + 10} 8` : ` L${x + 5} 6 L${x + 10} 0`;
  }
  d += side === "top" ? ` L${w} 9 L0 9 Z` : ` L${w} -1 L0 -1 Z`;
  return (
    <svg className={`rcpt-edge rcpt-edge--${side}`} viewBox={`0 ${side === "top" ? 0 : -1} ${w} 9`} preserveAspectRatio="none" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Row({ children, className = "", feed, pause }: { children?: React.ReactNode; className?: string; feed?: "fast" | "slow"; pause?: number }) {
  return (
    <div className={`rcpt-row ${className}`} data-row data-feed={feed} data-pause={pause}>
      {children}
    </div>
  );
}

function Line({ item, value, className = "" }: { item: React.ReactNode; value?: React.ReactNode; className?: string }) {
  return (
    <Row className={`rcpt-line ${className}`}>
      <span className="rcpt-item">{item}</span>
      {value != null && <span className="rcpt-val">{value}</span>}
    </Row>
  );
}

export function Receipt({ onSigned, onPrint }: { onSigned?: () => void; onPrint?: () => void }) {
  const paper = useRef<HTMLDivElement>(null);
  // printing needs motion and an observer; otherwise the slip is simply there, printed and signed
  const [animated] = useState(() => !reducedMotion && typeof IntersectionObserver !== "undefined");
  const [phase, setPhase] = useState<Phase>("static");
  const [when, setWhen] = useState(() => stamp());
  const titleId = useId();

  // with motion allowed, start empty (the paper inside the slot) and wait to be seen
  useLayoutEffect(() => {
    if (animated) setPhase("idle");
  }, [animated]);

  // the sequence outlives phase changes; only unmounting stops it
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // print once the slot itself is in view, so the paper is seen coming out of it
  const slot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase !== "idle" || !slot.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setPhase("printing");
        void print();
      },
      // phones scroll through the empty slip on the way down, so start a little before the slot
      // shows and let the paper come up from the bottom edge
      { threshold: 1, rootMargin: phone ? "0px 0px 14% 0px" : "0px 0px -6% 0px" },
    );
    io.observe(slot.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function print() {
    const el = paper.current;
    if (!el) return;
    setWhen(stamp());
    onPrint?.();
    const top = el.getBoundingClientRect().top;
    const H = el.offsetHeight;
    const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-row]")).map((r) => ({
      bottom: r.getBoundingClientRect().bottom - top,
      fast: r.dataset.feed === "fast",
      pause: Number(r.dataset.pause ?? 0),
    }));
    // a thermal printer: short, quick feeds, one printed row at a time
    const feed = [0.3, 0.75, 0.25, 1] as const;
    let from = H + 12;
    for (const r of rows) {
      if (!alive.current) return;
      if (r.pause) await wait(r.pause);
      const to = Math.max(0, H - r.bottom - 3); // the row just clears the slot's lip
      const dur = r.fast ? 0.035 : Math.min(0.085, 0.028 + (from - to) * 0.0018);
      await animate(el, { y: [from, to] }, { duration: dur, ease: feed });
      from = to;
      await wait(r.fast ? 4 : 10);
    }
    if (!alive.current) return;
    // feed the tail out, then tear it off: a small tug up, and the slip settles
    await animate(el, { y: [from, 0] }, { duration: 0.24, ease: feed });
    if (!alive.current) return;
    setPhase("torn");
    await animate(el, { y: [0, -7, 0], rotate: [0, -1.6, -0.9] }, { duration: 0.55, ease: [0.22, 1, 0.36, 1] });
    if (!alive.current) return;
    setPhase("signed");
    await wait(900);
    if (alive.current) onSigned?.();
  }

  useEffect(() => {
    if (!animated) onSigned?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flags = RECEIPT.showProposals;

  return (
    <div className="rcpt" data-phase={phase} role="figure" aria-labelledby={titleId}>
      <div className="rcpt-feed">
        <div className="rcpt-paper" ref={paper}>
          <Edge side="top" />
          <div className="rcpt-body">
            <Row className="rcpt-head">
              <Logo className="rcpt-logo" title="SmartCrew" />
            </Row>
            <Row className="rcpt-title">
              <span id={titleId}>{RECEIPT.title}</span>
            </Row>
            <Row className="rcpt-meta">
              <time>{when}</time>
            </Row>
            <Row className="rcpt-rule" feed="fast" />
            <Row className="rcpt-h">{RECEIPT.get}</Row>
            {RECEIPT.items.map((it) => (
              <div key={it.item} className="rcpt-group">
                <Line item={it.item} value={RECEIPT.included} />
                {it.sub && (
                  <Row className="rcpt-sub" feed="fast">
                    {it.sub}
                  </Row>
                )}
              </div>
            ))}
            {flags && (
              <Line
                className="rcpt-flag"
                item={RECEIPT.proposalItem}
                value={
                  <span className="rcpt-flag-mark" title="Proposal: needs Andrew’s OK">
                    {FLAG}
                  </span>
                }
              />
            )}
            <Row className="rcpt-rule" feed="fast" pause={60} />
            <Row className="rcpt-h">{RECEIPT.costs}</Row>
            <Line item={RECEIPT.call} value={RECEIPT.callValue} />
            <Row className="rcpt-rule rcpt-rule--double" feed="fast" pause={140} />
            <Line className="rcpt-total" item={RECEIPT.total} value={RECEIPT.totalValue} />
            {flags && (
              <>
                <Row className="rcpt-sub rcpt-flag" feed="fast">
                  {RECEIPT.proposalWhy} <span className="rcpt-flag-mark">{FLAG}</span>
                </Row>
                <Row className="rcpt-rule" feed="fast" pause={60} />
                <Row className="rcpt-note rcpt-flag">
                  {RECEIPT.proposalNotes.map((n, i) => (
                    <span key={n} className="rcpt-note-item">
                      {i > 0 && <span aria-hidden="true"> · </span>}
                      {n} <span className="rcpt-flag-mark">{FLAG}</span>
                    </span>
                  ))}
                </Row>
              </>
            )}
            <Row className="rcpt-sign">
              <span className="rcpt-x" aria-hidden="true">
                ×
              </span>
              <span className="rcpt-sig">
                <Signature className="rcpt-sig-svg" title={RECEIPT.signatureAlt} />
              </span>
            </Row>
            <Row className="rcpt-by">{RECEIPT.signedBy}</Row>
          </div>
          <Edge side="bottom" />
        </div>
      </div>
      <div className="rcpt-slot" ref={slot} aria-hidden="true">
        <span className="rcpt-led" />
      </div>
    </div>
  );
}
