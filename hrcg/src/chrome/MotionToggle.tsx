// MOTION toggle (brief 3.1, 4.3; WCAG 2.2.2). Owner: A1.
// The visible ON/OFF follows the <html class="rm"> set by the head script, so first paint is right
// before hydration; the button text ("Motion ON" / "Motion OFF", with a visually hidden "Motion ") is its name.

import { usePrefs, prefsStore } from '../system/prefs';
import { STRIP } from '../content/copy/chrome';

export function MotionToggle({ className }: { className?: string }) {
  const { motion } = usePrefs();
  return (
    <button
      type="button"
      className={`motion-toggle ${className ?? ''}`}
      // The visible state is part of the name (WCAG 2.5.3): "Motion ON" / "Motion OFF". No aria-pressed,
      // because a toggle's name must not change with its state; the text itself carries the state.
      data-motion={motion ? 'on' : 'off'}
      onClick={() => prefsStore.toggleMotion()}
    >
      <span className="sr-only">{STRIP.motionButtonLabel} </span>
      <span className="when-motion">{STRIP.motionOn}</span>
      <span className="when-rm">{STRIP.motionOff}</span>
    </button>
  );
}

export default MotionToggle;
