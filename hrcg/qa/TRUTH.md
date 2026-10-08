# Truth audit: brief 10.5, whole page, all owners

Signed by A6, 2026-10-08. Scope: every string in `src/content/**` (all owners' copy files), the
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

| # | Rule | Where | File | Owner | What is wrong | Fix |
|---|---|---|---|---|---|---|
| V1 | 22 (labels must be readable), 23-adjacent (no false claim) | INDEX overlay footer and THE SET lightbox | `src/chrome/SheetIndex.tsx` (`hasTheSet()`), `src/chrome/Lightbox.tsx`; data: `src/media/manifest.json` | A1 (render gate), A5 (manifest) | `▶ WATCH THE SET (0:30) · CONCEPT FILM: SCREEN CAPTURE OF THIS SITE + AI-GENERATED CONCEPT FOOTAGE` and the lightbox title `… · 0:30` are rendered now, but `the-set-169` in the mock manifest is a **5.04 s placeholder cut of c34**: not 30 seconds and not a screen capture of the site. The page states two false facts about the film it opens. | Render THE SET links only for the real film: gate `hasTheSet()` on `!isMockManifest && entry.dur >= 25` (A1), or keep `the-set-169` out of the manifest until A7's render is encoded (A5, as A5-MOCK-READY says). A-900's link (A6) is already gated this way. |

No other open violation. Items below are signed line by line.

## Resolved during the audit

| # | Rule | Where | Owner | What was wrong | Status |
|---|---|---|---|---|---|
| R1 | 22 (AI disclosure must be legible) | A-104, desktop | A4 (`src/sheets/A104Pipe.tsx`) | `PLAN 04 · CONCEPT FILM · AI-GENERATED` and `TASK DRAWING TRACED FROM CONCEPT FOOTAGE · DRAWING` printed on the same line and overlapped. | **Fixed by A4** (stacked; QA run 4, `qa/shots/desktop-a-104.jpg`). |
| R2 | 22 / 23-adjacent | A-900 film link | A6 (`src/sheets/conversion/A900Parts.tsx`) | Would have shown `▶ WATCH THE SET (0:30) …` for the 5 s placeholder. | **Fixed:** rendered only for a real, non-mock film of ≥ 25 s. |
| R3 | 22 (no unlabelled claim of detection) | A-300 T7 proof row | A6 | A proof label next to a placeholder image would claim tests that had not run. | **Built in:** the row renders only when `t7-proof.json` reports a real, passing measurement (now `26 PX WIDE`, pass). |

## Rule by rule (brief 10.5)

| Rule | Status | Evidence |
|---|---|---|
| 1 No date beyond 2027 | ✓ | Lint (months, seasons, T-/countdown) clean everywhere. No countdown UI. Every date mention is `Hold. To be announced on this site.` / `Date and venue will be announced on this site.` |
| 2 No venue | ✓ | `Manhattan` appears only in the A-200 history body and the grid alt (allowlisted). A-100 tag carries `NOT A VENUE PLAN`; A-300's empty bay `NOT A VENUE PLAN`; A-200 is `CONTEXT · THE 1811 GRID (HISTORY) · NOT A MAP`. A-200 (motion, reduced motion, phone): the row outline becomes the HOLD cloud and parks before the grid draws; no bay, arena or slab shape is drawn on the grid; no street names, numbers, parks, coastline or pin. Under reduced motion the HOLD tag sits beside the static diagram, not on it. |
| 3 Always "planned" | ✓ | Lint: every string group with 2027 contains planned (strip STATUS, hero status line, A-200 statement, both mailto subjects `HRCG 2027 (planned) - …`, `<title>`, og tags). The A-900 footer title block is one lint group, so `YEAR 2027` sits with `STATUS Planned`. `HRCG-2027` always with PLANNED. |
| 4 No prizes | ✓ | Lint clean; no medal/podium/trophy imagery. |
| 5 No teams or counts | ✓ | Digit allowlist clean on all three surfaces. The A-300 bay number is `—`; the stencil slot says `YOUR ROBOT` until the visitor types. The T7 proof width (`26 PX WIDE`) is the measured string from `t7-proof.json` and prints only when measured. |
| 6 No sponsors | ✓ | Lint clean; no logo strips or tiers. A-301 view title ends `NOT SPONSOR PRODUCTS`; every material alt ends `Not a sponsor product.` Tool livery checked on the five material stills (tape measure and drill are graphite; no brand marks). |
| 7 No organiser | ✓ | No presented-by, founder, team page or judges anywhere. |
| 8 No rules or scoring | ✓ | Lint clean (heats, rounds, finals, scores, tolerances, mm, ±). No run order is stated: A-100 says `Five jobs every builder knows.`; 01–05 are the challenges' own numbers. T7 says `A gift for developers, not a rule of the Games.`; the depth note says `They do not describe how the Games will be judged.` A-103 never says steel, beam, flange or torque. |
| 9 No autonomy claims | ✓ | Lint clean. No copy presumes robot perception or learning: depth is `NOT ROBOT PERCEPTION DATA` in every depth title and in the imagery notes; T7 speaks of "a camera", not the robot. |
| 10 No eligibility | ✓ | Lint clean; no `must`, `built by` or conditions. Audience is the site's own line: `For humanoid robot developers, research labs, and university teams.` |
| 11 No subset rule | ✓ | Note 3 and the RFI helper read `Tell us which challenges suit your platform. We'll start from the work your robot is ready to attempt.` This is the audit's own sanctioned tightening (audit §5, FAQ row: "keep the soft substance") of the original `Team conversations can focus on …`; it states no rule. Brief 10.5's word "verbatim" conflicts with brief 3.12; resolved in favour of audit §5. `Enter one, some or all` appears nowhere. The READY FOR line paints only what the visitor ticks. |
| 12 No registration | ✓ | Lint clean. Buttons are `Discuss competing →` / `Discuss sponsorship →`, real mailto links; nothing is submitted (no `<form>` element, no network request; QA no-JS suite confirms default bodies). |
| 13 No tickets, livestream or audience size | ✓ | Lint clean (`LIVE`, stream, tickets). No copy asserts spectator access. The hero sub `Five construction tasks, with results you can see.` is the client's existing line (audit §1) and makes no access claim. Crowds: see A5's D4 (not re-audited here; mock media are ungraded). |
| 14 No audience metrics | ✓ | Lint clean; keynote 2 keeps `Get in front of the people who specify and buy. Ask us about demonstrations and visibility.` |
| 15 Contact placeholder | ✓ | `hello@example.com` exists only as `CONTACT_EMAIL` in `src/content/config.ts` (lint test); every link, mailto, footer cell and copy button reads the constant. No other domain, phone or person. |
| 16 No social handles | ✓ | `@` only inside the address (lint). No social icons. |
| 17 No testimonials | ✓ | No quotes from people anywhere. |
| 18 No "first" | ✓ | Lint clean; `inaugural` is used (A-301 body). |
| 19 No Olympic, no five-in-two-rows | ✓ | Lint clean. Checked every five-element arrangement at 1440, 1024, 768 and 390: COURSE mark one course; A-100 one row (phone: one row + a one-column list); A-300 challenge chips one row (≤1023 px one column); A-301 material strip one row (phone one column); A-301 `WHICH CHALLENGE?` chips one row (≤1023 one column); A-900 roll-call one column; the footer CHALLENGES cell one line (≤1023 one per line, never a 3-over-2 wrap). Favicon is a 2/3/2 wall (seven bricks). |
| 20 NYC trademarks | ✓ | Lint clean; no subway bullets, I♥NY, Empire State or skyline. |
| 21 No real brands | ✓ | Lint clean; manual "FIGURE" check clean. 07 is named a concept design wherever it is named (A-300 title `ROBOT 07 IS A CONCEPT DESIGN, NOT A REAL ROBOT OR A COMPETITOR`, note 6, imagery notes, A-100 label). Tool trade dress: see rule 6 for A-301; footage frames are A5's D11. |
| 22 All AI imagery labelled | ✓ except **V1** | QA rule-22 check on the live DOM: every `<picture>`/`<video>` sits under a non-drawing `<ViewTitle>` (pass at desktop). Our own digital renders (T7, proof strip) and drawings are not AI imagery and carry no AI label. No LIVE bugs, timestamps or lower-thirds. |
| 23 No fabricated stats | ✓ | `%` only in `PRINT AT 100%` (the PDFs). No counters. The only measured number on the page is T7's proof width, from the pipeline's detection results. |
| 24 No extra sponsor promises | ✓ | Exactly the three keynotes; `Ask us about demonstrations and visibility.` kept. |
| Site: HRCG-2027 with PLANNED | ✓ | INDEX title and the phone title block. |
| Site: no vendor names | ✓ | Lint clean (the page says "AI-generated" and "a monocular depth model"). |
| Site: no GROUND TRUTH | ✓ | Lint clean. |
| Site: fine print never says "nothing is stored" | ✓ | It reads `Nothing you type is stored or sent by this page. Ticking a box only adds it to the email.` (true: the page stores only the MOTION preference). |
| Site: A-200 fact gate | ✓ **VERIFIED** | See below. `FACT_GATE = 'verified'` stands. |
| Site: no generated text in any frame | ✓ for A-300/A-301 stills; footage is A5's D10 | ref21 (the stencilled 07 is the robot's designed numeral), the empty bay, the five material crops: no generated lettering. |

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

The Randel survey-bolt "cross" story is not used anywhere.

## Watch items (not violations today)

- **Media are still the mock set** (`manifest.json` `"mock": true`): ungraded, no livery shift, no crowd
  crush. Rules 13 (legible crowds) and 21 (tool trade dress) must be re-checked on A5's final encodes
  (D4, D11) before launch. The re-check is a screenshot pass of A-101–A-105 at 1440.
- **THE SET** must keep its `0:30` only when the real 30 s film ships (V1).
- **A-200 under reduced motion**: the HOLD tag sits close to the grid diagram's top-left corner; it does
  not touch it (rule 2 holds), but more space would read more clearly as "parked first".
- **Replacing the placeholder address** (`CONTACT_EMAIL`) is the client's call; the lint's rule 15 must be
  updated to the real address at the same time.
