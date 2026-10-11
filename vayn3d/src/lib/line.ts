// Live numbers the 3D line writes every frame and the DOM reads without re-rendering React.

export const line = {
  progress: new Map<string, number>(), // station -> 0..1 printed
  meters: 0, // real-world metres of line laid so far, across the page
  layer: 0, // global layer counter for the HUD
  live: { progress: 0, order: 0 },
  webgl: true,
};

// Run a callback every animation frame while mounted (for number readouts).
export function everyFrame(cb: () => void) {
  let id = 0;
  const loop = () => {
    cb();
    id = requestAnimationFrame(loop);
  };
  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}

if (import.meta.env.DEV) (window as unknown as { __line: typeof line }).__line = line;
