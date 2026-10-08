// <SheetTag id="A-103" /> (brief 3.2): label-style tag top-left of each sheet, on the spine.
// Also registers the sheet with sheetStore (its closest [data-sheet] ancestor, else itself).
// Owner: A1.

import { useEffect, useRef } from 'react';
import { sheetById, type SheetId } from '../content/sheets';
import { sheetStore } from '../system/sheetStore';
import { LabelText } from './LabelText';

export interface SheetTagProps {
  id: SheetId;
  className?: string;
}

export function SheetTag({ id, className }: SheetTagProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const sheet = sheetById(id);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = el.closest('[data-sheet]') ?? el;
    return sheetStore.register(id, target);
  }, [id]);

  if (!sheet?.tag) return null;
  return (
    <p ref={ref} className={`sheet-tag t-label ${className ?? ''}`} data-sheet-tag={id}>
      <LabelText text={sheet.tag} />
    </p>
  );
}

export default SheetTag;
