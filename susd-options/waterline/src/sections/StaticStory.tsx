import { useEffect, useRef } from 'react';
import { engine, type Controller } from '../engine/engine';
import { TideController } from './tide.controller';
import { TideStage, tideEls } from './Tide';
import { TurnLine } from './Turn';

// The turn's end state: the line above the water, which is only a strip at the block's foot.
const TURN_END_STATIC = 0.84;
import { CycleController, CycleStage, cycleEls } from './Cycle';
import { lapEndP } from './cycle.timeline';
import { UI } from '../copy';

/** A block with its own fixed water level (reduced motion: no scroll-scrubbed motion at all). */
function useStatic(make: () => Controller) {
  useEffect(() => engine.addController(make()), []); // eslint-disable-line react-hooks/exhaustive-deps
}

function fracLevel(block: HTMLElement, frac: number): Controller {
  return {
    measure: () => {
      block.dataset.level = String(frac * block.offsetHeight);
    },
    start: () => 0,
    update: () => undefined,
    target: () => 0,
  };
}

function TideBlock({ n, primary, name }: { n: number; primary: boolean; name: string }) {
  const block = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useStatic(() => new TideController(tideEls(block.current!, stage.current!, null), { pinned: n, staticMode: true, block: block.current }));
  return (
    <section className="block" data-block={name} ref={block} aria-labelledby={primary ? 'thesis' : undefined} aria-label={primary ? undefined : UI.tide}>
      <div className="block-water" aria-hidden="true" />
      <TideStage primary={primary} n={n} flood={n >= 39} ready stageRef={stage} />
    </section>
  );
}

function TurnBlock() {
  const block = useRef<HTMLElement>(null);
  useStatic(() => fracLevel(block.current!, TURN_END_STATIC));
  return (
    <section className="block" data-block="turn" ref={block} aria-labelledby="turn-title">
      <div className="block-water" aria-hidden="true" />
      <div className="stage turn-stage">
        <div className="turn-pos turn-pos-static">
          <TurnLine id="turn-title" />
        </div>
      </div>
    </section>
  );
}

function CycleBlock({ fixed }: { fixed: 'end' | 'oxygen' }) {
  const block = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useStatic(() => new CycleController(cycleEls(block.current!, stage.current!), fixed === 'end' ? lapEndP(3) : 1, block.current));
  return (
    <section className="block" data-block={`cycle-${fixed}`} ref={block} aria-label={UI.cycleLabel}>
      <div className="block-water" aria-hidden="true" />
      <CycleStage stageRef={stage} fixed={fixed} />
    </section>
  );
}

/** prefers-reduced-motion: the sticky sequences become stacked end states. */
export function StaticStory() {
  return (
    <>
      <TideBlock n={8} primary name="hero" />
      <TideBlock n={13} primary={false} name="n13" />
      <TideBlock n={39} primary={false} name="flood" />
      <TurnBlock />
      <CycleBlock fixed="end" />
      <CycleBlock fixed="oxygen" />
    </>
  );
}
