// State the page's own scripts share with the renderer: the lens and the slide it rewrites.

export type Band = [number, number, number, number]; // x0, y0, x1, y1 in slide uv (y down)

export const lens = {
  /** 0 when there's no lens on the page, up to 1 while it's showing */
  on: 0,
  /** centre and radius, CSS px on screen */
  x: 0,
  y: 0,
  r: 0,
  mag: 1.45,
  /** the element the slide is drawn over, and the slide before and after the rewrite */
  slide: null as HTMLElement | null,
  before: null as HTMLCanvasElement | null,
  after: null as HTMLCanvasElement | null,
  /** bumped whenever the canvases are redrawn */
  version: 0,
  /** the lines the lens rewrites, and how far along each one it has got (0 to 1) */
  bands: [] as Band[],
  wipe: [0, 0, 0, 0],
};
