import type { ReactNode } from "react";
import { PhoneButton } from "../kit";
import "./ReportForms.css";

/*
 * Shared parts of the two phone report forms (M7 Hauling Log, M8 DOT Inspection Report).
 * The header glyphs are drawn here (not from the kit Icon set) because the app's form headers use
 * a slightly heavier, taller truck / clipboard / clock-rotate-left than the kit's generic icons.
 * 24×24 grid, 1.75 px stroke at 24 px, measured from the 1560×3376 Vercel mocks.
 */

type GlyphName = "truck" | "clipboard" | "history" | "folder" | "wrench";

const GLYPHS: Record<GlyphName, ReactNode> = {
  truck: (
    <>
      <path d="M15.2 15.3V5.8a1.5 1.5 0 0 0-1.5-1.5H4.8a1.5 1.5 0 0 0-1.5 1.5v9.5h16.9v-3.7l-2.4-3H15.2" />
      <circle cx="7.1" cy="18.2" r="2" />
      <circle cx="16.5" cy="18.2" r="2" />
    </>
  ),
  clipboard: (
    <>
      <path d="M8.6 5H7.6a2.4 2.4 0 0 0-2.4 2.4V18a2.4 2.4 0 0 0 2.4 2.4h8.8a2.4 2.4 0 0 0 2.4-2.4V7.4A2.4 2.4 0 0 0 16.4 5h-1.2" />
      <rect x="8.6" y="3.4" width="6.6" height="3.9" rx="1.3" />
    </>
  ),
  // the two Watch it work forms (Add Project, Add Service Record), Andrew's comment-mode notes, Oct 20
  folder: <path d="M3.6 7.2a1.8 1.8 0 0 1 1.8-1.8h3.9l2 2.2h7.3a1.8 1.8 0 0 1 1.8 1.8v8.2a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8z" />,
  wrench: <path d="M14.6 6.1a4 4 0 0 0 4.9 5.2l-7.8 7.8a2 2 0 0 1-2.9-2.9l7.8-7.8a4 4 0 0 1-2-2.3zM14.6 6.1l2.6 2.6" />,
  history: (
    <>
      <path d="M5.4 11.4a7.2 7.2 0 1 1 1.6 5.2" />
      <path d="M3 11.7l2.1 1.9 2.2-2" />
      <path d="M12.3 7.6V12l3 2.1" />
    </>
  ),
};

export function Glyph({ name, size = 24, stroke = 1.75 }: { name: GlyphName; size?: number; stroke?: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {GLYPHS[name]}
    </svg>
  );
}

/** Form header: [icon in grey circle] Title ……… (history). */
export function FormHeader({ icon, title }: { icon: GlyphName; title: string }) {
  return (
    <div className="sc-phead rf-head">
      <span className="sc-circle-btn rf-circle">
        <Glyph name={icon} />
      </span>
      <span className="sc-phead-title rf-title">{title}</span>
      <span className="sc-circle-btn rf-circle">
        <Glyph name="history" />
      </span>
    </div>
  );
}

/** Sticky Cancel / Submit sheet (`submit` renames the dark button). */
export const formFooterFor = (submit: string) => (
  <>
    <PhoneButton className="rf-btn">Cancel</PhoneButton>
    <PhoneButton className="rf-btn" tone="dark">
      {submit}
    </PhoneButton>
  </>
);

/** Sticky Cancel / Submit sheet. */
export const formFooter = (
  <>
    <PhoneButton className="rf-btn">Cancel</PhoneButton>
    <PhoneButton className="rf-btn" tone="dark">
      Submit
    </PhoneButton>
  </>
);
