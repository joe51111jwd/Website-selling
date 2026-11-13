// THROWAWAY test harness (branch claude/hero-hold-wheeltest only, never merged): ?wheeltest adds buttons that
// play trackpad-shaped wheel events into the page, through the real hold and the real smooth scroller.
export function wheelTest() {
  if (!new URLSearchParams(location.search).has("wheeltest")) return;
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;background:#111;color:#fff;font:13px/1.4 monospace;padding:8px;border-radius:6px;max-width:340px";
  const out = document.createElement("div");
  let maxY = 0;
  let log = "";
  const mk = (label: string, fn: () => void) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = "margin:2px;padding:6px 8px;font:13px monospace";
    b.onclick = fn;
    box.appendChild(b);
  };
  const fire = (dy: number) => window.dispatchEvent(new WheelEvent("wheel", { deltaY: dy, deltaMode: 0, cancelable: true, bubbles: true }));
  const fling = (peak = 160, frames = 110) => {
    maxY = window.scrollY;
    let k = 0;
    const t = window.setInterval(() => {
      fire(Math.max(1, peak * 0.955 ** k));
      if (++k >= frames) window.clearInterval(t);
    }, 16);
  };
  mk("Fling", () => fling());
  mk("Big fling", () => fling(320, 140));
  mk("Fling up", () => {
    let k = 0;
    const t = window.setInterval(() => {
      fire(-Math.max(1, 160 * 0.955 ** k));
      if (++k >= 110) window.clearInterval(t);
    }, 16);
  });
  mk("Top", () => {
    window.scrollTo(0, 0);
    log = "";
  });
  box.appendChild(out);
  document.body.appendChild(box);
  const tick = () => {
    maxY = Math.max(maxY, window.scrollY);
    const j = document.querySelector<HTMLElement>(".hero-join");
    const vis = j ? getComputedStyle(j).visibility : "?";
    out.textContent = `scrollY ${Math.round(window.scrollY)}  max ${Math.round(maxY)}  vh ${window.innerHeight}  join ${vis}${log}`;
    requestAnimationFrame(tick);
  };
  tick();
}
