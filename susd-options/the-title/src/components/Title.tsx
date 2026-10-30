import { useEffect, useRef } from 'react';
import { COPY } from '../copy';
import { TitleEngine, type TitleConfig, type WordKey } from './titleEngine';
import { fontsReady } from '../hooks/fonts';
import { registerLight } from '../hooks/light';

const KEYS: WordKey[] = ['up', 'side', 'down'];

interface Props {
  config: TitleConfig;
  className?: string;
  /** called once the engine has measured and fitted */
  onEngine: (e: TitleEngine) => void;
  /** pointer handler on the big UP word (section 02) */
  upHandlers?: React.HTMLAttributes<HTMLSpanElement>;
}

/** The visual title. Always aria-hidden: the accessible name lives in real text elsewhere. */
export function Title({ config, className, onEngine, upHandlers }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLDivElement>(null);
  const words = useRef<Record<string, HTMLSpanElement | null>>({});
  const faces = useRef<Record<string, HTMLSpanElement | null>>({});
  const hy = useRef<(HTMLSpanElement | null)[]>([]);
  const hyFace = useRef<(HTMLSpanElement | null)[]>([]);
  const jobs = useRef<(HTMLSpanElement | null)[]>([]);
  const uls = useRef<(HTMLSpanElement | null)[]>([]);
  const cfgRef = useRef(config);
  cfgRef.current = config;
  const cb = useRef(onEngine);
  cb.current = onEngine;

  useEffect(() => {
    let engine: TitleEngine | null = null;
    let dead = false;
    const unlight = root.current ? registerLight(root.current) : () => {};
    fontsReady().then(() => {
      if (dead || !root.current || !ink.current) return;
      engine = new TitleEngine(
        {
          root: root.current,
          ink: ink.current,
          words: { up: words.current.up!, side: words.current.side!, down: words.current.down! },
          faces: { up: faces.current.up!, side: faces.current.side!, down: faces.current.down! },
          hy: [hy.current[0]!, hy.current[1]!],
          hyFace: [hyFace.current[0]!, hyFace.current[1]!],
          jobs: jobs.current.filter(Boolean) as HTMLElement[],
          uls: uls.current.filter(Boolean) as HTMLElement[],
        },
        cfgRef.current,
      );
      root.current.classList.add('is-ready');
      cb.current(engine);
    });
    return () => {
      dead = true;
      unlight();
      engine?.destroy();
    };
  }, []);

  return (
    <div className={`title title--${config.layout} ${className ?? ''}`} ref={root} aria-hidden="true">
      <div className="title-ink" ref={ink}>
        {KEYS.map((k, i) => (
          <span key={k} className={`tw tw-${k}`} ref={(el) => (words.current[k] = el)} {...(k === 'up' ? upHandlers : {})}>
            <span className="tf" ref={(el) => (faces.current[k] = el)}>
              {COPY.hero.words[i]}
            </span>
          </span>
        ))}
        {[0, 1].map((n) => (
          <span key={n} className="hy" ref={(el) => (hy.current[n] = el)}>
            <span className="hyf" ref={(el) => (hyFace.current[n] = el)} />
          </span>
        ))}
      </div>
      {config.jobs &&
        COPY.hero.jobs.map((line, n) => (
          <span key={n} className={`job job-${KEYS[n]}`} ref={(el) => (jobs.current[n] = el)}>
            <span className="jt">{line}</span>
            <span className="ul" ref={(el) => (uls.current[n] = el)} />
          </span>
        ))}
    </div>
  );
}
