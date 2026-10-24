import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { views, type View } from "../content";
import { fontsReady } from "../cover";
import type { BookScene } from "../book3d";
import { Reveal } from "./ui";

/*
  "Take a closer look." The real 3D hardcover: pick a view on the left and the book turns to it, or
  drag it around. three.js loads with this section, so the hero doesn't wait on it.
*/

export function CloserLook() {
  const [view, setView] = useState<View>("front");
  const [failed, setFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<BookScene | null>(null);
  const inView = useInView(stage, { margin: "200px 0px" });
  const live = useRef({ view, inView });
  live.current = { view, inView };

  useEffect(() => {
    let gone = false;
    Promise.all([fontsReady(), import("../book3d")])
      .then(([, mod]) => {
        if (gone || !canvas.current) return;
        const s = mod.createBook(canvas.current);
        s.setView(live.current.view);
        s.setActive(live.current.inView);
        scene.current = s;
      })
      .catch(() => setFailed(true));
    return () => {
      gone = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => scene.current?.setView(view), [view]);
  useEffect(() => scene.current?.setActive(inView), [inView]);

  return (
    <section className="section closer" aria-label="Take a closer look">
      <div className="wrap">
        <Reveal>
          <h2 className="headline-left">Take a closer look.</h2>
        </Reveal>
      </div>
      <div className="wrap-wide">
        <div className="closer-panel">
          <div className="closer-list" role="radiogroup" aria-label="View">
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={view === v.id}
                className={`closer-opt${view === v.id ? " is-on" : ""}`}
                onClick={() => setView(v.id)}
              >
                <span className="closer-ico" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                {v.label}
              </button>
            ))}
          </div>
          <div className="closer-stage" ref={stage}>
            {failed ? (
              <p className="closer-fallback">The 3D view needs WebGL.</p>
            ) : (
              <canvas ref={canvas} className="closer-canvas" aria-label="A 3D model of the hardcover book. Drag to turn it." />
            )}
          </div>
        </div>
        <p className="closer-note">Drag to turn the book. Cover art is a placeholder until the final jacket.</p>
      </div>
    </section>
  );
}
