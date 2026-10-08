// Frame-space layouts of the cover (brief §2.2) per format. 16:9 uses the site's CoverStage layout on the
// 1920x1076 c34 frame (src/hero/heroLayout.ts TYPE_LAYOUT + LINE_LAYOUT, pass B director note 1): two tight
// stacks at .86, FAR from its cap-top, NEAR's right edge at 0.885 and BUILD?'s baseline on the chalk line.
// 9:16 is N01b laid out the same way (site 9:16 values); 1:1 re-authors the same blocks on a square crop.
// 9:16 and 1:1 drop the frame a little so the F-058 disclosure has the top safe area to itself.
import type { H1Line } from '../components/HeroType';
import type { Rect } from '../components/Clip';
import type { StringGeom } from '../lib/string';
import { C } from '../theme';
import type { Format } from '../timeline';
import { STILLS, USE_N01B, type ClipId } from '../clips';

export type CoverLayout = {
  clip: ClipId; // the snap film
  still: string; // its freeze frame (frame 84)
  src: [number, number]; // source size
  crop: Rect; // source px
  dest: Rect; // window / frame rect in comp px
  window: boolean; // framed window on the slab (vs full-bleed frame)
  status: { x: number; cy: number; size: number };
  h1: { size: number; lines: H1Line[] };
  line: StringGeom;
  stroke: number;
  depositW: number;
  xSize: number;
  shadowMax: number;
  puffScale: number;
  viewTitle: { x: number; y: number; w: number; size: number; wrap: boolean };
  pivot: [number, number]; // push pivot, comp px
  push: { frame: number; far: number; near: number };
  pool: [number, number];
  mask?: string; // the frame's own mask (a top feather where the frame is dropped below the comp top)
};
const topFeather = (px: number) => `linear-gradient(to bottom, transparent 0px, #000 ${px}px)`;

const fy169 = (y: number) => 2 + y * 1076;
const fx169 = (x: number) => x * 1920;
const H169 = 0.131 * 1076; // 141 px
const CAP169 = H169 * 0.8;
const STEP169 = H169 * 0.86; // the brief's line-height: both stacks are tight
// site TYPE_LAYOUT['169']: size 0.131, farLeft 0.095, farCapTop 0.135, nearRight 0.885, nearBaseline 0.755
const FAR1_169 = fy169(0.135) + CAP169;
const NEAR2_169 = fy169(0.755);

const D11 = 70; // 1:1 frame drop (see '11')
export const COVER: Record<Format, CoverLayout> = {
  '169': {
    clip: 'c34',
    still: STILLS.c34f84,
    src: [1920, 1076],
    crop: [0, 0, 1920, 1076],
    dest: [0, 2, 1920, 1076],
    window: false,
    status: { x: fx169(0.09), cy: fy169(0.105), size: 18 },
    h1: {
      size: H169,
      lines: [
        { text: 'WHAT CAN A', x: fx169(0.095), baseline: FAR1_169, anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'HUMANOID', x: fx169(0.095), baseline: FAR1_169 + STEP169, anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'ACTUALLY', x: fx169(0.885), baseline: NEAR2_169 - STEP169, anchor: 'end', ink: C.orange, plane: 'near' },
        { text: 'BUILD?', x: fx169(0.885), baseline: NEAR2_169, anchor: 'end', ink: C.orange, plane: 'near' },
      ],
    },
    line: { ax: fx169(0.52), bx: fx169(0.92), y: fy169(0.76), depth: 108, up: 0.42, sag: 15, maxDepth: 0.22 * 1080 },
    stroke: 2.4,
    depositW: 7,
    xSize: 10,
    shadowMax: 17,
    puffScale: 1.21,
    viewTitle: { x: 96, y: 938, w: 1728, size: 20, wrap: false },
    pivot: [fx169(0.52), fy169(0.4)],
    push: { frame: 0.045, far: 0.03, near: 0.065 },
    pool: [36, 46],
  },
  '916': {
    clip: 'c34',
    still: STILLS.c34f84,
    src: [1920, 1076],
    crop: [588, 0, 861, 1076],
    dest: [64, 150, 952, 1076 * (952 / 861)],
    window: true,
    status: { x: 64, cy: 112, size: 24 },
    h1: {
      size: 112,
      lines: [
        { text: 'WHAT CAN A', x: 64, baseline: 1572, anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'HUMANOID', x: 64, baseline: 1670, anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'ACTUALLY', x: 994, baseline: 1670, anchor: 'end', ink: C.orange, plane: 'near' },
        { text: 'BUILD?', x: 994, baseline: 1768, anchor: 'end', ink: C.orange, plane: 'near' },
      ],
    },
    line: { ax: 0.47 * 1080, bx: 0.92 * 1080, y: 1774, depth: 92, up: 0.42, sag: 12, maxDepth: 0.15 * 1920 },
    stroke: 2.4,
    depositW: 7,
    xSize: 10,
    shadowMax: 15,
    puffScale: 1.1,
    viewTitle: { x: 64, y: 1352, w: 952, size: 24, wrap: true },
    pivot: [64 + (998 - 588) * (952 / 861), 150 + 432 * (952 / 861)],
    push: { frame: 0.05, far: 0, near: 0 },
    pool: [50, 72],
  },
  '11': {
    clip: 'c34',
    still: STILLS.c34f84,
    src: [1920, 1076],
    crop: [422, 0, 1076, 1076],
    // dropped 70 px (top feathered) so the disclosure owns the top safe area; the frame's floor runs off the bottom
    dest: [0, D11, 1080, 1080],
    window: false,
    mask: topFeather(56),
    status: { x: 64, cy: 106 + D11, size: 18 },
    h1: {
      // 96 px (not 108) so WHAT CAN A ends clear of 07's head in the square crop; FAR moves with the frame
      size: 96,
      lines: [
        { text: 'WHAT CAN A', x: 64, baseline: 218 + D11, anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'HUMANOID', x: 64, baseline: 218 + D11 + 0.86 * 96, anchor: 'start', ink: C.chalk, plane: 'far' },
        // NEAR's right edge stays clear of the chalk box at the line's end (as the site's 0.885 does)
        { text: 'ACTUALLY', x: 980, baseline: 846 - 0.86 * 96, anchor: 'end', ink: C.orange, plane: 'near' },
        { text: 'BUILD?', x: 980, baseline: 846, anchor: 'end', ink: C.orange, plane: 'near' },
      ],
    },
    line: { ax: 0.47 * 1080, bx: 1016, y: 852, depth: 92, up: 0.42, sag: 12, maxDepth: 0.22 * 1080 },
    stroke: 2.2,
    depositW: 6.5,
    xSize: 9,
    shadowMax: 15,
    puffScale: 1.0,
    viewTitle: { x: 64, y: 884, w: 952, size: 18, wrap: true },
    pivot: [998 - 422, 432 + D11],
    push: { frame: 0.045, far: 0.03, near: 0.065 },
    pool: [44, 50],
  },
};

// 9:16 from N01b, laid out with the site's 9:16 TYPE_LAYOUT (size 0.070, FAR x 0.08, NEAR right 0.865, tight
// .86 stacks) except FAR's cap-top, which stays at 0.10 so HUMANOID ends above 07's helmet (the site's 0.13
// puts "ID" on the helmet; the film draws the type over the footage, with no occlusion). The frame is dropped
// D916 px (top feathered into the slab) so the two-line F-058 disclosure sits alone in the top safe area;
// NEAR and the line sit at 0.755 / 0.76 of the frame so the view title clears the bottom disclosure.
const D916 = 150;
const N01B_S = 1080 / 1076;
const FH916 = 1912 * N01B_S;
const fy916 = (y: number) => D916 + y * FH916;
const H916 = 0.07 * FH916;
const COVER_916_N01B: CoverLayout = {
  clip: 'n01b',
  still: STILLS.n01bf100,
  src: [1076, 1912],
  crop: [0, 0, 1076, 1912],
  dest: [0, D916, 1080, FH916],
  window: false,
  mask: topFeather(140),
  status: { x: 0.08 * 1080, cy: 140, size: 24 },
  h1: {
    size: H916,
    lines: [
      { text: 'WHAT CAN A', x: 0.08 * 1080, baseline: fy916(0.1) + H916 * 0.8, anchor: 'start', ink: C.chalk, plane: 'far' },
      { text: 'HUMANOID', x: 0.08 * 1080, baseline: fy916(0.1) + H916 * (0.8 + 0.86), anchor: 'start', ink: C.chalk, plane: 'far' },
      { text: 'ACTUALLY', x: 0.865 * 1080, baseline: fy916(0.755) - H916 * 0.86, anchor: 'end', ink: C.orange, plane: 'near' },
      { text: 'BUILD?', x: 0.865 * 1080, baseline: fy916(0.755), anchor: 'end', ink: C.orange, plane: 'near' },
    ],
  },
  line: { ax: 0.47 * 1080, bx: 0.92 * 1080, y: fy916(0.76), depth: 92, up: 0.42, sag: 12, maxDepth: 0.15 * 1920 },
  stroke: 2.4,
  depositW: 7,
  xSize: 10,
  shadowMax: 15,
  puffScale: 1.1,
  viewTitle: { x: 64, y: fy916(0.76) + 40, w: 952, size: 24, wrap: true },
  pivot: [0.53 * 1080, fy916(0.36)],
  push: { frame: 0.045, far: 0.03, near: 0.065 },
  pool: [50, 40],
};
if (USE_N01B) COVER['916'] = COVER_916_N01B;

export const VT_FILM = 'PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM · AI-GENERATED. THIS HASN’T HAPPENED YET.';
export const VT_STILL = 'PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM STILL · AI-GENERATED. THIS HASN’T HAPPENED YET.';
export const STATUS = 'PLANNED · NEW YORK CITY · 2027';
