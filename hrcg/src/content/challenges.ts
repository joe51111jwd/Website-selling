// The five challenges, in their fixed order (brief 3.4-3.8). Owner: A1.
// Copy here is exact brief copy; other agents import it rather than retyping it.

export type ChallengeNo = 1 | 2 | 3 | 4 | 5;

export interface Challenge {
  no: ChallengeNo;
  /** '01'..'05' */
  num: string;
  /** Sentence case, as in the footer title block: 'Drywall installation' */
  name: string;
  /** Upper case, as in H2s, bay labels and chips: 'DRYWALL INSTALLATION' */
  upper: string;
  /** Bay label and checkbox label: '02 DRYWALL INSTALLATION' */
  label: string;
  /** Sheet id */
  sheet: 'A-101' | 'A-102' | 'A-103' | 'A-104' | 'A-105';
  /** Roll-call verb (INDEX rows and A-900 only) */
  verb: string;
  /** Spec sentence */
  spec: string;
}

export const CHALLENGES: readonly Challenge[] = [
  {
    no: 1,
    num: '01',
    name: 'Bricklaying',
    upper: 'BRICKLAYING',
    label: '01 BRICKLAYING',
    sheet: 'A-101',
    verb: 'LAY BRICK.',
    spec: 'Build a wall segment with straight courses, consistent joints, and a stable finish.',
  },
  {
    no: 2,
    num: '02',
    name: 'Drywall installation',
    upper: 'DRYWALL INSTALLATION',
    label: '02 DRYWALL INSTALLATION',
    sheet: 'A-102',
    verb: 'HANG DRYWALL.',
    spec: 'Position and fasten a panel on a prepared frame, with correct alignment and a clean finish.',
  },
  {
    no: 3,
    num: '03',
    name: 'Bolted assembly',
    upper: 'BOLTED ASSEMBLY',
    label: '03 BOLTED ASSEMBLY',
    sheet: 'A-103',
    verb: 'BOLT IT.',
    spec: 'Align components and complete a secure bolted connection.',
  },
  {
    no: 4,
    num: '04',
    name: 'Pipe assembly',
    upper: 'PIPE ASSEMBLY',
    label: '04 PIPE ASSEMBLY',
    sheet: 'A-104',
    verb: 'RUN THE PIPE.',
    spec: 'Connect pipes and fittings to a task drawing, with correct geometry and secure joints.',
  },
  {
    no: 5,
    num: '05',
    name: 'Layout and marking',
    upper: 'LAYOUT AND MARKING',
    label: '05 LAYOUT AND MARKING',
    sheet: 'A-105',
    verb: 'MARK IT OUT.',
    spec: 'Transfer a plan onto a work surface with accurate positions and clear reference lines.',
  },
];

export function challengeBySheet(sheet: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.sheet === sheet);
}
