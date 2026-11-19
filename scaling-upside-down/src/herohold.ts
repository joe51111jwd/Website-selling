// The hero holds the screen (Michael, 13 Nov: "I did a fairly normal two-finger scroll on my laptop, and
// the entire book introduction and signup offer went by almost instantly ... keep that opening book section
// in view longer, even when someone scrolls quickly").
//
// One scroll that starts on the hero stops on the hero: a fling of the trackpad, a spin of the wheel, a
// flick on a phone, Space or Page Down. It still moves a little, so the visitor sees the page answer (the
// "Scroll" cue goes), and the title page, the book's words and the red JOIN plank stay whole on screen.
// The next scroll goes on into the story as before. Scrolling up, links and the menu are never held.
//
// The wheel rules are a small state machine (wheelStep), so they can be checked without a browser
// (scripts/check-herohold.mjs); holdHero() wires them to the page.

/** the gap between wheel events that ends one gesture (a trackpad's glide sends them every frame) */
export const GESTURE_GAP_MS = 220;
/** the longest one unbroken stream of wheel events is held, so a visitor who keeps scrolling is never stuck */
export const HOLD_MAX_MS = 2200;

/** a held glide that suddenly gets stronger again is a new swipe (fingers back on the pad before the glide ended) */
export const NEW_SWIPE_AFTER_MS = 300;

export type WheelState = { last: number; armed: boolean; heldAt: number; prev: number };
export const wheelState = (): WheelState => ({ last: -Infinity, armed: false, heldAt: 0, prev: 0 });

/**
 * One wheel event: where the page's scroll is heading now (y, px), the event's delta (px, down > 0) and
 * where the hero's hold ends (stop, px). "pass" lets the scroller take it; "hold" swallows it, and
 * `toStop` asks for the page to be brought to the stop (once, as the gesture first reaches it).
 */
export function wheelStep(s: WheelState, now: number, y: number, dy: number, stop: number): { act: "pass" | "hold"; toStop: boolean } {
  const swipe = s.heldAt > 0 && now - s.heldAt > NEW_SWIPE_AFTER_MS && dy >= Math.max(24, s.prev * 3);
  const fresh = now - s.last > GESTURE_GAP_MS || swipe;
  s.last = now;
  s.prev = Math.abs(dy);
  if (fresh) {
    s.armed = y < stop - 1; // only a gesture that starts on the hero is held
    s.heldAt = 0;
  }
  if (!s.armed || dy <= 0) return { act: "pass", toStop: false };
  if (s.heldAt && now - s.heldAt > HOLD_MAX_MS) {
    s.armed = false; // still scrolling after all that: let them go
    return { act: "pass", toStop: false };
  }
  if (y + dy <= stop) return { act: "pass", toStop: false };
  const first = !s.heldAt;
  if (first) s.heldAt = now;
  return { act: "hold", toStop: first || y < stop - 1 };
}

type Scroller = { targetScroll: number; scrollTo: (to: number, o?: { immediate?: boolean; force?: boolean }) => void } | null;

/**
 * Wire the hold to the page. stop(): where the hold ends, in px from the top. scroller(): the smooth
 * scroller if there is one (none with reduced motion). Registered before the scroller, so a held wheel
 * event never reaches it. Returns the cleanup.
 */
export function holdHero(stop: () => number, scroller: () => Scroller): () => void {
  const html = document.documentElement;
  const at = () => scroller()?.targetScroll ?? window.scrollY;
  const goStop = (smooth: boolean) => {
    const s = scroller();
    const to = stop();
    if (s) s.scrollTo(to, smooth ? {} : { immediate: true, force: true });
    else window.scrollTo({ top: to, behavior: "instant" as ScrollBehavior });
  };

  // the wheel and the trackpad
  const ws = wheelState();
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.defaultPrevented) return; // pinch-zoom is the browser's
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    const r = wheelStep(ws, e.timeStamp || performance.now(), at(), dy, stop());
    if (r.act === "pass") return;
    if (e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
    if (r.toStop) goStop(true);
  };

  // the keys that move a screen at a time (the arrows move a line, and Home and End mean it)
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
    const down = e.key === "PageDown" || (e.key === " " && !e.shiftKey);
    if (!down) return;
    const y = at();
    if (y >= stop() - 1) return;
    e.preventDefault();
    goStop(true);
  };

  // phones and tablets: the flick is the browser's own, so a flick that starts on the hero is stopped at the
  // hold's end (the page is held still for a moment, which ends the glide on every phone browser)
  let touchY = 0;
  let touchArmed = false;
  let pinning = 0;
  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches[0]?.clientY ?? 0;
    touchArmed = false;
  };
  const onTouchMove = (e: TouchEvent) => {
    // armed only by a real drag towards the story (a tap on the red plank is a link, not a scroll)
    const y = e.touches[0]?.clientY ?? touchY;
    if (!touchArmed && touchY - y > 6 && window.scrollY < stop() - 1) touchArmed = true;
  };
  const onScroll = () => {
    if (!touchArmed) return;
    const to = stop();
    if (window.scrollY <= to) return;
    touchArmed = false;
    if (pinning) return;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    window.scrollTo({ top: to, behavior: "instant" as ScrollBehavior });
    scroller()?.scrollTo(to, { immediate: true, force: true });
    pinning = window.setTimeout(() => {
      html.style.overflow = prev;
      pinning = 0;
    }, 90);
  };
  // a link or the menu moves the page on purpose
  const onClick = () => {
    touchArmed = false;
  };

  window.addEventListener("wheel", onWheel, { passive: false, capture: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, true);
  return () => {
    window.removeEventListener("wheel", onWheel, { capture: true });
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("click", onClick, true);
    if (pinning) {
      window.clearTimeout(pinning);
      html.style.overflow = "";
    }
  };
}
