// PHONE MODE: lay the next screens out before they scroll in. Offscreen moments and scenes skip
// rendering (content-visibility: auto), so each one's first style + layout + paint otherwise lands
// as one task in the frame where it comes into view (25–100 ms at 4x CPU, a hitch mid-flick).
// Here, when one comes within 1.5 screens below the viewport, it is queued and marked
// `data-warm` in idle time, ONE per idle moment (never two in the same frame), which turns the
// skip off for it (shell.css / day-phone.css): its first layout happens while the visitor is
// still reading the screen above; then it goes back to being skipped while off screen, its layout
// cached. Scenes that build themselves in pieces (Try it, Your number,
// the spec sheet: ../try/warm.ts) do their own. Started by App once the first screen has landed (src/site/ready.ts).

const SEL = ".dph-m, .site > .scene:not(.hero):not(.day)";

type Idle = (cb: () => void, opts?: { timeout: number }) => number;

export function startWarmAhead(): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  const w = window as unknown as { requestIdleCallback?: Idle; cancelIdleCallback?: (id: number) => void };
  const queue: HTMLElement[] = [];
  const watched = new WeakSet<Element>();
  let idle = 0;
  let raf = 0;
  let timer = 0;
  let dead = false;

  const pump = () => {
    idle = 0;
    timer = 0;
    if (dead) return;
    const el = queue.shift();
    if (!el) return;
    el.dataset.warm = "";
    // once it has been laid out and painted, hand it back to content-visibility: auto. Its layout
    // stays cached (cheap to show when it arrives), and while it is far off screen it is skipped
    // again, so page-wide restyles (the popup's scroll lock) don't have to lay it out
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!dead) delete el.dataset.warm;
      }),
    );
    if (queue.length) schedule();
  };
  // after the next frame has been produced, in the idle time that follows it
  const schedule = () => {
    if (idle || raf || timer || dead) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      timer = window.setTimeout(() => {
        timer = 0;
        if (w.requestIdleCallback) idle = w.requestIdleCallback(pump, { timeout: 800 });
        else timer = window.setTimeout(pump, 40);
      }, 0);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        if (!("warm" in el.dataset)) queue.push(el);
      }
      // nearest first
      queue.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      if (queue.length) schedule();
    },
    { rootMargin: "0px 0px 150% 0px" },
  );
  const scan = () =>
    document.querySelectorAll(SEL).forEach((el) => {
      if (watched.has(el)) return;
      watched.add(el);
      io.observe(el);
    });
  scan();
  // the scenes after One Day mount progressively (App: useLateScenes)
  window.addEventListener("sc:scenes", scan);
  return () => {
    dead = true;
    io.disconnect();
    window.removeEventListener("sc:scenes", scan);
    if (idle) w.cancelIdleCallback?.(idle);
    cancelAnimationFrame(raf);
    window.clearTimeout(timer);
  };
}
