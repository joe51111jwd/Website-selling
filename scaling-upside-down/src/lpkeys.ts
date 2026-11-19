// The focus film's timing on the page (src/components/FocusPage.tsx): how far through the film section the page
// is (0-1) → the film's frame (0-385). A few beats hold the film nearly still over a long scroll; the picture's
// zoom and its place on the screen hold through them too (src/fit.ts).
import film from "./lpfilm.json";

const LAST = (film.x as number[]).length - 1;
export const KEYS: [number, number][] = [
  [0.09, 0],
  [0.11, 0], // the small white building, still
  [0.265, 83], // everything piled on at once, to the brink
  [0.285, 86], // a held breath at the tipping point
  [0.37, 140], // it falls
  [0.39, 146], // the wreckage, still
  [0.88, LAST], // cleared; the core; three rounds of up, side and down
  [1, LAST], // the finished tower, still
];

// the still beats that pass through more than one frame (a few frames over a long scroll): 83-86 and 140-146
export const STILLS: [number, number][] = KEYS.slice(1)
  .map(([, f], n): [number, number] => [KEYS[n][1], f])
  .filter(([a, b]) => b > a && b - a <= 6);

export const frameAt = (p: number) => {
  if (p <= KEYS[0][0]) return KEYS[0][1];
  for (let k = 0; k < KEYS.length - 1; k++) {
    const [p0, f0] = KEYS[k];
    const [p1, f1] = KEYS[k + 1];
    if (p <= p1) return f0 + ((p - p0) / (p1 - p0)) * (f1 - f0);
  }
  return KEYS[KEYS.length - 1][1];
};
