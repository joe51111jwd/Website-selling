// Measuring text for proof marks. Offsets (offsetLeft/offsetTop chains) ignore CSS transforms,
// so measuring inside a rotated sheet gives exact unrotated, sheet-local coordinates.
export type Box = { x: number; y: number; w: number; h: number };

export function boxWithin(el: HTMLElement, root: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export type Line = { x0: number; x1: number; y: number; h: number };

/** Groups word boxes into visual lines (works across wraps). */
export function linesOf(words: HTMLElement[], root: HTMLElement): Line[] {
  const lines: Line[] = [];
  for (const w of words) {
    const b = boxWithin(w, root);
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - b.y) < b.h * 0.4) {
      last.x0 = Math.min(last.x0, b.x);
      last.x1 = Math.max(last.x1, b.x + b.w);
    } else {
      lines.push({ x0: b.x, x1: b.x + b.w, y: b.y, h: b.h });
    }
  }
  return lines;
}

let probe: HTMLDivElement | null = null;
/** One design pixel (--u) in CSS px, resolved by a hidden probe. */
export function designUnit() {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;left:0;top:0;height:0;width:calc(1000 * var(--u));visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
  }
  return probe.offsetWidth / 1000 || 1;
}
