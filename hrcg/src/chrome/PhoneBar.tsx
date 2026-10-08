// Phone bar (<768 px; brief 3.1): 56 px + safe-area. Left: "PLANNED · NYC · 2027 · A-103", which
// opens the full title block as a bottom sheet (no JS: a plain link to the in-page index in the
// footer title block). Right: Teams → / Sponsors → (each ≥44 px). Owner: A1.

import { Dialog } from './Dialog';
import { overlays } from './overlays';
import { MotionToggle } from './MotionToggle';
import { HoldMark } from './HoldMark';
import { LabelText } from './LabelText';
import { PHONE_BAR, STRIP } from '../content/copy/chrome';
import { useSheet } from '../system/sheetStore';
import { sheetById, SHEETS } from '../content/sheets';
import { lenisScrollTo } from '../system/lenis';
import { navClick } from './nav';
import type { MouseEvent } from 'react';

// F-063: "PLANNED · " can be dropped visually on the narrowest phones (≤340 px) and stays in the name
const [STATUS_FIRST, ...STATUS_REST] = PHONE_BAR.statusPrefix.split(' · ');

export function PhoneBar() {
  const { current } = useSheet();
  return (
    <nav className="phone-bar" aria-label={STRIP.navLabel}>
      <a
        className="phone-status"
        data-strip-cell="status"
        href="#index"
        aria-haspopup="dialog"
        onClick={(e) => {
          e.preventDefault();
          overlays.open('title-sheet', e.currentTarget);
        }}
      >
        <span>
          <span className="phone-status-first">{STATUS_FIRST} · </span>
          <LabelText text={`${STATUS_REST.join(' · ')} · ${current}`} />
        </span>
      </a>
      <a className="phone-cta cell-button" data-strip-cell="teams" href="#a-300" onClick={navClick(true)}>
        {STRIP.teamsShort}
      </a>
      <a className="phone-cta cell-button" data-strip-cell="sponsors" href="#a-301" onClick={navClick(true)}>
        {STRIP.sponsorsShort}
      </a>
    </nav>
  );
}

/** The bottom sheet: the full title block (brief 3.1). */
export function TitleSheet() {
  const { current } = useSheet();
  const sheet = sheetById(current) ?? SHEETS[0]!;
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href') ?? '';
    overlays.close({ restoreFocus: false });
    lenisScrollTo(href, { announce: true });
  };
  return (
    <Dialog id="title-sheet" className="title-sheet" labelledBy="title-sheet-title">
      <div className="title-sheet-panel">
        <p id="title-sheet-title" className="title-sheet-title t-label">
          <LabelText text={PHONE_BAR.sheetTitle} />
        </p>
        <dl className="title-sheet-cells">
          <div className="ts-cell">
            <dt className="strip-label">{STRIP.projectLabel}</dt>
            <dd className="strip-value">{STRIP.projectValue}</dd>
          </div>
          <div className="ts-cell">
            <dt className="strip-label">{STRIP.statusLabel}</dt>
            <dd className="strip-value strip-value--strong">
              <span>
                <LabelText text={STRIP.statusValue} />
              </span>
            </dd>
          </div>
          <div className="ts-cell" data-strip-cell="venue">
            <dt className="strip-label">{STRIP.holdLabel}</dt>
            <dd className="strip-value" data-strip-target="">
              <HoldMark />
              <span aria-hidden="true">{STRIP.holdValue}</span>
              <span className="sr-only">{STRIP.holdSr}</span>
            </dd>
          </div>
          <div className="ts-cell">
            <dt className="strip-label">{STRIP.imageryLabel}</dt>
            <dd className="strip-value">{STRIP.imageryValue}</dd>
          </div>
          <div className="ts-cell">
            <dt className="strip-label">{STRIP.sheetLabel}</dt>
            <dd className="strip-value">
              <span>
                <LabelText text={sheet.strip} />
              </span>
            </dd>
          </div>
          <div className="ts-cell">
            <dt className="strip-label">{STRIP.motionLabel}</dt>
            <dd className="strip-value">
              <MotionToggle />
            </dd>
          </div>
        </dl>
        <div className="title-sheet-ctas">
          <a className="cell-button ts-cta" href="#a-300" onClick={go}>
            <span className="strip-label">{STRIP.teamsLabel}</span>
            <span>{STRIP.teamsValue}</span>
          </a>
          <a className="cell-button ts-cta" href="#a-301" onClick={go}>
            <span className="strip-label">{STRIP.sponsorsLabel}</span>
            <span>{STRIP.sponsorsValue}</span>
          </a>
        </div>
        <button type="button" className="cell-button ts-close" onClick={() => overlays.close()}>
          {PHONE_BAR.close}
        </button>
      </div>
    </Dialog>
  );
}

export default PhoneBar;
