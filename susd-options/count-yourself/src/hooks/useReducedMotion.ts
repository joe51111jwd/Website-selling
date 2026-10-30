import { matches, useMedia } from './useMedia';

const Q = '(prefers-reduced-motion: reduce)';
export const prefersReducedMotion = () => matches(Q);
export const useReducedMotion = () => useMedia(Q);
