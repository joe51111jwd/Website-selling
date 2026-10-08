// One timeline for picture, sound (scripts/sound.mjs) and captions (scripts/captions.mjs).
import data from './timeline.json';

export type Format = '169' | '916' | '11';

export type CoverT = { start: number; end: number; payout: [number, number]; pull: [number, number]; impact: number };
export type FormatT = {
  duration: number;
  cover: CoverT;
  plancut: { start: number; end: number };
  sheets: { start: number; each: number; plan: number };
  context: { start: number; end: number } | null;
  end: { start: number; end: number };
};

export const FPS: number = data.fps;
export const TL = data.formats as unknown as Record<Format, FormatT>;

/** Film frames after impact at which c34 frame 60 shows (S + 0.267 s), and its play length (24 src frames). */
export const FILM_DELAY_FRAMES = 8;
export const FILM_FRAMES = 30; // 1.0 s at 30 fps covers c34 frames 60 → 84
export const FILM_FADE = 0.55;

export const formatOf = (w: number, h: number): Format => (w > h ? '169' : w < h ? '916' : '11');

export type Sheet = {
  id: string;
  n: string;
  name: string;
  nameLines: string[];
  verb: string;
  verbLines: string[];
  tag: string;
  plan: 'b40' | 'b41' | 'b42' | 'b43' | 'b44';
};

// Exact copy from the brief (§3.1 INDEX rows, §3.4–3.8 sheet tags, §7c beat sheet supers).
export const SHEETS: Sheet[] = [
  {
    id: 'A-101',
    n: '01',
    name: 'BRICKLAYING',
    nameLines: ['BRICKLAYING'],
    verb: 'LAY BRICK.',
    verbLines: ['LAY BRICK.'],
    tag: 'A-101 · CHALLENGE 01 · BRICKLAYING · PLAN / PERSPECTIVE / DETAIL · NTS',
    plan: 'b40',
  },
  {
    id: 'A-102',
    n: '02',
    name: 'DRYWALL INSTALLATION',
    nameLines: ['DRYWALL', 'INSTALLATION'],
    verb: 'HANG DRYWALL.',
    verbLines: ['HANG', 'DRYWALL.'],
    tag: 'A-102 · CHALLENGE 02 · DRYWALL INSTALLATION · PERSPECTIVE / PLAN · NTS',
    plan: 'b41',
  },
  {
    id: 'A-103',
    n: '03',
    name: 'BOLTED ASSEMBLY',
    nameLines: ['BOLTED', 'ASSEMBLY'],
    verb: 'BOLT IT.',
    verbLines: ['BOLT IT.'],
    tag: 'A-103 · CHALLENGE 03 · BOLTED ASSEMBLY · DETAIL / PERSPECTIVE / PLAN · NTS',
    plan: 'b42',
  },
  {
    id: 'A-104',
    n: '04',
    name: 'PIPE ASSEMBLY',
    nameLines: ['PIPE', 'ASSEMBLY'],
    verb: 'RUN THE PIPE.',
    verbLines: ['RUN THE PIPE.'],
    tag: 'A-104 · CHALLENGE 04 · PIPE ASSEMBLY · ISOMETRIC / PERSPECTIVE · NTS',
    plan: 'b43',
  },
  {
    id: 'A-105',
    n: '05',
    name: 'LAYOUT AND MARKING',
    nameLines: ['LAYOUT AND', 'MARKING'],
    verb: 'MARK IT OUT.',
    verbLines: ['MARK IT OUT.'],
    tag: 'A-105 · CHALLENGE 05 · LAYOUT AND MARKING · PLAN / SECTION A–A / DETAIL · NTS',
    plan: 'b44',
  },
];

/** Sheet number shown top-right, with the time it ticks in. */
export const sheetSchedule = (f: FormatT): { t: number; id: string }[] => {
  const s: { t: number; id: string }[] = [
    { t: 0, id: 'A-000' },
    { t: f.plancut.start + 0.08, id: 'A-100' },
  ];
  SHEETS.forEach((sh, i) => s.push({ t: f.sheets.start + i * f.sheets.each, id: sh.id }));
  if (f.context) s.push({ t: f.context.start, id: 'A-200' });
  s.push({ t: f.end.start, id: 'A-900' });
  return s;
};
