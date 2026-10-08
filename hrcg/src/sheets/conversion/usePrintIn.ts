// Print-in (brief 3.2, 6): body text prints in (opacity, 200 ms) when its sheet arrives; it never
// travels. Uses A1's .print-in / .is-in classes (always visible with no JS and under reduced motion).
// Owner: A6.

import { useSheet } from '../../system/sheetStore';

export function usePrintIn(sheet: string): string {
  const { current, visited } = useSheet();
  return current === sheet || visited.has(sheet) ? 'print-in is-in' : 'print-in';
}
