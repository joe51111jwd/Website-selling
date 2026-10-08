// Shared conversion parts (brief 3.10, 3.11, 3.13, 5.4). Owner: A6.
// - <Chip>: a labelled checkbox drawn as a ruled cell; checked fills slab-black with gypsum text,
//   and a bay-yellow inner rule when it stands for a bay (the five challenge chips).
// - <SendBlock>: the real mailto <a> (works with no JS), its fine print, the after-click line and
//   the alternate path "Or email … [Copy address]".
// - <CopyButton>: Copy address -> Copied (+ "Address copied." live) / select the address and
//   "Press Ctrl+C or ⌘C to copy". Hidden with no JS (brief 10.4).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CONTACT_EMAIL } from '../../content/config';
import { COPY, SEND } from '../../content/copy/conversion';
import { announce } from '../../system/announce';
import { copyText } from '../../lib/clipboard';
import { buildMailto } from '../../lib/mailto';

const PLAIN_MAILTO = buildMailto('plain');

export interface ChipProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label (and the start of the accessible name) */
  children: ReactNode;
  /** The chip stands for a bay: bay-yellow inner rule when checked */
  bay?: boolean;
  className?: string;
}

export function Chip({ id, checked, onChange, children, bay = false, className }: ChipProps) {
  return (
    <label className={`chip${bay ? ' chip--bay' : ''}${checked ? ' is-checked' : ''} ${className ?? ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="chip-input"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span className="chip-face">{children}</span>
    </label>
  );
}

type CopyState = 'idle' | 'copied' | 'denied';

export function CopyButton({
  target,
  className,
}: {
  /** The element whose text is selected when the clipboard is refused (the visible address) */
  target: () => Element | null;
  className?: string;
}) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const label = state === 'copied' ? COPY.copied : state === 'denied' ? COPY.denied : COPY.idle;
  return (
    <button
      type="button"
      className={`cell-button copy-button js-only ${className ?? ''}`}
      data-state={state}
      onClick={async () => {
        const r = await copyText(CONTACT_EMAIL, target());
        clearTimeout(timer.current);
        if (r === 'copied') {
          setState('copied');
          announce(COPY.announce);
          timer.current = setTimeout(() => setState('idle'), 4000);
        } else {
          setState('denied');
        }
      }}
    >
      {label}
    </button>
  );
}

export interface SendBlockProps {
  /** id prefix (unique per sheet) */
  id: string;
  href: string;
  label: string;
}

/** The send row: button, fine print, after-click line, alternate path (brief 3.10, 3.13). */
export function SendBlock({ id, href, label }: SendBlockProps) {
  const [clicked, setClicked] = useState(false);
  const addr = useRef<HTMLAnchorElement>(null);
  const fine = `${id}-fine`;
  return (
    <div className="send">
      <a
        className="cell-button send-button"
        href={href}
        aria-describedby={fine}
        data-mailto={id}
        onClick={() => setClicked(true)}
      >
        {label}
      </a>
      <p id={fine} className="send-fine">
        {SEND.finePrint}
      </p>
      <p className="send-after" data-shown={clicked ? '' : undefined}>
        {clicked ? SEND.afterClick : null}
      </p>
      <p className="send-alt">
        <span className="send-alt-text">
          {SEND.orEmail}{' '}
          <a ref={addr} className="send-address" href={PLAIN_MAILTO}>
            {CONTACT_EMAIL}
          </a>
        </span>
        <CopyButton target={() => addr.current} />
      </p>
    </div>
  );
}
