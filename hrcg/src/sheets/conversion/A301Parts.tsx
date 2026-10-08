// A-301 parts (brief 3.11): Materials (five 1:1 crops with keynote numerals), Keynotes, KitComposer.
// Owner: A6. Hovering or focusing a crop underlines its keynote rows (150 ms); on phones a tap
// does the same, and the tapped crop's keynote titles print under the row. No leader lines.

import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { ViewTitle } from '../../chrome/ViewTitle';
import { LabelText } from '../../chrome/LabelText';
import { Picture } from '../../system/Picture';
import { CHALLENGES } from '../../content/challenges';
import { SPONSORS } from '../../content/copy/conversion';
import { buildMailto } from '../../lib/mailto';
import { Chip, SendBlock } from './FormParts';

/** Media ids of the five crops, in order (MAT 01 … MAT 05) */
const MAT_IDS = ['mat-1', 'mat-2', 'mat-3', 'mat-4', 'mat-5'] as const;

/**
 * A keynote numeral drawn as a ruled square. The text is the brief's "[1]" (copy, lint and screen
 * readers read it); on screen the square stands in for the brackets and the numeral is drawn by CSS
 * from data-n, with empty alternative text so assistive tech doesn't read it twice.
 */
export function KeynoteMark({ n, active = false, hidden = true }: { n: number; active?: boolean; hidden?: boolean }) {
  return (
    <span
      className={`keynote-mark num${active ? ' is-active' : ''}`}
      data-n={n}
      aria-hidden={hidden ? true : undefined}
    >
      <span className="sr-only">{`[${n}]`}</span>
    </span>
  );
}

/** 'MAT 02 · BOARD AND FIXINGS' -> ['MAT 02', ' · ', 'BOARD AND FIXINGS'] (textContent unchanged) */
function splitLabel(label: string): [string, string, string] {
  const i = label.indexOf(' · ');
  return i < 0 ? [label, '', ''] : [label.slice(0, i), ' · ', label.slice(i + 3)];
}

export function Materials({
  active,
  setActive,
}: {
  active: number | null;
  setActive: (i: number | null) => void;
}) {
  // F-057: a touch tap must leave its crop active. The compat focus event activates the crop
  // before the click, so the click may only toggle it off if it was already active when the finger
  // went down. Hover is real mouse hover only (pointerType), never the emulated mouseenter.
  const down = useRef<{ i: number; was: boolean } | null>(null);
  const isMouse = (e: PointerEvent) => e.pointerType === 'mouse';
  const current = active === null ? null : SPONSORS.materials[active];
  return (
    <ViewTitle id="a301-materials" className="materials" frame={false}>
      <ol className="materials-list">
        {SPONSORS.materials.map((m, i) => {
          const ids = m.keynotes.map((n) => `keynote-${n}`).join(' ');
          const on = active === i;
          const [no, sep, name] = splitLabel(m.label);
          return (
            <li key={m.label} className={`material${on ? ' is-active' : ''}`}>
              <button
                type="button"
                className="material-button"
                aria-describedby={ids}
                onPointerEnter={(e) => {
                  if (isMouse(e)) setActive(i);
                }}
                onPointerLeave={(e) => {
                  if (isMouse(e)) setActive(null);
                }}
                onPointerDown={() => {
                  down.current = { i, was: on };
                }}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => {
                  const d = down.current;
                  down.current = null;
                  // pointer: decided by the state before the pointer went down; keyboard: a toggle
                  const was = d && d.i === i ? d.was : on;
                  setActive(was ? null : i);
                }}
              >
                <span className="material-frame">
                  <Picture id={MAT_IDS[i]!} className="material-picture" sizes="(min-width: 768px) 18vw, 20vw" />
                </span>
                <span className="material-meta">
                  <span className="material-label t-label">
                    <span className="material-no">
                      <LabelText text={no} />
                    </span>
                    <span className="material-name">
                      {sep}
                      {name}
                    </span>
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
      {/* phones: the tapped crop's name and keynote titles, under the five-up row (F-056, F-057) */}
      <p className="materials-readout t-label" aria-hidden="true">
        {current ? (
          <>
            <span className="materials-readout-name">
              <LabelText text={current.label} />
            </span>
            {current.keynotes.map((n) => (
              <span key={n} className="materials-readout-key">
                <KeynoteMark n={n} active />
                {SPONSORS.keynotes.find((k) => k.n === n)?.title}
              </span>
            ))}
          </>
        ) : null}
      </p>
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
