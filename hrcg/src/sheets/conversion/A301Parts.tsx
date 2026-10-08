// A-301 parts (brief 3.11): Materials (five 1:1 crops with keynote numerals), Keynotes, KitComposer.
// Owner: A6. Hovering or focusing a crop underlines its keynote rows (150 ms); on phones a tap
// does the same. No leader lines.

import { useMemo, useState } from 'react';
import { ViewTitle } from '../../chrome/ViewTitle';
import { LabelText } from '../../chrome/LabelText';
import { Picture } from '../../system/Picture';
import { CHALLENGES } from '../../content/challenges';
import { SPONSORS } from '../../content/copy/conversion';
import { buildMailto } from '../../lib/mailto';
import { Chip, SendBlock } from './FormParts';

/** Media ids of the five crops, in order (MAT 01 … MAT 05) */
const MAT_IDS = ['mat-1', 'mat-2', 'mat-3', 'mat-4', 'mat-5'] as const;

export function KeynoteMark({ n, active = false, hidden = true }: { n: number; active?: boolean; hidden?: boolean }) {
  return (
    <span className={`keynote-mark num${active ? ' is-active' : ''}`} aria-hidden={hidden ? true : undefined}>
      {n}
    </span>
  );
}

export function Materials({
  active,
  setActive,
}: {
  active: number | null;
  setActive: (i: number | null) => void;
}) {
  return (
    <ViewTitle id="a301-materials" className="materials" frame={false}>
      <ol className="materials-list">
        {SPONSORS.materials.map((m, i) => {
          const ids = m.keynotes.map((n) => `keynote-${n}`).join(' ');
          const on = active === i;
          return (
            <li key={m.label} className={`material${on ? ' is-active' : ''}`}>
              <button
                type="button"
                className="material-button"
                aria-describedby={ids}
                aria-pressed={on}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(on ? null : i)}
              >
                <span className="material-frame">
                  <Picture id={MAT_IDS[i]!} className="material-picture" sizes="(min-width: 768px) 18vw, 120px" />
                </span>
                <span className="material-meta">
                  <span className="material-label t-label">
                    <LabelText text={m.label} />
                  </span>
                  <span className="material-keys">
                    {m.keynotes.map((n) => (
                      <KeynoteMark key={n} n={n} active={on} />
                    ))}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </ViewTitle>
  );
}

export function Keynotes({ lit }: { lit: ReadonlySet<number> }) {
  return (
    <div className="keynotes">
      <p className="keynotes-title t-label">{SPONSORS.keynotesTitle}</p>
      <ol className="keynotes-list">
        {SPONSORS.keynotes.map((k) => {
          const on = lit.has(k.n);
          return (
            <li key={k.n} id={`keynote-${k.n}`} className={`keynote${on ? ' is-lit' : ''}`}>
              <KeynoteMark n={k.n} active={on} hidden={false} />
              <p className="keynote-text">
                <span className="keynote-title t-label">{k.title}</span>
                <span className="keynote-sep" aria-hidden="true">
                  {' — '}
                </span>
                <span className="keynote-body">{k.text}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

interface ComposerState {
  company: string;
  make: string;
  bring: ReadonlySet<string>;
  challenges: ReadonlySet<number>;
  also: ReadonlySet<string>;
}

const EMPTY: ComposerState = {
  company: '',
  make: '',
  bring: new Set(),
  challenges: new Set(),
  also: new Set(),
};

function toggled<T>(set: ReadonlySet<T>, v: T, on: boolean): Set<T> {
  const next = new Set(set);
  if (on) next.add(v);
  else next.delete(v);
  return next;
}

export function KitComposer({ labelledBy }: { labelledBy: string }) {
  const [s, setS] = useState<ComposerState>(EMPTY);
  const href = useMemo(
    () =>
      buildMailto('sponsors', {
        company: s.company,
        make: s.make,
        bring: [...s.bring],
        challenges: [...s.challenges],
        also: [...s.also],
      }),
    [s],
  );
  const f = SPONSORS.fields;
  return (
    <div className="rfi composer" role="form" aria-labelledby={labelledBy}>
      <div className="rfi-row">
        <label className="rfi-label t-label" htmlFor="kit-company">
          {f.company.label}
        </label>
        <input
          id="kit-company"
          className="rfi-input t-input"
          type="text"
          autoComplete="organization"
          placeholder={f.company.placeholder}
          value={s.company}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setS((p) => ({ ...p, company: v }));
          }}
        />
      </div>
      <div className="rfi-row">
        <label className="rfi-label t-label" htmlFor="kit-make">
          {f.make.label}
        </label>
        <input
          id="kit-make"
          className="rfi-input t-input"
          type="text"
          autoComplete="off"
          placeholder={f.make.placeholder}
          value={s.make}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setS((p) => ({ ...p, make: v }));
          }}
        />
      </div>
      <fieldset className="rfi-row rfi-row--chips">
        <legend className="rfi-label t-label">{f.bring.label}</legend>
        <div className="rfi-field chips">
          {SPONSORS.bring.map((c) => (
            <Chip
              key={c.key}
              id={`kit-bring-${c.key}`}
              checked={s.bring.has(c.key)}
              onChange={(on) => setS((p) => ({ ...p, bring: toggled(p.bring, c.key, on) }))}
            >
              <span className="chip-name">{c.chip}</span>
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="rfi-row rfi-row--chips">
        <legend className="rfi-label t-label">{f.challenge.label}</legend>
        <div className="rfi-field chips chips--bays">
          {CHALLENGES.map((c) => (
            <Chip
              key={c.no}
              id={`kit-ch-${c.num}`}
              bay
              checked={s.challenges.has(c.no)}
              onChange={(on) => setS((p) => ({ ...p, challenges: toggled(p.challenges, c.no, on) }))}
            >
              <span className="chip-num num">{c.num}</span>
              <span className="chip-name">{c.upper}</span>
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="rfi-row rfi-row--chips">
        <legend className="rfi-label t-label">{f.also.label}</legend>
        <div className="rfi-field chips chips--wide">
          {SPONSORS.also.map((c) => (
            <Chip
              key={c.key}
              id={`kit-also-${c.key}`}
              checked={s.also.has(c.key)}
              onChange={(on) => setS((p) => ({ ...p, also: toggled(p.also, c.key, on) }))}
            >
              <span className="chip-name">{c.chip}</span>
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="rfi-row rfi-row--send">
        <span className="rfi-label" aria-hidden="true" />
        <SendBlock id="kit" href={href} label={SPONSORS.button} />
      </div>
    </div>
  );
}
