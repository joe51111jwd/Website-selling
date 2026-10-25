import { useEffect, useRef } from "react";
import type { SiteCopy } from "../copy";
import { lenis } from "../lenis";
import { Announcer } from "./Announcer";
import { CopyButton } from "./CopyButton";

/** open the use notice from anywhere; focus goes back to `trigger` when it closes */
export const openNotice = (trigger?: HTMLElement | null) => window.dispatchEvent(new CustomEvent("susd:notice", { detail: trigger ?? null }));

export function NoticeDialog({ copy }: { copy: SiteCopy["ending"]["notice"] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const open = (e: Event) => {
      const d = ref.current;
      if (!d || d.open) return;
      back.current = (e as CustomEvent<HTMLElement | null>).detail ?? (document.activeElement as HTMLElement | null);
      d.showModal();
      d.querySelector<HTMLElement>(".notice-body")?.scrollTo(0, 0);
      lenis?.stop();
    };
    window.addEventListener("susd:notice", open);
    return () => window.removeEventListener("susd:notice", open);
  }, []);

  const onClose = () => {
    lenis?.start();
    back.current?.focus({ preventScroll: true });
  };

  return (
    <dialog
      ref={ref}
      id="use-notice"
      className="notice-dlg"
      aria-labelledby="notice-title"
      onClose={onClose}
      // the dialog box is filled by .notice-in, so a click on the dialog itself is a click on the backdrop
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
    >
      <div className="notice-in">
        <header className="notice-head">
          <h2 id="notice-title">{copy.title}</h2>
          <button type="button" className="notice-x" onClick={() => ref.current?.close()}>
            Close
          </button>
        </header>
        <div className="notice-body" data-lenis-prevent tabIndex={0} role="region" aria-labelledby="notice-title">
          <div className="notice-cols">
            {copy.paragraphs.map((p) => (p.startsWith("## ") ? <h3 key={p}>{p.slice(3)}</h3> : <p key={p.slice(0, 40)}>{p}</p>))}
          </div>
        </div>
        <footer className="notice-foot">
          <CopyButton source="notice" size="md" again={false} />
          <Announcer />
        </footer>
      </div>
    </dialog>
  );
}
