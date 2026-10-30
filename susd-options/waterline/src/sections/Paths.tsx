import { useEffect, useRef, useState, type FormEvent } from 'react';
import { COPY, UI } from '../copy';
import { LINKS } from '../links';
import { engine, type Controller, type Frame } from '../engine/engine';
import { PARAMS } from '../engine/params';
import { measureBox, type SectionBox } from '../hooks/useScrollProgress';

const P = COPY.paths;
const [TITLE_A, TITLE_B] = [P.bookTitle.split(' ')[0], P.bookTitle.split(' ').slice(1).join(' ')]; // "Scaling" / "Up-Side-Down"
const STACK = TITLE_B.split('-'); // Up / Side / Down
const META = P.fileMeta.split(' · '); // V16 / October 2026 / 35,445 words

/** The water stands 72 px under the section's bottom edge: a calm strip, like a dock, that runs on under the footer. */
class PathsController implements Controller {
  box: SectionBox = { top: 0, height: 1 };
  constructor(private section: HTMLElement) {}
  start() {
    return this.box.top;
  }
  measure(scrollY: number) {
    this.box = measureBox(this.section, scrollY);
  }
  target(f: Frame) {
    const m = engine.model;
    m.level.k = 260;
    m.level.c = 32; // a stiffer spring: the strip stays attached to the section while scrolling
    return this.box.top + this.box.height - f.scrollY - 72;
  }
  update() {}
}

export function BookCover() {
  return (
    <div className="cover" role="img" aria-label={`${P.bookTitle}, ${P.bookAuthor}`}>
      <span className="cover-spine" />
      <span className="cover-title">{TITLE_A}</span>
      <span className="cover-stack">
        <span className="c-up">{STACK[0]}-</span>
        <span className="c-side">{STACK[1]}-</span>
        <span className="c-down">{STACK[2]}</span>
      </span>
      <span className="cover-rule" />
      <span className="cover-author">{P.bookAuthor}</span>
    </div>
  );
}

function FileStack({ done }: { done: boolean }) {
  return (
    <div className="file" data-done={done ? '1' : '0'}>
      <span className="sheet s3" />
      <span className="sheet s2" />
      <div className="sheet s1">
        <div className="file-top">
          <p className="file-name">{P.fileName}</p>
          <p className="file-meta">
            {META.map((m, i) => (
              <span key={m}>
                {i > 0 && <i aria-hidden="true">·</i>}
                {m}
              </span>
            ))}
          </p>
        </div>
        {/* The file's real first lines (BL 1–8), the way the .md opens. */}
        <div className="file-face" aria-hidden="true">
          {P.fileFace.map((l) => (
            <p className="ff-h" key={l}>
              {l}
            </p>
          ))}
          <p className="ff-p">
            <b>{P.fileLead}</b> {P.fileRest}
          </p>
        </div>
        <div className="file-foot" aria-hidden="true">
          <span>{UI.fileKind}</span>
          <span className="file-free">{UI.free}</span>
        </div>
        <div className="stamp-wrap" aria-hidden={!done}>
          <p className="stamp" aria-hidden="true">
            {P.stamp}
          </p>
          <span className="sr-only">{UI.yoursAria}</span>
          <p className="closed">{P.closed}</p>
          <p className="leaving">{P.leaving}</p>
        </div>
      </div>
    </div>
  );
}

/** 05 · TWO PATHS: the book, and the Bootloader as a file. Getting the file drains the page dry. */
export function Paths({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduced) return;
    return engine.addController(new PathsController(section.current!));
  }, [reduced]);

  useEffect(() => {
    if (done) document.documentElement.dataset.drained = '1';
  }, [done]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const el = input.current!;
    if (!el.checkValidity() || !el.value.trim()) {
      setMsg(el.value.trim() ? P.checkEmail : P.badEmail);
      el.focus();
      if (!reduced) {
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
      }
      return;
    }
    setMsg('');
    setBusy(true);
    // Phones: bring the file into view so the stamp lands where the visitor is looking.
    // The drain starts once that scroll has settled, so the water never sits on the moving form.
    let wait = 0;
    const file = section.current?.querySelector<HTMLElement>('.file');
    if (file) {
      const r = file.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        engine.scrollTo(r.top + window.scrollY - Math.max(16, (window.innerHeight - r.height) / 2 - 60), reduced);
        wait = reduced ? 0 : 380;
      }
    }
    const go = () => {
      if (!PARAMS.nonav) window.location.assign(LINKS.get);
    };
    if (reduced) {
      engine.drain(() => undefined);
      setDone(true);
      window.setTimeout(go, 300);
      return;
    }
    window.setTimeout(() => {
      engine.drain(() => {
        setDone(true);
        window.setTimeout(go, 180 + 300);
      });
    }, wait);
  };

  return (
    <section id="paths" className="paths" ref={section} aria-labelledby="paths-title" data-done={done ? '1' : '0'}>
      <h2 id="paths-title" className="sr-only">
        {UI.pathsLabel}
      </h2>
      {/* One line, two halves (M L234): each sentence heads its own column on desktop. */}
      <p className="paths-lede">
        <span className="lede-a">{P.bookHead}</span> <span className="lede-b">{P.fileHead}</span>
      </p>
      <div className="paths-grid">
        <div className="path path-file" role="group" aria-label={P.fileName}>
          <div className="path-obj">
            <FileStack done={done} />
          </div>
          <div className="path-note">
            <p className="path-kick">{P.worksWith}</p>
            <p className="upload">{P.upload}</p>
          </div>
          <div className="path-cta">
            <form className="optin" noValidate onSubmit={submit} data-bad={msg ? '1' : '0'}>
              <label className="sr-only" htmlFor="email">
                {P.email}
              </label>
              <input
                ref={input}
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder={P.placeholder}
                disabled={busy}
                aria-describedby="form-msg"
                aria-invalid={msg ? true : undefined}
                onInput={() => msg && setMsg('')}
              />
              <button type="submit" className="btn btn-ink btn-get" disabled={busy}>
                {P.submit}
              </button>
              <p className="form-msg" id="form-msg" aria-live="polite">
                {msg}
              </p>
            </form>
            <a className="appendix" href={LINKS.appendix}>
              {P.appendix}
            </a>
          </div>
        </div>

        <div className="path path-book" role="group" aria-label={P.bookTitle}>
          <div className="path-obj">
            <BookCover />
          </div>
          <div className="path-note" />
          <div className="path-cta">
            {LINKS.preorder ? (
              <a className="btn btn-ink" href={LINKS.preorder}>
                {UI.preorderLink}
              </a>
            ) : (
              <button type="button" className="btn btn-soon" aria-disabled="true">
                {P.preorder}
              </button>
            )}
          </div>
        </div>
      </div>
      {reduced && <div className="paths-strip" aria-hidden="true" />}
    </section>
  );
}
