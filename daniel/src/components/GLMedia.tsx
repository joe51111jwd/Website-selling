import { useEffect, useRef, type HTMLAttributes } from "react";
import type { Media } from "../content/work";
import { stage, type Plane, type PlaneOptions } from "../lib/gl/stage";

type Props = HTMLAttributes<HTMLDivElement> & {
  media: Media;
  options?: PlaneOptions;
  eager?: boolean;
  onPlane?: (plane: Plane | null) => void;
};

/**
 * A picture or film drawn by the WebGL stage. The <img> underneath holds the
 * layout and the alt text, and shows on its own if WebGL isn't there.
 */
export function GLMedia({ media, options, eager, onPlane, className, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !stage.enabled) return;
    const plane = stage.track(el, media, options);
    onPlane?.(plane);
    return () => {
      onPlane?.(null);
      plane.dispose();
    };
    // options are read once; the plane lives as long as the media does
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.src]);

  const still = media.kind === "video" ? media.poster : media.src;
  return (
    <div ref={ref} className={`media${className ? ` ${className}` : ""}`} {...rest}>
      {media.kind === "video" && !stage.enabled ? (
        <video src={media.src} poster={media.poster} muted loop playsInline autoPlay aria-label={media.alt} />
      ) : (
        <img src={still} alt={media.alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} />
      )}
    </div>
  );
}
