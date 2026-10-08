// MOTION toggle (brief 3.1, 4.3; WCAG 2.2.2 pause mechanism). Owner: A1.
// FIXLIST F-019: a toggle button with a stable accessible name ("Motion") and aria-pressed for its
// state (brief 3.1 "a button with aria-pressed"). The visible ON/OFF follows <html class="rm"> (set by
// the head script), so first paint is right before hydration; it is aria-hidden, because the state is
// exposed by aria-pressed. The strip cell / title-sheet row around it is the hit area (chrome.css).

import { usePrefs, prefsStore } from '../system/prefs';
import { STRIP } from '../content/copy/chrome';

export function MotionToggle({ className }: { className?: string }) {
  const { motion } = usePrefs();
  return (
    <button
      type="button"
      className={`motion-toggle ${className ?? ''}`}
      aria-pressed={motion}
      data-motion={motion ? 'on' : 'off'}
      onClick={() => prefsStore.toggleMotion()}
    >
      <span className="sr-only">{STRIP.motionButtonLabel}</span>
      <span className="when-motion" aria-hidden="true">
        {STRIP.motionOn}
      </span>
      <span className="when-rm" aria-hidden="true">
        {STRIP.motionOff}
      </span>
    </button>
  );
}

export default MotionToggle;
