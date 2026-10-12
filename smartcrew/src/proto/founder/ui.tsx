import type { ReactNode } from "react";
import { CREW_BUCKETS, MICRO, type Bucket, type OpenSignup } from "./copy";
import drish from "./assets/logo-drish.png";
import rieke from "./assets/logo-rieke.png";
import jcr from "./assets/logo-jcr.png";
import fireball from "./assets/logo-fireball.png";
import dw from "./assets/logo-dw.png";
import midwest from "./assets/logo-midwest.png";
import face from "./assets/andrew-face.webp";

/** The bevelled black button from Andrew's favourite mockup. Every CTA opens the same popup. */
export function TrialButton({ open, source, size, className = "", children = "Get my free trial", id }: { open: OpenSignup; source: string; size?: Bucket; className?: string; children?: ReactNode; id?: string }) {
  return (
    <button id={id} type="button" className={`f-btn f-btn-dark ${className}`} onClick={() => open({ intent: "trial", source, size })}>
      {children}
    </button>
  );
}

export function DemoLink({ open, source, className = "" }: { open: OpenSignup; source: string; className?: string }) {
  return (
    <button type="button" className={`f-link ${className}`} onClick={() => open({ intent: "demo", source })}>
      or book a demo with Andrew
    </button>
  );
}

/** Keep "30-minute" and "5–100" from breaking across lines. */
export function nw(text: string): ReactNode {
  const parts = text.split(/(\d+-minute|\d+–\d+)/);
  return parts.map((p, i) => (i % 2 ? <span className="f-nw" key={i}>{p}</span> : p));
}

/** The standard micro-copy under a primary button, with Andrew's face next to "a call with Andrew". */
export function Micro({ text = MICRO, face: showFace = true }: { text?: string; face?: boolean }) {
  return (
    <p className="f-micro">
      {showFace && <img className="f-micro-face" src={face} alt="" width={32} height={32} />}
      <span>{nw(text)}</span>
    </p>
  );
}

/**
 * A proposal or wording Andrew hasn't approved yet (OFFER.md 2B, PLAYBOOK ⚑). Shown so the
 * slot is designed, outlined so nobody mistakes it for an approved claim.
 */
export function Ph({ children, label = "Placeholder for Andrew", inline = false, className = "" }: { children: ReactNode; label?: string; inline?: boolean; className?: string }) {
  const Tag = inline ? "span" : "div";
  return (
    <Tag className={`f-ph ${inline ? "f-ph-inline" : ""} ${className}`}>
      <span className="f-ph-label">{label}</span>
      {children}
    </Tag>
  );
}

/** Small marker on a line whose exact wording Andrew still has to approve. */
export function Flag() {
  return (
    <sup className="f-flag" title="Wording Andrew still has to approve">
      ⚑<span className="f-sr">wording to approve</span>
    </sup>
  );
}

const LOGOS = [
  { src: drish, name: "Drish Construction", h: 1.0 },
  { src: rieke, name: "Rieke Grading", h: 1.05 },
  { src: jcr, name: "JCR Excavating", h: 0.86 },
  { src: fireball, name: "Fireball Construction", h: 1.18 },
  { src: dw, name: "DW Companies", h: 1.12 },
  { src: midwest, name: "Midwest Erosion Specialists", h: 0.84 },
];

export function UsedBy({ className = "" }: { className?: string }) {
  return (
    <div className={`f-usedby ${className}`}>
      <span className="f-usedby-label">Used by</span>
      <ul className="f-usedby-list">
        {LOGOS.map((l) => (
          <li key={l.name} style={{ ["--lh" as string]: l.h }}>
            <img src={l.src} alt={l.name} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Crew-size chips that work as CTAs: each opens the popup with step 1 ticked. */
export function SizeChips({ open, source, label = "How big is your crew?" }: { open: OpenSignup; source: string; label?: string }) {
  return (
    <div className="f-sizechips" role="group" aria-label={label}>
      <span className="f-sizechips-label">{label}</span>
      <div className="f-sizechips-row">
        {CREW_BUCKETS.map((b) => (
          <button key={b} type="button" className="f-chip" onClick={() => open({ intent: "trial", source: `${source}-chip`, size: b })}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
