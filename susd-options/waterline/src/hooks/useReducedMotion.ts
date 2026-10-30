import { useEffect, useState } from 'react';
import { PARAMS } from '../engine/params';

const query = () => window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion() {
  return PARAMS.reduced || query().matches;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = query();
    const on = () => setReduced(PARAMS.reduced || mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
