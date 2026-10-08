// Sandbox router (brief G16): http://127.0.0.1:5300/?sandbox=<name>. Owner: A1.
//
//   ?sandbox=<name>               lazily mounts src/sandboxes/<name>.tsx (default export)
//   ?sandbox=sheets/A101Brick     mounts any component module by path under src/ (default export
//                                 or the named export equal to the file name), e.g. hero/CoverStage,
//                                 marks/GridBubble, chrome/TitleStrip
//   ?sandbox=<registered>         names registered in REGISTERED below (add via requests/)
//   &chrome=1                     also renders the sheet header, title strip and phone bar
//   &ground=gypsum                paper ground instead of the slab
//   ?sandbox                      (no name) lists everything mountable
//
// Sandboxes render with createRoot (no hydration). Lenis, prefs and tier work as on the page.

import { Component, Suspense, lazy, useEffect, type ComponentType, type ReactNode } from 'react';
import { SheetHeader } from '../chrome/SheetHeader';
import { TitleStrip } from '../chrome/TitleStrip';
import { PhoneBar, TitleSheet } from '../chrome/PhoneBar';
import { SheetIndex } from '../chrome/SheetIndex';
import { AriaLive } from '../chrome/AriaLive';
import { useShellEffects } from '../system/shell';

type Mod = Record<string, unknown>;
type Loader = () => Promise<Mod>;

/** Sandbox files owned by each agent: src/sandboxes/<agent-or-name>.tsx */
const sandboxFiles = import.meta.glob<Mod>(['./*.tsx', '!./index.tsx']);

/** Any component module, mounted by path (lazy; never in the shell bundle). */
const componentFiles = import.meta.glob<Mod>([
  '../sheets/**/*.tsx',
  '../hero/**/*.tsx',
  '../marks/**/*.tsx',
  '../chrome/**/*.tsx',
  '../lib/**/*.tsx',
]);

/** Named registrations (requests/ -> A1). name -> loader */
const REGISTERED: Record<string, Loader> = {
  chrome: () => import('./chromeSandbox'),
};

function resolveLoader(name: string): Loader | null {
  if (REGISTERED[name]) return REGISTERED[name]!;
  const own = sandboxFiles[`./${name}.tsx`];
  if (own) return own;
  const clean = name.replace(/^\/+|^src\//, '').replace(/\.tsx$/, '');
  return componentFiles[`../${clean}.tsx`] ?? null;
}

function pickComponent(mod: Mod, name: string): ComponentType {
  const base = name.split('/').pop()!.replace(/\.tsx$/, '');
  const c = (mod.default ?? mod[base] ?? Object.values(mod).find((v) => typeof v === 'function')) as
    | ComponentType
    | undefined;
  if (!c) throw new Error(`sandbox "${name}": module has no default or "${base}" export`);
  return c;
}

class SandboxBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const e = this.state.error as Error;
      return (
        <pre className="sandbox-error">
          {String(e?.stack ?? e)}
        </pre>
      );
    }
    return this.props.children;
  }
}

function SandboxList() {
  const own = Object.keys(sandboxFiles).map((k) => k.replace('./', '').replace('.tsx', ''));
  const comps = Object.keys(componentFiles).map((k) => k.replace('../', '').replace('.tsx', ''));
  const all = [...Object.keys(REGISTERED), ...own, ...comps];
  return (
    <div className="sandbox-list">
      <p className="t-label">SANDBOXES</p>
      <ul>
        {all.map((n) => (
          <li key={n}>
            <a href={`?sandbox=${encodeURIComponent(n)}`}>{n}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChromeFrame({ children }: { children: ReactNode }) {
  useShellEffects();
  return (
    <>
      <SheetHeader />
      <TitleStrip />
      <PhoneBar />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SheetIndex />
      <TitleSheet />
      <AriaLive />
      <div className="sheet-border" aria-hidden="true" />
    </>
  );
}

function Bare({ children }: { children: ReactNode }) {
  useShellEffects();
  return (
    <>
      {children}
      <AriaLive />
    </>
  );
}

export function SandboxRoot({ name, chrome, ground }: { name: string; chrome: boolean; ground: string | null }) {
  useEffect(() => {
    document.documentElement.dataset.sandbox = name || 'list';
    if (ground === 'gypsum') document.body.dataset.ground = 'gypsum';
  }, [name, ground]);

  if (!name) return <SandboxList />;
  const loader = resolveLoader(name);
  if (!loader) {
    return (
      <div className="sandbox-list">
        <p className="t-label">NO SANDBOX NAMED “{name}”</p>
        <SandboxList />
      </div>
    );
  }
  const Lazy = lazy(async () => ({ default: pickComponent(await loader(), name) }));
  const Frame = chrome ? ChromeFrame : Bare;
  return (
    <Frame>
      <div className="sandbox" data-sandbox={name} data-ground={ground ?? 'slab'}>
        <SandboxBoundary>
          <Suspense fallback={null}>
            <Lazy />
          </Suspense>
        </SandboxBoundary>
      </div>
    </Frame>
  );
}

export default SandboxRoot;
