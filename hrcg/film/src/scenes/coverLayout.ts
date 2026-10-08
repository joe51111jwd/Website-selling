// Frame-space layouts of the cover (brief §2.2) per format. 16:9 uses the binding fractions of the
// 1920x1076 c34 frame; 9:16 is the brief's phone fallback (4:5 window over the H1 on the slab, §2.5);
// 1:1 re-authors the same blocks on a square crop.
import type { H1Line } from '../components/HeroType';
import type { Rect } from '../components/Clip';
import type { StringGeom } from '../lib/string';
import { C } from '../theme';
import type { Format } from '../timeline';

export type CoverLayout = {
  crop: Rect; // c34 source px
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
};

const fy169 = (y: number) => 2 + y * 1076;
const fx169 = (x: number) => x * 1920;
const H169 = 0.131 * 1076; // 141 px
const CAP169 = H169 * 0.8;

export const COVER: Record<Format, CoverLayout> = {
  '169': {
    crop: [0, 0, 1920, 1076],
    dest: [0, 2, 1920, 1076],
    window: false,
    status: { x: fx169(0.09), cy: fy169(0.105), size: 18 },
    h1: {
      size: H169,
      lines: [
        { text: 'WHAT CAN A', x: fx169(0.12), baseline: fy169(0.14) + CAP169, anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'HUMANOID', x: fx169(0.12), baseline: fy169(0.37), anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'ACTUALLY', x: fx169(0.92), baseline: fy169(0.47) + CAP169, anchor: 'end', ink: C.orange, plane: 'near' },
        { text: 'BUILD?', x: fx169(0.92), baseline: fy169(0.755), anchor: 'end', ink: C.orange, plane: 'near' },
      ],
    },
    line: { ax: fx169(0.52), bx: fx169(0.92), y: fy169(0.76), depth: 108, up: 0.42, sag: 15, maxDepth: 0.22 * 1080 },
    stroke: 2.4,
    depositW: 7,
    xSize: 10,
    shadowMax: 17,
    puffScale: 1.21,
    viewTitle: { x: 96, y: 958, w: 1728, size: 20, wrap: false },
    pivot: [fx169(0.52), fy169(0.4)],
    push: { frame: 0.045, far: 0.03, near: 0.065 },
    pool: [36, 46],
  },
  '916': {
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
    crop: [422, 0, 1076, 1076],
    dest: [0, 0, 1080, 1080],
    window: false,
    status: { x: 64, cy: 106, size: 18 },
    h1: {
      // 96 px (not 108) so WHAT CAN A ends clear of 07's head in the square crop
      size: 96,
      lines: [
        { text: 'WHAT CAN A', x: 64, baseline: 218, anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'HUMANOID', x: 64, baseline: 310, anchor: 'start', ink: C.chalk, plane: 'far' },
        { text: 'ACTUALLY', x: 1016, baseline: 752, anchor: 'end', ink: C.orange, plane: 'near' },
        { text: 'BUILD?', x: 1016, baseline: 846, anchor: 'end', ink: C.orange, plane: 'near' },
      ],
    },
    line: { ax: 0.47 * 1080, bx: 1016, y: 852, depth: 92, up: 0.42, sag: 12, maxDepth: 0.22 * 1080 },
    stroke: 2.2,
    depositW: 6.5,
    xSize: 9,
    shadowMax: 15,
    puffScale: 1.0,
    viewTitle: { x: 64, y: 952, w: 952, size: 18, wrap: true },
    pivot: [998 - 422, 432],
    push: { frame: 0.045, far: 0.03, near: 0.065 },
    pool: [44, 50],
  },
};

export const VT_FILM = 'PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM · AI-GENERATED. THIS HASN’T HAPPENED YET.';
export const VT_STILL = 'PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM STILL · AI-GENERATED. THIS HASN’T HAPPENED YET.';
export const STATUS = 'PLANNED · NEW YORK CITY · 2027';
