import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DEBUG_DONE } from '../debug';
import { useFontsReady } from '../hooks/fonts';
import { useInViewOnce } from '../hooks/inview';
import { isCalm, useCompact } from '../hooks/media';
import { useResizeKey } from '../hooks/resize';
import { designUnit } from '../marks/measure';
import { caretFor, drawStrikes, measureStrike, type StrikeLine } from '../marks/strikes';
import { Clock, EASES, RGB, struckRGB } from '../motion/clock';

export type Phase = 'pending' | 'play' | 'done';
export type { StrikeLine };

/**
 * One proof sheet's marks: the inherited line is struck in red (with the dele loop in the
 * margin and the caret), then the correction rises out of the paper. Plays once, the first
 * time the sheet is at least 55% visible. `extra` appends sheet-specific steps; `measureExtra`
 * runs after each measure (fonts, resize, layout switch).
 */
export function useProof(opts: { extra?: (t: Clock, at: number) => void; measureExtra?: () => void } = {}) {
  const fonts = useFontsReady();
  const rk = useResizeKey();
  const compact = useCompact();
  const section = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const del = useRef<HTMLModElement>(null);
  const delWords = useRef<HTMLElement[]>([]);
  const corrWords = useRef<HTMLElement[]>([]);
  const strikes = useRef<SVGPathElement[][]>([]);
  const dele = useRef<SVGPathElement>(null);
  const caret = useRef<SVGPathElement>(null);
  const tl = useRef<Clock | null>(null);
  const extra = useRef(opts.extra);
  extra.current = opts.extra;
  const measureExtra = useRef(opts.measureExtra);
  measureExtra.current = opts.measureExtra;

  const [lines, setLines] = useState<StrikeLine[]>([]);
  const [caretPath, setCaretPath] = useState('');
  const [phase, setPhase] = useState<Phase>(() => (isCalm() || DEBUG_DONE ? 'done' : 'pending'));
  const [seen, setSeen] = useState(false);

  useLayoutEffect(() => {
    if (!fonts || !inner.current || !delWords.current.length) return;
    setLines(measureStrike(delWords.current, inner.current, compact ? 2 : 6));
    setCaretPath(caretFor(corrWords.current, inner.current, designUnit(), compact));
    measureExtra.current?.();
    tl.current?.finish();
  }, [fonts, rk, compact]);

  useInViewOnce(section, 0.55, () => setSeen(true), { enabled: phase === 'pending' });

  useLayoutEffect(() => {
    if (phase !== 'pending' || !seen || !lines.length) return;
    if (isCalm()) {
      setPhase('done');
      return;
    }
    const t = new Clock();
    tl.current = t;
    const E = EASES;
    const total = lines.reduce((s, l) => s + (l.x1 - l.x0), 0) || 1;
    const strikeMs = Math.min(520, Math.max(320, total * 0.55));
    const at = drawStrikes(t, strikes.current, 80, strikeMs);
    t.color(del.current, 80, 300, E.outCubic, RGB.ink, struckRGB(del.current));
    t.draw(dele.current, at - 120, 200, E.outCubic);
    t.draw(caret.current, at + 40, 120);
    const rise = at + 140;
    corrWords.current.forEach((w, i) => t.enter(w, rise + i * 40, 460, E.outQuint, { y: 16 }));
    extra.current?.(t, rise + corrWords.current.length * 40 + 200);
    setPhase('play');
    t.onDone(() => setPhase('done'));
  }, [phase, seen, lines]);

  useEffect(() => {
    if (phase === 'done') tl.current?.release();
  }, [phase]);

  return { section, inner, del, delWords, corrWords, strikes, dele, caret, caretPath, lines, phase, compact, fonts, rk };
}
