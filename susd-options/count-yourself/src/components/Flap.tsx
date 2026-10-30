import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

/** A departures-board flap: rotateX 90° out, swap, 90° in (180 ms in all), after `delay`. */
export function Flap({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  const [shown, setShown] = useState(text);
  const [st, setSt] = useState<'idle' | 'out' | 'in'>('idle');
  useEffect(() => {
    if (text === shown) return;
    if (prefersReducedMotion()) {
      setShown(text);
      return;
    }
    const t = [
      window.setTimeout(() => setSt('out'), delay),
      window.setTimeout(() => {
        setShown(text);
        setSt('in');
      }, delay + 90),
      window.setTimeout(() => setSt('idle'), delay + 190),
    ];
    return () => t.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <span className={`flap is-${st} ${className}`}>{shown}</span>;
}
