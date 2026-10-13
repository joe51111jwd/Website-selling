// The film's controls, like a video player's but in the brand: play / pause, a rail with one tick
// per chapter (its label under it; click to go there, softly), and Skip. After the end the rail
// stays as a quiet scrubber with Replay; after the visitor stepped out (scrolled up, Skip, the
// popup) the play button reads "Resume". Reduced motion: Previous / Next instead (no autoplay).
// Every control is a real button with a visible focus ring.

import { useEffect, useRef } from "react";
import type { Player } from "./player";
import { EASE } from "./player";
import { usePlayer } from "./usePlayer";
import "./controls.css";

export type ControlsCopy = {
  /** accessible name of the control group */
  group: string;
  play: string;
  pause: string;
  resume: string;
  replay: string;
  skip: string;
  prev: string;
  next: string;
  /** accessible name of chapter i's tick ("6:42 AM: Clock-in hits the office.") */
  tick: (i: number) => string;
};

type Props = {
  player: Player;
  copy: ControlsCopy;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onReplay: () => void;
  onChapter: (i: number) => void;
  className?: string;
  /** the text under a tick (default: the chapter's label) */
  tickText?: (i: number) => string;
};

const Icon = ({ kind }: { kind: "play" | "pause" | "replay" | "prev" | "next" }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="plc-ico">
    {kind === "play" && <path d="M6.5 4.2v11.6c0 .6.6.9 1.1.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8c-.5-.3-1.1 0-1.1.6Z" fill="currentColor" />}
    {kind === "pause" && (
      <>
        <rect x="5" y="4" width="3.4" height="12" rx="1" fill="currentColor" />
        <rect x="11.6" y="4" width="3.4" height="12" rx="1" fill="currentColor" />
      </>
    )}
    {kind === "replay" && (
      <path d="M4.5 10a5.5 5.5 0 1 0 1.7-4M4.6 3.6v3.2h3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    )}
    {kind === "prev" && <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />}
    {kind === "next" && <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

/** Each tick's fill runs with the clock through its chapter (a track on the film, no JS per frame). */
function useFills(p: Player, fills: React.RefObject<(HTMLSpanElement | null)[]>) {
  useEffect(() => {
    const offs = p.chapters.map((c, i) => {
      const el = fills.current?.[i];
      if (!el) return () => {};
      return p.track(el, [
        { t: 0, transform: "scaleX(0)" },
        { t: c.start, transform: "scaleX(0)", ease: EASE.linear },
        { t: c.end, transform: "scaleX(1)" },
      ]);
    });
    return () => offs.forEach((f) => f());
  }, [p, fills]);
}

export function Controls({ player: p, copy, onPlay, onPause, onSkip, onReplay, onChapter, className, tickText }: Props) {
  const v = usePlayer(p);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  useFills(p, fills);
  const reduced = p.reduced;
  const playing = v.state === "playing";
  const ended = v.state === "ended";
  const resume = v.state === "paused" && (v.reason === "exit" || v.reason === "skip" || v.reason === "cta" || v.reason === "away");
  const n = p.chapters.length;

  return (
    <div className={`plc${className ? ` ${className}` : ""}`} role="group" aria-label={copy.group} data-state={v.state} data-reason={v.reason ?? ""}>
      {reduced ? (
        <button type="button" className="plc-btn plc-step" onClick={() => onChapter(Math.max(0, v.chapter - 1))} disabled={v.chapter === 0} aria-label={copy.prev} data-cursor="link">
          <Icon kind="prev" />
        </button>
      ) : ended ? (
        <button type="button" className="plc-btn plc-text" onClick={onReplay} data-cursor="link">
          <Icon kind="replay" />
          <span>{copy.replay}</span>
        </button>
      ) : resume ? (
        <button type="button" className="plc-btn plc-text plc-resume" onClick={onPlay} data-cursor="link">
          <Icon kind="play" />
          <span>{copy.resume}</span>
        </button>
      ) : (
        <button
          type="button"
          className="plc-btn plc-play"
          onClick={playing ? onPause : onPlay}
          aria-label={playing ? copy.pause : copy.play}
          data-cursor="link"
        >
          <Icon kind={playing ? "pause" : "play"} />
        </button>
      )}

      <ol className="plc-rail">
        {p.chapters.map((c, i) => (
          <li key={i} className={i === v.chapter ? "is-on" : i < v.chapter ? "is-past" : undefined}>
            <button
              type="button"
              onClick={() => onChapter(i)}
              aria-label={copy.tick(i)}
              aria-current={i === v.chapter ? "step" : undefined}
              data-cursor="view"
              data-cursor-label={c.label}
            >
              <span className="plc-track" aria-hidden="true">
                <span className="plc-fill" ref={(el) => void (fills.current[i] = el)} />
              </span>
              <span className="plc-t" aria-hidden="true">
                {tickText ? tickText(i) : c.label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {reduced ? (
        <button type="button" className="plc-btn plc-step" onClick={() => onChapter(Math.min(n - 1, v.chapter + 1))} disabled={v.chapter === n - 1} aria-label={copy.next} data-cursor="link">
          <Icon kind="next" />
        </button>
      ) : (
        <button type="button" className="plc-btn plc-skip" onClick={onSkip} hidden={ended} data-cursor="link">
          {copy.skip}
        </button>
      )}
    </div>
  );
}
