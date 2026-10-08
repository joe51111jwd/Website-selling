// THE one exact-string table for view titles (brief 3.2). Owner: A1.
// Nobody types a disclosure string by hand: render <ViewTitle id="..."/> or
// <ViewTitle view kind suffix?/> (src/chrome/ViewTitle.tsx), which builds the string from here.
// Apostrophes are typographic in the UI (brief 5.2).

export type ViewKind = 'film' | 'frame' | 'still' | 'depth' | 'drawing';

/** The line that appears in exactly four places (G8). Only the hero film title uses it via ViewTitle. */
export const HASNT_HAPPENED = 'THIS HASN’T HAPPENED YET.';

/** Kind templates: the text that follows `{VIEW} · ` */
export const KIND_TEXT: Record<ViewKind, string> = {
  film: 'CONCEPT FILM · AI-GENERATED',
  frame: 'CONCEPT FILM STILL · AI-GENERATED',
  still: 'CONCEPT ILLUSTRATION · AI-GENERATED',
  depth: 'DEPTH ESTIMATED FROM AI-GENERATED CONCEPT FILM · RELATIVE, NO UNITS · NOT ROBOT PERCEPTION DATA',
  drawing: 'DRAWING',
};

/** The hero 3D VIEW variant of the depth template (brief 2.3): "FROM ONE FRAME OF". */
const DEPTH_ONE_FRAME =
  'DEPTH ESTIMATED FROM ONE FRAME OF AI-GENERATED CONCEPT FILM · RELATIVE, NO UNITS · NOT ROBOT PERCEPTION DATA';

/** Printed right-aligned on every view-title rule; not part of the string. */
export const NTS = 'NTS';

export interface ViewTitleSpec {
  view: string;
  kind: ViewKind;
  suffix?: string;
  /** Append ". THIS HASN’T HAPPENED YET." (hero film title only, G8) */
  hasntHappened?: boolean;
  /** Use the hero 3D VIEW depth wording ("FROM ONE FRAME OF") */
  oneFrame?: boolean;
}

/** Build the exact string. */
export function viewTitleText(spec: ViewTitleSpec): string {
  const kindText = spec.kind === 'depth' && spec.oneFrame ? DEPTH_ONE_FRAME : KIND_TEXT[spec.kind];
  let s = `${spec.view} · ${kindText}`;
  if (spec.suffix) s += ` · ${spec.suffix}`;
  if (spec.hasntHappened) s += `. ${HASNT_HAPPENED}`;
  return s;
}

/**
 * Every view title on the site, keyed by a stable id. Use the id form when you can:
 * <ViewTitle id="a101-plan" />. The computed form (<ViewTitle view kind suffix/>) is
 * checked against this table in dev and in tests.
 */
export const VIEW_TITLES = {
  // A-000 hero
  'hero-film': { view: 'PERSPECTIVE 05-A · LAYOUT AND MARKING', kind: 'film', hasntHappened: true },
  'hero-still': { view: 'PERSPECTIVE 05-A · LAYOUT AND MARKING', kind: 'frame', hasntHappened: true },
  'hero-3d': { view: '3D VIEW 05-A', kind: 'depth', oneFrame: true },
  // A-000 -> A-100 plan cut, A-100
  'plan-cut': { view: 'PLAN 05', kind: 'frame' },
  'a100-plans': { view: 'PLAN VIEWS 01–05', kind: 'film' },
  // A-101
  'a101-plan': { view: 'PLAN 01', kind: 'film' },
  'a101-perspective': { view: 'PERSPECTIVE 01-A', kind: 'film' },
  'a101-detail': { view: 'DETAIL 1 / A-101', kind: 'film' },
  // A-102
  'a102-perspective': { view: 'PERSPECTIVE 02-A', kind: 'film' },
  'a102-plan': { view: 'PLAN 02', kind: 'film' },
  // A-103
  'a103-detail': { view: 'DETAIL 3 / A-103', kind: 'film' },
  'a103-perspective': { view: 'PERSPECTIVE 03-A', kind: 'film' },
  'a103-plan': { view: 'PLAN 03', kind: 'film' },
  // A-104
  'a104-plan': { view: 'PLAN 04', kind: 'film' },
  'a104-perspective': { view: 'PERSPECTIVE 04-A', kind: 'film' },
  'a104-trace': { view: 'TASK DRAWING TRACED FROM CONCEPT FOOTAGE', kind: 'drawing' },
  // A-105
  'a105-plan': { view: 'PLAN 05', kind: 'film' },
  'a105-trace': { view: 'LINES TRACED FROM CONCEPT FOOTAGE', kind: 'drawing' },
  'a105-section': {
    view: 'SECTION A–A',
    kind: 'depth',
    suffix: 'ILLUSTRATIVE: PLAN AND SECTION ARE DIFFERENT SHOTS',
  },
  'a105-detail': { view: 'DETAIL 5 / A-105', kind: 'film' },
  // A-200
  'a200-poster': { view: 'PLAN VIEWS 01–05', kind: 'frame' },
  'a200-drawing': { view: 'CONTEXT · THE 1811 GRID (HISTORY)', kind: 'drawing', suffix: 'NOT A MAP' },
  // A-300
  'a300-detail07': {
    view: 'DETAIL 07',
    kind: 'still',
    suffix: 'ROBOT 07 IS A CONCEPT DESIGN, NOT A REAL ROBOT OR A COMPETITOR',
  },
  'a300-empty-bay': { view: 'PLAN · AN EMPTY BAY', kind: 'still', suffix: 'NOT A VENUE PLAN' },
  // A-301
  'a301-materials': { view: 'MATERIALS', kind: 'still', suffix: 'NOT SPONSOR PRODUCTS' },
} as const satisfies Record<string, ViewTitleSpec>;

export type ViewTitleId = keyof typeof VIEW_TITLES;

/** Exact strings, as printed. Tests compare these against the brief literally. */
export const VIEW_TITLE_STRINGS: Record<ViewTitleId, string> = Object.fromEntries(
  Object.entries(VIEW_TITLES).map(([id, spec]) => [id, viewTitleText(spec as ViewTitleSpec)]),
) as Record<ViewTitleId, string>;

const known = new Set<string>(Object.values(VIEW_TITLE_STRINGS));

/** True when a computed title is one of the table's exact strings. */
export function isKnownViewTitle(text: string): boolean {
  return known.has(text);
}

/** THE SET lightbox title (brief 3.13); not a view title, kept here so the disclosure has one home. */
export const THE_SET_TITLE =
  'THE SET · CONCEPT FILM: SCREEN CAPTURE OF THIS SITE + AI-GENERATED CONCEPT FOOTAGE · 0:30';
