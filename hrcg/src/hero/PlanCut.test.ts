// Plan-cut geometry (FIXLIST-1 F-005). Owner: A2.
import { describe, expect, it } from 'vitest';
import {
  BASE,
  FRESH_FALLBACK,
  IDENTITY,
  apply,
  compose,
  coverFit,
  lineFlip,
  registerLine,
  relativeAffine,
  type Affine,
} from './PlanCut';

const map = (A: Affine, x: number, y: number) => ({ x: A.a * x + A.c * y + A.e, y: A.b * x + A.d * y + A.f });

describe('registerLine (landscape plan cut)', () => {
  it("puts b44's fresh line exactly on the deposit", () => {
    const L = { x: 820, y: 680 };
    const R = { x: 1450, y: 680 };
    const m = registerLine(FRESH_FALLBACK[0], FRESH_FALLBACK[1], L, R);
    const a = apply(m, ...FRESH_FALLBACK[0]);
    const b = apply(m, ...FRESH_FALLBACK[1]);
    expect(a.x).toBeCloseTo(L.x, 6);
    expect(a.y).toBeCloseTo(L.y, 6);
    expect(b.x).toBeCloseTo(R.x, 6);
    expect(b.y).toBeCloseTo(R.y, 6);
  });
});

describe('coverFit (portrait plan cut)', () => {
  it('covers the stage and centres the line where the cover allows', () => {
    const W = 390;
    const H = 844;
    const m = coverFit(W, H, 0.564, 0.528);
    const side = m.s * BASE;
    expect(side).toBe(844);
    const left = m.cx - side / 2;
    const top = m.cy - side / 2;
    expect(left).toBeLessThanOrEqual(0);
    expect(left + side).toBeGreaterThanOrEqual(W);
    expect(top).toBe(0);
    expect(apply(m, 0.564, 0.528).x).toBeCloseTo(W / 2, 6);
  });
  it('clamps so no slab shows at the edges', () => {
    const m = coverFit(390, 844, 0.02, 0.5);
    expect(m.cx - (m.s * BASE) / 2).toBe(0);
  });
});

describe('lineFlip (the deposit onto b44 line)', () => {
  const L0 = { x: 180, y: 632 };
  const R0 = { x: 375, y: 632 };
  const L1 = { x: 57, y: 446 };
  const R1 = { x: 333, y: 446 };
  it('is the identity at 0', () => {
    const A = lineFlip(L0, R0, L1, R1, 0);
    for (const k of ['a', 'b', 'c', 'd', 'e', 'f'] as const) expect(A[k]).toBeCloseTo(IDENTITY[k], 9);
  });
  it('lands both ends on the target line at 1', () => {
    const A = lineFlip(L0, R0, L1, R1, 1);
    const a = map(A, L0.x, L0.y);
    const b = map(A, R0.x, R0.y);
    expect(a.x).toBeCloseTo(L1.x, 6);
    expect(a.y).toBeCloseTo(L1.y, 6);
    expect(b.x).toBeCloseTo(R1.x, 6);
    expect(b.y).toBeCloseTo(R1.y, 6);
  });
  it('composes with the pull-out (identity when the plan has not moved)', () => {
    const m0 = coverFit(390, 844, 0.564, 0.528);
    const R = relativeAffine(m0, m0);
    const A = compose(R, lineFlip(L0, R0, L1, R1, 1));
    const a = map(A, L0.x, L0.y);
    expect(a.x).toBeCloseTo(L1.x, 6);
    expect(a.y).toBeCloseTo(L1.y, 6);
  });
});
