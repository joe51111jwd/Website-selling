# SmartCrew · "One Day" product page

The page a Facebook ad sends a dirt-work contractor to (owners of 5–100 person crews, mostly on an iPhone inside the Facebook app). It tells one workday at a made-up 16-person crew, Cedar Ridge Earthworks, on the real SmartCrew app. It makes one ask, **Get my free trial**, and that ask ends in a booked call with Andrew Drish, the founder.

Vite 8, React 19, TypeScript (strict), motion, and three.js through React Three Fiber (one shared WebGL canvas, laptops only).

## The flow

```
Facebook ad ──► /  (product page) ──► popup "Set up your SmartCrew" ──► /book
  ?angle=…        orange CTA            3 steps: size + company,         Andrew's video + his Cal.com
  message match   (every scene)         name + email, mobile             calendar, prefilled; product details
```

The page, in order:

1. **Intro.** A night jobsite map with three real notifications. It plays once per session, lasts at most 3 s and is skipped by any input.
2. **Hero.** "Fence the Words": the headline's key phrase is fenced by the geofence, and the orange CTA sits on the axis under it.
3. **One Day.** Seven moments from 6:42 AM to Friday payroll. On laptops they play on a 3D MacBook and iPhone; on phones, on a 2D phone frame.
4. **Spec sheet.** All 38 tools in six groups.
5. **Try it.** The visitor taps Clock In.
6. **Your number.** A calculator; its estimate rides into the popup.
7. **Proof.**
8. **Five apps → one.**
9. **Andrew's offer.** His story and a signed receipt.
10. **FAQ and the close**, then the footer.

Rules the page keeps:

- Every scene is one tap from the popup.
- Only one orange button is on screen at a time. The header CTA (laptops) and the sticky bottom bar (phones) step aside whenever a scene's own CTA is showing (`src/site/shell/primaryCta.ts`).
- Phones (≤ 760 px) never load three.js or a `.glb`. They use transform and opacity animations only, and each one triggers once.

## Run, build, deploy

```bash
npm install
npm run dev              # http://localhost:5173 (the team's QA server runs on :5310)
npm run typecheck        # tsc, strict
npm run typecheck:build  # the deploy's typecheck (tsconfig.build.json)
npm run build            # typecheck + dist/ (dist/index.html and dist/book/index.html)
npm run build:preview    # same, plus noindex: what the preview deploy runs
npm run preview          # serve dist/
npm run e2e              # end-to-end test (below); needs a server running
npm run screens          # re-shoot the app screen textures into public/screens/ (dev server up)
```

`base: "./"`, so `dist/` works from any folder or subdomain.

**Vercel** (project `smartcrew-preview`):

| Setting | Value |
|---|---|
| Framework | Vite |
| Root directory | `smartcrew` |
| Install command | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` |
| Build command | `npm run build:preview` |
| Output directory | `dist` |
| Node | 24 |

## Config: `src/config.ts`

Everything external lives in one file. An empty value switches its feature off safely.

| Key | Today | Notes |
|---|---|---|
| `calLink` | `andrew-drish/15min` | The Cal.com event embedded on `/book`. |
| `callLength`, `callLengthConfirmed` | `"30-minute"`, `false` | Every "a 30-minute call" line. While `false`, those lines carry a ⚑. Keep `T.N` in `copy.ts` equal to it. |
| `leadWebhook` | empty | The popup posts each step (`start`, `email`, `complete`) as a form post. Zapier, Make and GoHighLevel can all read it. |
| `metaPixelId`, `gaId` | **empty** | Stay empty on previews so test clicks never reach the ad account. At launch only: Pixel `1259016858853739`, GA4 `G-FED5LLVE5W`. |
| `vidalytics` | account `5_H1Y3QY`, walkthrough `Lz1Z_A8eimAA04gJ` | Andrew's video on `/book`. |
| `andrewPhone` | empty | E.164. Turns on "Save Andrew's number" after booking. |
| `privacyUrl`, `termsUrl`, `loginUrl`, `email` | live smartcrewhq.com pages, the app, hello@ | |

All copy lives in `src/content/copy.ts`: the tokens `T.SIZE`, `T.N` and `T.PROGRAM`, the `ANGLES` for `?angle=`, every scene's strings, and the FAQ. The seven moments and 38 features are in `src/content/moments.ts`. The demo data (made-up names only) is in `src/screens/data.ts`.

## Dev routes and switches

| URL | What it does |
|---|---|
| `/?intro=0`, `/?intro=1` | Skip or force the intro. It plays once per session (`sessionStorage` key `sc-intro`) and never with reduced motion. |
| `/?intro=1&introDebug` | Hold the intro. `window.__introSeek(ms)` renders any frame. |
| `/?angle=profit\|overbudget\|timecards\|payroll\|replace` | The hero H1, sub and fenced phrase that match the ad. |
| **`?review`** | **Shows every ⚑ marker and every unapproved proposal on a built page.** It sticks for the session, so the popup and `/book` show them too. The dev server always shows them, and so does a build made with `VITE_SHOW_FLAGS=1`. The ad build hides them. |
| `/?nocursor` · `/?stageHQ` · `/?daySlow=8` | No custom cursor · full-resolution 3D · One Day at 8× slower. |
| `/?stage3d` (dev only) | Forces the 3D Stage on a phone-sized window. |
| `/?screens`, `/?screen=<id>` · `/?sandbox=devices` · `/?cursor-demo` | App screens · device sandbox · cursor bench (dev only). |
| `/book/` · `/book/?demo=booked` | The booking page, and its booked state without touching Andrew's calendar (dev only). |
| `/src/signup/dev/`, `/src/site/day/dev.html`, `/src/site/day/states/dev.html`, `/src/site/specsheet/dev.html`, `/src/site/try/dev/`, `/src/site/phone/dev.html` | Per-scene harnesses (dev only). |
| `window.__stage.getTimeline()` | Dev console: every 3D pose key with its page position. |

## Where things live

| Path | What |
|---|---|
| `index.html`, `src/site/intro/` | The intro's first frame (plain HTML, CSS and SVG, so the Facebook browser paints before any JS) and its hand-over. |
| `src/App.tsx` | The page shell: backdrop, the lazy 3D Stage (never on phones), header, scenes, sticky bar, popup, cursor. |
| `src/site/<scene>/` | One folder per scene. Each phone version sits beside its desktop one (`*Phone.tsx`). |
| `src/site/ui/Cta.tsx` | The orange `<Cta>` and the ink `DemoLink` / `InlineCta`. They all call `openSignup()` (`src/signup/contract.ts`). |
| `src/site/shell/` | Header, phone sticky bar, and the "one orange button" rule. |
| `src/three/` | The Stage: one canvas, `StageAnchor`, pose keys. Import from `src/three/stage` only. |
| `src/signup/` | The popup. It saves each step, then hands the lead to `/book` in `sessionStorage` (`sc_lead`), never in the URL. |
| `src/book/` | `/book`: headline, Andrew's video, Cal.com inline (prefilled), what the call covers, and "What you're setting up" (the spec sheet's data, imported). |
| `src/lib/` | `lead.ts` (validation, attribution, webhook), `track.ts` (Pixel/GA4 events), `flags.ts` (⚑ on/off). |

## The end-to-end test

```bash
npm run e2e                                  # against http://127.0.0.1:5310
node tools/e2e.mjs http://127.0.0.1:4173     # against `npm run preview`
node tools/e2e.mjs --only=phone              # run only the checks whose name contains "phone"
```

It runs Playwright as a 1440 × 660 laptop and as an iPhone in the Facebook in-app browser (390 × 664, touch, DPR 3, FBAN/FBIOS user agent), and checks:

- every CTA met while scrolling opens the popup;
- never two orange CTAs on screen at once;
- the popup's three steps and their errors, then the hand-off to `/book` with the lead in storage;
- `/book`: the H1, Andrew's video container, Cal.com mounted with name and email prefilled (**it never picks a time**), the calendar high on the first screen, the product details;
- spec sheet expand and collapse, the Try it tap, the calculator's estimate in the popup, the FAQ toggles, the header links and Log in;
- each `?angle=` H1 (read from `copy.ts`);
- intro skip, `?intro=0`, once per session;
- reduced motion, and a no-WebGL laptop (poster stills);
- zero console errors or failed requests;
- phones never request three.js or `.glb`;
- no tracking requests on previews.

Third-party noise is ignored and listed at the end of the run: the Cal.com and Vidalytics iframes, headless Chromium's missing video codecs, and requests cancelled by navigation. The run prints a PASS/FAIL table and exits 1 on any failure. A full run takes a few minutes, because headless WebGL is software-rendered.

## Andrew's to-do before launch (every ⚑)

Open any build with `?review` to see each one in place.

1. **Call length.** The copy says "a 30-minute call". His Cal.com link (`andrew-drish/15min`) opens a **45-minute** "SmartCrew Demo". He sets the event to 30 min, or gives the real length. Then update `config.callLength` and `T.N`, and set `config.callLengthConfirmed: true`. That clears the ⚑ in the hero, popup, receipt and `/book`.
2. **Program name and size range, matching his ads.** The page says "Founding Member trial" and "5–100 employees". His live ads say "private beta" and "5–50". He picks one name and one range (`T.PROGRAM`, `T.SIZE`), and the ads change to match.
3. **Testimonials.**
   - Phil Drish (~$150k per YEAR): approve the family disclosure, "Drish Construction is Andrew's family's dirt work company, where SmartCrew started." The FTC endorsement guides require it.
   - Katie: is her company **JW** or **JCR** Excavating (the logo strip shows JCR)? We need written permission to quote her, and her surname if possible.
   - The six "Used by" logos: confirm each customer agreed to be shown.
4. **Official vector logos** for Drish Construction, Rieke Grading and Fireball Construction. They are raster today; JCR, DW and Midwest are traced to SVG.
5. **A high-res headshot or field photo.** Today's cut-out is 456 × 420 px and looks soft on retina screens (`public/andrew/`).
6. **His signature.** The receipt's signature is traced from the 277 × 73 image on smartcrewhq.com. He OKs its use, or sends a clean scan.
7. **Privacy policy and terms.** `config.privacyUrl` and `config.termsUrl` point at live pages that predate this flow (SMS consent, the trial). Update them, or give new URLs.
8. **SMS consent wording** in the popup's step 3 ("About 3 texts per booking. Msg & data rates may apply. Reply STOP to opt out."). This needs counsel's review, a 10DLC-registered sender number, and a decision on who sends.
9. **Cal.com reminders.** Turn them on for booking, 24 h before and 1 h before (US SMS reminders need Cal's Teams plan). Set `config.andrewPhone` so "Save Andrew's number" appears after booking.
10. **In his own words:**
    - FAQ "Why a call?" (its answer is flagged);
    - the receipt's "Why it's free";
    - the `/book` "On the call" lines;
    - that he opens the call with the visitor's own estimate (the calculator and `/book` say so).
11. **The receipt's proposals** (shown on review builds only): a founding rate locked while they stay, a capacity cap ("[N] new setups a month"), and a guarantee (name plus terms).
12. **Features seen only in mockups** (`confirm: true` in `moments.ts`): missed clock-out flags, JSAs and toolbox talks, fuel records, won bid → job. He confirms they are live, or they come off. The spec sheet and One Day recount themselves.
13. **QuickBooks.** Until he says how it works, the page says only "QuickBooks integration for payroll" and "ready for QuickBooks". It never says "sync".
14. **Launch plumbing.** Set `config.leadWebhook`, the Meta Pixel `1259016858853739` and GA4 `G-FED5LLVE5W` at launch, not before.
15. **Logo redraw** (`public/brand/`). This is a proposal: approve it or keep the current logo.
16. **3D models.** Record the source and licence of the MacBook and iPhone GLBs.

**The video stays as it is.** `/book` embeds Andrew's existing walkthrough (Vidalytics `Lz1Z_A8eimAA04gJ`). Any redo, replacement or re-edit needs the agency owner's explicit approval.

## Fonts and credits

| Face | Use | Licence |
|---|---|---|
| Special Gothic (`public/fonts/special-gothic-*`) | Headlines, times, numbers, CTA label | SIL OFL 1.1 |
| Finlandica Text (`public/fonts/finlandica-text-*`) | Body text | SIL OFL 1.1 |
| Inter (`@fontsource-variable/inter`) | The recreated app screens only | SIL OFL 1.1 |

- The licence texts ship next to the font files.
- Apple Pro Display XDR model by polyman Studio, CC-BY-4.0. No scene uses it; the footer credits it automatically if one ever does.
- Apple, iPhone, MacBook and the app names in Five apps are trademarks of their owners. The page names them in plain text, with no logos.

## QA notes

- Check on 1440 × 660, 1280 × 600, 1440 × 900 and an iPhone (390 × 664) in the Facebook in-app browser.
- Headless WebGL is software-rendered (2–5 fps). Judge composition, not smoothness, and use `?stageHQ` for sharp stills.
- Never complete a real booking on Andrew's Cal.com. Stop at the time picker.
- Never commit real employee names. The demo data is made up.
