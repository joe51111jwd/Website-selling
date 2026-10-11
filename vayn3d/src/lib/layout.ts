// Page-space boxes of the elements the 3D line attaches to (data-station="…").
// The World converts these to world units every frame, so CSS stays in charge of layout.

export type Box = { cx: number; cy: number; w: number; h: number };

export const boxes = new Map<string, Box>();
let version = 0;
export const layoutVersion = () => version;

export function measure() {
  const sy = window.scrollY;
  document.querySelectorAll<HTMLElement>("[data-station]").forEach((el) => {
    const r = el.getBoundingClientRect();
    boxes.set(el.dataset.station!, { cx: r.left + r.width / 2, cy: r.top + sy + r.height / 2, w: r.width, h: r.height });
  });
  version++;
}

let raf = 0;
export function watchLayout() {
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(measure);
  };
  const ro = new ResizeObserver(schedule);
  ro.observe(document.body);
  window.addEventListener("resize", schedule);
  document.fonts?.ready.then(schedule);
  schedule();
  return () => {
    ro.disconnect();
    window.removeEventListener("resize", schedule);
  };
}
