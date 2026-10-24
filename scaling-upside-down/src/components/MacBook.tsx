import type { ReactNode } from "react";

/**
 * The photographic Space Gray MacBook Pro from the portfolio, split at the hinge. The screen sits
 * under the lid image, which is transparent where the display is.
 */
const FRAME = {
  lid: `${import.meta.env.BASE_URL}media/mbp/lid.webp`,
  base: `${import.meta.env.BASE_URL}media/mbp/base.webp`,
};

export function MacBook({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mac ${className}`}>
      <div className="mac-lid">
        <div className="mac-screen">{children}</div>
        <img className="mac-lid-img" src={FRAME.lid} alt="" draggable={false} />
      </div>
      <img className="mac-base-img" src={FRAME.base} alt="" draggable={false} />
    </div>
  );
}
