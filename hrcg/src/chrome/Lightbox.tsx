// THE SET lightbox (brief 3.13): <dialog aria-label="The Set, a 30-second concept film">,
// data-lenis-prevent. Rendered only if the manifest has 'the-set-169'. On demand only: the video
// gets its sources when the dialog opens. Captions: a WebVTT <track> when the manifest entry's
// `meta` points at a .vtt file. Owner: A1.

import { useEffect, useRef } from 'react';
import { Dialog } from './Dialog';
import { overlays, useOverlay } from './overlays';
import { THE_SET } from '../content/copy/chrome';
import { THE_SET_TITLE } from '../content/viewTitles';
import { media } from '../media/manifest';
import { sortSources } from '../system/LoopVideo';
import { LabelText } from './LabelText';

export function Lightbox() {
  const entry = media['the-set-169'];
  const open = useOverlay() === 'the-set';
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (open) {
      v.preload = 'auto';
      v.load();
    } else {
      v.pause();
    }
  }, [open]);

  if (!entry) return null;
  const vtt = entry.meta && entry.meta.endsWith('.vtt') ? entry.meta : null;
  return (
    <Dialog id="the-set" className="set-dialog" label={THE_SET.dialogLabel}>
      <div className="set-panel">
        <p className="set-title t-label">
          <LabelText text={THE_SET_TITLE} />
        </p>
        <video
          ref={ref}
          className="set-video"
          controls
          playsInline
          preload="none"
          poster={entry.poster}
          aria-label={THE_SET.posterAlt}
          width={entry.w}
          height={entry.h}
        >
          {sortSources(entry.sources).map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
          {vtt ? <track kind="captions" src={vtt} srcLang="en" label="English" default /> : null}
        </video>
        <button type="button" className="cell-button set-close" onClick={() => overlays.close()}>
          {THE_SET.close}
        </button>
      </div>
    </Dialog>
  );
}

export default Lightbox;
