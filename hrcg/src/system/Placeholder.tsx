// Placeholder sheets: stand-ins until an owner's component lands, and the fallback when one
// throws. They carry the sheet's tag and one H2 so anchors, focus and the strip work. Their
// height is the brief's scroll length. Owner: A1.

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { sheetById, type SheetId } from '../content/sheets';
import { SheetTag } from '../chrome/SheetTag';

export function SheetPlaceholder({
  id,
  file,
  vh,
  heading = 'h2',
}: {
  id: SheetId;
  file: string;
  vh?: number;
  heading?: 'h1' | 'h2';
}) {
  const sheet = sheetById(id)!;
  const H = heading;
  const name = sheet.strip.split(' · ').slice(1).join(' · ');
  return (
    <div
      className="sheet-placeholder"
      data-placeholder={file}
      style={{ minHeight: `${vh ?? sheet.scrollVh}vh` }}
    >
      <SheetTag id={id} />
      <H className="sheet-placeholder-h t-h2-statement" tabIndex={-1}>
        {heading === 'h1' ? 'Humanoid Robot Construction Games' : name}
      </H>
    </div>
  );
}

interface BoundaryProps {
  name: string;
  fallback: ReactNode;
  children: ReactNode;
}

/** Client error boundary per sheet: one broken sheet never takes the page down. */
export class SheetBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(`[HRCG] ${this.props.name} crashed; showing its placeholder.`, error, info.componentStack);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
