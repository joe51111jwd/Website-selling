// THE SET lightbox (brief 3.13): <dialog aria-label="The Set, a 30-second concept film">,
// data-lenis-prevent. Rendered only if the manifest has 'the-set-169'. On demand only: the video
// gets its poster and sources when the dialog opens (FIXLIST F-002: no poster bytes at first paint).
// Captions (F-020): a WebVTT <track> from the manifest entry's `captions`; a <details> transcript
// under the video fetches `transcript` the first time it opens. The video's name is THE_SET.videoLabel;
// posterAlt describes the poster only. Owner: A1.

import { useEffect, useRef, useState } from 'react';
import { Dialog } from './Dialog';
import { overlays, useOverlay } from './overlays';
import { THE_SET } from '../content/copy/chrome';
import { THE_SET_TITLE } from '../content/viewTitles';
import { media } from '../media/manifest';
import { sortSources } from '../system/LoopVideo';
import { LabelText } from './LabelText';

type Transcript = { state: 'idle' | 'loading' | 'ready' | 'error'; text: string };

/**
 * The transcript file is hard-wrapped plain text: blank lines between sections, a sheet heading
 * ("A-100 · THE FIVE BAYS") on a section's first line, "- " list lines. Re-flow it for any width.
 */
export function transcriptBlocks(text: string): Array<{ heading: boolean; text: string }> {
  const out: Array<{ heading: boolean; text: string }> = [];
  for (const para of text.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (/^(A-\d{3}\b|THE SET\b)/.test(lines[0]!)) out.push({ heading: true, text: lines.shift()! });
    let cur: string[] = [];
    const flush = () => {
      if (cur.length) out.push({ heading: false, text: cur.join(' ') });
      cur = [];
    };
    for (const l of lines) {
      if (l.startsWith('- ')) flush();
      cur.push(l);
    }
    flush();
  }
  return out;
}

export function Lightbox() {
  const entry = media['the-set-169'];
  const open = useOverlay() === 'the-set';
  const ref = useRef<HTMLVideoElement>(null);
  // once opened, the poster stays (no refetch, no flash on the next open)
  const [armed, setArmed] = useState(false);
  const [tx, setTx] = useState<Transcript>({ state: 'idle', text: '' });

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (open) {
      setArmed(true);
      v.preload = 'auto';
      v.load();
    } else {
      v.pause();
    }
  }, [open]);

  if (!entry) return null;
  const vtt = entry.captions ?? null;
  const transcriptUrl = entry.transcript ?? null;
  const poster = armed ? (entry.posterFallback ?? entry.poster) : undefined;

  const loadTranscript = () => {
    if (!transcriptUrl || tx.state === 'loading' || tx.state === 'ready') return;
    setTx({ state: 'loading', text: '' });
    fetch(transcriptUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => setTx({ state: 'ready', text }))
      .catch(() => setTx({ state: 'error', text: '' }));
  };

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
          poster={poster}
          aria-label={THE_SET.videoLabel}
          width={entry.w}
          height={entry.h}
        >
          {sortSources(entry.sources).map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
          {/* a default track is fetched eagerly, so it mounts with the poster on first open */}
          {vtt && armed ? <track kind="captions" src={vtt} srcLang="en" label="English" default /> : null}
        </video>
        {transcriptUrl ? (
          <details
            className="set-transcript"
            onToggle={(e) => {
              if ((e.currentTarget as HTMLDetailsElement).open) loadTranscript();
            }}
          >
            <summary className="t-label">{THE_SET.transcript}</summary>
            <div className="set-transcript-body" aria-busy={tx.state === 'loading' || undefined}>
              {tx.state === 'ready' ? (
                transcriptBlocks(tx.text).map((b, i) => (
                  <p key={i} className={b.heading ? 'set-transcript-h t-label' : undefined}>
                    {b.text}
                  </p>
                ))
              ) : tx.state === 'error' ? (
                <p>
                  <a href={transcriptUrl}>{THE_SET.transcriptFile}</a>
                </p>
              ) : null}
            </div>
          </details>
        ) : null}
        <button type="button" className="cell-button set-close" onClick={() => overlays.close()}>
          {THE_SET.close}
        </button>
      </div>
    </Dialog>
  );
}

export default Lightbox;
