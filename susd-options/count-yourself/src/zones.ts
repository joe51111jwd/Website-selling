import { COPY, UI } from './copy';

export type Zone = (typeof COPY.zones)[number];
export type ZoneId = 'solo' | 'small' | 'valley' | 'team' | 'threshold' | 'graveyard' | 'tot';

export const MIN = 1;
export const MAX = 40;

export const C = {
  cream: '#F1EADF',
  ink: '#1C1A17',
  green: '#2B5A37',
  olive: '#4E5A2B',
  ochre: '#D49B2C',
  oxblood: '#5E1712',
  oxbloodDeep: '#3E0F0C',
  slate: '#2A2D31',
  meterBg: '#17150F',
  up: '#2B5A37',
  sideInk: '#A87414',
  down: '#B2322A',
};

export const clampN = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n)));
export const zoneOf = (n: number): Zone => COPY.zones.find((z) => n >= z.from && n <= z.to) ?? COPY.zones[COPY.zones.length - 1];
export const zoneId = (n: number) => zoneOf(n).id as ZoneId;
export const pathways = (n: number) => (n * (n - 1)) / 2;
export const tempoOf = (n: number) => COPY.tempo.find((t) => n >= t.from && n <= t.to);

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};

export function fieldOf(n: number): string {
  switch (zoneId(n)) {
    case 'valley':
      return C.olive;
    case 'threshold':
      return C.ochre;
    case 'graveyard':
      return mix(C.oxblood, C.oxbloodDeep, (n - 15) / 24);
    case 'tot':
      return C.slate;
    default:
      return C.green;
  }
}

export const inkText = (n: number) => zoneId(n) === 'threshold';
export const fgOf = (n: number) => (inkText(n) ? C.ink : C.cream);
/**
 * The inside of the drum window: the field darkened 35%. On ochre it goes much deeper (a burnt ochre),
 * so the window stays one system across zones: a dark cut with cream numerals (≥ 7:1).
 */
export const wellOf = (field: string) => mix(field, '#000000', field === C.ochre ? 0.56 : 0.35);

/** The zone tag under the drum. At 12 it names the ceiling (the pathways label above already says 66). */
export function tagOf(n: number): string {
  if (n === 12) return `${COPY.ceilingTag} · ${zoneOf(12).tag.split(' · ')[1]}`;
  return zoneOf(n).tag;
}

export const peopleWord = (n: number) => (n === 1 ? UI.person : COPY.hero.people);
/** "coordination pathways", or the singular for exactly one (n = 2). */
export const coordWord = (n: number) => (pathways(n) === 1 ? UI.pathwayOne : COPY.hero.pathwaysLabel);
/** "pathways", or the singular for exactly one. */
export const pathWord = (n: number) => (pathways(n) === 1 ? UI.pathway : UI.pathways);

/** The spinbutton's aria-valuetext: n, its pathways and the zone name. */
export function valueText(n: number): string {
  const z = zoneOf(n).tag.split(' · ')[0];
  return `${n}${n === MAX ? '+' : ''} ${peopleWord(n)}, ${pathways(n)} ${coordWord(n)}, ${z}`;
}
