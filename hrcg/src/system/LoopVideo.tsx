// <LoopVideo id="plan-b40" className? /> (brief 8.5, 9.2). Owner: A1.
// Prerendered markup works with no JS (<video controls preload="none" poster> + AV1-first
// <source>s). After hydration the VideoManager takes over: no controls, lazy load, ≤2 decoders,
// posters under MOTION OFF, ▶ PLAY when play() is rejected, FILM UNAVAILABLE on error.
// Must sit inside a <ViewTitle> whose kind is not 'drawing'.

import { useEffect, useRef, useState, type Ref } from 'react';
import { media, phoneVariant, type MediaEntry, type Src } from '../media/manifest';
import { videoManager, type VideoState } from './VideoManager';
import { useViewContext, assertLabelled } from './viewContext';
import { MEDIA_STATES } from '../content/copy/chrome';

export interface LoopVideoProps {
  /** Manifest id */
  id: string;
  className?: string;
  /**
   * Manifest id used below 768 px. Default: the manifest's phone variant (phoneVariant(id), e.g.
   * 'plan-b40' -> 'plan-b40-m'), chosen after hydration. Pass phoneId={null} to never switch.
   */
  phoneId?: string | null;
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
  className,
  phoneId: phoneIdProp,
  autoPlay = true,
  priority,
  sheet,
  startAt,
  label,
  fit = 'cover',
  videoRef,
  onState,
}: LoopVideoProps) {
  const ctx = useViewContext();
  const phoneCandidate = phoneIdProp === undefined ? phoneVariant(id) : phoneIdProp;
  const phoneId = phoneCandidate && phoneCandidate !== id ? phoneCandidate : null;
  const [usePhone, setUsePhone] = useState(false);
  const activeId = usePhone && phoneId ? phoneId : id;
  const entry: MediaEntry | undefined = media[activeId] ?? media[id];
  const rootRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLVideoElement>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  assertLabelled(id, ctx);

  useEffect(() => {
    if (!phoneId) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setUsePhone(mq.matches && !!media[phoneId]);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [phoneId]);

  useEffect(() => {
    const el = elRef.current;
    if (!el || !entry) return;
    const unregister = videoManager.register(id, el, {
      entry,
      sheet,
      priority,
      autoplay: autoPlay,
      startAt,
      wrapper: rootRef.current,
    });
    const unsub = videoManager.onState(id, (s) => {
      onStateRef.current?.(s);
      ctx?.setStatus(id, s === 'error' ? MEDIA_STATES.filmUnavailable : '');
    });
    return () => {
      unsub();
      unregister();
    };
    // re-register when the source set changes (phone variant)
  }, [id, activeId, entry, sheet, priority, autoPlay, startAt, ctx]);

  const aria = label ?? entry?.alt ?? '';

  if (!entry) {
    return (
      <div
        ref={rootRef}
        className={`loopvideo loopvideo--missing ${className ?? ''}`}
        data-media-id={id}
        data-missing=""
        role="img"
        aria-label={aria || undefined}
      />
    );
  }

  const sources = sortSources(entry.sources);
  return (
    <div
      ref={rootRef}
      className={`loopvideo loopvideo--${fit} ${className ?? ''}`}
      data-media-id={id}
      data-state="idle"
      style={{ aspectRatio: `${entry.w} / ${entry.h}` }}
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
        poster={entry.posterFallback ?? entry.poster}
        aria-label={aria}
        width={entry.w}
        height={entry.h}
      >
        {sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
      {entry.poster || entry.posterFallback ? (
        <picture className="loopvideo-poster" aria-hidden="true">
          {entry.poster && entry.posterFallback && entry.poster !== entry.posterFallback ? (
            <source srcSet={entry.poster} type={/\.avif$/i.test(entry.poster) ? 'image/avif' : undefined} />
          ) : null}
          <img
            src={entry.posterFallback ?? entry.poster}
            alt=""
            width={entry.w}
            height={entry.h}
            decoding="async"
            loading="lazy"
          />
        </picture>
      ) : null}
      <button
        type="button"
        className="loopvideo-play cell-button"
        aria-label={`${MEDIA_STATES.playLabelPrefix}${aria}`}
        onClick={() => videoManager.userPlay(id)}
      >
        {MEDIA_STATES.play}
      </button>
    </div>
  );
}

export default LoopVideo;
