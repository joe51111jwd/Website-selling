// A-900 · GENERAL NOTES and close (brief 3.12, H-6, H-7), on gypsum paper: six notes printed open in
// two ruled columns, the imagery notes keyed like a dataset README, the roll-call, the email, the end
// line with the two CTA cells. The full-width title block that holds the in-page drawing index
// (<nav id="index">, the no-JS target of INDEX) follows as the page footer (App.tsx, F-066). Owner: A6.

import './conversion/conversion.css';
import { SheetTag } from '../chrome/SheetTag';
import { NOTES } from '../content/copy/conversion';
import { Close, Contact, ImageryNotes, Notes, RollCall } from './conversion/A900Parts';
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
        <Close />
      </div>
      {/* the title block (FooterBlock, A900Parts) is the page's <footer>, rendered by the shell right
          after </main> (F-066 / F-100) */}
    </div>
  );
}

export default A900Notes;
