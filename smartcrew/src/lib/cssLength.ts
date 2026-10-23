// Every length in the CSS is rem (px-rem.postcss.ts) and desktop sets the root to 90% (styles/tokens.css),
// so a size written down in px in script is a design size at 100% and has to be scaled to match.
export function pageScale(): number {
  return (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16;
}

// A custom property comes back from getComputedStyle as it was written ("4rem", "clamp(1.25rem, 4vw, 4rem)"),
// not as px. Ask the browser to resolve it: lay out a throwaway element, inside `host` so that the
// property is in scope, whose width is the property.
export function cssLengthPx(host: Element, name: string, fallback: number): number {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:var(${name}, ${fallback}px)`;
  host.appendChild(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px || fallback;
}
