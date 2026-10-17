// The Replace section's drawn pieces: the six card icons (24-unit line icons, stroked in
// currentColor) and the replaced-app marks (the apps' own colour logos in white discs; a letter
// mark for apps we hold no file for; a drawn paper load ticket).

import type { ReactNode } from "react";
import { REPLACE } from "../../content/replace";

type CardId = (typeof REPLACE.cards)[number]["id"];
type App = (typeof REPLACE.cards)[number]["apps"][number];

const ICONS: Record<CardId, ReactNode> = {
  // a punch clock
  time: (
    <>
      <circle cx="12" cy="13.5" r="8.25" />
      <path d="M12 9v4.5l3 2M9.5 2.5h5M12 2.5v2.75" />
    </>
  ),
  // an excavator: tracks, house, boom, stick and bucket
  fleet: (
    <>
      <rect x="1.75" y="17" width="13" height="4.5" rx="2.25" />
      <path d="M3.25 17v-6.25c0-.55.45-1 1-1h3.1l1.65 3h3V17" />
      <path d="M12 12.75 16.25 4.75l5.25 5" />
      <path d="M21.5 9.75c.95 1.35 1.15 2.85.75 4.4h-3.6z" />
    </>
  ),
  // the sales pipeline as a funnel
  crm: <path d="M2.75 4.25h18.5l-7.1 8.3v6.6l-4.3 2.1v-8.7z" />,
  // a job folder
  files: (
    <>
      <path d="M2.5 6.5c0-.83.67-1.5 1.5-1.5h4.6l2.15 2.25H20c.83 0 1.5.67 1.5 1.5v9.75c0 .83-.67 1.5-1.5 1.5H4c-.83 0-1.5-.67-1.5-1.5z" />
      <path d="M2.5 10.5h19" />
    </>
  ),
  // two message bubbles
  comms: (
    <>
      <path d="M15.25 8.5V4.25c0-.83-.67-1.5-1.5-1.5H3.75c-.83 0-1.5.67-1.5 1.5v6.75c0 .83.67 1.5 1.5 1.5h1.5v3l3.4-3" />
      <path d="M11 10c0-.83.67-1.5 1.5-1.5h8c.83 0 1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5h-1.25v3l-3.4-3H12.5c-.83 0-1.5-.67-1.5-1.5z" />
    </>
  ),
  // a dump truck with a load on
  hauling: (
    <>
      <path d="M1.75 10.25h12.5V15.5H4.6z" />
      <path d="M3.4 10.25c1.5-2.75 3.35-4.05 5.15-4.05 1.95 0 3.45 1.35 4.3 4.05" />
      <path d="M15.75 15.5V10.5h3l3 3.4v1.6M4.6 15.5h17.15" />
      <circle cx="7" cy="18" r="2.1" />
      <circle cx="18" cy="18" r="2.1" />
    </>
  ),
};

export function CardIcon({ id }: { id: CardId }) {
  return (
    <svg className="rp-ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[id]}
    </svg>
  );
}

/** A carbon-copy load ticket: perforated top, a few ruled lines, a stamp box. */
function TicketGlyph() {
  return (
    <svg className="rp-ticket" viewBox="0 0 20 24" aria-hidden="true">
      <path
        d="M3 2.6l1.75 1.1L6.5 2.6l1.75 1.1L10 2.6l1.75 1.1 1.75-1.1 1.75 1.1L17 2.6V21.4H3z"
        fill="#fbe7a1"
        stroke="#5b4d40"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M5.8 8.2h8.4M5.8 11.2h8.4M5.8 14.2h5" stroke="#5b4d40" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="11.6" y="16.4" width="3" height="2.6" rx=".5" fill="#d0512b" />
    </svg>
  );
}

const BASE = import.meta.env.BASE_URL;

/** One replaced app: its mark in a white disc, its name as the label and the hover tag. */
export function AppMark({ app }: { app: App }) {
  let mark: ReactNode;
  if (app.file) {
    mark = <img src={`${BASE}logos/apps/${app.file}`} alt={app.name} width={18} height={18} loading="lazy" decoding="async" />;
  } else if (app.letter) {
    mark = (
      <span className="rp-letter" role="img" aria-label={app.name}>
        <span aria-hidden="true">{app.letter}</span>
      </span>
    );
  } else {
    mark = (
      <span className="rp-glyph" role="img" aria-label={app.name}>
        <TicketGlyph />
      </span>
    );
  }
  return (
    <li className="rp-app" data-name={app.name}>
      {mark}
    </li>
  );
}
