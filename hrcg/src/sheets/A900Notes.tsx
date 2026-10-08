// A-900 · GENERAL NOTES and close (brief 3.12), on gypsum paper: six notes, the imagery notes keyed
// like a dataset README, the roll-call, the email, the end line, and the full-width title block that
// holds the in-page drawing index (<nav id="index">, the no-JS target of INDEX). Owner: A6.

import './conversion/conversion.css';
import { SheetTag } from '../chrome/SheetTag';
import { HASNT_HAPPENED } from '../content/viewTitles';
import { NOTES } from '../content/copy/conversion';
import { Contact, FooterBlock, ImageryNotes, Notes, RollCall } from './conversion/A900Parts';
import { usePrintIn } from './conversion/usePrintIn';

export function A900Notes() {
  const printIn = usePrintIn('A-900');
  return (
    <div className="conv conv--a900">
      <div className="sheet-inner conv-head">
        <SheetTag id="A-900" />
      </div>
      <div className="sheet-inner a900-body">
        <h2 className="conv-h2 t-h2-statement">{NOTES.h2}</h2>
        <div className={`a900-notes ${printIn}`}>
          <Notes />
        </div>
        <ImageryNotes />
        <RollCall />
        <Contact />
        <p className="end-line">{HASNT_HAPPENED}</p>
      </div>
      <div className="sheet-inner">
        <FooterBlock />
      </div>
    </div>
  );
}

export default A900Notes;
