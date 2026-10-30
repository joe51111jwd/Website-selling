import { useEffect, useRef, useState, type FormEvent } from 'react';
import { COPY, UI } from '../copy';
import { LINKS } from '../links';
import { BOOTLOADER } from '../bootloader';
import { PARAMS } from '../params';
import { Wheel, type WheelApi } from '../components/Wheel';
import { useStore } from '../state/store';
import { useSeen } from '../hooks/useInView';
import { useReducedMotion, prefersReducedMotion } from '../hooks/useReducedMotion';
import { addTick, wake } from '../motion/loop';
import { Spring } from '../motion/spring';
import { clamp, easeOutCubic } from '../motion/ease';
import { MAX } from '../zones';
import { focusEmail, scrollToId } from '../nav';
import { S } from '../components/Text';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
// SVG path data (geometry, not copy):
const PENCIL = 'M70 9 C 100 8, 116 24, 112 42 C 108 62, 82 73, 56 72 C 28 71, 8 60, 9 40 C 10 20, 32 9, 58 8 C 74 7.5, 88 11, 96 16'; // label (svg path data)
const FILE_ICON = 'M2.5 1.5h10l5 5v16h-15z M12.5 1.5v5h5'; // label (svg path data)
// A real address has something@something.tld (the browser's type=email alone accepts "a@b").
const EMAIL_PATTERN = '[^@\\s]+@[^@\\s]+\\.[^@\\s]+'; // label (regex)

/** 35,445: five digit wheels and a comma, rolling up from 00,000 (1200 ms, wheels finishing right to left 60 ms apart). */
function Odometer({ go }: { go: boolean }) {
  const digits = BOOTLOADER.wordsLabel.replace(/\D/g, '').split('').map(Number); // [3,5,4,4,5]
  const wheels = useRef<(WheelApi | null)[]>([]);
  const rm = useReducedMotion();

  useEffect(() => {
    if (!go) return;
    const count = digits.length;
    // Rightmost spins most, like a real counter.
    const turns = digits.map((_, i) => Math.max(0, i - 1));
    const ends = digits.map((d, i) => d + 10 * turns[i]);
    if (rm) {
      digits.forEach((d, i) => wheels.current[i]?.set(d));
      return;
    }
    const t0 = performance.now();
    const prev = ends.map(() => 0);
    return addTick((dt, now) => {
      let moving = false;
      for (let i = 0; i < count; i++) {
        const fromRight = count - 1 - i;
        const dur = 1200 - 60 * fromRight;
        const p = clamp((now - t0) / dur, 0, 1);
        if (p >= 1) {
          // Settle on a plain angle (rotateX(144deg), not 864deg) with no blur: crisp at any DPR.
          wheels.current[i]?.set(digits[i], 0);
          continue;
        }
        const pos = ends[i] * easeOutCubic(p);
        const speed = Math.abs(pos - prev[i]) / Math.max(dt, 1 / 240);
        prev[i] = pos;
        wheels.current[i]?.set(pos, clamp((speed - 3) * 0.08, 0, 1.6));
        moving = true;
      }
      return moving;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, rm]);

  return (
    <div className="odo" role="img" aria-label={`${BOOTLOADER.wordsLabel} ${COPY.paths.words}`}>
      {digits.map((_, i) => (
        <span key={i} className="odo-slot">
          <Wheel ref={(w) => (wheels.current[i] = w)} faces={DIGITS} className="odo-wheel" />
          {i === 1 && <span className="odo-comma">,</span>}
        </span>
      ))}
    </div>
  );
}

/**
 * The visitor's number in a small printed box, circled in pencil-red when the card enters. Until they
 * set a number it shows "?" and is a way back to the dial (8 is only the hero's example).
 */
function Circled({ go }: { go: boolean }) {
  const n = useStore((s) => s.n);
  const mine = useStore((s) => s.touched);
  const pencil = (
    <svg viewBox="0 0 120 80" className="pencil" aria-hidden="true">
      <path pathLength={1} d={PENCIL} />
    </svg>
  );
  if (!mine)
    return (
      <button type="button" className={`circled is-ask${go ? ' on' : ''}`} onClick={() => scrollToId('top', 'dial-window')} aria-label={COPY.hero.setHint} title={COPY.hero.setHint}>
        <span className="circled-n" aria-hidden="true">
          ?
        </span>
        {pencil}
      </button>
    );
  return (
    <span className={`circled${go ? ' on' : ''}`} aria-hidden="true">
      <span className="circled-n">
        {n}
        {n === MAX ? '+' : ''}
      </span>
      {pencil}
    </span>
  );
}

/** The key: an ink block holding a three-face word drum, GET IT → SENT → YOURS. */
function KeyForm({ cardRef }: { cardRef: React.RefObject<HTMLDivElement> }) {
  const input = useRef<HTMLInputElement>(null);
  const wheel = useRef<WheelApi>(null);
  const spring = useRef(new Spring(0, 300, 26));
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(
    () =>
      addTick((dt) => {
        const m = spring.current.step(dt);
        wheel.current?.set(spring.current.x);
        return m;
      }),
    [],
  );
  const roll = (to: number, instant = false) => {
    if (instant) spring.current.jump(to);
    else spring.current.target = to;
    wake();
  };
  const timers = useRef<number[]>([]);
  // Back from /appendix through the back/forward cache: the key and the field are usable again.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      setBusy(false);
      setPressed(false);
      setMsg('');
      roll(0, true);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const el = input.current!;
    if (!el.checkValidity() || !el.value.trim()) {
      // Nothing typed: ask for it. Something typed that is not an address: ask them to check it.
      setMsg(el.value.trim() ? COPY.paths.badFormat : COPY.paths.badEmail);
      // Keep what they typed and keep focus on the field; shake it in place (2 px, twice, 150 ms).
      el.focus();
      if (!prefersReducedMotion())
        el.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }],
          { duration: 75, iterations: 2, easing: 'linear' },
        );
      return;
    }
    setMsg('');
    setBusy(true);
    const nav = () => {
      if (!PARAMS.nonav) window.location.assign(LINKS.get);
    };
    const later = (f: () => void, ms: number) => timers.current.push(window.setTimeout(f, ms));
    if (prefersReducedMotion()) {
      roll(2, true);
      later(nav, 300);
      return;
    }
    // ~1.3 s: press (90 ms) → SENT (300 ms spring) → +250 ms YOURS, card brightens 3% → +400 ms go.
    setPressed(true);
    later(() => roll(1), 90);
    later(() => {
      roll(2);
      const card = cardRef.current;
      card?.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.03)' }, { filter: 'brightness(1)' }], { duration: 240, easing: 'ease-out' });
    }, 90 + 300 + 250);
    later(() => setPressed(false), 90 + 300 + 250 + 200);
    later(nav, 90 + 300 + 250 + 400);
  };

  return (
    <form className="optin" noValidate onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="email">
        {COPY.paths.email}
      </label>
      <input
        ref={input}
        className="email"
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        pattern={EMAIL_PATTERN}
        placeholder={COPY.paths.placeholder}
        disabled={busy}
        aria-invalid={msg ? true : undefined}
        aria-describedby="form-msg"
        onInput={() => msg && setMsg('')}
      />
      <button type="submit" className={`key${pressed ? ' pressed' : ''}${busy ? ' done' : ''}`} disabled={busy} aria-label={UI.keySr}>
        <Wheel ref={wheel} faces={COPY.paths.key} dir={1} className="key-drum" />
      </button>
      <p className="form-msg" id="form-msg" aria-live="polite">
        {msg}
      </p>
    </form>
  );
}

/** A typographic jacket: SCALING, then UP- / SIDE- / DOWN in the three inks, flush left, with the title's hyphens. */
function Cover() {
  return (
    <div className="cover" aria-hidden="true">
      <span className="cover-scaling">{UI.coverScaling}</span>
      <span className="cover-w cw-up">
        {UI.upFace}
        <i className="cw-hy" />
      </span>
      <span className="cover-w cw-side">
        {UI.sideFace}
        <i className="cw-hy" />
      </span>
      <span className="cover-w cw-down">{UI.downFace}</span>
      <span className="cover-author">{COPY.paths.bookAuthor}</span>
    </div>
  );
}

export function Paths() {
  const boot = useRef<HTMLDivElement>(null);
  const seen = useSeen(boot, 0.35);
  return (
    <section id="paths" className="paths" aria-labelledby="paths-h">
      <p className="paths-mark" aria-hidden="true">
        <span>{UI.pathsKicker}</span>
      </p>
      <h2 id="paths-h" className="paths-h" tabIndex={-1}>
        <S>{COPY.paths.heading}</S>
      </h2>
      <div className="cards">
        <div className="card card-boot" ref={boot}>
          <p className="kick">{UI.bootloaderKicker}</p>
          <div className="file">
            <svg viewBox="0 0 20 24" className="file-ico" aria-hidden="true">
              <path d={FILE_ICON} />
            </svg>
            <div>
              <p className="file-name">{COPY.paths.fileName}</p>
              {/* Date, then the assistants: on a narrow card the line breaks at the dot, never mid-list. */}
              <p className="file-meta">
                {COPY.paths.fileLine.split(' · ').map((part, i) => (
                  <span key={i} className="fm-part">
                    {i > 0 && (
                      <i className="dot" aria-hidden="true">
                        ·
                      </i>
                    )}
                    {part}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <div className="count">
            <Odometer go={seen} />
            <p className="count-label">{COPY.paths.words}</p>
          </div>
          <p className="ref">
            <S>{COPY.paths.refLine}</S>
          </p>
          <div className="ask">
            <p className="ask-label">{COPY.paths.firstAsk}</p>
            <div className="ask-row">
              <p className="ask-q">{COPY.paths.firstQuestion}</p>
              <Circled go={seen} />
            </div>
          </div>
          <p className="howto">
            {COPY.paths.upload} {COPY.paths.locate}
          </p>
          <KeyForm cardRef={boot} />
          <a className="appendix hit44" href={LINKS.appendix}>
            {COPY.paths.appendix}
            <span className="appx-note">
              <i className="dot" aria-hidden="true">
                ·
              </i>
              {UI.appendixNote}
            </span>
          </a>
        </div>

        <div className="card card-book">
          <p className="kick">{UI.bookKicker}</p>
          <Cover />
          <p className="book-title sr-only">
            {COPY.paths.bookTitle} · {COPY.paths.bookAuthor}
          </p>
          <p className="book-line">
            <S>{COPY.paths.bookLine}</S>
          </p>
          {LINKS.preorder ? (
            <a className="pill pill-ink" href={LINKS.preorder}>
              {UI.preorderLive}
            </a>
          ) : (
            <>
              <button type="button" className="pill pill-ink is-off" aria-disabled="true">
                {COPY.paths.preorder}
              </button>
              {/* The book's live next step today: a real button, not a footnote. */}
              <a className="pill pill-ink-solid meanwhile" href="#email" onClick={focusEmail}>
                {COPY.paths.meanwhile}
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
