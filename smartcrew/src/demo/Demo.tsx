import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "../brand/BrandLogo";
import { track, trackCustom } from "../lib/track";
import { useVideoStart } from "../book/useVideoStart";
import demoUrl from "../book/assets/andrew-demo.mp4";
import demoPoster from "../book/assets/andrew-demo-poster.webp";

// /demo (James, Oct 23: "a demo page with no booking so if we want to send it to people"; "just
// headline subhead vid and call to action at the bottom"). Andrew's demo video, the one on the
// You're Booked page, with no calendar. "Try SmartCrew" goes to the home page's sign-up popup the way
// the SEO pages' buttons do (/?try=<page>), and from there to /book.
// The headline and line are plain wording, not Andrew's own: he can change them.

export default function Demo() {
  const [failed, setFailed] = useState(false);
  const { ref, sound, hear } = useVideoStart("demo_page");

  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    track("ViewContent", { content_name: "Demo page" });
  }, []);

  return (
    <div className="bk dm">
      <header className="bk-bar">
        <a href="../" className="bk-logo" aria-label="SmartCrew, back to the product page">
          <BrandLogo className="bk-logo-img" />
        </a>
      </header>

      <main className="dm-main">
        <section className="bk-intro dm-intro">
          <h1 className="bk-h1">See SmartCrew in action.</h1>
          <p className="bk-sub">Andrew Drish, the founder, walks you through the web app and the mobile app.</p>
        </section>

        <div className="bk-video-slot dm-video">
          <figure className="bk-video" data-testid="demo-video">
            <div className="bk-video-frame">
              <video
                ref={ref}
                className="bk-mp4"
                data-testid="demo-mp4"
                src={demoUrl}
                poster={demoPoster}
                playsInline
                loop={!sound}
                controls={sound}
                preload="metadata"
                onEnded={() => sound && trackCustom("video_ended", { video: "demo_page" })}
                onError={() => setFailed(true)}
              />
              {failed ? (
                <div className="bk-poster" aria-hidden="true">
                  <span className="bk-poster-note">The video didn't load here.</span>
                </div>
              ) : (
                !sound && (
                  <button type="button" className="bk-hear" onClick={() => void hear()?.catch(() => {})} aria-label="Play Andrew’s video with sound">
                    <span className="bk-hear-pill">
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                        <path d="M2.5 6.6h2.6L9 3.4v11.2L5.1 11.4H2.5z" fill="currentColor" />
                        <path d="M11.6 6.2a3.6 3.6 0 0 1 0 5.6M13.6 4.2a6.4 6.4 0 0 1 0 9.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                      Tap to hear Andrew
                    </span>
                  </button>
                )
              )}
            </div>
          </figure>
        </div>

        <p className="dm-cta-row">
          <a className="dm-cta" href="../?try=demo" data-testid="demo-cta" onClick={() => trackCustom("demo_page_cta")}>
            Try SmartCrew
          </a>
        </p>
      </main>
    </div>
  );
}
