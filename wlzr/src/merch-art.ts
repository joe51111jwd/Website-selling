// Placeholder product art (flat lays drawn in SVG) until the merch photos come in. A product with an
// `image` uses that photo instead.

import type { Product } from "./data";

let uid = 0;

function camo(id: string) {
  // seeded blobs in four woodland tones
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const tones = ["#5d5a3c", "#3b3524", "#8a7d55", "#2a2a1c"];
  let blobs = "";
  for (let i = 0; i < 46; i++) {
    const x = r() * 120, y = r() * 120, rx = 6 + r() * 16, ry = 3 + r() * 8, a = r() * 180;
    blobs += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${a.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${tones[i % 4]}"/>`;
  }
  return `<pattern id="${id}" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#6f6a48"/>${blobs}</pattern>`;
}

function emblem(cx: number, cy: number, r: number) {
  const s = r * 0.62;
  return `<g stroke="#e8231b" stroke-width="${r * 0.12}" fill="none" stroke-linecap="square">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#e8231b" stroke="none"/>
    <g stroke="#ffffff" stroke-width="${r * 0.1}">
      <circle cx="${cx}" cy="${cy}" r="${s}"/><ellipse cx="${cx}" cy="${cy}" rx="${s * 0.42}" ry="${s}"/>
      <line x1="${cx - s}" y1="${cy}" x2="${cx + s}" y2="${cy}"/><line x1="${cx}" y1="${cy - s}" x2="${cx}" y2="${cy + s}"/>
      <path d="M${cx - s * 0.28} ${cy - s * 1.35} L${cx + s * 0.18} ${cy - s * 0.1} L${cx - s * 0.18} ${cy + s * 0.1} L${cx + s * 0.28} ${cy + s * 1.35}"/>
    </g></g>`;
}

export function productArt(p: Product) {
  if (p.image) return `<img src="${p.image}" alt="${p.name}">`;
  const id = `camo${uid++}`;
  const body = p.body === "camo" ? `url(#${id})` : p.body;
  const sl = p.sleeves ? (p.sleeves === "camo" ? `url(#${id})` : p.sleeves) : body;
  const ink = "rgba(0,0,0,.35)";
  let shape = "";
  if (p.kind === "tee" || p.kind === "longsleeve" || p.kind === "hoodie") {
    const long = p.kind !== "tee";
    shape += long
      ? `<path d="M58 44 L22 62 L6 176 L30 180 L48 92 Z" fill="${sl}" stroke="${ink}" stroke-width="1.5"/>
         <path d="M142 44 L178 62 L194 176 L170 180 L152 92 Z" fill="${sl}" stroke="${ink}" stroke-width="1.5"/>
         <rect x="6" y="168" width="24" height="12" fill="${sl}" stroke="${ink}"/><rect x="170" y="168" width="24" height="12" fill="${sl}" stroke="${ink}"/>`
      : `<path d="M58 44 L18 66 L32 102 L52 94 Z" fill="${sl}" stroke="${ink}" stroke-width="1.5"/>
         <path d="M142 44 L182 66 L168 102 L148 94 Z" fill="${sl}" stroke="${ink}" stroke-width="1.5"/>`;
    shape += `<path d="M58 44 Q80 36 86 34 Q100 48 114 34 Q120 36 142 44 L152 92 L150 190 L50 190 L48 92 Z" fill="${body}" stroke="${ink}" stroke-width="1.5"/>`;
    if (p.kind === "hoodie") {
      shape += `<path d="M70 40 Q100 4 130 40 Q118 58 100 60 Q82 58 70 40 Z" fill="${body}" stroke="${ink}" stroke-width="1.5"/>
        <path d="M72 140 L128 140 L136 176 L64 176 Z" fill="none" stroke="${ink}" stroke-width="1.5"/>
        <line x1="94" y1="58" x2="92" y2="92" stroke="#fff" stroke-width="2"/><line x1="106" y1="58" x2="108" y2="92" stroke="#fff" stroke-width="2"/>`;
    } else {
      shape += `<path d="M86 34 Q100 48 114 34" fill="none" stroke="${ink}" stroke-width="3"/>`;
    }
    shape += emblem(100, p.kind === "hoodie" ? 112 : 100, 26);
  } else {
    shape += `<path d="M36 128 Q30 60 100 52 Q170 60 164 128 Z" fill="${body}" stroke="${ink}" stroke-width="1.5"/>
      <path d="M36 128 Q100 112 164 128 Q186 134 192 150 Q130 140 100 142 Q60 140 36 128 Z" fill="${body}" stroke="${ink}" stroke-width="1.5"/>
      <path d="M100 52 L100 126" stroke="${ink}" stroke-width="1.2"/><circle cx="100" cy="54" r="4" fill="${body}" stroke="${ink}"/>
      ${emblem(100, 96, 20)}`;
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name}"><defs>${camo(id)}</defs>${shape}</svg>`;
}
