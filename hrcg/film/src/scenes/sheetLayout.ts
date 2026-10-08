// Native layouts of the five challenge sheets, per format. Crops are the brief's (§5.6, §7a):
// c31 only 4:5 at x ≥ 0.50; c33 only bottom-anchored 2.39:1; c30 only a band (until N09 replaces it).
import type { ClipId } from '../clips';
import { CROPS } from '../clips';
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
};

export type PlanL = {
  dest: Rect;
  vt: [number, number, number];
  tag: [number, number];
  numeral: { x: number; baseline: number; size: number; anchor: 'start' | 'end' };
  name: { x: number; baselines: number[]; size: number; oneLine: boolean };
};

const P45_916: Rect = [64, 150, 952, 1076 * (952 / 861)];
const SQ_916: Rect = [64, 150, 952, 952];

export const PLAN_L: Record<Format, (nLines: number) => PlanL> = {
  '169': (n) => ({
    dest: [96, 112, 800, 800],
    vt: [96, 926, 800],
    tag: [960, 120],
    numeral: { x: 960, baseline: 912 - (n === 2 ? 2 : 1) * 129 - 70, size: 230, anchor: 'start' },
    name: { x: 960, baselines: n === 2 ? [783, 912] : [912], size: 150, oneLine: false },
  }),
  '916': (n) => ({
    dest: [64, 760, 952, 952],
    vt: [64, 1726, 952],
    tag: [64, 150],
    numeral: { x: 1016, baseline: 720 - (n === 2 ? 112 : 0) - 2, size: 190, anchor: 'end' },
    name: { x: 64, baselines: n === 2 ? [608, 720] : [720], size: 130, oneLine: false },
  }),
  '11': () => ({
    dest: [64, 140, 660, 660],
    vt: [64, 812, 660],
    tag: [64, 100],
    numeral: { x: 1016, baseline: 330, size: 210, anchor: 'end' },
    name: { x: 64, baselines: [985], size: 100, oneLine: true },
  }),
};

export const PERSP: Record<Format, Persp[]> = {
  '169': [
    {
      clip: 'c30',
      crop: CROPS.c30_239,
      dest: [0, 138, 1920, 803],
      inAt: 0.4,
      framed: false,
      vt: [96, 958, 1728],
      sup: { lines: ['LAY BRICK.'], x: 1824, baselines: [392], anchor: 'end', size: 220 },
    },
    {
      clip: 'c31',
      crop: CROPS.c31_45,
      dest: [1168, 110, 656, 820],
      inAt: 0.3,
      framed: true,
      vt: [1168, 944, 656],
      sup: { lines: ['HANG', 'DRYWALL.'], x: 96, baselines: [741, 930], anchor: 'start', size: 220 },
    },
    {
      clip: 'c32',
      crop: [0, 0, 1920, 1076],
      dest: [0, 2, 1920, 1076],
      inAt: 0.2,
      framed: false,
      vt: [96, 958, 1728],
      sup: { lines: ['BOLT IT.'], x: 1824, baselines: [306], anchor: 'end', size: 220 },
    },
    {
      clip: 'c33',
      crop: CROPS.c33_239,
      dest: [384, 334, 1440, 602],
      inAt: 0.6,
      framed: true,
      vt: [384, 950, 1440],
      sup: { lines: ['RUN THE PIPE.'], x: 96, baselines: [292], anchor: 'start', size: 220 },
    },
    {
      clip: 'c34',
      crop: [588, 0, 861, 1076],
      dest: [96, 110, 656, 820],
      inAt: 0.0,
      framed: true,
      vt: [96, 944, 656],
      sup: { lines: ['MARK IT', 'OUT.'], x: 1824, baselines: [741, 930], anchor: 'end', size: 220 },
    },
  ],
  '916': [
    {
      clip: 'c30',
      crop: [96, 0, 861, 1076],
      dest: P45_916,
      inAt: 0.4,
      framed: true,
      vt: [64, 1352, 952],
      sup: { lines: ['LAY BRICK.'], x: 64, baselines: [1620], anchor: 'start', size: 190 },
    },
    {
      clip: 'c31',
      crop: CROPS.c31_45,
      dest: P45_916,
      inAt: 0.3,
      framed: true,
      vt: [64, 1352, 952],
      sup: { lines: ['HANG', 'DRYWALL.'], x: 64, baselines: [1600, 1763], anchor: 'start', size: 190 },
    },
    {
      clip: 'c32',
      crop: [400, 216, 860, 860],
      dest: SQ_916,
      inAt: 0.2,
      framed: true,
      vt: [64, 1114, 952],
      sup: { lines: ['BOLT IT.'], x: 64, baselines: [1400], anchor: 'start', size: 190 },
    },
    {
      clip: 'c33',
      crop: [520, 273, 803, 803],
      dest: SQ_916,
      inAt: 0.6,
      framed: true,
      vt: [64, 1114, 952],
      sup: { lines: ['RUN THE', 'PIPE.'], x: 64, baselines: [1400, 1563], anchor: 'start', size: 190 },
    },
    {
      clip: 'c34',
      crop: [588, 0, 861, 1076],
      dest: P45_916,
      inAt: 0.0,
      framed: true,
      vt: [64, 1352, 952],
      sup: { lines: ['MARK IT', 'OUT.'], x: 64, baselines: [1600, 1763], anchor: 'start', size: 190 },
    },
  ],
  '11': [
    {
      clip: 'c30',
      crop: CROPS.c30_239,
      dest: [64, 170, 952, 398],
      inAt: 0.4,
      framed: true,
      vt: [64, 582, 952],
      sup: { lines: ['LAY BRICK.'], x: 64, baselines: [985], anchor: 'start', size: 150 },
    },
    {
      clip: 'c31',
      crop: CROPS.c31_45,
      dest: [472, 110, 544, 680],
      inAt: 0.3,
      framed: true,
      vt: [472, 802, 544],
      sup: { lines: ['HANG DRYWALL.'], x: 64, baselines: [985], anchor: 'start', size: 150 },
    },
    {
      clip: 'c32',
      crop: [0, 0, 1920, 1076],
      dest: [64, 150, 952, 533.5],
      inAt: 0.2,
      framed: true,
      vt: [64, 697, 952],
      sup: { lines: ['BOLT IT.'], x: 64, baselines: [985], anchor: 'start', size: 150 },
    },
    {
      clip: 'c33',
      crop: CROPS.c33_239,
      dest: [64, 200, 952, 398],
      inAt: 0.6,
      framed: true,
      vt: [64, 612, 952],
      sup: { lines: ['RUN THE PIPE.'], x: 64, baselines: [985], anchor: 'start', size: 150 },
    },
    {
      clip: 'c34',
      crop: [588, 0, 861, 1076],
      dest: [64, 110, 544, 680],
      inAt: 0.0,
      framed: true,
      vt: [64, 802, 544],
      sup: { lines: ['MARK IT OUT.'], x: 64, baselines: [985], anchor: 'start', size: 150 },
    },
  ],
};

export const PERSP_TITLES = ['PERSPECTIVE 01-A', 'PERSPECTIVE 02-A', 'PERSPECTIVE 03-A', 'PERSPECTIVE 04-A', 'PERSPECTIVE 05-A'];
