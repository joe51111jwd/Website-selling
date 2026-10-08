// Title strip (brief 3.1, 4.3): <nav aria-label="Title block">, right after the header in DOM
// order, fixed to the bottom of the sheet border. One row, 56 px. Only the SHEET cell ticks.
// Collapse rules are pure CSS (chrome.css), so the prerendered strip is already right.
// Owner: A1.

import { CourseMark } from './CourseMark';
import { HoldMark } from './HoldMark';
import { MotionToggle } from './MotionToggle';
import { LabelText } from './LabelText';
import { STRIP } from '../content/copy/chrome';
import { useSheet } from '../system/sheetStore';
import { sheetById, SHEETS } from '../content/sheets';
import { navClick } from './nav';

export function TitleStrip() {
  const { current } = useSheet();
  const sheet = sheetById(current) ?? SHEETS[0]!;
  return (
    <nav className="title-strip" aria-label={STRIP.navLabel}>
      <a
        className="strip-cell strip-mark"
        data-strip-cell="mark"
        href="#a-000"
        aria-label={STRIP.markLabel}
        onClick={navClick(true)}
      >
        <CourseMark current={sheet.challenge ?? null} width={96} />
      </a>

      <div className="strip-cell strip-project" data-strip-cell="project">
        <span className="strip-label">{STRIP.projectLabel}</span>
        <span className="strip-value">{STRIP.projectValue}</span>
      </div>

      <div className="strip-cell strip-status" data-strip-cell="status">
        <span className="strip-label">{STRIP.statusLabel}</span>
        <span className="strip-value strip-value--strong">
          <span className="v-long">
            <LabelText text={STRIP.statusValue} />
          </span>
          <span className="v-short">
            <LabelText text={STRIP.statusShort} />
          </span>
        </span>
      </div>

      <div className="strip-cell strip-hold" data-strip-cell="venue">
        <span className="strip-label">{STRIP.holdLabel}</span>
        <span className="strip-value" data-strip-target="">
          <HoldMark />
          <span aria-hidden="true">{STRIP.holdValue}</span>
          <span className="sr-only">{STRIP.holdSr}</span>
        </span>
      </div>

      <div className="strip-cell strip-imagery" data-strip-cell="imagery">
        <span className="strip-label">{STRIP.imageryLabel}</span>
        <span className="strip-value">
          <span className="v-long">{STRIP.imageryValue}</span>
          <span className="v-short">
            {STRIP.imageryShort}
          </span>
        </span>
      </div>

      <div className="strip-cell strip-sheet" data-strip-cell="sheet">
        <span className="strip-label">{STRIP.sheetLabel}</span>
        <span className="strip-value strip-tick" key={sheet.id}>
          <span className="v-long">
            <LabelText text={sheet.strip} />
          </span>
          <span className="v-short num">
            {sheet.id}
          </span>
        </span>
      </div>

      <div className="strip-cell strip-motion" data-strip-cell="motion">
        <span className="strip-label" aria-hidden="true">
          {STRIP.motionLabel}
        </span>
        <MotionToggle className="strip-value" />
      </div>

      <a className="strip-cell strip-cta" data-strip-cell="teams" href="#a-300" onClick={navClick(true)}>
        <span className="strip-label">{STRIP.teamsLabel}</span>
        <span className="strip-value">
          <span className="v-long">{STRIP.teamsValue}</span>
          <span className="v-short">
            {STRIP.teamsShort}
          </span>
        </span>
      </a>

      <a className="strip-cell strip-cta" data-strip-cell="sponsors" href="#a-301" onClick={navClick(true)}>
        <span className="strip-label">{STRIP.sponsorsLabel}</span>
        <span className="strip-value">
          <span className="v-long">{STRIP.sponsorsValue}</span>
          <span className="v-short">
            {STRIP.sponsorsShort}
          </span>
        </span>
      </a>
    </nav>
  );
}

export default TitleStrip;
