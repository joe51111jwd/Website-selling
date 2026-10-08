// Exact copy for A-100 (THE FIVE BAYS) and A-101 to A-103 (brief 3.3–3.6). Owner: A3.
// Typographic apostrophes and dashes in the UI (brief 5.2). Linted by src/content/lint.test.ts.
// Sheet tags come from content/sheets.ts (<SheetTag>), view titles from content/viewTitles.ts
// (<ViewTitle>), challenge names / labels / spec sentences from content/challenges.ts.

export const A100 = {
  h2: 'Five jobs every builder knows.',
  body: 'Each one is real trade work, from a straight course of brick to a precisely marked plan. The Games bring robot developers together with the people who build, specify and buy.',
  /** Legend heading and entries, in order (brief 3.3) */
  legendTitle: 'LEGEND',
  legend: ['BAY', 'CONTROL POINT', 'CHALK LINE', 'VIEW MARKER', 'DETAIL', 'SECTION CUT', 'HOLD'],
  /** aria-label of the arena composite video (bays 01–04 plus slot 05) */
  videoLabel:
    'AI-generated concept film, seen from above: five work bays in a row. In each one, robot 07, a concept design, works on one challenge: bricklaying, drywall installation, bolted assembly, pipe assembly, and layout and marking.',
  /** alt of the plan-cut still (A2 renders it; kept here with the A-100 copy) */
  planCutAlt:
    'AI-generated concept film still, seen from above: a freshly snapped blue chalk line in bay 05, with robot 07 crouched beside it.',
  /** slot 05 video (b44 from 2.60 s), brief 3.8 b44 alt */
  slot5Label:
    'AI-generated concept film, seen from above: robot 07 snaps a blue chalk line inside a marked-out bay and moves to the bay’s edge.',
} as const;

export const A101 = {
  h2: 'BRICKLAYING',
  bondWords: ['STRAIGHT COURSES', 'CONSISTENT JOINTS', 'STABLE FINISH'],
  /** ViewMarker names itself "01-A A-101: go to perspective, …" (its visible text first, F-035) */
  viewMarker: {
    view: '01-A',
    sheet: 'A-101',
    label: 'go to perspective, concept film of bricklaying',
  },
  /** DetailBubble names itself "1 A-101 detail: concept film of …" (its visible text first, F-035) */
  detailLabel: 'concept film of a robot hand pressing a brick into mortar',
  /** printed beside the bubble (brief 3.4 layout: "◯1 DETAIL 1 / A-101") */
  bubbleWord: 'DETAIL',
  alt: {
    plan: 'AI-generated concept film, seen from above: robot 07 spreads mortar and lays a course of brick between two line posts.',
    /** F-081: what the shot shows (matches the manifest alt, F-090) */
    perspective:
      'AI-generated concept film: robot 07 spreads mortar with a trowel and steadies a course of brick between two line posts, against a dark background.',
    detail: 'AI-generated concept film, close up: a robot hand presses a brick into a mortar bed beside a stringline.',
  },
} as const;

export const A102 = {
  h2: 'DRYWALL INSTALLATION',
  /** Beats, set on the panel's screw rows */
  beats: ['POSITIONED', 'FASTENED', 'ALIGNED', 'CLEAN FINISH'],
  alt: {
    perspective:
      'AI-generated concept film, close on robot 07’s hands pressing a sheet of drywall flat against a steel stud frame; dust hangs in the light.',
    plan: 'AI-generated concept film, seen from above: robot 07 holds a drywall sheet against a stud frame, steps back, and returns.',
  },
} as const;

export const A103 = {
  h2: 'BOLTED ASSEMBLY',
  beats: ['ALIGNED', 'SECURE'],
  alt: {
    detail: 'AI-generated concept film, close up: a robot hand runs an impact wrench on a nut until it seats.',
    perspective: 'AI-generated concept film: robot 07 drives a bolt with an impact wrench and reaches into a tray of bolts.',
    plan: 'AI-generated concept film, seen from above: robot 07 completes a bolted connection with an impact wrench.',
  },
} as const;
