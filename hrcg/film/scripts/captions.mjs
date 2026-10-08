#!/usr/bin/env node
// WebVTT captions (every super + [sound] cues) and a plain-text transcript for THE SET, from the same
// timeline as the picture and the sound. Writes to film/deliver/ (and copies to film/out/).
// usage: node film/scripts/captions.mjs
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TL = JSON.parse(readFileSync(join(ROOT, 'src/timeline.json'), 'utf8'));
const FPS = TL.fps;
const DELIVER = join(ROOT, 'deliver');
const OUT = join(ROOT, 'out');
mkdirSync(DELIVER, { recursive: true });
mkdirSync(OUT, { recursive: true });

// exact on-screen copy (the same strings as src/)
const SHEETS = [
  ['A-101', '01', 'BRICKLAYING', 'LAY BRICK.'],
  ['A-102', '02', 'DRYWALL INSTALLATION', 'HANG DRYWALL.'],
  ['A-103', '03', 'BOLTED ASSEMBLY', 'BOLT IT.'],
  ['A-104', '04', 'PIPE ASSEMBLY', 'RUN THE PIPE.'],
  ['A-105', '05', 'LAYOUT AND MARKING', 'MARK IT OUT.'],
];
const H1 = 'WHAT CAN A HUMANOID ACTUALLY BUILD?';
const STATUS = 'PLANNED · NEW YORK CITY · 2027';
const VT_FILM = 'PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM · AI-GENERATED. THIS HASN’T HAPPENED YET.';
const VT_STILL = 'PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM STILL · AI-GENERATED. THIS HASN’T HAPPENED YET.';
const BURN = ['HRCG-2027 · PLANNED · DRAWING SET', 'CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE'];

const ts = (t) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
};

const build = (fmt) => {
  const f = TL.formats[fmt];
  const c = f.cover;
  const impactF = Math.round(c.impact * FPS);
  const film = (impactF + 8) / FPS;
  const freeze = (impactF + 8 + 29) / FPS;
  const P = f.plancut.start;
  const sup = []; // [start, end, text]
  const snd = [];
  sup.push([0, Math.min(c.pull[0], 2.2), `${BURN[0]}\n${BURN[1]}`]);
  sup.push([Math.min(c.pull[0], 2.2), P + 0.2, `${STATUS}\n${H1}`]);
  sup.push([film, freeze, VT_FILM]);
  sup.push([freeze, P + 0.06, VT_STILL]);
  sup.push([P + 0.06, P + 1.25, 'PLAN 05 · CONCEPT FILM STILL · AI-GENERATED']);
  sup.push([
    P + 1.25,
    f.plancut.end,
    'A-100 · THE FIVE BAYS (ILLUSTRATIVE) · NOT A VENUE PLAN · NTS\n01 BRICKLAYING · 02 DRYWALL INSTALLATION · 03 BOLTED ASSEMBLY · 04 PIPE ASSEMBLY · 05 LAYOUT AND MARKING\nPLAN VIEWS 01–05 · CONCEPT FILM · AI-GENERATED',
  ]);
  snd.push([0, freeze, '[quiet room tone]']);
  snd.push([c.payout[0], c.payout[1], '[a chalk line reel pays out]']);
  snd.push([c.pull[0], c.pull[1], '[the line is pulled taut]']);
  snd.push([c.pull[1], c.impact + 0.6, '[the line snaps: a twang, then a hard thwack on concrete]']);
  snd.push([c.impact + 0.3, freeze, '[chalk powder hisses]']);
  snd.push([freeze, P, '[silence]']);
  snd.push([P + 0.06, P + 0.8, '[a low thud]']);
  SHEETS.forEach(([id, n, name, verb], i) => {
    const s0 = f.sheets.start + i * f.sheets.each;
    const s1 = s0 + f.sheets.plan;
    const s2 = s0 + f.sheets.each;
    sup.push([s0, s1, `${id} · CHALLENGE ${n} · ${name}\nPLAN ${n} · CONCEPT FILM · AI-GENERATED`]);
    sup.push([s1, s2, `${verb}\nPERSPECTIVE ${n}-A · CONCEPT FILM · AI-GENERATED`]);
    snd.push([s0, s0 + 0.3, '[pencil tick]']);
    snd.push([s1, s1 + 0.4, '[a dry knock]']);
  });
  if (f.context) {
    const a = f.context.start;
    sup.push([a, a + 0.45, 'A-200 · CONTEXT · THE 1811 GRID (HISTORY) · NOT A MAP · NTS\nPLAN VIEWS 01–05 · CONCEPT FILM STILL · AI-GENERATED\nTHE FIVE BAYS · ILLUSTRATIVE']);
    sup.push([a + 0.45, a + 1.15, 'VENUE: HOLD — Venue to be announced on this site.']);
    sup.push([a + 1.15, a + 1.95, 'DATE · VENUE: HOLD\nCONTEXT · THE 1811 GRID (HISTORY) · DRAWING · NOT A MAP']);
    sup.push([a + 1.95, f.context.end, 'NEW YORK’S GRID STARTED AS A LAYOUT.\nTRUE NORTH · THE 1811 GRID · ABOUT 29°']);
    snd.push([a, f.context.end, '[pencil scratching]']);
  }
  const e = f.end.start;
  sup.push([e + 0.55, f.end.end, 'HUMANOID ROBOT CONSTRUCTION GAMES\nPLANNED FOR NEW YORK CITY · 2027\nTEAMS AND SPONSORS: GET IN TOUCH.\nTHIS HASN’T HAPPENED YET.']);
  snd.push([e + 0.1, e + 0.55, '[five soft clacks of brick]']);
  snd.push([e + 0.55, f.end.end, '[silence]']);

  const cues = [
    ...sup.map(([a, b, tx]) => ({ a, b, tx, set: 'line:-1' })),
    ...snd.map(([a, b, tx]) => ({ a, b, tx, set: 'line:0' })),
  ].sort((p, q) => p.a - q.a || (p.set < q.set ? -1 : 1));
  let vtt = `WEBVTT\n\nNOTE\nTHE SET (${fmt === '11' ? '1:1, 20 s cut' : fmt === '916' ? '9:16' : '16:9'}) · CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE.\nEvery on-screen super, plus [sound] cues (shown at the top). The two burn-ins\n"${BURN[0]}" and "${BURN[1]}" stay on screen for the whole film.\nNo music, no voice. All footage is AI-generated concept footage; nothing shown has happened yet.\n\n`;
  cues.forEach((q, i) => {
    vtt += `${i + 1}\n${ts(q.a)} --> ${ts(Math.min(q.b, f.duration))} ${q.set}\n${q.tx}\n\n`;
  });
  return vtt;
};

for (const fmt of ['169', '916', '11']) {
  const name = `the-set-${fmt}.vtt`;
  writeFileSync(join(DELIVER, name), build(fmt));
  copyFileSync(join(DELIVER, name), join(OUT, name));
}

const transcript = `THE SET · concept film, 0:30 (also cut as 9:16 and as a 20-second 1:1)
CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE. THIS HASN’T HAPPENED YET.
No music and no voice; the sound is synthesised foley.

Burned in for the whole film: "HRCG-2027 · PLANNED · DRAWING SET" (top left), the sheet number (top right),
"CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE" (bottom left).

A-000 · COVER
On a dark concrete slab, under quiet room tone, a blue chalk line pays out from a chalk box between two
orange control marks. The headline waits in pale outline: "WHAT CAN A HUMANOID ACTUALLY BUILD?", with
"PLANNED · NEW YORK CITY · 2027" above it. The line is pulled taut and let go: it snaps onto the slab with a
twang and a hard thwack, leaves a powdery blue stripe and lifts a small puff of chalk. The headline inks:
"WHAT CAN A HUMANOID" in chalk white, "ACTUALLY BUILD?" in marking orange. AI-generated concept film of
robot 07, a concept design, rises through the dust: it snaps its own chalk line and a blue plume billows
toward the camera. View title: "PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM · AI-GENERATED. THIS
HASN’T HAPPENED YET." The sound drops to silence and time stops on the frame of the dust's peak; the camera
pushes in slowly on the still ("CONCEPT FILM STILL").

A-100 · THE FIVE BAYS
A low thud. The frozen frame becomes a plan seen from above: "PLAN 05 · CONCEPT FILM STILL · AI-GENERATED",
with the snapped line lying on robot 07's freshly snapped line in bay 05. The view pulls out to one row of five
work bays, numbered 01 to 05 in gridline bubbles: "01 BRICKLAYING · 02 DRYWALL INSTALLATION · 03 BOLTED
ASSEMBLY · 04 PIPE ASSEMBLY · 05 LAYOUT AND MARKING". Sheet tag: "A-100 · THE FIVE BAYS (ILLUSTRATIVE) · NOT A
VENUE PLAN · NTS". View title: "PLAN VIEWS 01–05 · CONCEPT FILM · AI-GENERATED".

A-101 TO A-105 · THE FIVE CHALLENGES
Five sheets, three seconds each. A pencil tick, then each bay's plan view from above with its sheet tag,
stencil number and name; a dry knock and a hard cut to the perspective, with the roll-call verb:
- 01 BRICKLAYING, then "LAY BRICK.": robot 07 lays a brick against a stringline.
- 02 DRYWALL INSTALLATION, then "HANG DRYWALL.": hands press a sheet of drywall against a steel stud frame.
- 03 BOLTED ASSEMBLY, then "BOLT IT.": robot 07 drives a bolt with an impact wrench.
- 04 PIPE ASSEMBLY, then "RUN THE PIPE.": hands join copper pipe at a fitting under a warm work light.
- 05 LAYOUT AND MARKING, then "MARK IT OUT.": robot 07 crouches with a taut chalk line and lifts it.
Every view carries its title, for example "PERSPECTIVE 01-A · CONCEPT FILM · AI-GENERATED" (NTS).

A-200 · CONTEXT · THE 1811 GRID (HISTORY) · NOT A MAP  (16:9 and 9:16 only)
Under a bed of pencil scratching, the row of five bays fades to its pencil outline ("THE FIVE BAYS ·
ILLUSTRATIVE"), which turns into an orange revision cloud: "VENUE: HOLD — Venue to be announced on this
site." The cloud lifts and docks in a ruled cell, "DATE · VENUE: HOLD". Only then does a separate history
diagram draw: the grid of avenues and cross streets, set about 29 degrees east of true north, with two north
arrows ("TRUE NORTH", "THE 1811 GRID") and an angle arc ("ABOUT 29°"). It is not a map and not the venue.
"NEW YORK’S GRID STARTED AS A LAYOUT."

END CARD
On slab black, five soft clacks: the course mark lays five bricks in one course. Then:
"HUMANOID ROBOT CONSTRUCTION GAMES"
"PLANNED FOR NEW YORK CITY · 2027" | "TEAMS AND SPONSORS: GET IN TOUCH."
"THIS HASN’T HAPPENED YET."
Silence.

The 1:1 cut runs the same cover, plan cut, five sheets and end card in 20 seconds, without A-200.
The 9:16 version is laid out natively for phones (its snap is a separate vertical concept take).
`;
writeFileSync(join(DELIVER, 'the-set-transcript.txt'), transcript);
copyFileSync(join(DELIVER, 'the-set-transcript.txt'), join(OUT, 'the-set-transcript.txt'));
console.log('captions + transcript written');
