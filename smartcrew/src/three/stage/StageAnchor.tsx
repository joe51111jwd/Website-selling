// A box in the DOM the Stage fits the devices into. Layout it with CSS like any element; keep it
// free of transforms (the Stage measures it once per layout, not per frame). Inside a pinned
// <Scene>, the Stage follows its sticky stage; elsewhere it scrolls with the page.

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { registerAnchor } from "./store";

export type StageAnchorProps = {
  id: string;
  className?: string;
  style?: CSSProperties;
  /**
   * A still of what the Stage draws here (public/renders/…, rendered from the Stage itself). It
   * shows until the 3D is ready, and stays when WebGL is missing or too slow. `frame` must match
   * the poses' frame so the still lines up with the 3D ([6, 4] by default); `pad` is the margin
   * the still was rendered with around the frame, as a fraction of the frame.
   */
  poster?: { src: string; frame?: [number, number]; pad?: number; alt?: string };
  children?: ReactNode;
};

export function StageAnchor({ id, className, style, poster, children }: StageAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => registerAnchor(id, ref.current!), [id]);
  const [fw, fh] = poster?.frame ?? [6, 4];
  const pad = poster?.pad ?? 0;
  return (
    <div ref={ref} data-stage-anchor={id} className={`stage-anchor${className ? ` ${className}` : ""}`} style={style}>
      {poster && (
        <div className="stage-poster" style={{ ["--fa" as string]: fw / fh, ["--pad" as string]: pad }}>
          <img src={import.meta.env.BASE_URL + poster.src} alt={poster.alt ?? ""} decoding="async" />
        </div>
      )}
      {children}
    </div>
  );
}
