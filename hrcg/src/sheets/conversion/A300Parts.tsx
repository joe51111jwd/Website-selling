// A-300 parts (brief 3.10): StandIn (the diptych), RfiForm (RFI-001) and ControlTarget (T7).
// Owner: A6. State (platform, ticked challenges) lives in A300Teams and is shared with the bay.

import { useEffect, useMemo, useState } from 'react';
import { ViewTitle } from '../../chrome/ViewTitle';
import { LabelText } from '../../chrome/LabelText';
import { Picture } from '../../system/Picture';
import { CHALLENGES } from '../../content/challenges';
import { T7, TEAMS } from '../../content/copy/conversion';
import { media, loadJson } from '../../media/manifest';
import { buildMailto } from '../../lib/mailto';
import { BayPlate } from './BaySlot';
import { Chip, SendBlock } from './FormParts';

// ------------------------------------------------------------------------------------- StandIn

export function StandIn({ platform, ready }: { platform: string; ready: ReadonlySet<number> }) {
  return (
    <div className="diptych">
      <div className="diptych-col">
        <ViewTitle id="a300-detail07" className="diptych-view">
          <Picture id="ref21-portrait" className="diptych-picture" sizes="(min-width: 768px) 50vw, 100vw" />
        </ViewTitle>
        <p className="diptych-word t-diptych">{TEAMS.diptychLeft}</p>
      </div>
      <div className="diptych-col">
        <ViewTitle id="a300-empty-bay" className="diptych-view">
          <BayPlate platform={platform} ready={ready} sizes="(min-width: 768px) 50vw, 100vw" />
        </ViewTitle>
        <p className="diptych-word t-diptych">{TEAMS.diptychRight}</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------- RfiForm

export interface TeamsState {
  team: string;
  platform: string;
  ready: ReadonlySet<number>;
  needs: string;
}

export function RfiForm({
  state,
  set,
}: {
  state: TeamsState;
  set: (patch: Partial<TeamsState>) => void;
}) {
  const href = useMemo(
    () =>
      buildMailto('teams', {
        team: state.team,
        platform: state.platform,
        challenges: [...state.ready],
        needs: state.needs,
      }),
    [state],
  );
  const f = TEAMS.fields;
  const toggle = (no: number, on: boolean) => {
    const next = new Set(state.ready);
    if (on) next.add(no);
    else next.delete(no);
    set({ ready: next });
  };
  return (
    <div className="rfi" role="form" aria-labelledby="rfi-001-title">
      <p className="rfi-head t-label" id="rfi-001-title">
        <LabelText text={TEAMS.formHeader} />
      </p>
      <div className="rfi-row">
        <label className="rfi-label t-label" htmlFor="rfi-team">
          {f.team.label}
        </label>
        <input
          id="rfi-team"
          className="rfi-input t-input"
          type="text"
          autoComplete="organization"
          placeholder={f.team.placeholder}
          value={state.team}
          onChange={(e) => set({ team: e.currentTarget.value })}
        />
      </div>
      <div className="rfi-row">
        <label className="rfi-label t-label" htmlFor="rfi-platform">
          <LabelText text={f.platform.label} />
        </label>
        <input
          id="rfi-platform"
          className="rfi-input t-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={f.platform.placeholder}
          value={state.platform}
          onChange={(e) => set({ platform: e.currentTarget.value })}
        />
      </div>
      <fieldset className="rfi-row rfi-row--chips" aria-describedby="rfi-challenges-help">
        <legend className="rfi-label t-label">
          <LabelText text={f.challenges.label} />
        </legend>
        <div className="rfi-field">
          <div className="chips chips--bays">
            {CHALLENGES.map((c) => (
              <Chip
                key={c.no}
                id={`rfi-ch-${c.num}`}
                bay
                checked={state.ready.has(c.no)}
                onChange={(on) => toggle(c.no, on)}
              >
                <span className="chip-num num">{c.num}</span>
                <span className="chip-name">{c.upper}</span>
              </Chip>
            ))}
          </div>
          <p className="rfi-help" id="rfi-challenges-help">
            {f.challenges.helper}
          </p>
        </div>
      </fieldset>
      <div className="rfi-row">
        <label className="rfi-label t-label" htmlFor="rfi-needs">
          <LabelText text={f.needs.label} />
        </label>
        <textarea
          id="rfi-needs"
          className="rfi-input rfi-textarea t-input"
          rows={2}
          placeholder={f.needs.placeholder}
          value={state.needs}
          onChange={(e) => set({ needs: e.currentTarget.value })}
        />
      </div>
      <div className="rfi-row rfi-row--send">
        <span className="rfi-label" aria-hidden="true" />
        <SendBlock id="rfi" href={href} label={TEAMS.button} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------- T7

interface Proof {
  mock?: boolean;
  smallestDetectedPx?: number | null;
}

/** The measured proof width, only when the pipeline has really measured it (never a placeholder). */
function useProofWidth(): number | null {
  const [px, setPx] = useState<number | null>(null);
  useEffect(() => {
    if (!media['t7-proof-json']) return;
    let alive = true;
    loadJson<Proof>('t7-proof-json')
      .then((p) => {
        if (!alive || !p || p.mock) return;
        const v = p.smallestDetectedPx;
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) setPx(Math.round(v));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return px;
}

function src(id: string): string | null {
  return media[id]?.sources?.[0]?.src ?? null;
}

export function ControlTarget() {
  const proofPx = useProofWidth();
  const t7 = src('t7-brick');
  const proof = media['t7-proof'];
  const downloads: Array<[string, string]> = [
    ['kit-t7-letter', T7.letter],
    ['kit-t7-a4', T7.a4],
    ['kit-t7-svg', T7.svg],
  ];
  return (
    <div className="t7">
      <p className="t7-label t-label">
        <LabelText text={T7.label} />
      </p>
      <div className="t7-target">
        {t7 ? (
          <img
            className="t7-img"
            src={t7}
            alt={T7.alt}
            width={media['t7-brick']!.w}
            height={media['t7-brick']!.h}
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
      <div className="t7-text">
        <h3 id="t7-h3" className="t7-h3">
          {T7.h3}
        </h3>
        <p className="t7-body t-body">{T7.body}</p>
        <p className="t7-note t-label">{T7.note}</p>
      </div>
      <ul className="t7-downloads">
        {downloads.map(([id, label]) => {
          const href = src(id);
          if (!href) return null;
          return (
            <li key={id}>
              <a className="cell-button t7-download" href={href} download>
                <LabelText text={label} />
              </a>
            </li>
          );
        })}
      </ul>
      {proofPx !== null && proof?.sources?.length ? (
        <figure className="t7-proof">
          <img
            className="t7-proof-img"
            src={proof.sources[proof.sources.length - 1]!.src}
            alt={T7.proofAlt}
            width={proof.w}
            height={proof.h}
            loading="lazy"
            decoding="async"
          />
          <figcaption className="t7-proof-label t-label">
            {T7.proofBefore}
            <span className="num">{proofPx}</span>
            {T7.proofAfter}
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}
