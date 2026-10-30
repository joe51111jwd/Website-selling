import { useEffect, useRef, useState, type ReactNode } from 'react';

type Item = { key: number; text: string; state: 'idle' | 'in' | 'out' };

/**
 * A one-line mask swap: the old text slides up and fades (outMs), then the new one rises in (inMs).
 * The exiting copy is aria-hidden so it is never read twice.
 */
export function Swap({
  text,
  className = '',
  outMs = 160,
  inMs = 220,
  as: Tag = 'span',
  render,
  instant = false,
}: {
  text: string;
  className?: string;
  outMs?: number;
  inMs?: number;
  as?: 'span' | 'p' | 'div';
  render?: (t: string) => ReactNode;
  /** Replace the text with no animation (a fast scripted roll). */
  instant?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([{ key: 0, text, state: 'idle' }]);
  const k = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const key = ++k.current;
    if (instant) {
      setItems([{ key, text, state: 'idle' }]);
      return;
    }
    setItems((prev) => [
      ...prev.filter((i) => i.state !== 'out').map((i) => ({ ...i, state: 'out' as const })),
      { key, text, state: 'in' },
    ]);
    const id = window.setTimeout(() => setItems((prev) => prev.filter((i) => i.state !== 'out')), outMs + 30);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, outMs]);
  return (
    <Tag className={`swap ${className}`} style={{ ['--out' as string]: `${outMs}ms`, ['--in' as string]: `${inMs}ms` }}>
      {(instant ? [{ key: k.current, text, state: 'idle' as const }] : items).map((i) => (
        <span key={i.key} className={`swap-item is-${i.state}`} aria-hidden={i.state === 'out' ? true : undefined}>
          {render ? render(i.text) : i.text}
        </span>
      ))}
    </Tag>
  );
}
