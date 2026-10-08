# Truth audit: brief 10.5, whole page, all owners

Signed by A6, 2026-10-08; updated in fix round 1 (`qa/review/FIXLIST-1.md`, A6 package and director
decisions H-4/H-5), same day. Scope: every string in `src/content/**` (all owners' copy files), the
prerendered HTML of the production build, the rendered DOM after hydration (including copy fetched at
runtime), the manifest's alts, the screenshots in `qa/shots/` (desktop, phone, reduced motion, no-GL,
no-JS) and a visual pass over every sheet. Truth rules are `research/audit.md` §4; where they and the
brief differ, the rules win.

**Automated:** the copy lint (`src/system/lintRules.ts`, word-boundary rules + digit allowlist +
`lint-allow.json`) passes on `src/content/**` (vitest), on the prerendered `index.html` (build) and on
the rendered DOM after hydration (`scripts/qa.mjs` lint suite): **0 violations** in each. QA also checks
rule 22 on the live DOM (every `<picture>`/`<video>` under a non-drawing view title: pass) and G8
(`THIS HASN'T HAPPENED YET.` visible only on the hero film title and the A-900 end line: pass).

## Open violations (fix before launch)

Reopened by design review round 1 (FIXLIST-1 F-053). Each line closes only when its fix lands **and**
A6 has looked at the retake named in the item; the sign-off is then recorded here with the file.

| # | Rule / gate | Where | Owner | Open because | Closes with |
|---|---|---|---|---|---|
| O1 | 13 (no audience) · D4 crowd crush | A-102 PERSPECTIVE 02-A (`el-c31`), THE SET's HANG DRYWALL beat | A5, A7 | A blurred, skin-toned figure shows between the studs (`qa/review/truth/c31-t3.4-person.jpg`, `truth/a102-site-spectator.jpg`). | F-009 (re-crush + re-crop), F-012 (THE SET re-render). **Manual crowd sign-off (A6): pending** — A6 signs on A5's every-12th-frame contact sheet of each shipped clip (`qa_shipped.py`) plus the R-DEV retake `qa/review/r1/1440-a-102-land.jpg`. |
| O2 | D4 halo | A-101 / A-103 perspectives (`el-c30`, `el-c32`, `el-c33`) | A5 | Light fringes round 07's helmet and pads against the crushed black (`art/crop-a101-persp-halo.png`). | F-047. |
| O3 | 21 (no real brands / trade dress) · D11 livery | og image, X card, THE SET poster and A-000 beats; `plan-b41`, `plan-b42`, `plan-b43`, `arena-0104` | A7, A5 | A yellow-and-black tape measure (`truth/og-tape.jpg`, `truth/x-card-small.jpg`); an orange-and-black drill and a red-and-black tool (`truth/b41-drill.jpg`, `truth/b42-tool.jpg`). | F-011 → F-010 (og, X card, THE SET), F-048 (plans, arena). Gate: `qa_shipped.py` reports `liveryFrames` = 0. |
| O4 | D10 (no generated text in any frame) | `det-n03` (A-103 detail circle), the `plan-b41` battery label, the c34 tape housing | A5 | Glyph-like embossed lettering (`truth/n03-socket-text.jpg`, `extra-stage-a-103-minus025vh-1440.jpg`). | F-049. **Manual D10 sign-off (A6): pending** — A6 signs on the re-extracted `truth/n03-socket-text.jpg` and the A-103 circle retake. |
| O5 | 22 (labels match the picture) | A-104 blue task-drawing trace | A4 | The trace highlights a single offset route; the copper on the floor is a rectangle with a tee (`truth/a-104-0vh-1280.jpg`). Director rejected regenerating b43 (H-12). | F-040 (no trace or trace caption until b43 matches). |

The QA build that produced the round-1 evidence was a development build (FIXLIST-1 §0); since F-052,
`scripts/qa.mjs` builds a real production build and fails its `build` suite otherwise.

## Resolved during the audit

| # | Rule | Where | Owner | What was wrong | Status |
|---|---|---|---|---|---|
| R1 | 22 (AI disclosure must be legible) | A-104, desktop | A4 (`src/sheets/A104Pipe.tsx`) | `PLAN 04 · CONCEPT FILM · AI-GENERATED` and `TASK DRAWING TRACED FROM CONCEPT FOOTAGE · DRAWING` printed on the same line and overlapped. | **Fixed by A4** (stacked; QA run 4, `qa/shots/desktop-a-104.jpg`). Round 1 saw the overprint again, but only in the development-mode QA build (chunk CSS ahead of `index-*.css`; FIXLIST-1 X-1). It stays fixed for the shipped build: `qa/review/r1/sheet-a-104-1280.jpg`, taken from the production QA build after F-052, shows two separate caption rules and no PLAY. F-013 (one stylesheet) and F-083 (a sturdier caption stack) make it independent of chunking. |
| R2 | 22 / 23-adjacent | A-900 film link | A6 (`src/sheets/conversion/A900Parts.tsx`) | Would have shown `▶ WATCH THE SET (0:30) …` for the 5 s placeholder. | **Fixed:** rendered only for a real, non-mock film of ≥ 25 s. |
| R3 | 22 (no unlabelled claim of detection) | A-300 T7 proof row | A6 | A proof label next to a placeholder image would claim tests that had not run. | **Built in:** the row renders only when the measurement is real and passing (A5 now inlines `proof: {smallestLabel: "26 PX WIDE", pass: true}` in the manifest, so it also prerenders). |
| R4 | 22, 23-adjacent | INDEX footer, THE SET lightbox, A-900 film link | A1 (`src/chrome/SheetIndex.tsx`, `Lightbox.tsx`, `copy/chrome.ts`, `viewTitles.ts`), A5 (manifest), A7 (film) | While the manifest was the mock, `▶ WATCH THE SET (0:30) · CONCEPT FILM: SCREEN CAPTURE OF THIS SITE + …` opened a 5 s placeholder cut of c34; and THE SET pass A contains no screen capture of the site at all. | **Fixed:** the real 30.016 s pass-A film is in the manifest (A5), and every THE SET string now reads `CONCEPT FILM: AI-GENERATED CONCEPT FOOTAGE` (A7-1, applied for A1). If pass B ships with site captures, the brief wording comes back by request. |

## Rule by rule (brief 10.5)

| Rule | Status | Evidence |
|---|---|---|
| 1 No date beyond 2027 | ✓ | Lint (months, seasons, T-/countdown) clean everywhere. No countdown UI. Every date mention is `Hold. To be announced on this site.` / `Date and venue will be announced on this site.` |
| 2 No venue | ✓ | `Manhattan` appears only in the A-200 history body and the grid alt (allowlisted). A-100 tag carries `NOT A VENUE PLAN`; A-300's empty bay `NOT A VENUE PLAN`; A-200 is `CONTEXT · THE 1811 GRID (HISTORY) · NOT A MAP`. A-200 (motion, reduced motion, phone): the row outline becomes the HOLD cloud and parks before the grid draws; no bay, arena or slab shape is drawn on the grid; no street names, numbers, parks, coastline or pin. Under reduced motion the HOLD tag sits beside the static diagram, not on it. |
| 3 Always "planned" | ✓ | Lint: every string group with 2027 contains planned (strip STATUS, hero status line, A-200 statement, both mailto subjects `HRCG 2027 (planned) - …`, `<title>`, og tags). The A-900 footer title block is one lint group, so `YEAR 2027` sits with `STATUS Planned`. `HRCG-2027` always with PLANNED. |
| 4 No prizes | ✓ | Lint clean; no medal/podium/trophy imagery. |
| 5 No teams or counts | ✓ | Digit allowlist clean on all three surfaces. The A-300 bay number is `—` under the legend word `BAY` (F-096: a word, not a number); the stencil slot says `YOUR ROBOT` until the visitor types. The T7 proof width (`26 PX WIDE`) is the measured string from `t7-proof.json` and prints only when measured; since F-097 it labels the third proof column on its own (`FLAT` · `WARPED + BLURRED` · `26 PX WIDE`, split from the brief's caption with no new words). |
| 6 No sponsors | ✓ | Lint clean; no logo strips or tiers. A-301 view title ends `NOT SPONSOR PRODUCTS`; every material alt ends `Not a sponsor product.` Tool livery checked on the five material stills (tape measure and drill are graphite; no brand marks). |
| 7 No organiser | ✓ | No presented-by, founder, team page or judges anywhere. |
| 8 No rules or scoring | ✓ | Lint clean (heats, rounds, finals, scores, tolerances, mm, ±). No run order is stated: A-100 says `Five jobs every builder knows.`; 01–05 are the challenges' own numbers. T7 says `A gift for developers, not a rule of the Games.`; the depth note says `They do not describe how the Games will be judged.` A-103 never says steel, beam, flange or torque. |
| 9 No autonomy claims | ✓ | Lint clean. No copy presumes robot perception or learning: depth is `NOT ROBOT PERCEPTION DATA` in every depth title and in the imagery notes; T7 speaks of "a camera", not the robot. |
| 10 No eligibility | ✓ | Lint clean; no `must`, `built by` or conditions. Audience is the site's own line: `For humanoid robot developers, research labs, and university teams.` |
| 11 No subset rule | ✓ | Note 3 and the RFI helper read `Tell us which challenges suit your platform. We'll start from the work your robot is ready to attempt.` This is the audit's own sanctioned tightening (audit §5, FAQ row: "keep the soft substance") of the original `Team conversations can focus on …`; it states no rule. Brief 10.5's word "verbatim" conflicts with brief 3.12; resolved in favour of audit §5. `Enter one, some or all` appears nowhere. **Corrected in round 1 (F-098):** the READY FOR line used to print all five numbers, dimmed, before anything was ticked (`qa/review/art/1440-a-300-land.jpg`), which read as a list of what a team is ready for. It now reads `READY FOR —` until a box is ticked, then prints only the ticked numbers (`qa/review/r1/1440-a-300-land.jpg`). Nothing on the bay is printed that the visitor hasn't chosen. |
| 12 No registration | ✓ | Lint clean. Buttons are `Discuss competing →` / `Discuss sponsorship →`, real mailto links; nothing is submitted (no `<form>` element, no network request; QA no-JS suite confirms default bodies). |
| 13 No tickets, livestream or audience size | **Open (O1)** for footage; ✓ for copy | Lint clean (`LIVE`, stream, tickets). No copy asserts spectator access. The hero sub `Five construction tasks, with results you can see.` is the client's existing line (audit §1) and makes no access claim. Crowds: see A5's D4 (not re-audited here; mock media are ungraded). |
| 14 No audience metrics | ✓ | Lint clean; keynote 2 keeps `Get in front of the people who specify and buy. Ask us about demonstrations and visibility.` |
| 15 Contact placeholder | ✓ | `hello@example.com` exists only as `CONTACT_EMAIL` in `src/content/config.ts` (lint test); every link, mailto, footer cell and copy button reads the constant. No other domain, phone or person. |
| 16 No social handles | ✓ | `@` only inside the address (lint). No social icons. |
| 17 No testimonials | ✓ | No quotes from people anywhere. |
| 18 No "first" | ✓ | Lint clean; `inaugural` is used (A-301 body). |
| 19 No Olympic, no five-in-two-rows | ✓ | Lint clean. Checked every five-element arrangement at 1440, 1024, 768 and 390: COURSE mark one course; A-100 one row (phone: one row + a one-column list); A-300 challenge chips one row (≤1023 px one column); A-301 material strip one row (phone one column); A-301 `WHICH CHALLENGE?` chips one row (≤1023 one column); A-900 roll-call one column; the footer CHALLENGES cell one line (≤1023 one per line, never a 3-over-2 wrap). Favicon is a 2/3/2 wall (seven bricks). |
| 20 NYC trademarks | ✓ | Lint clean; no subway bullets, I♥NY, Empire State or skyline. |
| 21 No real brands | **Open (O3)** for tool trade dress in footage and the social card; ✓ for copy | Lint clean; manual "FIGURE" check clean. 07 is named a concept design wherever it is named (A-300 title `ROBOT 07 IS A CONCEPT DESIGN, NOT A REAL ROBOT OR A COMPETITOR`, note 6, imagery notes, A-100 label). Tool trade dress: see rule 6 for A-301; footage frames are A5's D11. |
| 22 All AI imagery labelled | ✓ | QA rule-22 check on the live DOM: every `<picture>`/`<video>` sits under a non-drawing `<ViewTitle>` (pass at desktop). Our own digital renders (T7, proof strip) and drawings are not AI imagery and carry no AI label. No LIVE bugs, timestamps or lower-thirds. |
| 23 No fabricated stats | ✓ | `%` only in `PRINT AT 100%` (the PDFs). No counters. The only measured number on the page is T7's proof width, from the pipeline's detection results. |
| 24 No extra sponsor promises | ✓ | Exactly the three keynotes; `Ask us about demonstrations and visibility.` kept. Keynote 3 (director H-4, round 1): the "MEET THE TALENT — Meet the engineers …" repetition is removed; the text now reads `Connect with the engineers making robots useful on site, through recruiting and technical conversations with developers and research teams.` "Connect with" is the client's own verb for this keynote (audit §1: "Connect with developers and research teams through recruiting and technical conversations"), so the offer is unchanged: conversations, no placement or outcome promised. The og/twitter description and note 4 (`Explore …`) stay as they are (H-4, rule 24's negotiable framing). |
| Site: HRCG-2027 with PLANNED | ✓ | INDEX title and the phone title block. |
| Site: no vendor names | ✓ | Lint clean (the page says "AI-generated" and "a monocular depth model"). |
| Site: no GROUND TRUTH | ✓ | Lint clean. |
| Site: fine print never says "nothing is stored" | ✓ | It reads `Nothing you type is stored or sent by this page. Ticking a box only adds it to the email.` (true: the page stores only the MOTION preference). |
| Site: A-200 fact gate | ✓ **VERIFIED** | See below. `FACT_GATE = 'verified'` stands, including the H-5 wording (`drew most of Manhattan as a grid`). |
| Site: copy changed in round 1 (A6) | ✓ | Keynote 3 (H-4, rule 24 above). A-300 bay: legend word `BAY` (F-096) and `READY FOR —` (F-098). T7 proof caption split over three columns, same words (F-097). A-900 (H-6, H-7, F-094): the notes print open as headings and paragraphs (same six questions and answers); the end line `THIS HASN'T HAPPENED YET.` is set at statement size with the strip's own two CTA cells (`ROBOT TEAMS · Bring the robot →`, `CONSTRUCTION COMPANIES · Bring your product →`, same targets, no new words); the email is `clamp(28px, 4vw, 56px)`. G8 still holds: the end line is the only A-900 instance. The copy lint passes on `src/content/**`. |
| Site: no generated text in any frame | ✓ for A-300/A-301 stills; **open (O4)** for footage (A5's D10) | ref21 (the stencilled 07 is the robot's designed numeral), the empty bay, the five material crops: no generated lettering. |

## A-200 fact gate (brief 3.9, F5): VERIFIED

Every figure checked against at least two independent sources by A6 (2026-10-08), in addition to A4's
list in `src/content/copy/a104-a200.ts`:

| Figure | Sources |
|---|---|
| The plan, 1811 | Wikipedia, "Commissioners' Plan of 1811" ("their plan was presented in 1811"); NYPL Archives MssCol 605 (authenticated 22 March 1811, signed by the mayor 4 May 1811). |
| About 29° east of true north | Wikipedia (as above: "tilted 29 degrees east of true north"); StreetEasy, "How many NYC blocks are in one mile" (same figure). |
| Twelve avenues and 155 cross streets | Wikipedia ("12 primary … avenues", "155 orthogonal cross streets"); NYPL Archives MssCol 605 ("a grid of 155 numbered streets and 12 avenues"). One outlier (6sqft, "11 avenues") is contradicted by both. |
| John Randel Jr. | Wikipedia ("chief surveyor was John Randel Jr."); NYPL Archives (Randel attests the manuscript); MCNY *The Greatest Grid*. |
| 1,549 marble markers and 98 iron bolts | Wikipedia ("1,549 marble markers and 98 iron bolts"); MCNY *The Greatest Grid*, "Surveying the city" ("he erected 1,549 monuments and 98 iron bolts, where ground rock required the substitution"). |
| Module proportions (drawing only, no numbers printed) | Wikipedia (60 ft streets, about 200 ft between streets, 100 ft avenues, 610–920 ft between avenues); MCNY (A4's note). |

| "Most of Manhattan" (H-5, round 1: "drew Manhattan as a grid" → "drew most of Manhattan as a grid", in both bodies; A4 edits the copy) | Wikipedia, "Commissioners' Plan of 1811" (the plan laid out "the streets of Manhattan above Houston Street and below 155th Street"; "The jurisdiction of the Commission was all of Manhattan north of Houston Street"); Wikipedia, "John Randel Jr." (the grid ran "from 14th Street to 155th Street", and Randel later planned its extension above 155th Street); NYPL Archives MssCol 605 ("155 numbered streets": the grid stops at 155th Street, well short of the island's north end); MCNY *The Greatest Grid* (New York was then "a compact town at the southern tip", which the grid did not re-plan). The grid covered the island between the settled south and 155th Street: most of Manhattan, not all of it. "Most of" narrows the claim and adds no figure. |

The Randel survey-bolt "cross" story is not used anywhere. The lint allowlist holds the A-200 bodies as
exact strings (`src/content/lint-allow.json`, A1); its entries carry the H-5 wording, matching A4's copy
(`src/content/copy/a104-a200.ts`), and the QA gate `H5-wording` checks the rendered page for it.

## Watch items (not violations today)

- **Footage gates belong to A5** (D4 crowd crush, D10 no generated text, D11 visor glint and tool
  livery). The manifest is now the real one (`"mock": false`); this audit did not re-measure those
  gates frame by frame. Before launch, one screenshot pass of A-101 to A-105 at 1440 against rules 13
  and 21 closes it.
- **THE SET** wording must change back to the brief's `SCREEN CAPTURE OF THIS SITE + …` only if pass B
  really contains site captures (R4).
- **A-200 under reduced motion**: the HOLD tag sits close to the grid diagram's top-left corner; it does
  not touch it (rule 2 holds), but more space would read more clearly as "parked first".
- **Replacing the placeholder address** (`CONTACT_EMAIL`) is the client's call; the lint's rule 15 must be
  updated to the real address at the same time.
