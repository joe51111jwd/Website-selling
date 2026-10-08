// Copy for A-104 PIPE ASSEMBLY, A-105 LAYOUT AND MARKING and A-200 CONTEXT (brief 3.7–3.9, 4.2).
// Owner: A4. Exact brief copy; typographic apostrophes and dashes in the UI (brief 5.2).
// Sheet tags come from src/content/sheets.ts and view titles from src/content/viewTitles.ts (A1);
// media alts come from the manifest (A5). Only sheet-specific copy lives here.

export const A104 = {
  h2: 'PIPE ASSEMBLY',
  spec: 'Connect pipes and fittings to a task drawing, with correct geometry and secure joints.',
  /** One at each fitting along the iso pipe route, in route order. */
  beats: ['TO THE DRAWING', 'CORRECT GEOMETRY', 'SECURE JOINTS'],
} as const;

export const A105 = {
  h2: 'LAYOUT AND MARKING',
  spec: 'Transfer a plan onto a work surface with accurate positions and clear reference lines.',
  beats: ['ACCURATE POSITIONS', 'CLEAR REFERENCE LINES'],
  /** F9: only if the visitor really snapped the hero line (heroMachine.snappedByUser). */
  lineSnapped:
    'Before the walls, pipes and fittings go in, someone marks out where they go. That’s this job, and you already snapped one line of it.',
  /** Default (also the prerendered / no-JS variant). */
  line: 'Before the walls, pipes and fittings go in, someone marks out where they go. That’s this job.',
  hint: 'DRAG THE CUT ALONG THE LINE · IN FRONT OF THE PLANE: THE DRAWING · BEHIND IT: THE FILM',
  slider: {
    label: 'Section cut A–A: move the cutting plane along the chalk line',
    /** aria-valuetext by rounded value 0..10 */
    near: 'Near the camera',
    middle: 'Middle',
    far: 'Near the robot',
  },
  sectionLabel:
    'Depth drawing of one frame from an AI-generated concept film: robot 07 crouches, holding a taut chalk line that runs toward the camera. In front of the section plane the frame is drawn as depth contour lines; behind it the film shows.',
  /**
   * Detail 5 bubble (N04 pinch and snap). FIXLIST-1 F-044 / F-035: DetailBubble (A3) prefixes the visible
   * text, so the accessible name reads "5 A-105 detail: concept film of …" and starts with what is shown.
   */
  detail: {
    label: 'concept film of robot fingers pinching a chalk line and letting it snap',
  },
} as const;

/**
 * A-200 fact gate (brief 3.9, F5). Every figure in the verified body was checked against at least two
 * independent sources on 2026-10-08 (A4); A6 signs it off before launch. Sources:
 *  - 1811 / Commissioners' Plan: en.wikipedia.org/wiki/Commissioners%27_Plan_of_1811 ("presented in 1811");
 *    thegreatestgrid.mcny.org (Remarks of the Commissioners, 22 March 1811); NYPL archives record.
 *  - about 29° east of true north: Wikipedia (as above, "tilted 29 degrees east of true north");
 *    Scientific American, "Manhattanhenge: What It Is, and How to See It" (same figure).
 *  - twelve avenues and 155 cross streets: Wikipedia ("12 primary … avenues", "155 orthogonal cross
 *    streets"); NYPL archives record ("a grid of 155 numbered streets and 12 avenues"); MCNY The Greatest
 *    Grid ("The streets are numbered 1 to 155", First to Twelfth Avenue).
 *  - John Randel Jr.: Wikipedia (chief surveyor); MCNY (led the survey and set the monuments);
 *    Scientific American "How Manhattan got its street grid".
 *  - 1,549 marble markers and 98 iron bolts: Wikipedia ("1,549 marble markers and 98 iron bolts");
 *    MCNY The Greatest Grid ("By his count, he erected 1,549 monuments and 98 iron bolts, where ground
 *    rock required the substitution").
 *  - module proportions (drawing only, no numbers printed): blocks 200 ft N–S, streets 60 ft, avenues
 *    100 ft, blocks between avenues 610–920 ft: Wikipedia + MCNY (making-the-plan/12).
 *  - "much of it still fields": 6sqft (upper Manhattan "a rural area … country estates, farms"),
 *    Scientific American ("meadows … barns, cider mills"); the phrase is in both bodies.
 * FIXLIST-1 H-5 (director-approved): both bodies say "drew most of Manhattan as a grid" (it narrows the
 * claim and adds no figure); A6 notes the wording in the fact gate.
 * Set FACT_GATE to 'fallback' to ship the fallback body instead (e.g. if A6's sign-off fails).
 */
export const FACT_GATE: 'verified' | 'fallback' = 'verified';

export const A200 = {
  h2: 'New York’s grid started as a layout.',
  bodyVerified:
    'In 1811, the Commissioners’ Plan drew most of Manhattan as a grid of twelve avenues and 155 cross streets, set about 29° east of true north. Survey crews led by John Randel Jr. then marked it out on the ground, much of it still fields, with 1,549 marble markers and 98 iron bolts where rock got in the way.',
  bodyFallback:
    'In 1811, the Commissioners’ Plan drew most of Manhattan as a grid of avenues and cross streets, set about 29° east of true north. Survey crews then marked it out on the ground, much of it still fields.',
  statement: 'The Games are planned for New York City in 2027. Date and venue will be announced on this site.',
  labels: {
    trueNorth: 'TRUE NORTH',
    grid: 'THE 1811 GRID · ABOUT 29° E OF TRUE NORTH',
    angle: 'ABOUT 29°',
    bays: 'THE FIVE BAYS · ILLUSTRATIVE',
  },
  hold: {
    /** The tag on the cloud, split for typesetting; read together it is the exact brief string. */
    head: 'VENUE: HOLD',
    tail: 'Venue to be announced on this site.',
    full: 'VENUE: HOLD — Venue to be announced on this site.',
    cloudAlt: 'A cloud marked HOLD: the venue has not been announced.',
  },
  gridAlt:
    'Line drawing of the 1811 Manhattan street-grid module, set about 29 degrees east of true north. A history diagram, not a map, and not the venue.',
} as const;

export function a200Body(): string {
  return FACT_GATE === 'verified' ? A200.bodyVerified : A200.bodyFallback;
}
