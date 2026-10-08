// A-300 · FOR TEAMS (brief 3.10): the stand-in diptych, RFI-001 on gypsum paper with the bay column
// sticky beside it (the phone gets a 64 px sticky mini-slot instead), then control target T7 back on
// the slab. Owner: A6. No network request is ever made: the button is a real mailto.

import { useCallback, useState } from 'react';
import './conversion/conversion.css';
import { SheetTag } from '../chrome/SheetTag';
import { ViewTitle } from '../chrome/ViewTitle';
import { TEAMS } from '../content/copy/conversion';
import { BayPlate, MiniSlot, type Crop } from './conversion/BaySlot';
import { ControlTarget, RfiForm, StandIn, type TeamsState } from './conversion/A300Parts';
import { usePrintIn } from './conversion/usePrintIn';

/** The sticky column's detail of the bay: the slot, the READY FOR line and the plan around them. */
const SLOT_DETAIL: Crop = [0.13, 0.4, 0.87, 0.95];

const INITIAL: TeamsState = { team: '', platform: '', ready: new Set<number>(), needs: '' };

export function A300Teams() {
  const [state, setState] = useState<TeamsState>(INITIAL);
  const set = useCallback((patch: Partial<TeamsState>) => setState((s) => ({ ...s, ...patch })), []);
  const printIn = usePrintIn('A-300');

  return (
    <div className="conv conv--a300">
      <div className="sheet-inner conv-head">
        <SheetTag id="A-300" />
      </div>

      <div className="sheet-inner">
        <StandIn platform={state.platform} ready={state.ready} />
        <p className={`standin-note t-lead ${printIn}`}>{TEAMS.standIn}</p>
      </div>

      <div className="rfi-paper" data-ground="gypsum">
        <div className="sheet-inner">
          <h2 className="conv-h2 t-h2-statement t-upper">{TEAMS.h2}</h2>
          <div className="rfi-grid">
            <div className="rfi-baycol">
              <ViewTitle id="a300-empty-bay" className="rfi-bay-view">
                <BayPlate platform={state.platform} ready={state.ready} crop={SLOT_DETAIL} sizes="40vw" />
              </ViewTitle>
            </div>
            <div className="rfi-formcol">
              <p className={`rfi-lead t-lead ${printIn}`}>{TEAMS.lead}</p>
              <p className={`rfi-body t-body ${printIn}`}>{TEAMS.body}</p>
              <MiniSlot platform={state.platform} ready={state.ready} />
              <RfiForm state={state} set={set} />
            </div>
          </div>
        </div>
      </div>

      <div className="sheet-inner">
        <ControlTarget />
      </div>
    </div>
  );
}

export default A300Teams;
