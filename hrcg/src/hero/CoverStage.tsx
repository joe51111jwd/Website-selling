// A-000 COVER -> A-100 THE FIVE BAYS: one sticky stage (brief 2, 3.3, 4.1). Owner: A2.
//
// The markup is the same for every tier and is prerendered (brief 8.3a). The head script's classes
// pick the first paint in CSS (cover.css): .js:not(.rm) = the armed state, .rm / .no-js = the final
// frozen composition. React's first render is state-agnostic; everything that depends on the
// browser (motion, tier, codec, orientation) happens in the controller after hydration.
//
// Structure
//   .cv (320vh desktop / 220vh phone while pinned; natural height otherwise)
//     .cv-pin (sticky) ─ .cv-hero   the frame: ground, film, still, 3D VIEW, H1, line, hints
//                      ─ .cv-a100   A3's <A100Bays mode="stage"> (or a placeholder row)
//                      ─ .cv-plan   PLAN 05 still + deposits + the landed slot-05 film
//                      ─ .cv-fx     the string (SVG) and the puff (canvas2D)
//     .cv-spacer        the pinned scroll length
//     #a-000, #a-100    empty tracks: anchor geometry for INDEX / strip CTAs (focus is forwarded)

import { useEffect, useRef, useState, type ComponentType, type Ref } from 'react';
import './cover.css';
import { HERO } from '../content/copy/hero';
import { ViewTitle } from '../chrome/ViewTitle';
import { Picture } from '../system/Picture';
import { SheetPlaceholder } from '../system/Placeholder';
import { ControlX } from '../marks/ControlX';
import { ChalkBox } from '../marks/ChalkBox';
import { media, type MediaEntry } from '../media/manifest';
import { PORTRAIT_QUERY } from './heroLayout';
import { createCoverController, type ArenaHandle } from './controller';

type Mod = Record<string, unknown>;
const sheetMods = import.meta.glob<Mod>(['../sheets/A100Bays.tsx'], { eager: true });

type BaysProps = { mode?: 'static' | 'stage'; arenaRef?: Ref<ArenaHandle> };
function pickBays(): ComponentType<BaysProps> | null {
  const mod = sheetMods['../sheets/A100Bays.tsx'];
  if (!mod) return null;
  const c = (mod.default ?? mod.A100Bays) as ComponentType<BaysProps> | undefined;
  return typeof c === 'function' || (typeof c === 'object' && c !== null) ? c : null;
}

const PORTRAIT = PORTRAIT_QUERY;

/**
 * The hero film's poster is the frame-84 still <picture> directly under it (it switches 16:9 / 9:16
 * by media query, which a poster attribute cannot). A transparent poster keeps the no-JS video box
 * from painting grey over it; the film's own pixels cover the still once it plays.
 */
const CLEAR_POSTER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function srcOf(e: MediaEntry | undefined, re: RegExp): string | undefined {
  return e?.sources?.find((s) => re.test(s.type) || re.test(s.src))?.src;
}

/** <picture> with the 9:16 variant for portrait viewports (brief 2.5). */
function FramePicture({
  land,
  port,
  className,
  alt,
  eager = false,
  high = false,
}: {
  land: string;
  port: string;
  className?: string;
  alt: string;
  eager?: boolean;
  high?: boolean;
}) {
  const L = media[land];
  const P = media[port];
  if (!L) return <span className={className} data-missing={land} />;
  const lAvif = srcOf(L, /avif/i);
  const lWebp = srcOf(L, /webp/i);
  const lJpg = srcOf(L, /jpe?g/i);
  const pAvif = srcOf(P, /avif/i);
  const pWebp = srcOf(P, /webp/i);
  const pJpg = srcOf(P, /jpe?g/i);
  const fallback = lJpg ?? lWebp ?? lAvif!;
  return (
    <picture className={className} data-media-id={land}>
      {pAvif ? <source media={PORTRAIT} srcSet={pAvif} type="image/avif" /> : null}
      {pWebp ? <source media={PORTRAIT} srcSet={pWebp} type="image/webp" /> : null}
      {pJpg ? <source media={PORTRAIT} srcSet={pJpg} type="image/jpeg" /> : null}
      {lAvif && lAvif !== fallback ? <source srcSet={lAvif} type="image/avif" /> : null}
      <img
        src={fallback}
        alt={alt}
        width={L.w}
        height={L.h}
        loading={eager ? 'eager' : 'lazy'}
        decoding={eager ? 'sync' : 'async'}
        fetchPriority={high ? 'high' : undefined}
      />
    </picture>
  );
}

function ResetGlyph() {
  // ↺ is not in the Latin subsets: drawn, at the label's cap height (brief 5.7: arrows are glyph-like)
  return (
    <svg className="cv-reset-glyph" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M3.1 3.4A4.2 4.2 0 1 1 1.9 7" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.2 1.3L1.4 4.4L4.4 3.9" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function CoverStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<ArenaHandle | null>(null);
  const [mode, setMode] = useState<'static' | 'stage'>('static');
  const [codec, setCodec] = useState<'av1' | 'h264'>('av1');
  const Bays = pickBays();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctl = createCoverController({
      root,
      setMode,
      setCodec,
      arena: () => arenaRef.current,
    });
    return () => ctl.destroy();
  }, []);

  const film = media['hero-snap-169'];
  const filmP = media['hero-snap-916'];
  const plan = media['plan-b44'];
  const planM = media['plan-b44-m'];
  const filmSources = [
    ...(filmP?.sources ?? []).map((s) => ({ ...s, media: PORTRAIT })),
    ...(film?.sources ?? []).map((s) => ({ ...s, media: undefined as string | undefined })),
  ];
  const slotSources = [
    ...(planM?.sources ?? []).map((s) => ({ ...s, media: '(max-width: 767px)' as string | undefined })),
    ...(plan?.sources ?? []).map((s) => ({ ...s, media: undefined as string | undefined })),
  ];

  const [l0, l1, l2, l3] = HERO.h1Lines;
  const line = (text: string, i: number) => (
    <span className="cv-line" data-line={i} key={i}>
      <span className="cv-pen">{text}</span>
      <span className="cv-ink" aria-hidden="true">
        {text}
      </span>
    </span>
  );

  return (
    <div
      ref={rootRef}
      className="cv"
      data-cover=""
      data-vt="auto"
      data-hint="auto"
      data-line="auto"
      data-reset="off"
    >
      <div className="cv-pin">
        {/* ---------------------------------------------------------------- A-000 */}
        <section className="cv-hero" aria-labelledby="cv-h1">
          <div className="cv-box cv-ground" aria-hidden="true">
            <div className="cv-ground-in">
              <FramePicture land="hero-ground-169" port="hero-ground-916" alt="" eager high />
              <div className="cv-pool" />
            </div>
          </div>

          <ViewTitle id="hero-still" className="cv-box cv-media" frame={false} captionClassName="cv-vt cv-vt--still">
            <div className="cv-media-in">
              <FramePicture
                land={`hero-still-169-${codec}`}
                port={`hero-still-916-${codec}`}
                className="cv-still"
                alt={media['hero-still-169-av1']?.alt ?? ''}
              />
              <video
                className="cv-film"
                muted
                playsInline
                controls
                preload="none"
                poster={CLEAR_POSTER}
                aria-label={film?.alt}
                width={film?.w}
                height={film?.h}
              >
                {filmSources.map((s) => (
                  <source key={s.src} src={s.src} type={s.type} media={s.media} />
                ))}
              </video>
              <div className="cv-gl" role="group" aria-label={HERO.viewLabel} tabIndex={-1} />
            </div>
            <ViewTitle id="hero-film" captionClassName="cv-vt cv-vt--film" />
            <ViewTitle id="hero-3d" captionClassName="cv-vt cv-vt--3d" />
          </ViewTitle>

          <div className="cv-box cv-type">
            <p className="cv-status t-status">{HERO.status}</p>
            <h1 id="cv-h1" className="cv-h1" tabIndex={-1}>
              <span className="sr-only">
                {HERO.eyebrow}
                {HERO.eyebrowSep}
              </span>
              <span className="cv-far">
                {line(l0, 0)} {line(l1, 1)}
              </span>{' '}
              <span className="cv-near">
                {line(l2, 2)} {line(l3, 3)}
              </span>
            </h1>
            <FramePicture land="hero-matte-169" port="hero-matte-916" className="cv-matte" alt="" />
            <p className="cv-sub">{HERO.sub}</p>

            <ControlX className="cv-x cv-x--l" size={18} seed={11} />
            <ControlX className="cv-x cv-x--r" size={18} seed={23} />
            <span className="cv-chalkbox" aria-hidden="true">
              <ChalkBox size={22} side="left" />
            </span>
            <button type="button" className="cv-linebtn" aria-label={HERO.lineLabel} />
            <button type="button" className="cv-handle" aria-label={HERO.handleLabel} />

            <p className="cv-hint cv-hint--pull t-label" aria-live="off">
              <span>{HERO.hint.pull}</span>
              <span className="cv-hint-2">
                <span className="when-key">{HERO.hint.key}</span>
                <span className="when-touch">{HERO.hint.tap}</span>
              </span>
            </p>
            <div className="cv-restrow">
              <p className="cv-hint cv-hint--frozen-gl t-label">{HERO.hint.frozenGl}</p>
              <p className="cv-hint cv-hint--frozen t-label">{HERO.hint.frozen}</p>
              <button type="button" className="cv-reset cell-button" aria-label={HERO.resetLabel}>
                <ResetGlyph />
                <span>{HERO.reset.replace(/^↺\s*/, '')}</span>
              </button>
            </div>
            <button type="button" className="cv-play cell-button">
              {HERO.play}
            </button>
          </div>
        </section>

        {/* ---------------------------------------------------------------- A-100 */}
        <div className="cv-a100" data-print="auto" data-bubbles="auto">
          {Bays ? (
            <Bays mode={mode} arenaRef={arenaRef} />
          ) : (
            <>
              <SheetPlaceholder id="A-100" file="src/sheets/A100Bays.tsx" vh={0} />
              <div className="cv-ph-row" aria-hidden="true" data-cover-placeholder="">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="cv-ph-bay" data-bay={n} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------------- plan cut */}
        <ViewTitle id="plan-cut" className="cv-plan" frame={false} captionClassName="cv-vt cv-vt--plan">
          <div className="cv-plan-sq is-feathered">
            <Picture id="plan-b44-260" loading="lazy" />
          </div>
          <div className="cv-deps" aria-hidden="true" />
          <video className="cv-slot5" muted playsInline preload="none" aria-hidden="true" tabIndex={-1}>
            {slotSources.map((s) => (
              <source key={s.src} src={s.src} type={s.type} media={s.media} />
            ))}
          </video>
        </ViewTitle>

        <div className="cv-fx" aria-hidden="true">
          <svg className="cv-string" focusable="false">
            <path className="cv-string-shadow" d="" />
            <path className="cv-string-line" d="" />
            <path className="cv-string-core" d="" />
          </svg>
          <canvas className="cv-puff" />
        </div>
      </div>
      <div className="cv-spacer" />
      <div id="a-000" className="cv-track cv-track--000" data-sheet="A-000" data-ground="slab" tabIndex={-1} />
      <div id="a-100" className="cv-track cv-track--100" data-sheet="A-100" data-ground="slab" tabIndex={-1} />
      <div className="cv-track cv-track--cover" aria-hidden="true" />
    </div>
  );
}

export default CoverStage;
