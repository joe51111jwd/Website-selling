import { useEffect, useRef, useState } from "react";
import { trackCustom } from "../lib/track";

/**
 * Andrew's videos on /book and /demo start by themselves (James, Oct 22: "make that video autoplay"):
 * with sound where the browser allows it (the visitor just clicked through the popup or the calendar),
 * otherwise as a muted preview with "Tap to hear Andrew", the way his Vidalytics videos do. A tap
 * (`hear`) plays it from the start with sound and brings up its controls. iPhone Low Power Mode blocks
 * even a muted start, so there the first tap anywhere on the page starts the preview.
 * `clip` names the video; a new name starts over (the video element is re-keyed by the page).
 */
export function useVideoStart(clip: string) {
  const ref = useRef<HTMLVideoElement>(null);
  const [soundClip, setSoundClip] = useState<string | null>(null);
  const sound = soundClip === clip;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let gone = false;
    const preview = () => {
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute("muted", "");
      return v.play().catch(() => {});
    };
    const kick = () => {
      if (!gone && v.paused && !v.currentTime) void preview();
    };
    const started = () => {
      document.removeEventListener("click", kick, true);
      document.removeEventListener("touchend", kick, true);
    };
    document.addEventListener("click", kick, true);
    document.addEventListener("touchend", kick, true);
    v.addEventListener("playing", started, { once: true });
    v.muted = false;
    v.play().then(
      () => {
        if (gone) return;
        setSoundClip(clip);
        trackCustom("video_autoplay_sound", { video: clip });
      },
      () => {
        if (!gone) void preview();
      },
    );
    return () => {
      gone = true;
      started();
      v.removeEventListener("playing", started);
    };
  }, [clip]);

  /** the "Tap to hear Andrew" button: his voice, from the start */
  const hear = () => {
    const v = ref.current;
    if (!v) return undefined;
    v.muted = false;
    v.loop = false;
    v.currentTime = 0;
    setSoundClip(clip);
    trackCustom("video_sound_on", { video: clip });
    // the muted preview is usually already playing, so no play event follows: the caller marks it
    return v.play();
  };

  return { ref, sound, hear };
}
