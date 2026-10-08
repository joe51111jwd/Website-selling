// The drawing set: eleven sheets, in order (brief 3.0, 3.1, 3.2). Owner: A1.
// Sheet tags, strip names, INDEX rows and live-region announcements are exact brief copy.

export type SheetId =
  | 'A-000'
  | 'A-100'
  | 'A-101'
  | 'A-102'
  | 'A-103'
  | 'A-104'
  | 'A-105'
  | 'A-200'
  | 'A-300'
  | 'A-301'
  | 'A-900';

export type Ground = 'slab' | 'gypsum';

export interface Sheet {
  id: SheetId;
  /** Element id and hash target: 'a-103' -> href '#a-103' */
  anchor: string;
  /** Sheet tag (top-left of the sheet, on the spine). null for the cover. */
  tag: string | null;
  /** Title strip SHEET cell, wide form: 'A-103 · BOLTED ASSEMBLY' */
  strip: string;
  /** INDEX row title (Big Shoulders 800): 'A-103 BOLT IT.' without the number: 'BOLT IT.' */
  indexTitle: string;
  /** INDEX row sub-line (label style), challenge sheets only: 'Bolted assembly' */
  indexSub?: string;
  /** aria-live text when an INDEX row or strip CTA lands here */
  announce: string;
  /** 1..5 on challenge sheets: which COURSE-mark brick fills orange */
  challenge?: 1 | 2 | 3 | 4 | 5;
  ground: Ground;
  /** Desktop scroll length in vh (brief 3.0). For the cover stage, A-000 + A-100 = 320vh. */
  scrollVh: number;
  /** Phone scroll length in vh when pinned (only the hero stage and A-200); otherwise natural height. */
  phonePinVh?: number;
}

export const SHEETS: readonly Sheet[] = [
  {
    id: 'A-000',
    anchor: 'a-000',
    tag: null,
    strip: 'A-000 · COVER',
    indexTitle: 'COVER',
    announce: 'Sheet A-000, Cover.',
    ground: 'slab',
    scrollVh: 100,
  },
  {
    id: 'A-100',
    anchor: 'a-100',
    tag: 'A-100 · THE FIVE BAYS (ILLUSTRATIVE) · NOT A VENUE PLAN · NTS',
    strip: 'A-100 · THE FIVE BAYS',
    indexTitle: 'THE FIVE BAYS (ILLUSTRATIVE)',
    announce: 'Sheet A-100, The five bays.',
    ground: 'slab',
    scrollVh: 220,
  },
  {
    id: 'A-101',
    anchor: 'a-101',
    tag: 'A-101 · CHALLENGE 01 · BRICKLAYING · PLAN / PERSPECTIVE / DETAIL · NTS',
    strip: 'A-101 · BRICKLAYING',
    indexTitle: 'LAY BRICK.',
    indexSub: 'Bricklaying',
    announce: 'Sheet A-101, Bricklaying.',
    challenge: 1,
    ground: 'slab',
    scrollVh: 190,
  },
  {
    id: 'A-102',
    anchor: 'a-102',
    tag: 'A-102 · CHALLENGE 02 · DRYWALL INSTALLATION · PERSPECTIVE / PLAN · NTS',
    strip: 'A-102 · DRYWALL INSTALLATION',
    indexTitle: 'HANG DRYWALL.',
    indexSub: 'Drywall installation',
    announce: 'Sheet A-102, Drywall installation.',
    challenge: 2,
    ground: 'slab',
    scrollVh: 140,
  },
  {
    id: 'A-103',
    anchor: 'a-103',
    tag: 'A-103 · CHALLENGE 03 · BOLTED ASSEMBLY · DETAIL / PERSPECTIVE / PLAN · NTS',
    strip: 'A-103 · BOLTED ASSEMBLY',
    indexTitle: 'BOLT IT.',
    indexSub: 'Bolted assembly',
    announce: 'Sheet A-103, Bolted assembly.',
    challenge: 3,
    ground: 'slab',
    scrollVh: 180,
  },
  {
    id: 'A-104',
    anchor: 'a-104',
    tag: 'A-104 · CHALLENGE 04 · PIPE ASSEMBLY · ISOMETRIC / PERSPECTIVE · NTS',
    strip: 'A-104 · PIPE ASSEMBLY',
    indexTitle: 'RUN THE PIPE.',
    indexSub: 'Pipe assembly',
    announce: 'Sheet A-104, Pipe assembly.',
    challenge: 4,
    ground: 'slab',
    scrollVh: 140,
  },
  {
    id: 'A-105',
    anchor: 'a-105',
    tag: 'A-105 · CHALLENGE 05 · LAYOUT AND MARKING · PLAN / SECTION A–A / DETAIL · NTS',
    strip: 'A-105 · LAYOUT AND MARKING',
    indexTitle: 'MARK IT OUT.',
    indexSub: 'Layout and marking',
    announce: 'Sheet A-105, Layout and marking.',
    challenge: 5,
    ground: 'slab',
    scrollVh: 220,
  },
  {
    id: 'A-200',
    anchor: 'a-200',
    tag: 'A-200 · CONTEXT · THE 1811 GRID (HISTORY) · NOT A MAP · NTS',
    strip: 'A-200 · CONTEXT',
    indexTitle: 'CONTEXT · THE 1811 GRID',
    announce: 'Sheet A-200, Context: the 1811 grid.',
    ground: 'slab',
    scrollVh: 200,
    phonePinVh: 180,
  },
  {
    id: 'A-300',
    anchor: 'a-300',
    tag: 'A-300 · FOR TEAMS · RFI-001 · NTS',
    strip: 'A-300 · FOR TEAMS',
    indexTitle: 'FOR TEAMS',
    announce: 'Sheet A-300, For teams.',
    ground: 'slab',
    scrollVh: 230,
  },
  {
    id: 'A-301',
    anchor: 'a-301',
    tag: 'A-301 · FOR SPONSORS · KEYNOTES · NTS',
    strip: 'A-301 · FOR SPONSORS',
    indexTitle: 'FOR SPONSORS',
    announce: 'Sheet A-301, For sponsors.',
    ground: 'gypsum',
    scrollVh: 140,
  },
  {
    id: 'A-900',
    anchor: 'a-900',
    tag: 'A-900 · GENERAL NOTES · END OF SET',
    strip: 'A-900 · GENERAL NOTES',
    indexTitle: 'GENERAL NOTES',
    announce: 'Sheet A-900, General notes.',
    ground: 'gypsum',
    scrollVh: 150,
  },
];

/** The cover stage (A-000 -> A-100) is one sticky stage of 320vh; phones pin 220vh. */
export const COVER_STAGE_VH = 320;
export const COVER_STAGE_PHONE_VH = 220;

const byId = new Map<string, Sheet>(SHEETS.map((s) => [s.id, s]));

export function sheetById(id: string): Sheet | undefined {
  return byId.get(id);
}

/** 'A-103' -> 'a-103' */
export function anchorOf(id: string): string {
  return id.toLowerCase();
}
