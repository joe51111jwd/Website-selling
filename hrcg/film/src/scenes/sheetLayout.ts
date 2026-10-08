// Native layouts of the five challenge sheets, per format. Crops are the brief's (§5.6, §7a):
// c31 only inside A5's window below the head; c33 only bottom-anchored 2.39:1; c30 only a band.
import type { ClipId } from '../clips';
import { CROPS, USE_N09 } from '../clips';
import type { Rect } from '../components/Clip';
import type { Format } from '../timeline';

export type Persp = {
  clip: ClipId;
  crop: Rect;
  dest: Rect;
  inAt: number; // source seconds
  framed: boolean;
  vt: [number, number, number]; // x, y, w
  vtWrap?: boolean;
  sup: { lines: string[]; x: number; baselines: number[]; anchor: 'start' | 'end'; size: number };
  push?: { to: number; origin: [number, number] }; // slow push-in over the beat (scale 1 → to), origin in dest fractions
};

export type PlanL = {
  dest: Rect;
  vt: [number, number, number];
  tag: [number, number];
  numeral: { x: number; baseline: number; size: number; anchor: 'start' | 'end' };
  name: { x: number; baselines: number[]; size: number; oneLine: boolean };
};

// Pass B (F-058): every layout keeps clear of the two disclosure burn-ins (layout.ts DISCLOSURE): 16:9 and 1:1
// top right at y 104–146 and bottom left from y 1000; 9:16 top left at y 190–308 and bottom left from y 1755.
// 9:16 media are squares at the full content width, under the top disclosure.
const SQ_916: Rect = [64, 344, 952, 952];
const SUP_916 = { size: 170, one: [1540], two: [1540, 1686] };

// A-102 HANG DRYWALL (director note 2): A5's new window (board face, forearm and hand, the 07 stencil) from the
// part of the take where the hand is flat on the board (source 2.4–4.6 s), with a slow push-in on the hand.
const C31_PUSH = { to: 1.07, origin: [0.74, 0.5] as [number, number] };

export const PLAN_L: Record<Format, (nLines: number) => PlanL> = {
  '169': (n) => ({
    dest: [96, 160, 760, 760],
    vt: [96, 932, 760],
    tag: [960, 168],
    numeral: { x: 960, baseline: 912 - (n === 2 ? 2 : 1) * 129 - 70, size: 230, anchor: 'start' },
    name: { x: 960, baselines: n === 2 ? [783, 912] : [912], size: 150, oneLine: false },
  }),
  '916': (n) => ({
    dest: [64, 712, 952, 952],
    vt: [64, 1676, 952],
    tag: [64, 344],
    numeral: { x: 1016, baseline: 670 - (n === 2 ? 112 : 0), size: 190, anchor: 'end' },
    name: { x: 64, baselines: n === 2 ? [560, 672] : [672], size: 130, oneLine: false },
  }),
  '11': () => ({
    dest: [64, 206, 600, 600],
    vt: [64, 818, 600],
    tag: [64, 164],
    numeral: { x: 1016, baseline: 420, size: 210, anchor: 'end' },
    name: { x: 64, baselines: [962], size: 100, oneLine: true },
  }),
};

export const PERSP: Record<Format, Persp[]> = {
  '169': [
    USE_N09
      ? {
          clip: 'n09r',
          // the N09 band (2.39:1 at y 40) trimmed to 2.44:1 so it starts under the top disclosure
          crop: [0, 49, 1920, 786],
          dest: [0, 150, 1920, 786],
          inAt: 1.4,
          framed: false,
          vt: [96, 944, 1728],
          // two lines, right-aligned, so the super stays clear of 07's head and right shoulder
          sup: { lines: ['LAY', 'BRICK.'], x: 1824, baselines: [366, 547], anchor: 'end', size: 210 },
        }
      : {
          clip: 'c30',
          crop: CROPS.c30_239,
          dest: [0, 150, 1920, 786],
          inAt: 0.4,
          framed: false,
          vt: [96, 944, 1728],
          sup: { lines: ['LAY BRICK.'], x: 1824, baselines: [372], anchor: 'end', size: 200 },
        },
    {
      clip: 'c31',
      crop: CROPS.c31_45,
      dest: [1208, 172, 616, 770],
      inAt: 2.4,
      framed: true,
      vt: [1208, 954, 616],
      sup: { lines: ['HANG', 'DRYWALL.'], x: 96, baselines: [741, 930], anchor: 'start', size: 220 },
      push: C31_PUSH,
    },
    {
      clip: 'c32',
      // full width, matted above the view title so the labels never sit on the busy bolt tray
      crop: [0, 0, 1920, 920],
      dest: [0, 2, 1920, 920],
      inAt: 0.2,
      framed: false,
      vt: [96, 932, 1728],
      sup: { lines: ['BOLT IT.'], x: 1824, baselines: [372], anchor: 'end', size: 220 },
    },
    {
      clip: 'c33',
      crop: CROPS.c33_239,
      dest: [480, 368, 1344, 562],
      inAt: 0.6,
      framed: true,
      vt: [480, 940, 1344],
      sup: { lines: ['RUN THE PIPE.'], x: 96, baselines: [336], anchor: 'start', size: 210 },
    },
    {
      clip: 'c34',
      crop: [588, 0, 861, 1076],
      dest: [96, 152, 616, 770],
      inAt: 0.0,
      framed: true,
      vt: [96, 934, 616],
      sup: { lines: ['MARK IT', 'OUT.'], x: 1824, baselines: [741, 930], anchor: 'end', size: 220 },
    },
  ],
  '916': [
    {
      clip: USE_N09 ? 'n09r' : 'c30',
      crop: USE_N09 ? CROPS.n09r_sq : [96, 215, 861, 861],
      dest: SQ_916,
      inAt: USE_N09 ? 1.4 : 0.4,
      framed: true,
      vt: [64, 1308, 952],
      sup: { lines: ['LAY BRICK.'], x: 64, baselines: SUP_916.one, anchor: 'start', size: SUP_916.size },
    },
    {
      clip: 'c31',
      crop: CROPS.c31_sq,
      dest: SQ_916,
      inAt: 2.4,
      framed: true,
      vt: [64, 1308, 952],
      sup: { lines: ['HANG', 'DRYWALL.'], x: 64, baselines: SUP_916.two, anchor: 'start', size: SUP_916.size },
      push: C31_PUSH,
    },
    {
      clip: 'c32',
      crop: [400, 216, 860, 860],
      dest: SQ_916,
      inAt: 0.2,
      framed: true,
      vt: [64, 1308, 952],
      sup: { lines: ['BOLT IT.'], x: 64, baselines: SUP_916.one, anchor: 'start', size: SUP_916.size },
    },
    {
      clip: 'c33',
      crop: [520, 273, 803, 803],
      dest: SQ_916,
      inAt: 0.6,
      framed: true,
      vt: [64, 1308, 952],
      sup: { lines: ['RUN THE', 'PIPE.'], x: 64, baselines: SUP_916.two, anchor: 'start', size: SUP_916.size },
    },
    {
      clip: 'c34',
      crop: CROPS.c34_sq,
      dest: SQ_916,
      inAt: 0.0,
      framed: true,
      vt: [64, 1308, 952],
      sup: { lines: ['MARK IT', 'OUT.'], x: 64, baselines: SUP_916.two, anchor: 'start', size: SUP_916.size },
    },
  ],
  '11': [
    {
      clip: USE_N09 ? 'n09r' : 'c30',
      crop: USE_N09 ? CROPS.n09r_239 : CROPS.c30_239,
      dest: [64, 250, 952, 398.7],
      inAt: USE_N09 ? 1.4 : 0.4,
      framed: true,
      vt: [64, 662, 952],
      sup: { lines: ['LAY BRICK.'], x: 64, baselines: [970], anchor: 'start', size: 150 },
    },
    {
      clip: 'c31',
      crop: CROPS.c31_45,
      dest: [560, 172, 456, 570],
      inAt: 2.9,
      framed: true,
      vt: [560, 754, 456],
      sup: { lines: ['HANG DRYWALL.'], x: 64, baselines: [970], anchor: 'start', size: 150 },
      push: C31_PUSH,
    },
    {
      clip: 'c32',
      crop: [0, 0, 1920, 1076],
      dest: [64, 172, 952, 533.5],
      inAt: 0.2,
      framed: true,
      vt: [64, 717, 952],
      sup: { lines: ['BOLT IT.'], x: 64, baselines: [970], anchor: 'start', size: 150 },
    },
    {
      clip: 'c33',
      crop: CROPS.c33_239,
      dest: [64, 250, 952, 398],
      inAt: 0.6,
      framed: true,
      vt: [64, 662, 952],
      sup: { lines: ['RUN THE PIPE.'], x: 64, baselines: [970], anchor: 'start', size: 150 },
    },
    {
      clip: 'c34',
      crop: [588, 0, 861, 1076],
      dest: [64, 172, 456, 570],
      inAt: 0.0,
      framed: true,
      vt: [64, 754, 456],
      sup: { lines: ['MARK IT OUT.'], x: 64, baselines: [970], anchor: 'start', size: 150 },
    },
  ],
};

export const PERSP_TITLES = ['PERSPECTIVE 01-A', 'PERSPECTIVE 02-A', 'PERSPECTIVE 03-A', 'PERSPECTIVE 04-A', 'PERSPECTIVE 05-A'];
