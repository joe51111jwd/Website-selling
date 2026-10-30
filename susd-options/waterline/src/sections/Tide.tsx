import { useEffect, useRef, type RefObject } from 'react';
import { COPY, UI } from '../copy';
import { WetText, Words } from '../water/WetText';
import { engine } from '../engine/engine';
import { PARAMS } from '../engine/params';
import { TideController, linesLabel, pathways, peopleLabel, zoneOf, type ZoneKey } from './tide.controller';

const H1_BREAKS = [3, 6]; // desktop: three lines, breaking before words 3 and 6
const H1_PHONE = [2, 3, 4, 6, 7]; // phone: a six-line poster, one or two words a line
// Desktop gauge: a tick at each zone's upper bound; each zone name sits in the middle of its span.
export const GAUGE_TICKS = [1, 3, 7, 12, 14, 39, 40];
export const GAUGE_ZONES: { z: ZoneKey; lo: number; hi: number }[] = [
  { z: 'solopreneur', lo: 1, hi: 1 },
  { z: 'smallTeam', lo: 2, hi: 3 },
  { z: 'valley', lo: 4, hi: 7 },
  { z: 'team', lo: 8, hi: 12 },
  { z: 'threshold', lo: 13, hi: 14 },
  { z: 'graveyard', lo: 15, hi: 39 },
  { z: 'teamOfTeams', lo: 40, hi: 40 },
];
const PHONE_TICKS = [1, 12, 15, 40];
const ZONES = ['solopreneur', 'smallTeam', 'valley', 'team', 'threshold', 'graveyard'] as const;

type StageProps = {
  primary: boolean; // the live hero renders the page's one <h1>
  n: number;
  flood?: boolean;
  ready?: boolean;
  stageRef?: RefObject<HTMLDivElement>;
};

/** The tide stage: the sentence, the water's readout, the zone line, the gauge. */
export function TideStage({ primary, n, flood = false, ready = false, stageRef }: StageProps) {
  const rn = Math.round(n);
  const pw = pathways(rn);
  return (
    <div
      ref={stageRef}
      className="stage tide-stage"
      data-zone={zoneOf(rn)}
      data-red={rn >= 15 ? '1' : '0'}
      data-flood={flood ? '1' : '0'}
      data-ready={ready ? '1' : '0'}
      data-ro={ready ? '1' : '0'}
      data-tagv={ready && rn <= 12 ? '1' : '0'}
    >
      <div className="tide-head">
        <WetText as="p" className="kicker">
          <span className="kicker-author">{UI.byline}</span>
          <span className="kicker-sep"> · </span>
          <span className="kicker-main">{COPY.hero.kicker}</span>
        </WetText>
        <WetText as={primary ? 'h1' : 'p'} id={primary ? 'thesis' : undefined} className="h1" wobble>
          <Words text={COPY.hero.h1} breaks={H1_BREAKS} phoneBreaks={H1_PHONE} />
          <span className="probe" data-probe="" />
        </WetText>
      </div>

      {/* "complexity" rides the surface, right above the numbers that measure it */}
      <span className="surface-tag" data-complexity="" aria-hidden="true">
        <i />
        {COPY.cycle.labels.water}
        <i />
      </span>

      <div className="tide-low">
        <div className="tide-cell tide-info">
          <WetText className="readout">
            <span className="ro-fig">
              <span className="ro-num ro-people" data-slot="people">
                {rn}
              </span>
              <span className="ro-lab" data-slot="people-lab">
                {peopleLabel(rn)}
              </span>
            </span>
            <span className="ro-dot" aria-hidden="true" />
            <span className="ro-fig">
              <span className="ro-num ro-paths" data-slot="paths">
                {pw}
              </span>
              <span className="ro-lab ro-lab-lines" data-slot="paths-lab">
                {linesLabel(pw)}
              </span>
            </span>
          </WetText>
          <div className="slot">
            {ZONES.map((z) => (
              <div className="slot-v zone-v" data-z={z} key={z}>
                <p className="tag">{COPY.zones[z].tag}</p>
                {z === 'threshold' && <p className="breaks">{COPY.tide.breaks}</p>}
                <p className={z === 'threshold' ? 'zline zline-sm' : 'zline'}>{COPY.zones[z].line}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="tide-cell tide-red">
          <WetText as="p" className="redline">
            {COPY.tide.redline}
          </WetText>
          <WetText as="p" className="drowning">
            {COPY.tide.drowning}
          </WetText>
        </div>
      </div>

      {/* The gauge is decorative: the readout repeats what it shows. */}
      <div className="gauge-wrap" aria-hidden="true">
        <WetText className="gauge">
          <span className="g-head">{COPY.hero.gaugeHead}</span>
          <span className="g-line" />
          {/* past twelve: the gauge runs red */}
          <span className="g-red" data-red-seg="" />
          {GAUGE_TICKS.map((t) => (
            <span className={`g-tick g-zone${t === 40 ? ' g-out' : ''}`} data-tick={t} key={t} />
          ))}
          {GAUGE_ZONES.map((s) => (
            <span className={`g-name g-zone g-zname${s.z === 'teamOfTeams' ? ' g-out' : ''}`} data-lo={s.lo} data-hi={s.hi} data-z={s.z} key={s.z}>
              {COPY.zones[s.z].tag}
            </span>
          ))}
          {PHONE_TICKS.map((t) => (
            <span className="g-tick g-num" data-tick={t} key={`p${t}`}>
              <span className="g-val">{t === 40 ? '40+' : t}</span>
            </span>
          ))}
        </WetText>
        <span className="g-marker" data-marker="">
          <i className="g-tri" />
          <b className="g-mval" data-slot="mval">
            {rn}
          </b>
        </span>
      </div>

      <div className="cue" aria-hidden="true">
        {/* phones and tablets: the book's own question, answered by scrolling (desktop: atop the gauge) */}
        <span className="cue-q">{COPY.hero.gaugeHead}</span>
        <span>{COPY.hero.scrollCue}</span>
        <i className="chev" />
      </div>
    </div>
  );
}

/** Collects the stage's elements for a controller. */
export function tideEls(section: HTMLElement, stage: HTMLElement, live: HTMLElement | null) {
  const h1Root = stage.querySelector<HTMLElement>('.h1')!;
  const all = (s: string) => Array.from(stage.querySelectorAll<HTMLElement>(s));
  return {
    section,
    stage,
    h1Root,
    h1Dry: h1Root.querySelector<HTMLElement>('.wt-dry')!,
    h1Wet: h1Root.querySelector<HTMLElement>('.wt-wet')!,
    probe: h1Root.querySelector<HTMLElement>('.wt-dry [data-probe]')!,
    readout: stage.querySelector<HTMLElement>('.readout')!,
    people: all('[data-slot="people"]'),
    peopleLab: all('[data-slot="people-lab"]'),
    paths: all('[data-slot="paths"]'),
    pathsLab: all('[data-slot="paths-lab"]'),
    gauge: stage.querySelector<HTMLElement>('.gauge')!,
    marker: stage.querySelector<HTMLElement>('[data-marker]')!,
    mval: stage.querySelector<HTMLElement>('[data-slot="mval"]')!,
    numTicks: all('.g-num'),
    redSegs: all('[data-red-seg]'),
    znames: all('.g-zname'),
    complexity: stage.querySelector<HTMLElement>('[data-complexity]')!,
    live,
  };
}

/** 01–02 · TIDE: a tall section whose sticky stage is the hero. Scroll is hiring. */
export function Tide() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  const initialN = PARAMS.n ?? 1;

  useEffect(() => {
    const c = new TideController(tideEls(section.current!, stage.current!, live.current), { pinned: PARAMS.n, staticMode: false });
    return engine.addController(c);
  }, []);

  return (
    <section id="tide" className="tide" ref={section} aria-labelledby="thesis">
      <TideStage primary n={initialN} flood={initialN >= 39} ready={PARAMS.n !== null} stageRef={stage} />
      <p className="sr-only" aria-live="polite" ref={live} />
    </section>
  );
}
