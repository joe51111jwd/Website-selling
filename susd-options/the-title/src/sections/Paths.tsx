import { useRef, useState } from 'react';
import { COPY } from '../copy';
import { LINKS } from '../links';
import { BOOTLOADER } from '../bootloader';
import { prefersReduced } from '../hooks/useReducedMotion';
import { Sentences } from '../components/Lines';

const params = new URLSearchParams(window.location.search);
const NONAV = params.has('nonav');

/** The typographic cover: SCALING, then UP- / SIDE- / DOWN stacked in the three inks with the two hyphen
 *  blocks at the row ends (the title is the argument, so the cover keeps its hyphens), SIDE nudged right. */
function Cover() {
  const [up, side, down] = COPY.hero.words;
  return (
    <div className="cover" aria-hidden="true">
      <span className="cover-scaling caps">{COPY.hero.scaling}</span>
      <span className="cover-words">
        <span className="cw-row">
          <span className="cw relief-sm relief--up">{up}</span>
          <span className="lh cw-hy" />
        </span>
        <span className="cw-row cw-row--side">
          <span className="cw relief-sm relief--side">{side}</span>
          <span className="lh cw-hy" />
        </span>
        <span className="cw-row">
          <span className="cw relief-sm relief--down">{down}</span>
        </span>
      </span>
      <span className="cover-author">{COPY.paths.bookAuthor}</span>
    </div>
  );
}

/** The file as a stack of sheets. The top sheet shows the file's real first lines, faint, with line numbers. */
function FileStack({ stamped }: { stamped: boolean }) {
  return (
    <div className={`sheets ${stamped ? 'is-stamped' : ''}`} aria-hidden="true">
      <span className="sheet sheet-3" />
      <span className="sheet sheet-2" />
      <span className="sheet sheet-1">
        <span className="file-top">
          <span className="file-name">{BOOTLOADER.file}</span>
          <span className="file-meta tnum">{COPY.paths.fileMeta}</span>
        </span>
        <span className="file-body">
          <span className="file-face">
            {COPY.paths.fileFace.map((line, i) => (
              <span key={i} className={`fl ${line.startsWith('#') ? 'fl-h' : ''}`}>
                <span className="fl-n tnum">{i + 1}</span>
                <span className="fl-t">{line}</span>
              </span>
            ))}
          </span>
          {/* UP-SIDE-DOWN, hyphens included, stamped on the sheet's blank lines 3-5 (never over text) */}
          <span className="stamp-row">
            {COPY.hero.words.map((w, i) => (
              <span key={w} className="stamp-unit">
                {i > 0 && <span className={`stamp-h stamp-h-${i}`} />}
                <span className={`stamp-w stamp-w-${i}`}>{w}</span>
              </span>
            ))}
          </span>
        </span>
        <span className="stamp">{COPY.paths.stamp}</span>
      </span>
    </div>
  );
}

export function Paths() {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [pressed, setPressed] = useState(false);

  const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const el = input.current;
    if (!el || busy) return;
    if (!el.checkValidity() || !el.value.trim()) {
      setMsgOk(false);
      setMsg(el.value.trim() ? COPY.paths.checkEmail : COPY.paths.badEmail);
      el.focus();
      if (!prefersReduced()) {
        el.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(2px)' },
            { transform: 'translateX(-2px)' },
            { transform: 'translateX(2px)' },
            { transform: 'translateX(-2px)' },
            { transform: 'translateX(0)' },
          ],
          { duration: 150 },
        );
      }
      return;
    }
    setBusy(true);
    // what happens next was said before the click (the note under the field); now it is happening
    setMsgOk(true);
    setMsg(COPY.paths.next);
    const go = () => {
      if (!NONAV) window.location.assign(LINKS.get);
    };
    if (prefersReduced()) {
      setStamped(true);
      window.setTimeout(go, 300);
      return;
    }
    // press (90 ms) -> the face fades, UP-SIDE-DOWN stamped across the sheet (5 beats of 60 ms) -> "Yours" lands -> hold -> go
    setPressed(true);
    window.setTimeout(() => setStamped(true), 90);
    window.setTimeout(go, 90 + 360 + 180 + 270 + 400);
  };

  const preorder = LINKS.preorder ? (
    <a className="pill pill--line pill--lg" href={LINKS.preorder}>
      {COPY.paths.preorderLive}
    </a>
  ) : (
    <button type="button" className="pill pill--line pill--lg is-dim" aria-disabled="true" onClick={(e) => e.preventDefault()}>
      {COPY.paths.preorder}
    </button>
  );

  // One grid with shared rows, so the two paths line up across:
  //   head / object / line (the promise of the book; the first question of the file) / sub (who wrote it; how
  //   the file is used) / action (pre-order; the form) / next (the Appendix online; free, where it works, what next).
  // Phone and tablet: both heads first (M L4497, in order), then the file and its form, then the book.
  const note = msg ? (
    <span className={`form-note-msg ${msgOk ? 'is-ok' : 'is-err'}`}>{msg}</span>
  ) : (
    <span className="form-note-next">{COPY.paths.confirmNext}</span>
  );
  return (
    <section id="paths" className="paths" aria-labelledby="paths-h">
      <h2 id="paths-h" className="sr-only">
        {COPY.rail.book} · {COPY.rail.get}
      </h2>
      <div className="paths-grid">
        <h3 className="path-head path-head--book" id="book">
          {COPY.paths.bookHead}
        </h3>
        <div className="path-obj path-obj--book">
          <Cover />
        </div>
        <p className="sr-only">
          {COPY.paths.bookTitle} · {COPY.paths.bookAuthor}
        </p>
        <p className="path-line path-line--book">
          <Sentences text={COPY.paths.bookLine} />
        </p>
        <p className="path-sub path-sub--book">{COPY.paths.author}</p>
        <div className="path-act path-act--book">{preorder}</div>
        <a className="text-link path-more" href={LINKS.appendix}>
          {COPY.paths.bookMore}
        </a>

        <h3 className="path-head path-head--file">{COPY.paths.fileHead}</h3>
        <div className="path-obj path-obj--file">
          <FileStack stamped={stamped} />
        </div>
        <p className="sr-only">
          {BOOTLOADER.file} · {COPY.paths.fileMeta}
        </p>
        {/* the hook before the ask: what the file does first */}
        <p className="path-line path-line--file file-q">
          <span className="file-q-label">{COPY.paths.firstQLabel}</span>{' '}
          <span className="file-q-text">“{COPY.paths.firstQ}”</span>
        </p>
        <p className="path-sub path-sub--file">
          <span className="sent">{COPY.paths.upload}</span>{' '}
          <span className="sent">{COPY.paths.locate}</span>
        </p>
        <form className={`get-form path-act path-act--file ${pressed ? 'is-pressed' : ''}`} noValidate onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="email">
            {COPY.paths.email}
          </label>
          <input
            ref={input}
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={COPY.paths.placeholder}
            disabled={busy}
            aria-invalid={msg && !msgOk ? true : undefined}
            aria-describedby="form-msg file-note"
            onInput={() => {
              if (msg && !msgOk) setMsg('');
            }}
          />
          <button type="submit" className="submit" disabled={busy}>
            {COPY.paths.submit}
          </button>
          {/* one reserved line: what happens next (before the click), the error, or "opening" (after) */}
          <p className={`form-msg ${msg ? (msgOk ? 'is-ok' : 'is-err') : ''}`} id="form-msg" aria-live="polite">
            {note}
          </p>
        </form>
        <p className="file-tools caps" id="file-note">
          {COPY.paths.aiTools}
        </p>
      </div>
    </section>
  );
}
