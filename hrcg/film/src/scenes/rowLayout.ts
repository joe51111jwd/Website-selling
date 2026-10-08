// A-100's one row of five bays: b = content width / 5.4, gap = 0.1·b (R2's ratio, brief §3.3).
import type { Format } from '../timeline';

export type RowLayout = {
  b: number;
  gap: number;
  x0: number;
  y0: number;
  bubbleY: number;
  bubbleR: number;
  labels: 'under' | 'list';
  labelSize: number;
  listY: number;
  listPitch: number;
  viewTitleY: number;
  viewTitleW: number;
  tagY: number;
  numeral: number;
};

const row = (contentW: number, x0: number, y0: number, extra: Partial<RowLayout>): RowLayout => {
  const b = contentW / 5.4;
  return {
    b,
    gap: 0.1 * b,
    x0,
    y0,
    bubbleY: y0 - 58,
    bubbleR: 20,
    labels: 'under',
    labelSize: 20,
    listY: 0,
    listPitch: 0,
    viewTitleY: y0 + b + 70,
    viewTitleW: contentW,
    tagY: 130,
    numeral: 22,
    ...extra,
  };
};

export const ROW: Record<Format, RowLayout> = {
  '169': row(1728, 96, 372, {}),
  '916': row(952, 64, 700, {
    bubbleY: 700 - 46,
    bubbleR: 17,
    labels: 'list',
    labelSize: 26,
    listY: 700 + 952 / 5.4 + 150,
    listPitch: 54,
    viewTitleY: 700 + 952 / 5.4 + 40,
    tagY: 344, // under the two-line F-058 disclosure in the top safe area
    numeral: 18,
  }),
  '11': row(952, 64, 330, {
    bubbleY: 330 - 44,
    bubbleR: 16,
    labels: 'list',
    labelSize: 22,
    listY: 330 + 952 / 5.4 + 130,
    listPitch: 44,
    viewTitleY: 330 + 952 / 5.4 + 34,
    tagY: 168, // under the F-058 disclosure (top right, 104–146)
    numeral: 16,
  }),
};

export const bayRect = (r: RowLayout, i: number): [number, number, number, number] => [
  r.x0 + i * (r.b + r.gap),
  r.y0,
  r.b,
  r.b,
];

export const BAY_LABELS = ['01 BRICKLAYING', '02 DRYWALL INSTALLATION', '03 BOLTED ASSEMBLY', '04 PIPE ASSEMBLY', '05 LAYOUT AND MARKING'];
