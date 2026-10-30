// Draw-on for SVG proof marks with stroke-dashoffset.
// Hidden state keeps a gap wider than the round caps so no dot shows at the start.
export function hidePath(p: SVGGeometryElement) {
  const len = p.getTotalLength();
  p.style.strokeDasharray = `${len} ${len + 24}`;
  p.style.strokeDashoffset = `${len + 12}`;
  return len;
}

export function showPath(p: SVGGeometryElement) {
  p.getAnimations().forEach((a) => a.cancel());
  p.style.strokeDasharray = '';
  p.style.strokeDashoffset = '';
}
