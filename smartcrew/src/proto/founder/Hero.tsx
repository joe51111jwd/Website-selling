import { T, type Angle, HERO, type OpenSignup } from "./copy";
import { ScreenCrop } from "./Screen";
import { Pin } from "./Pin";
import { DemoLink, Micro, TrialButton, UsedBy } from "./ui";
import job from "./assets/photo-job.webp";

// Crop of the real project screen: job name, the info grid and the revenue / expenses / profit row.
const CROP = { x: 146, y: 112, w: 624, h: 352 };
const at = (px: number, py: number) => ({ left: `${((px - CROP.x) / CROP.w) * 100}%`, top: `${((py - CROP.y) / CROP.h) * 100}%` });

export function Hero({ angle, open }: { angle: Angle; open: OpenSignup }) {
  const c = HERO[angle];
  return (
    <section className="f-hero" id="top" aria-labelledby="f-h1" data-sec="hero">
      <div className="f-wrap f-hero-grid">
        <div className="f-hero-copy">
          <p className="f-eyebrow">
            <span>
              For dirt work contractors with <span className="f-nw">{T.SIZE} employees</span>
            </span>
          </p>
          <h1 id="f-h1" className={`f-h1${c.h1.length > 46 ? " f-h1-long" : ""}`}>
            {c.h1}
          </h1>
          <p className="f-hero-sub">{c.sub}</p>
          <div className="f-hero-cta" data-pair-end>
            <TrialButton id="f-hero-cta" open={open} source="hero" className="f-btn-lg" />
            <DemoLink open={open} source="hero" />
          </div>
          <Micro />
          <UsedBy className="f-hero-logos" />
        </div>

        <figure className="f-hero-visual">
          <div className="f-hero-photo">
            <img src={job} alt="An excavator operator digging a utility trench" width={1440} height={1080} fetchPriority="high" />
          </div>
          <div className="f-hero-ui">
            <ScreenCrop id="web-project-detail" {...CROP} label="SmartCrew project screen for one job, with its revenue, expenses and profit" />
            <Pin {...at(756, 437)} label="Profit on this job, updated daily" dir="ne" len={36} className="f-pin-flip-sm" />
          </div>
          <figcaption className="f-caption f-hero-caption">Demo account. Names and numbers are made up.</figcaption>
        </figure>
      </div>
    </section>
  );
}
