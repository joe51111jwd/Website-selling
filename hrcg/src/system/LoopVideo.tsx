// <LoopVideo id="plan-b40" className? /> (brief 8.5, 9.2). Owner: A1.
// Prerendered markup works with no JS (<video controls preload="none"> + AV1-first <source>s).
// After hydration the VideoManager takes over: no controls, lazy load, ≤2 decoders, posters under
// MOTION OFF, ▶ PLAY when play() is rejected, FILM UNAVAILABLE on error.
// Bytes (FIXLIST F-002): the <video> carries a transparent 1x1 poster (browsers fetch a real poster
// eagerly); the visible poster is the lazy <picture class="loopvideo-poster">, on every tier, no-JS
// included. The phone variant's sources are prerendered first with media="(max-width: 767px)", so a
// phone never fetches the desktop file. `group` (or a [data-vm-group] ancestor) holds the video and
// its poster until videoManager.release(group).
// Must sit inside a <ViewTitle> whose kind is not 'drawing'.

import { useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import { media, phoneVariant, type MediaEntry, type Src } from '../media/manifest';
import { videoManager, type VideoState } from './VideoManager';
import { CLEAR_POSTER } from './clearPoster';
import { useViewContext, assertLabelled } from './viewContext';
import { MEDIA_STATES } from '../content/copy/chrome';

export interface LoopVideoProps {
  /** Manifest id */
  id: string;
  /**
   * Distinguishes two elements showing the same manifest id (plan-b44 on A-100 and A-105).
   * Registry key becomes `${id}#${instance}`; priority lists still use `id`.
   */
  instance?: string;
  className?: string;
  /**
   * Manifest id used below 768 px. Default: the manifest's phone variant (phoneVariant(id), e.g.
   * 'plan-b40' -> 'plan-b40-m'), prerendered as <source media="(max-width: 767px)"> (video and poster)
   * and aspect-ratio. Pass phoneId={null} to never switch.
   */
  phoneId?: string | null;
  /**
   * Load group (FIXLIST F-002), rendered as data-vm-group on the root: held (no video or poster bytes)
   * until videoManager.release(group). A [data-vm-group] ancestor does the same for every video in it.
   */
  group?: string;
  /** Plays when ≥50% visible (default true). false: only ▶ or videoManager.request(id). */
  autoPlay?: boolean;
  /** Tie-break when the sheet has no manifest priority list (lower first) */
  priority?: number;
  /** Override the sheet whose priority list ranks this video */
  sheet?: string;
  /** Seconds to start from on first load */
  startAt?: number;
  /** Override the manifest alt as the video's aria-label */
  label?: string;
  /** object-fit for the video and poster (default 'cover') */
  fit?: 'cover' | 'contain';
  /** Receives the <video> element */
  videoRef?: Ref<HTMLVideoElement>;
  onState?: (state: VideoState) => void;
}

/** Below this the phone variant is used (matches the CSS phone breakpoint). */
export const PHONE_MEDIA = '(max-width: 767px)';

const CODEC_ORDER = (s: Src) => {
  const t = s.type.toLowerCase();
  if (t.includes('av01') || t.includes('av1')) return 0;
  if (t.includes('webm') || t.includes('vp9') || t.includes('vp09')) return 1;
  return 2; // H.264 / avc1 last
};

export function sortSources(sources: Src[] | undefined): Src[] {
  return [...(sources ?? [])].sort((a, b) => CODEC_ORDER(a) - CODEC_ORDER(b));
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else (ref as { current: T | null }).current = value;
}

export function LoopVideo({
  id,
  instance,
  className,
  phoneId: phoneIdProp,
  autoPlay = true,
  priority,
  sheet,
  startAt,
  label,
  fit = 'cover',
  group,
  videoRef,
  onState,
}: LoopVideoProps) {
  const ctx = useViewContext();
  const key = instance ? `${id}#${instance}` : id;
  const phoneCandidate = phoneIdProp === undefined ? phoneVariant(id) : phoneIdProp;
  const phoneId = phoneCandidate && phoneCandidate !== id ? phoneCandidate : null;
  // the label may differ per variant: switched after hydration (sources and poster never switch in React)
  const [usePhone, setUsePhone] = useState(false);
  const entry: MediaEntry | undefined = media[id];
  const phoneEntry: MediaEntry | undefined = phoneId ? media[phoneId] : undefined;
  const labelEntry = (usePhone && phoneEntry) || entry;
  const rootRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLVideoElement>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  assertLabelled(id, ctx);

  useEffect(() => {
    if (!phoneId || !media[phoneId]) return;
    const mq = window.matchMedia(PHONE_MEDIA);
    let first = true;
    const apply = () => {
      setUsePhone(mq.matches);
      // crossing the breakpoint (rotation, resize): re-run source selection if it already loaded
      if (!first) videoManager.reload(key);
      first = false;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [phoneId, key]);

  useEffect(() => {
    const el = elRef.current;
    if (!el || !entry) return;
    const unregister = videoManager.register(key, el, {
      entry,
      mediaId: id,
      sheet,
      priority,
      autoplay: autoPlay,
      startAt,
      wrapper: rootRef.current,
    });
    const unsub = videoManager.onState(key, (s) => {
      onStateRef.current?.(s);
      ctx?.setStatus(key, s === 'error' ? MEDIA_STATES.filmUnavailable : '');
    });
    return () => {
      unsub();
      unregister();
    };
  }, [key, id, entry, sheet, priority, autoPlay, startAt, ctx]);

  const aria = label ?? labelEntry?.alt ?? '';

  if (!entry) {
    return (
      <div
        ref={rootRef}
        className={`loopvideo loopvideo--missing ${className ?? ''}`}
        data-media-id={id}
        data-vm-group={group}
        data-missing=""
        role="img"
        aria-label={aria || undefined}
      />
    );
  }

  const phone = phoneEntry?.sources?.length ? phoneEntry : undefined;
  const sources: Array<Src & { media?: string }> = [
    ...(phone ? sortSources(phone.sources).map((s) => ({ ...s, media: PHONE_MEDIA })) : []),
    ...sortSources(entry.sources),
  ];
  const style = {
    aspectRatio: 'var(--lv-ar)',
    '--lv-ar-d': `${entry.w} / ${entry.h}`,
    ...(phone ? { '--lv-ar-m': `${phone.w} / ${phone.h}` } : null),
  } as CSSProperties;
  return (
    <div
      ref={rootRef}
      className={`loopvideo loopvideo--${fit} ${className ?? ''}`}
      data-media-id={id}
      data-video-key={key}
      data-vm-group={group}
      data-state="idle"
      style={style}
    >
      <video
        ref={(el) => {
          elRef.current = el;
          assignRef(videoRef, el);
        }}
        muted
        playsInline
        controls
        preload="none"
        poster={CLEAR_POSTER}
        aria-label={aria}
        width={entry.w}
        height={entry.h}
      >
        {sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} media={s.media} />
        ))}
      </video>
      <PosterPicture entry={entry} phone={phone} />
      <button
        type="button"
        className="loopvideo-play cell-button"
        aria-label={`${MEDIA_STATES.playLabelPrefix}${aria}`}
        onClick={() => videoManager.userPlay(key)}
      >
        {MEDIA_STATES.play}
      </button>
    </div>
  );
}

function isAvif(src: string) {
  return /\.avif$/i.test(src);
}

/** The visible poster: lazy, art-directed (phone variant first), AVIF before JPEG. */
function PosterPicture({ entry, phone }: { entry: MediaEntry; phone?: MediaEntry }) {
  const img = entry.posterFallback ?? entry.poster;
  if (!img) return null;
  const modern = (e: MediaEntry) =>
    e.poster && e.posterFallback && e.poster !== e.posterFallback ? e.poster : null;
  const phoneImg = phone ? (phone.posterFallback ?? phone.poster) : undefined;
  const phoneModern = phone ? modern(phone) : null;
  const deskModern = modern(entry);
  return (
    <picture className="loopvideo-poster" aria-hidden="true">
      {phoneModern ? (
        <source media={PHONE_MEDIA} srcSet={phoneModern} type={isAvif(phoneModern) ? 'image/avif' : undefined} />
      ) : null}
      {phoneImg ? <source media={PHONE_MEDIA} srcSet={phoneImg} /> : null}
      {deskModern ? <source srcSet={deskModern} type={isAvif(deskModern) ? 'image/avif' : undefined} /> : null}
      <img src={img} alt="" width={entry.w} height={entry.h} decoding="async" loading="lazy" />
    </picture>
  );
}

export default LoopVideo;
