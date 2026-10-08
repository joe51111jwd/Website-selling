// MOTION toggle (brief 3.1, 4.3; WCAG 2.2.2). Owner: A1.
// The visible ON/OFF follows the <html class="rm"> set by the head script, so first paint is right
// before hydration; aria-pressed follows the prefs store after hydration.

import { usePrefs, prefsStore } from '../system/prefs';
import { STRIP } from '../content/copy/chrome';

export function MotionToggle({ className }: { className?: string }) {
  const { motion } = usePrefs();
  return (
    <button
      type="button"
      className={`motion-toggle ${className ?? ''}`}
      aria-pressed={motion}
      aria-label={STRIP.motionButtonLabel}
      onClick={() => prefsStore.toggleMotion()}
    >
      <span className="when-motion">{STRIP.motionOn}</span>
      <span className="when-rm">{STRIP.motionOff}</span>
    </button>
  );
}

export default MotionToggle;
