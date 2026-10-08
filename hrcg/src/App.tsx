// The drawing set, in order (brief 3.0). Owner: A1.
// Every sheet's component is imported from its owner's file path through import.meta.glob, so a
// missing file never breaks the build: the sheet renders its placeholder at the brief's scroll
// length instead. Each sheet is wrapped in <section id="a-1xx" data-sheet="A-1xx"> by this file;
// owners render INSIDE it (the cover stage renders its own #a-000 and #a-100, see below).
//
// Accepted exports per file: default, or a named export equal to the file name
// (e.g. export function A101Brick()). Components take no props.
//
// Shell JS budget (FIXLIST F-014): the sheets below the fold (A-105 with its section slice, A-200,
// A-300, A-301, A-900) are React.lazy chunks, each behind its own <Suspense>. The prerender waits for
// them, so their HTML is in index.html; on the client React keeps that server HTML in place until each
// chunk has loaded, then hydrates it. CSS stays one file (vite.config.ts cssCodeSplit: false, F-013).

import { Suspense, lazy, useEffect, type ComponentType, type CSSProperties } from 'react';
import { COVER_STAGE_VH, sheetById, type SheetId } from './content/sheets';
import { SKIP_LINK } from './content/copy/chrome';
import { SheetHeader } from './chrome/SheetHeader';
import { TitleStrip } from './chrome/TitleStrip';
import { PhoneBar, TitleSheet } from './chrome/PhoneBar';
import { SheetIndex, InPageIndex } from './chrome/SheetIndex';
import { Lightbox } from './chrome/Lightbox';
import { AriaLive } from './chrome/AriaLive';
import { SheetPlaceholder, SheetBoundary } from './system/Placeholder';
import { useShellEffects } from './system/shell';

type Mod = Record<string, unknown>;

// Explicit file lists: never glob a whole folder (it would pull lazy GL modules into the shell).
const eagerModules = import.meta.glob<Mod>(
  [
    './hero/CoverStage.tsx',
    './sheets/A100Bays.tsx',
    './sheets/A101Brick.tsx',
    './sheets/A102Drywall.tsx',
    './sheets/A103Bolt.tsx',
    './sheets/A104Pipe.tsx',
  ],
  { eager: true },
);
const lazyModules = import.meta.glob<Mod>([
  './sheets/A105Layout.tsx',
  './sheets/A200Context.tsx',
  './sheets/A300Teams.tsx',
  './sheets/A301Sponsors.tsx',
  './sheets/A900Notes.tsx',
]);

function componentOf(mod: Mod | undefined, path: string): ComponentType | null {
  if (!mod) return null;
  const name = path.split('/').pop()!.replace(/\.tsx$/, '');
  const c = (mod.default ?? mod[name]) as ComponentType | undefined;
  if (typeof c === 'function' || (typeof c === 'object' && c !== null)) return c;
  return null;
}

/** A module that loads but exports no component renders nothing (the build stays green). */
function Empty() {
  return null;
}

// one lazy component per file, created once (stable identity across renders)
const lazyComponents = new Map<string, ComponentType>();
for (const [path, load] of Object.entries(lazyModules)) {
  lazyComponents.set(
    path,
    lazy(() => load().then((mod) => ({ default: componentOf(mod, path) ?? Empty }))),
  );
}

function pick(path: string): ComponentType | null {
  return componentOf(eagerModules[path], path) ?? lazyComponents.get(path) ?? null;
}

interface Slot {
  id: SheetId;
  file: string;
}

const SLOTS: Slot[] = [
  { id: 'A-101', file: './sheets/A101Brick.tsx' },
  { id: 'A-102', file: './sheets/A102Drywall.tsx' },
  { id: 'A-103', file: './sheets/A103Bolt.tsx' },
  { id: 'A-104', file: './sheets/A104Pipe.tsx' },
  { id: 'A-105', file: './sheets/A105Layout.tsx' },
  { id: 'A-200', file: './sheets/A200Context.tsx' },
  { id: 'A-300', file: './sheets/A300Teams.tsx' },
  { id: 'A-301', file: './sheets/A301Sponsors.tsx' },
  { id: 'A-900', file: './sheets/A900Notes.tsx' },
];

function vhVar(vh: number): CSSProperties {
  return { ['--sheet-vh' as string]: vh } as CSSProperties;
}

function SheetSection({ id, file }: Slot) {
  const sheet = sheetById(id)!;
  const C = pick(file);
  const fallback = (
    <>
      <SheetPlaceholder id={id} file={file.replace('./', 'src/')} />
      {id === 'A-900' ? (
        <footer className="placeholder-footer">
          <InPageIndex />
        </footer>
      ) : null}
    </>
  );
  return (
    <section
      id={sheet.anchor}
      className={`sheet sheet--${sheet.anchor}`}
      data-sheet={id}
      data-ground={sheet.ground}
      style={vhVar(sheet.scrollVh)}
    >
      {C ? (
        <SheetBoundary name={id} fallback={fallback}>
          <Suspense fallback={fallback}>
            <C />
          </Suspense>
        </SheetBoundary>
      ) : (
        fallback
      )}
    </section>
  );
}

/**
 * Cover stage (A-000 -> A-100, one sticky stage of 320vh). src/hero/CoverStage.tsx (A2) renders
 * BOTH sheets itself: elements with id="a-000" data-sheet="A-000" and id="a-100" data-sheet="A-100".
 * Until it exists: an A-000 placeholder, then A3's A100Bays (static) or an A-100 placeholder.
 */
function CoverSlot() {
  const Cover = pick('./hero/CoverStage.tsx');
  const Bays = pick('./sheets/A100Bays.tsx');
  const a000 = sheetById('A-000')!;
  const a100 = sheetById('A-100')!;
  const fallback = (
    <>
      <section id="a-000" className="sheet sheet--a-000" data-sheet="A-000" data-ground="slab" style={vhVar(a000.scrollVh)}>
        <SheetPlaceholder id="A-000" file="src/hero/CoverStage.tsx" heading="h1" />
      </section>
      <section id="a-100" className="sheet sheet--a-100" data-sheet="A-100" data-ground="slab" style={vhVar(a100.scrollVh)}>
        {Bays ? (
          <SheetBoundary name="A-100" fallback={<SheetPlaceholder id="A-100" file="src/sheets/A100Bays.tsx" />}>
            <Bays />
          </SheetBoundary>
        ) : (
          <SheetPlaceholder id="A-100" file="src/sheets/A100Bays.tsx" />
        )}
      </section>
    </>
  );
  return (
    <div className="stage-cover" data-stage="cover" style={vhVar(COVER_STAGE_VH)}>
      {Cover ? (
        <SheetBoundary name="A-000" fallback={fallback}>
          <Suspense fallback={fallback}>
            <Cover />
          </Suspense>
        </SheetBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}

export function App() {
  useShellEffects();
  useEffect(() => {
    // dev aid: list which sheets are still placeholders
    if (import.meta.env.DEV) {
      const missing = SLOTS.filter((s) => !pick(s.file)).map((s) => s.id);
      if (!pick('./hero/CoverStage.tsx')) missing.unshift('A-000');
      if (missing.length) console.info(`[HRCG] placeholder sheets: ${missing.join(', ')}`);
    }
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP_LINK}
      </a>
      <SheetHeader />
      <TitleStrip />
      <PhoneBar />
      <main id="main" tabIndex={-1}>
        <CoverSlot />
        <div className="set-body">
          {SLOTS.map((s) => (
            <SheetSection key={s.id} {...s} />
          ))}
        </div>
      </main>
      <SheetIndex />
      <TitleSheet />
      <Lightbox />
      <AriaLive />
      <div className="sheet-border" aria-hidden="true" />
    </>
  );
}

export default App;
